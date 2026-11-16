import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  let https;
  if (mode === 'dev-https') {
    if (!process.env.LOCALAPPDATA) {
      throw new Error('Development HTTPS setup requires Windows and LOCALAPPDATA.');
    }
    const certificateDirectory = path.join(process.env.LOCALAPPDATA, 'chris-page', 'dev-https');
    try {
      https = {
        pfx: readFileSync(path.join(certificateDirectory, 'server.pfx')),
        passphrase: readFileSync(path.join(certificateDirectory, 'password.txt'), 'utf8').trim(),
      };
    } catch (error) {
      throw new Error('Development HTTPS certificate is unavailable. Run scripts\\setup-dev-https.ps1 first.', { cause: error });
    }
  }
  return {
    plugins: [react(), tailwindcss()],
    server: { https },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});