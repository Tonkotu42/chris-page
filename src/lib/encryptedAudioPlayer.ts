import type { AudioSource } from './privateAudioPlayer';
import { getSupabaseClient } from './supabaseClient';

const audioBucket = 'audio-files';
const workletUrl = '/audio-decrypter.js';
const downloadTimeoutMs = 60_000;
const processingTimeoutMs = 45_000;
const workletTimeoutMs = 15_000;

interface WorkletMessage {
  type: string;
  frame?: number;
}

function waitForOperation<T>(
  operation: Promise<T>,
  signal: AbortSignal,
  timeoutMs: number,
  timeoutMessage: string,
) {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error(timeoutMessage)));
    }, timeoutMs);
    const onAbort = () => {
      finish(() => reject(new DOMException('Audio loading was cancelled.', 'AbortError')));
    };
    const finish = (complete: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      complete();
    };

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener('abort', onAbort, { once: true });
    operation.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error)),
    );
  });
}

function isEncryptedStoragePath(source: string) {
  return source.toLowerCase().endsWith('.bin');
}

function getXorKey() {
  const configuredKey = import.meta.env.VITE_AUDIO_XOR_KEY;
  if (!configuredKey) throw new Error('VITE_AUDIO_XOR_KEY must be configured.');
  return configuredKey;
}

function decryptAudio(audioData: ArrayBuffer, key: string) {
  const keyBytes = new TextEncoder().encode(key);
  if (keyBytes.length === 0) throw new Error('VITE_AUDIO_XOR_KEY must not be empty.');

  const encryptedBytes = new Uint8Array(audioData);
  const decryptedBytes = new Uint8Array(encryptedBytes.length);
  for (let index = 0; index < encryptedBytes.length; index += 1) {
    decryptedBytes[index] = encryptedBytes[index] ^ keyBytes[index % keyBytes.length];
  }
  return decryptedBytes.buffer;
}

export class SupabaseWorkletAudioPlayer {
  private context: AudioContext | null = null;
  private workletModule: Promise<void> | null = null;
  private buffer: AudioBuffer | null = null;
  private node: AudioWorkletNode | null = null;
  private nodeConnected = false;
  private gainNode: GainNode | null = null;
  private loadController: AbortController | null = null;
  private loadGeneration = 0;
  private position = 0;
  private positionUpdatedAt = 0;
  private playbackRate = 1;
  private volume = 1;
  private playing = false;

  onEnded: (() => void) | null = null;

  get isReady() {
    return this.buffer !== null;
  }

  get isPlaying() {
    return this.playing;
  }

  get duration() {
    return this.buffer?.duration ?? 0;
  }

  get currentTime() {
    if (!this.buffer || !this.playing || !this.context) return this.position;
    const elapsed = Math.max(0, this.context.currentTime - this.positionUpdatedAt);
    return Math.min(this.buffer.duration, this.position + elapsed * this.playbackRate);
  }

  async load(source: AudioSource): Promise<AudioBuffer> {
    this.loadController?.abort();
    this.releaseNode();
    this.buffer = null;
    this.position = 0;
    this.playing = false;

    const generation = ++this.loadGeneration;
    const controller = new AbortController();
    this.loadController = controller;

    try {
      let audioData: ArrayBuffer;
      if (typeof source === 'string') {
        if (isEncryptedStoragePath(source)) {
          const download = getSupabaseClient()
            .storage
            .from(audioBucket)
            .download(source);
          const { data, error } = await waitForOperation(
            download,
            controller.signal,
            downloadTimeoutMs,
            'Audio download timed out. Check your connection and Supabase settings, then retry.',
          );
          if (error) throw new Error(`Could not download encrypted audio: ${error.message}`);
          if (!data) throw new Error('Supabase returned no audio data.');
          audioData = await data.arrayBuffer();
          audioData = decryptAudio(audioData, getXorKey());
        } else {
          const response = await fetch(source, {
            credentials: 'same-origin',
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`Audio request failed with status ${response.status}.`);
          audioData = await response.arrayBuffer();
        }
      } else {
        audioData = await source.arrayBuffer();
      }

      const context = this.getContext();
      const workletModule = this.workletModule;
      if (!workletModule) throw new Error('The audio worklet could not be initialized.');
      await waitForOperation(
        workletModule.catch((error: unknown) => {
          if (this.workletModule === workletModule) this.workletModule = null;
          throw error;
        }),
        controller.signal,
        workletTimeoutMs,
        'Loading the audio processor timed out. Please retry.',
      );
      if (generation !== this.loadGeneration) {
        throw new DOMException('Audio loading was cancelled.', 'AbortError');
      }

      const node = new AudioWorkletNode(context, 'audio-decrypter', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        channelCount: 2,
        channelCountMode: 'explicit',
      });
      const gainNode = context.createGain();
      gainNode.gain.value = this.volume;
      gainNode.connect(context.destination);
      this.node = node;
      this.gainNode = gainNode;

      const buffer = await waitForOperation(
        context.decodeAudioData(audioData),
        controller.signal,
        processingTimeoutMs,
        'Audio decoding timed out. Please retry.',
      );

      if (generation !== this.loadGeneration) {
        throw new DOMException('Audio loading was cancelled.', 'AbortError');
      }

      this.buffer = buffer;
      node.port.onmessage = ({ data }: MessageEvent<WorkletMessage>) => {
        if (this.node !== node || !this.buffer) return;
        if (this.playing && data.type === 'position' && typeof data.frame === 'number') {
          this.position = Math.min(this.buffer.duration, data.frame / this.buffer.sampleRate);
          this.positionUpdatedAt = context.currentTime;
        } else if (data.type === 'ended') {
          this.position = this.buffer.duration;
          this.positionUpdatedAt = context.currentTime;
          this.playing = false;
          this.disconnectNode();
          this.onEnded?.();
        }
      };

      const channels = Array.from({ length: buffer.numberOfChannels }, (_, channelIndex) => (
        new Float32Array(buffer.getChannelData(channelIndex)).buffer
      ));
      node.port.postMessage({ type: 'load', channels, frameCount: buffer.length }, channels);

      this.positionUpdatedAt = context.currentTime;
      return buffer;
    } catch (error) {
      if (generation === this.loadGeneration) this.releaseNode();
      throw error;
    } finally {
      if (this.loadController === controller) this.loadController = null;
    }
  }

