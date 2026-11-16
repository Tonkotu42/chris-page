import type { Cassette } from './musicStorage';

export const initialCassettes: Cassette[] = [
  {
    id: 'afterlife',
    title: 'Afterlife',
    sideATitle: 'Afterlife',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: 'afterlife.bin', fileName: 'afterlife.mp3' },
    sideB: null,
    color: 'from-[#a3a3a3] via-[#33384a] to-[#090a10]',
    locked: true,
  },
  {
    id: 'done-with-u',
    title: 'Done With U',
    sideATitle: 'Done With U',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: 'done-with-u.bin', fileName: 'Done with you.mp3' },
    sideB: null,
    color: 'from-[#b2a1c9] via-[#423448] to-[#090a10]',
    locked: true,
  },
  {
    id: 'make-me-up',
    title: 'Make Me Up',
    sideATitle: 'Make Me Up',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: 'make-me-up.bin', fileName: 'Make Me up.mp3' },
    sideB: null,
    color: 'from-[#c7a77b] via-[#57412b] to-[#090a10]',
    locked: true,
  },
  {
    id: 'voyage',
    title: 'VOYAGE',
    sideATitle: 'VOYAGE',
    sideBTitle: 'SIDE B',
    sideA: { kind: 'audio', src: 'voyage.bin', fileName: 'VOYAGE.mp3' },
    sideB: null,
    color: 'from-[#8f9eae] via-[#303c4b] to-[#090a10]',
    locked: true,
  },
];
