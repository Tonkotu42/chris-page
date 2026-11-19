import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const menuItems = [
  { label: 'PRODUCTS', to: '/products' },
  { label: 'MUSIC', to: '/music' },
  { label: 'GAME', to: '/game' },
  { label: 'INFO', to: '/info' },
];

export function SiteMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="site-menu relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="site-menu-panel"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-xs tracking-[0.18em] text-white transition hover:bg-white/10 ${
          isOpen ? 'relative z-50' : ''
        }`}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span>MENU</span>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <nav
            id="site-menu-panel"
            aria-label="Main menu"
            className="site-menu-panel absolute right-0 top-[calc(100%+0.75rem)] z-40 w-56 overflow-hidden rounded-xl border border-white/15 bg-black/95 p-2 shadow-2xl backdrop-blur-xl"
          >
            {menuItems.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm tracking-[0.16em] text-neutral-200 transition hover:bg-white/10 hover:text-white"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-neutral-600">
                  0{index + 1}
                </span>
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
