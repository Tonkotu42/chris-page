import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

function createProcessor() {
  let Processor;
  class AudioWorkletProcessor {
    port = { onmessage: null, postMessage() {} };
  }
  runInNewContext(readFileSync(new URL('../public/audio-decrypter.js', import.meta.url), 'utf8'), {
    AudioWorkletProcessor,
    sampleRate: 1000,
    registerProcessor: (_name, processor) => { Processor = processor; },
  });
  const processor = new Processor();
  const samples = Float32Array.from({ length: 1000 }, (_, index) => index / 1000);
  processor.port.onmessage({ data: { type: 'load', channels: [samples.buffer], frameCount: samples.length } });
  return processor;
}

function render(processor, length) {
  const output = new Float32Array(length);
  processor.process([], [[output]]);
  return output;
}

test('scratch renders the selected audio in both directions and becomes silent', () => {
  const processor = createProcessor();
  processor.port.onmessage({ data: { type: 'scratch', from: 100, to: 200, duration: 0.1 } });
  const forward = render(processor, 100);
  assert.ok(forward[30] < forward[70]);
  assert.ok(forward[50] > 0.14 && forward[50] < 0.16);
  assert.ok(render(processor, 10).every((sample) => sample === 0));

  processor.port.onmessage({ data: { type: 'scratch', from: 200, to: 100, duration: 0.1 } });
  const reverse = render(processor, 100);
  assert.ok(reverse[30] > reverse[70]);
  assert.ok(reverse[50] > 0.14 && reverse[50] < 0.16);
});

test('stopping a scratch silences it without starting playback', () => {
  const processor = createProcessor();
  processor.port.onmessage({ data: { type: 'scratch', from: 100, to: 200, duration: 0.1 } });
  render(processor, 10);
  processor.port.onmessage({ data: { type: 'stopScratch' } });
  assert.ok(render(processor, 100).every((sample) => sample === 0));
});
