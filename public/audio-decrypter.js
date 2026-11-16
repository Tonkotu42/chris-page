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
    this.scratch = null;

    this.port.onmessage = ({ data }) => {
      if (data.type === 'load') {
        this.channels = data.channels.map((channel) => new Float32Array(channel));
        this.frameCount = data.frameCount;
        this.position = 0;
        this.playing = false;
        this.port.postMessage({ type: 'position', frame: 0 });
      } else if (data.type === 'play') {
        this.scratch = null;
        if (this.position >= this.frameCount) this.position = 0;
        this.playing = this.frameCount > 0;
      } else if (data.type === 'pause') {
        this.playing = false;
      } else if (data.type === 'stop') {
        this.playing = false;
        this.scratch = null;
        this.position = 0;
        this.port.postMessage({ type: 'position', frame: 0 });
      } else if (data.type === 'scratch'
        && this.frameCount > 0
        && Number.isFinite(data.from)
        && Number.isFinite(data.to)
        && Number.isFinite(data.duration)
        && data.duration > 0) {
        this.playing = false;
        this.scratch = {
          from: Math.max(0, Math.min(data.from, this.frameCount - 1)),
          to: Math.max(0, Math.min(data.to, this.frameCount - 1)),
          length: Math.max(1, Math.round(data.duration * sampleRate)),
          frame: 0,
        };
        this.position = Math.max(0, Math.min(data.to, this.frameCount));
      } else if (data.type === 'stopScratch') {
        this.scratch = null;
      } else if (data.type === 'seek' && Number.isFinite(data.frame)) {
        this.position = Math.max(0, Math.min(data.frame, this.frameCount));
      } else if (data.type === 'rate' && Number.isFinite(data.value) && data.value > 0) {
        this.playbackRate = data.value;
      } else if (data.type === 'loop') {
        this.loop = Boolean(data.enabled);
      }
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output) return true;
    output.forEach((channel) => channel.fill(0));

    if ((!this.playing && !this.scratch) || this.channels.length === 0) return true;

    const outputFrames = output[0]?.length ?? 0;
    for (let frame = 0; frame < outputFrames; frame += 1) {
      if (this.scratch) {
        const scratch = this.scratch;
        const progress = scratch.length > 1 ? scratch.frame / (scratch.length - 1) : 1;
        const position = scratch.from + (scratch.to - scratch.from) * progress;
        const sourceFrame = Math.floor(position);
        const nextFrame = Math.min(sourceFrame + 1, this.frameCount - 1);
        const fraction = position - sourceFrame;
        const fadeFrames = Math.min(128, scratch.length / 2);
        const envelope = Math.min(1, (scratch.frame + 1) / fadeFrames, (scratch.length - scratch.frame) / fadeFrames);
        for (let channel = 0; channel < output.length; channel += 1) {
          const samples = this.channels[Math.min(channel, this.channels.length - 1)];
          output[channel][frame] = (samples[sourceFrame] * (1 - fraction)
            + samples[nextFrame] * fraction) * envelope;
        }
        scratch.frame += 1;
        if (scratch.frame >= scratch.length) this.scratch = null;
        continue;
      }

      if (!this.playing) break;
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

    if (this.playing) this.framesSinceReport += outputFrames;
    if (this.playing && this.framesSinceReport >= sampleRate / 10) {
      this.framesSinceReport = 0;
      this.port.postMessage({ type: 'position', frame: this.position });
    }
    return true;
  }
}

registerProcessor('audio-decrypter', AudioDecrypterProcessor);
