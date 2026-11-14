import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import ArtistPage from './pages/ArtistPage';
import BassFitterPage from './pages/BassFitterPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ArtistPage />} />
        <Route path="/bassfitter" element={<BassFitterPage />} />
      </Routes>
    </HashRouter>
  );
}
