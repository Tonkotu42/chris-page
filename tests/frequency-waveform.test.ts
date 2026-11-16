import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrequencyWaveform } from '../src/lib/frequencyWaveform';

function tone(frequency: number, sampleRate = 44100) {
  const samples = Float32Array.from(
    { length: sampleRate },
    (_, index) => Math.sin(2 * Math.PI * frequency * index / sampleRate),
  );
  return {
    length: samples.length,
    sampleRate,
    numberOfChannels: 1,
    getChannelData: () => samples,
  };
}

test('frequency waveform distinguishes low, mid and high tones', async () => {
  const signal = new AbortController().signal;
  for (const [frequency, band] of [[60, 'low'], [1000, 'mid'], [10000, 'high']] as const) {
    const bars = await createFrequencyWaveform(tone(frequency), signal);
    const bar = bars[10];
    assert.ok(bar[band] > Math.max(...(['low', 'mid', 'high'] as const)
      .filter((other) => other !== band).map((other) => bar[other])), `${frequency} Hz should be ${band}`);
    assert.ok(bar.peak > 0.9);
    assert.equal(bars.length, 20);
  }
});

test('frequency waveform aborts when its track is unloaded', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(createFrequencyWaveform(tone(100), controller.signal), { name: 'AbortError' });
});
