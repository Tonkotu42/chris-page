import { readFile, writeFile } from 'node:fs/promises';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: ['.env.local', '.env'] });

const [, , inputPath, outputPath] = process.argv;
const secret = process.env.AUDIO_XOR_KEY ?? process.env.VITE_AUDIO_XOR_KEY;

if (!inputPath || !outputPath || !secret) {
  console.error('Set VITE_AUDIO_XOR_KEY in .env.local or AUDIO_XOR_KEY in the environment.');
  console.error('Usage: node scripts/encrypt-audio.mjs <input.mp3> <output.bin>');
  process.exitCode = 1;
} else if (path.extname(inputPath).toLowerCase() !== '.mp3' || path.extname(outputPath).toLowerCase() !== '.bin') {
  console.error('The input must be an MP3 file and the output must use the .bin extension.');
  process.exitCode = 1;
} else {
  const key = Buffer.from(secret, 'utf8');
  if (key.length === 0) {
    console.error('A non-empty AUDIO_XOR_KEY is required.');
    process.exitCode = 1;
  } else {
    const audio = await readFile(inputPath);
    for (let index = 0; index < audio.length; index += 1) {
      audio[index] ^= key[index % key.length];
    }
    await writeFile(outputPath, audio);
    console.log(`Encrypted ${inputPath} to ${outputPath}.`);
  }
}
