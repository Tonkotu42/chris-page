export interface FrequencyWaveformBar {
  peak: number;
  low: number;
  mid: number;
  high: number;
}

export const waveformBarsPerSecond = 20;

export async function createFrequencyWaveform(
  buffer: Pick<AudioBuffer, 'sampleRate' | 'length' | 'numberOfChannels' | 'getChannelData'>,
  signal: AbortSignal,
) {
  const samplesPerBar = Math.max(1, Math.round(buffer.sampleRate / waveformBarsPerSecond));
  const barCount = Math.ceil(buffer.length / samplesPerBar);
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  const lowState = channels.map(() => 0);
  const midState = channels.map(() => 0);
  const lowCoefficient = 1 - Math.exp(-2 * Math.PI * 250 / buffer.sampleRate);
  const midCoefficient = 1 - Math.exp(-2 * Math.PI * 2500 / buffer.sampleRate);
  const bars: FrequencyWaveformBar[] = [];
  const channel = new MessageChannel();

  try {
    for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
      if (signal.aborted) throw new DOMException('Waveform analysis was cancelled.', 'AbortError');
      let peak = 0;
      let lowEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;
      const start = barIndex * samplesPerBar;
      const end = Math.min(buffer.length, start + samplesPerBar);

      for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
        const samples = channels[channelIndex];
        let low = lowState[channelIndex];
        let belowHigh = midState[channelIndex];
        for (let index = start; index < end; index += 1) {
          const sample = samples[index];
          low += lowCoefficient * (sample - low);
          belowHigh += midCoefficient * (sample - belowHigh);
          const mid = belowHigh - low;
          const high = sample - belowHigh;
          peak = Math.max(peak, Math.abs(sample));
          lowEnergy += low * low;
          midEnergy += mid * mid;
          highEnergy += high * high;
        }
        lowState[channelIndex] = low;
        midState[channelIndex] = belowHigh;
      }

      const count = (end - start) * channels.length;
      bars.push({
        peak,
        low: Math.sqrt(lowEnergy / count),
        mid: Math.sqrt(midEnergy / count),
        high: Math.sqrt(highEnergy / count),
      });
      if (barIndex % waveformBarsPerSecond === waveformBarsPerSecond - 1) {
        await new Promise<void>((resolve) => {
          channel.port1.onmessage = () => resolve();
          channel.port2.postMessage(null);
        });
      }
    }
    return bars;
  } finally {
    channel.port1.close();
    channel.port2.close();
  }
}
