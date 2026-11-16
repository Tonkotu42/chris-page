import assert from 'node:assert/strict';
import test from 'node:test';
import { SupabaseWorkletAudioPlayer } from '../src/lib/encryptedAudioPlayer.ts';

test('reports how to enable audio when AudioWorklet is unavailable', async () => {
  const previousWindow = globalThis.window;
  const previousAudioContext = globalThis.AudioContext;
  globalThis.window = { isSecureContext: false };
  globalThis.AudioContext = class {};
  try {
    const player = new SupabaseWorkletAudioPlayer();
    await assert.rejects(player.load(new Blob()), /requires HTTPS on network devices/);
    globalThis.window.isSecureContext = true;
    await assert.rejects(player.load(new Blob()), /not supported by this browser/);
  } finally {
    globalThis.window = previousWindow;
    globalThis.AudioContext = previousAudioContext;
  }
});
