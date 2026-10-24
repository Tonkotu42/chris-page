import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  ExternalLink,
  Music2,
  Youtube,
  Instagram,
  Twitter,
  Cloud,
  Video,
  Disc3,
  Share2,
  Sparkles,
} from 'lucide-react';
import { OpeningIntro } from './components/OpeningIntro';

interface Track {
  id: string;
  youtubeId: string;
  title: string;
  subtitle: string;
  isNew?: boolean;
}

const TRACKS: Track[] = [
  {
    id: 'afterlife',
    youtubeId: 'eVXfIjVjnc0',
    title: 'Afterlife',
    subtitle: 'Official Music Video',
    isNew: true,
  },
  {
    id: 'done-with-u',
    youtubeId: 'brrU3TAzZWg',
    title: 'Done With U',
    subtitle: 'Official Music Video',
  },
];

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  desc: string;
  icon: typeof Youtube;
  hoverColor: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@shota_christopher_ohyama',
    url: 'https://www.youtube.com/@shota_christopher_ohyama',
    desc: 'Official Channel & Music Videos',
    icon: Youtube,
    hoverColor: 'group-hover:text-red-500',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    handle: 'chrisakagangcat',
    url: 'https://soundcloud.com/chrisakagangcat',
    desc: 'Original Tracks & Audio Streaming',
    icon: Cloud,
    hoverColor: 'group-hover:text-orange-400',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@gang_cat_chris',
    url: 'https://www.tiktok.com/@gang_cat_chris',
    desc: 'Shorts & Behind The Scenes',
    icon: Video,
    hoverColor: 'group-hover:text-cyan-400',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@chris_neko_',
    url: 'https://www.instagram.com/chris_neko_/',
    desc: 'Photos & Daily Stories',
    icon: Instagram,
    hoverColor: 'group-hover:text-pink-400',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    handle: '@Chris193389686',
    url: 'https://x.com/Chris193389686',
    desc: 'Official Announcements & Thoughts',
    icon: Twitter,
    hoverColor: 'group-hover:text-sky-400',
  },
];

export default function App() {
  const [activeTrack, setActiveTrack] = useState<Track>(TRACKS[0]);
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col selection:bg-neutral-800 selection:text-white font-sans relative">
      {/* オープニング演出 (AnimatePresence) */}
      <AnimatePresence>
        {showIntro && (
          <OpeningIntro
            key="opening-intro-screen"
            onComplete={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>

      {/* 繊細な背景アンビエント */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-700 via-neutral-950 to-black"
        aria-hidden="true"
      />

      {/* ナビゲーションバー */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative z-10 border-b border-neutral-900/80 backdrop-blur-md bg-[#0a0a0c]/80 sticky top-0"
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-bold tracking-[0.3em] uppercase text-white font-mono">
              CHRIS
            </span>
            <span className="hidden sm:inline-block text-[11px] uppercase tracking-widest text-neutral-500 border-l border-neutral-800 pl-3">
              Official Site
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium tracking-wider text-neutral-400 overflow-x-auto py-1">
              {SOCIAL_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    id={`header-nav-${item.id}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-900 hover:text-white transition-colors duration-200"
                    title={`${item.name}: ${item.handle}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">{item.name}</span>
                  </a>
                );
              })}
            </nav>

            {/* オープニング演出の再再生ボタン */}
            <button
              id="replay-intro-btn"
              type="button"
              onClick={() => setShowIntro(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-800 bg-white/5 hover:bg-white/10 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all duration-200 text-xs shrink-0 cursor-pointer"
              title="オープニング演出を再生"
            >
              <Sparkles className="w-3 h-3 text-red-400" />
              <span className="text-[11px] font-mono">Intro</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* メインコンテンツ */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-8 sm:py-12 flex flex-col gap-12">
        {/* メイン動画プレイヤー */}
        <motion.section
          id="hero-player-section"
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-neutral-800/80 group">
            <iframe
              id="main-youtube-iframe"
              key={activeTrack.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${activeTrack.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
              title={`${activeTrack.title} - CHRIS`}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* 曲名・アーティスト情報バー */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {activeTrack.title}
                </h1>
                {activeTrack.isNew && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-neutral-200 border border-white/15">
                    New Release
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-400 mt-1 flex items-center gap-2">
                <Music2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>CHRIS • {activeTrack.subtitle}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                id="watch-on-youtube-btn"
                href={`https://youtu.be/${activeTrack.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg transition duration-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>YouTubeで視聴</span>
              </a>
            </div>
          </div>
        </motion.section>

        {/* ディスコグラフィー / 他の作品 */}
        <motion.section
          id="releases-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="border-t border-neutral-900 pt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase font-semibold tracking-[0.2em] text-neutral-400 flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-neutral-500" />
              Music Videos
            </h2>
            <span className="text-xs text-neutral-600">{TRACKS.length} Releases</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TRACKS.map((track) => {
              const isSelected = track.id === activeTrack.id;
              return (
                <button
                  key={track.id}
                  id={`track-card-${track.id}`}
                  type="button"
                  onClick={() => setActiveTrack(track)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-4 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900/90 border-neutral-700 ring-1 ring-neutral-600/50'
                      : 'bg-neutral-950/40 border-neutral-900 hover:bg-neutral-900/50 hover:border-neutral-800'
                  }`}
                >
                  <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-neutral-800">
                    <img
                      src={`https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`}
                      alt={track.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                        isSelected
                          ? 'bg-black/40 text-white opacity-100'
                          : 'bg-black/30 text-white opacity-0 hover:opacity-100'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isSelected ? 'text-white' : 'text-neutral-300'
                        }`}
                      >
                        {track.title}
                      </p>
                      {track.isNew && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 border border-white/10">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {track.subtitle}
                    </p>
                    {isSelected && (
                      <span className="inline-block text-[10px] text-neutral-400 mt-1 font-mono">
                        ● Now Playing
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* 公式ソーシャル & ストリーミング リンク */}
        <motion.section
          id="social-links-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="border-t border-neutral-900 pt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase font-semibold tracking-[0.2em] text-neutral-400 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-neutral-500" />
              Official Links & Streaming
            </h2>
            <span className="text-xs text-neutral-600">Connect with CHRIS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {SOCIAL_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.id}
                  id={`social-card-${link.id}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:bg-neutral-900/60 hover:border-neutral-800 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 group-hover:border-neutral-700 transition-colors">
                        <Icon className={`w-4 h-4 transition-colors ${link.hoverColor}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-neutral-100 transition-colors">
                          {link.name}
                        </h3>
                        <p className="text-[11px] font-mono text-neutral-500">
                          {link.handle}
                        </p>
                      </div>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors shrink-0 mt-1" />
                  </div>

                  <p className="text-xs text-neutral-400 mt-3 pl-0.5">
                    {link.desc}
                  </p>
                </a>
              );
            })}
          </div>
        </motion.section>
      </main>

      {/* フッター */}
      <footer className="relative z-10 border-t border-neutral-900/80 py-8 text-neutral-500 text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CHRIS (Shota Christopher Ohyama). All rights reserved.</p>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.id}
                id={`footer-link-${item.id}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-300 transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