  async play(options: { loop?: boolean; restart?: boolean } = {}) {
    if (!this.buffer || !this.node) throw new Error('Audio has not finished loading.');
    if (options.restart) {
      this.position = 0;
      this.node.port.postMessage({ type: 'seek', frame: 0 });
    } else if (this.playing) {
      return;
    }

    if (this.position >= this.buffer.duration) {
      this.position = 0;
      this.node.port.postMessage({ type: 'seek', frame: 0 });
    }

    const context = this.getContext();
    this.connectNode();
    this.positionUpdatedAt = context.currentTime;
    this.node.port.postMessage({ type: 'rate', value: this.playbackRate });
    this.node.port.postMessage({ type: 'loop', enabled: options.loop ?? false });
    this.node.port.postMessage({ type: 'play' });
    this.playing = true;

    try {
      if (context.state === 'suspended') await context.resume();
    } catch (error) {
      this.pause();
      throw error;
    }
  }

  pause() {
    if (!this.playing) return;
    this.position = this.currentTime;
    this.positionUpdatedAt = this.context?.currentTime ?? 0;
    this.playing = false;
    this.node?.port.postMessage({ type: 'pause' });
    this.node?.port.postMessage({
      type: 'seek',
      frame: this.position * (this.buffer?.sampleRate ?? 1),
    });
    this.disconnectNode();
  }

  async beginScratch() {
    if (!this.buffer || !this.node) throw new Error('Audio has not finished loading.');
    const context = this.getContext();
    this.connectNode();
    if (context.state === 'suspended') await context.resume();
  }

  scratch(fromSeconds: number, toSeconds: number, duration: number) {
    if (!this.buffer || !this.node) throw new Error('Audio has not finished loading.');
    if (!Number.isFinite(fromSeconds) || !Number.isFinite(toSeconds) || !Number.isFinite(duration) || duration <= 0) {
      throw new Error('Invalid scratch position or duration.');
    }
    this.position = Math.max(0, Math.min(toSeconds, this.buffer.duration));
    this.positionUpdatedAt = this.context?.currentTime ?? 0;
    if (this.position === fromSeconds) {
      this.node.port.postMessage({ type: 'stopScratch' });
      return;
    }
    this.node.port.postMessage({
      type: 'scratch',
      from: fromSeconds * this.buffer.sampleRate,
      to: this.position * this.buffer.sampleRate,
      duration,
    });
  }

  endScratch() {
    this.node?.port.postMessage({ type: 'stopScratch' });
    this.disconnectNode();
  }

  stop() {
    this.loadGeneration += 1;
    this.loadController?.abort();
    this.loadController = null;
    this.playing = false;
    this.position = 0;
    this.positionUpdatedAt = this.context?.currentTime ?? 0;
    this.node?.port.postMessage({ type: 'stop' });
    if (!this.buffer) this.releaseNode();
    this.disconnectNode();
  }

  seek(seconds: number) {
    if (!this.buffer || !Number.isFinite(seconds)) return Promise.resolve();
    this.position = Math.max(0, Math.min(seconds, this.buffer.duration));
    this.positionUpdatedAt = this.context?.currentTime ?? 0;
    this.node?.port.postMessage({
      type: 'seek',
      frame: this.position * this.buffer.sampleRate,
    });
    return Promise.resolve();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (!this.gainNode || !this.context) return;
    this.gainNode.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
  }

  setPlaybackRate(playbackRate: number) {
    if (!Number.isFinite(playbackRate) || playbackRate <= 0) return;
    this.position = this.currentTime;
    this.positionUpdatedAt = this.context?.currentTime ?? 0;
    this.playbackRate = playbackRate;
    this.node?.port.postMessage({
      type: 'seek',
      frame: this.position * (this.buffer?.sampleRate ?? 1),
    });
    this.node?.port.postMessage({ type: 'rate', value: playbackRate });
  }

  private getContext() {
    if (!this.context || this.context.state === 'closed') this.context = new AudioContext();
    if (!this.workletModule) {
      if (!this.context.audioWorklet) {
        throw new Error(window.isSecureContext
          ? 'AudioWorklet is not supported by this browser. Try a current browser.'
          : 'Audio requires HTTPS on network devices. Start the HTTPS development server and trust its certificate.');
      }
      this.workletModule = this.context.audioWorklet.addModule(workletUrl);
    }
    return this.context;
  }

  private releaseNode() {
    this.node?.port.close();
    this.disconnectNode();
    this.gainNode?.disconnect();
    this.node = null;
    this.gainNode = null;
  }

  private connectNode() {
    if (!this.node || !this.gainNode || this.nodeConnected) return;
    this.node.connect(this.gainNode);
    this.nodeConnected = true;
  }

  private disconnectNode() {
    if (!this.node || !this.nodeConnected) return;
    this.node.disconnect();
    this.nodeConnected = false;
  }
}
