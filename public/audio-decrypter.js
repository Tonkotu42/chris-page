class AudioDecrypterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.channels = [];
    this.frameCount = 0;
    this.position = 0;
    this.playbackRate = 1;
    this.playing = false;
    this.loop = false;
    this.framesSinceReport = 0;

    this.port.onmessage = ({ data }) => {
      if (data.type === 'decrypt') {
        this.decrypt(data);
      } else if (data.type === 'load') {
        this.channels = data.channels.map((channel) => new Float32Array(channel));
        this.frameCount = data.frameCount;
        this.position = 0;
        this.playing = false;
        this.port.postMessage({ type: 'position', frame: 0 });
      } else if (data.type === 'play') {
        if (this.position >= this.frameCount) this.position = 0;
        this.playing = this.frameCount > 0;
      } else if (data.type === 'pause') {
        this.playing = false;
      } else if (data.type === 'stop') {
        this.playing = false;
        this.position = 0;
        this.port.postMessage({ type: 'position', frame: 0 });
      } else if (data.type === 'seek' && Number.isFinite(data.frame)) {
        this.position = Math.max(0, Math.min(data.frame, this.frameCount));
      } else if (data.type === 'rate' && Number.isFinite(data.value) && data.value > 0) {
        this.playbackRate = data.value;
      } else if (data.type === 'loop') {
        this.loop = Boolean(data.enabled);
      }
    };
  }

  decrypt({ encryptedAudio, key }) {
    if (!(encryptedAudio instanceof ArrayBuffer) || typeof key !== 'string' || key.length === 0) {
      this.port.postMessage({ type: 'error', message: 'Encrypted audio and a non-empty key are required.' });
      return;
    }

    const keyBytes = new TextEncoder().encode(key);
    const encryptedBytes = new Uint8Array(encryptedAudio);
    const decryptedAudio = new ArrayBuffer(encryptedBytes.length);
    const decryptedBytes = new Uint8Array(decryptedAudio);
    for (let index = 0; index < encryptedBytes.length; index += 1) {
      decryptedBytes[index] = encryptedBytes[index] ^ keyBytes[index % keyBytes.length];
    }

    this.port.postMessage({ type: 'decrypted', audioBuffer: decryptedAudio }, [decryptedAudio]);
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output) return true;
    output.forEach((channel) => channel.fill(0));

    if (!this.playing || this.channels.length === 0) return true;

    const outputFrames = output[0]?.length ?? 0;
    for (let frame = 0; frame < outputFrames; frame += 1) {
      if (this.position >= this.frameCount) {
        if (this.loop && this.frameCount > 0) {
          this.position %= this.frameCount;
        } else {
          this.position = this.frameCount;
          this.playing = false;
          this.port.postMessage({ type: 'ended' });
          break;
        }
      }

      const sourceFrame = Math.floor(this.position);
      const nextFrame = Math.min(sourceFrame + 1, this.frameCount - 1);
      const fraction = this.position - sourceFrame;
      for (let channel = 0; channel < output.length; channel += 1) {
        const samples = this.channels[Math.min(channel, this.channels.length - 1)];
        output[channel][frame] = samples[sourceFrame] * (1 - fraction)
          + samples[nextFrame] * fraction;
      }
      this.position += this.playbackRate;
    }

    this.framesSinceReport += outputFrames;
    if (this.framesSinceReport >= sampleRate / 10) {
      this.framesSinceReport = 0;
      this.port.postMessage({ type: 'position', frame: this.position });
    }
    return true;
  }
}

registerProcessor('audio-decrypter', AudioDecrypterProcessor);
