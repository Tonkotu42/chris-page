import assert from 'node:assert/strict';
import test from 'node:test';
import { nextQueueEntry, swapQueueEntries } from '../src/lib/musicQueue';

test('advances through inserted tapes in order, including repeated tapes', () => {
  const queue = [
    { id: 'one', cassetteId: 'afterlife' },
    { id: 'two', cassetteId: 'done' },
    { id: 'three', cassetteId: 'afterlife' },
  ];
  assert.equal(nextQueueEntry(queue, null)?.id, 'one');
  assert.equal(nextQueueEntry(queue, 'one')?.id, 'two');
  assert.equal(nextQueueEntry(queue, 'two')?.id, 'three');
  assert.equal(nextQueueEntry(queue, 'three'), null);
});

test('does not restart a queue when its current entry is missing', () => {
  assert.equal(nextQueueEntry([], null), null);
  assert.equal(nextQueueEntry([{ id: 'one', cassetteId: 'afterlife' }], 'removed'), null);
});

test('swaps individual slots, including duplicate tapes, without changing the active entry', () => {
  const queue = [
    { id: 'one', cassetteId: 'afterlife' },
    { id: 'two', cassetteId: 'done' },
    { id: 'three', cassetteId: 'afterlife' },
  ];
  const reordered = swapQueueEntries(queue, 'one', 'three');
  assert.deepEqual(reordered.map((entry) => entry.id), ['three', 'two', 'one']);
  assert.equal(nextQueueEntry(reordered, 'three')?.id, 'two');
  assert.deepEqual(queue.map((entry) => entry.id), ['one', 'two', 'three']);
  assert.equal(swapQueueEntries(queue, 'missing', 'two'), queue);
  assert.equal(swapQueueEntries(queue, 'one', 'one'), queue);
});
