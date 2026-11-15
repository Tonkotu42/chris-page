export type AudioSource = string | Blob;

let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

export class WebAudioPlayer {
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private loadController: AbortController | null = null;
  private loadGeneration = 0;
  private offset = 0;
  private startedAt = 0;
  private playbackRate = 1;
  private volume = 1;

  onEnded: (() => void) | null = null;

  get isReady() {
    return this.buffer !== null;
  }

  get isPlaying() {
    return this.source !== null;
  }

  get duration() {
    return this.buffer?.duration ?? 0;
  }

  get currentTime() {
    if (!this.buffer) return 0;
    if (!this.source) return this.offset;
    const elapsed = (getAudioContext().currentTime - this.startedAt) * this.playbackRate;
    return Math.min(this.buffer.duration, this.offset + elapsed);
  }

  async load(source: AudioSource): Promise<AudioBuffer> {
    this.loadController?.abort();
    this.stopSource();
    this.buffer = null;
    this.offset = 0;

    const generation = ++this.loadGeneration;
    const controller = new AbortController();
    this.loadController = controller;

    try {
      let audioData: ArrayBuffer;
      if (typeof source === 'string') {
        const response = await fetch(source, {
          credentials: 'same-origin',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Audio request failed with status ${response.status}.`);
        }
        audioData = await response.arrayBuffer();
      } else {
        audioData = await source.arrayBuffer();
      }

      const buffer = await getAudioContext().decodeAudioData(audioData);
      if (generation !== this.loadGeneration) {
        throw new DOMException('Audio loading was cancelled.', 'AbortError');
      }

      this.buffer = buffer;
      return buffer;
    } finally {
      if (this.loadController === controller) this.loadController = null;
    }
  }

  play(options: { loop?: boolean; restart?: boolean } = {}): Promise<void> {
    if (!this.buffer) return Promise.reject(new Error('Audio has not finished loading.'));
    if (options.restart) {
      this.stopSource();
      this.offset = 0;
    } else if (this.source) {
      return Promise.resolve();
    }

    const context = getAudioContext();
    const resume = context.state === 'suspended' ? context.resume() : Promise.resolve();
    const source = context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = options.loop ?? false;
    source.playbackRate.value = this.playbackRate;
    source.connect(this.getGainNode(context));
    this.offset = this.offset >= this.buffer.duration
      ? 0
      : Math.max(0, this.offset);
    this.startedAt = context.currentTime;
    this.source = source;
    source.onended = () => {
      if (this.source !== source) return;
      this.source = null;
      source.disconnect();
      this.offset = this.buffer?.duration ?? 0;
      this.onEnded?.();
    };

    try {
      source.start(0, this.offset);
    } catch (error) {
      this.source = null;
      source.disconnect();
      return Promise.reject(error);
    }

    return resume.catch((error: unknown) => {
      if (this.source === source) this.stopSource();
      throw error;
    });
  }

  pause() {
    if (!this.source) return;
    this.offset = this.currentTime;
    this.stopSource();
  }

  stop() {
    this.loadGeneration += 1;
    this.loadController?.abort();
    this.loadController = null;
    this.stopSource();
    this.offset = 0;
  }

  seek(seconds: number): Promise<void> {
    if (!this.buffer || !Number.isFinite(seconds)) return Promise.resolve();
    const wasPlaying = this.isPlaying;
    this.pause();
    this.offset = Math.max(0, Math.min(seconds, this.buffer.duration));
    return wasPlaying && this.offset < this.buffer.duration
      ? this.play()
      : Promise.resolve();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    const context = getAudioContext();
    const gainNode = this.getGainNode(context);
    gainNode.gain.setTargetAtTime(this.volume, context.currentTime, 0.015);
  }

  setPlaybackRate(playbackRate: number) {
    if (!Number.isFinite(playbackRate) || playbackRate <= 0) return;
    if (this.source) {
      const context = getAudioContext();
      this.offset = this.currentTime;
      this.startedAt = context.currentTime;
      this.source.playbackRate.setValueAtTime(playbackRate, context.currentTime);
    }
    this.playbackRate = playbackRate;
  }

  private getGainNode(context: AudioContext) {
    if (!this.gainNode || this.gainNode.context !== context) {
      this.gainNode = context.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(context.destination);
    }
    return this.gainNode;
  }

  private stopSource() {
    const source = this.source;
    if (!source) return;
    this.source = null;
    source.onended = null;
    source.stop();
    source.disconnect();
  }
}

export function createWaveformPeaks(buffer: AudioBuffer, barCount = 160) {
  const samplesPerBar = Math.ceil(buffer.length / barCount);
  return Array.from({ length: barCount }, (_, barIndex) => {
    let peak = 0;
    const start = barIndex * samplesPerBar;
    const end = Math.min(buffer.length, start + samplesPerBar);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const samples = buffer.getChannelData(channel);
      for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
        peak = Math.max(peak, Math.abs(samples[sampleIndex]));
      }
    }
    return peak;
  });
}
