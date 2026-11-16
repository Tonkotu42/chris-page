import React, { Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

// 各ページを動的インポート（Lazy Load）に変更
const ArtistPage = React.lazy(() => import('./pages/ArtistPage'));
const BassFitterPage = React.lazy(() => import('./pages/BassFitterPage'));
const MusicPage = React.lazy(() => import('./pages/MusicPage'));
const SectionPage = React.lazy(() => import('./pages/SectionPage'));

export default function App() {
  return (
    <HashRouter>
      {/* 読み込み中のフォールバック（必要に応じてスピナー等に変更可能） */}
      <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<ArtistPage />} />
          <Route path="/bassfitter" element={<BassFitterPage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/game" element={<SectionPage />} />
          <Route path="/info" element={<SectionPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}