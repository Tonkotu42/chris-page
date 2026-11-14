import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import ArtistPage from './pages/ArtistPage';
import BassFitterPage from './pages/BassFitterPage';
import MusicPage from './pages/MusicPage';
import SectionPage from './pages/SectionPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ArtistPage />} />
        <Route path="/bassfitter" element={<BassFitterPage />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="/game" element={<SectionPage />} />
        <Route path="/info" element={<SectionPage />} />
      </Routes>
    </HashRouter>
  );
}
