import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Layers, SlidersHorizontal } from 'lucide-react';
import { SiteMenu } from '../components/SiteMenu';
import soundPatcherHeroImg from '../assets/images/sound_patcher_hero_1795080694869.jpg';
import bassFitterHeroImg from '../assets/images/bassfitter_hero_1795094734236.jpg';

interface ProductEntry {
  id: string;
  name: string;
  category: string;
  summary: string;
  specs: string;
  to: string;
  image: string;
  imageAlt: string;
  accent: string;
}

const PRODUCTS: ProductEntry[] = [
  {
    id: 'sound-patcher',
    name: 'SOUND PATCHER',
    category: 'Modular Multi-Effect Rack',
    summary:
      'EQ・2種のコンプレッサー・ソフトクリッパー・リミッターを最大12スロットまで自在に組めるモジュラーラック。パラレルDry/Rackミックス内蔵。',
    specs: '12 Slots · 6 Modules · 20Hz–20kHz Spec',
    to: '/products/sound-patcher',
    image: soundPatcherHeroImg,
    imageAlt: 'SOUND PATCHER 3D modular hardware concept render',
    accent: 'text-cyan-300',
  },
  {
    id: 'bassfitter',
    name: 'BassFitter',
    category: 'Low-End Compressor',
    summary:
      'ベースとキックの低域にフォーカスしてタイトに整える専用コンプレッサー。Sub HPFとリアルタイムスペクトラムを搭載。',
    specs: 'Downward Comp · Sub HPF · Spectrum View',
    to: '/bassfitter',
    image: bassFitterHeroImg,
    imageAlt: 'BassFitter 3D hardware compressor concept render',
    accent: 'text-cyan-300',
  },
];

export default function ProductsPage() {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = 'PRODUCTS | CHRIS';
  }, []);

  const markImageFailed = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-neutral-100 selection:bg-cyan-400/25 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07080a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <Link
            to="/"
            className="text-sm font-semibold tracking-[0.26em] text-white whitespace-nowrap shrink-0 transition-colors hover:text-cyan-300"
          >
            CHRIS
          </Link>

          <nav className="hidden items-center gap-6 text-xs text-neutral-400 md:flex">
            <Link to="/products" className="text-white whitespace-nowrap shrink-0">
              Products
            </Link>
            <Link
              to="/products/sound-patcher"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              Sound Patcher
            </Link>
            <Link
              to="/bassfitter"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              BassFitter
            </Link>
            <Link
              to="/music"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              Music
            </Link>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <SiteMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-16">
        {/* Featured Product Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]"
        >
          <div className="flex flex-col justify-between py-2">
            <div>
              <p className="text-xs text-cyan-300">
                CHRIS Audio Plugins <span aria-hidden="true">·</span> Featured Release
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-5xl">
                SOUND PATCHER
              </h1>
              <p className="mt-4 text-sm leading-7 text-neutral-300 sm:text-base">
                6種類のコアエフェクトを最大12スロットまで自在にパッチング。
                ミックスからマスタリング前段まで、思い描いたチェインを1画面で完結させるモジュラーラック。
              </p>
              <p className="mt-4 font-mono text-xs text-neutral-400">
                Dynamic EQ · Static EQ · Opt Comp · FET Comp · Soft Clip · Limiter
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/products/sound-patcher"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-xs font-semibold text-neutral-950 whitespace-nowrap shrink-0 transition-colors hover:bg-cyan-300"
              >
                <span>SOUND PATCHER を見る</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/bassfitter"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-neutral-200 whitespace-nowrap shrink-0 transition-colors hover:border-white/30 hover:text-white"
              >
                <span>BassFitter を見る</span>
              </Link>
            </div>
          </div>

          <Link
            to="/products/sound-patcher"
            className="group block overflow-hidden rounded-xl border border-white/10 bg-[#0d1015] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {!failedImages['featured-hero'] ? (
              <img
                src={soundPatcherHeroImg}
                alt="SOUND PATCHER 3D physical hardware render"
                referrerPolicy="no-referrer"
                onError={() => markImageFailed('featured-hero')}
                className="h-full min-h-[260px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center p-8 text-center">
                <Layers className="h-9 w-9 text-cyan-400" aria-hidden="true" />
                <p className="mt-3 text-base font-semibold text-white">SOUND PATCHER</p>
              </div>
            )}
          </Link>
        </motion.section>

        {/* Full Product Lineup Grid */}
        <section className="mt-20 border-t border-white/10 pt-12" aria-labelledby="lineup-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-400">
                Lineup <span aria-hidden="true">·</span> {PRODUCTS.length} Plugins
              </p>
              <h2 id="lineup-heading" className="mt-2 text-2xl font-bold text-white">
                Products
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {PRODUCTS.map((product) => (
              <Link
                key={product.id}
                to={product.to}
                className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0e1116] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25"
              >
                <div className="aspect-[16/10] w-full overflow-hidden border-b border-white/10 bg-[#090b0f]">
                  {!failedImages[product.id] ? (
                    <img
                      src={product.image}
                      alt={product.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() => markImageFailed(product.id)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-500">
                      <SlidersHorizontal className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className={`text-xs font-medium ${product.accent}`}>
                      {product.category}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{product.name}</h3>
                    <p className="mt-2.5 text-sm leading-6 text-neutral-400">{product.summary}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="font-mono text-xs text-neutral-500">{product.specs}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white group-hover:text-cyan-300">
                      <span>詳細を見る</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
