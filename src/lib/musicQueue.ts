export interface QueueEntry {
  id: string;
  cassetteId: string;
}

export function nextQueueEntry(queue: QueueEntry[], currentId: string | null): QueueEntry | null {
  if (currentId === null) return queue[0] ?? null;
  const index = queue.findIndex((entry) => entry.id === currentId);
  return index < 0 ? null : queue[index + 1] ?? null;
}

export function swapQueueEntries(queue: QueueEntry[], sourceId: string, targetId: string): QueueEntry[] {
  const sourceIndex = queue.findIndex((entry) => entry.id === sourceId);
  const targetIndex = queue.findIndex((entry) => entry.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return queue;
  const result = [...queue];
  [result[sourceIndex], result[targetIndex]] = [result[targetIndex], result[sourceIndex]];
  return result;
}
