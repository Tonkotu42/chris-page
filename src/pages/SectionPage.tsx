import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SiteMenu } from '../components/SiteMenu';

const sections: Record<string, string> = {
  game: 'GAME',
  info: 'INFO',
};

export default function SectionPage() {
  const { pathname } = useLocation();
  const section = pathname.slice(1);
  const title = sections[section] ?? 'INFO';

  useEffect(() => {
    document.title = `${title} | CHRIS`;
  }, [title]);

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm tracking-[0.24em] text-white">CHRIS</Link>
          <SiteMenu />
        </div>
      </header>
      <main className="mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">CHRIS / {title}</p>
        <h1 className="mt-4 text-4xl font-bold text-white">{title}</h1>
        <p className="mt-4 text-sm text-neutral-500">Coming soon</p>
      </main>
    </div>
  );
}
