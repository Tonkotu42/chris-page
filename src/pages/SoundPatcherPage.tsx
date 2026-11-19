import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { SiteMenu } from '../components/SiteMenu';
import soundPatcherHeroImg from '../assets/images/sound_patcher_hero_1795080694869.jpg';
import soundPatcherModulesImg from '../assets/images/sound_patcher_modules_1795080694732.jpg';

type ModuleId =
  | 'dynamic-eq'
  | 'static-eq'
  | 'opt-comp'
  | 'fet-comp'
  | 'soft-clip'
  | 'limiter';

interface ModuleSpec {
  id: ModuleId;
  name: string;
  category: string;
  accent: string;
  maxInstances: number;
  summary: string;
  detail: string;
}

interface RackSlotItem {
  uid: string;
  moduleId: ModuleId;
}

interface PresetDefinition {
  id: string;
  label: string;
  description: string;
  modules: ModuleId[];
  blend: number;
  dry: number;
  rack: number;
}

interface InterfaceHotspot {
  id: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  description: string;
}

const MODULES: ModuleSpec[] = [
  {
    id: 'dynamic-eq',
    name: 'DYNAMIC EQ',
    category: 'Dynamic Tone',
    accent: '#22d3ee',
    maxInstances: 4,
    summary: '入力レベルに応じて帯域を自動で制御するダイナミックEQ。',
    detail: 'ボーカルの歯擦音やベースの共振など、必要な瞬間だけ帯域を抑えたい場面に最適。',
  },
  {
    id: 'static-eq',
    name: 'STATIC EQ',
    category: 'Surgical Tone',
    accent: '#60a5fa',
    maxInstances: 4,
    summary: '素早く明瞭な音色補正を行うスタティックEQ。',
    detail: '不要なローカットやエア感のブーストなど、チェインの土台作りを担います。',
  },
  {
    id: 'opt-comp',
    name: 'OPT COMP',
    category: 'Optical Dynamics',
    accent: '#facc15',
    maxInstances: 4,
    summary: '音楽的で滑らかな減衰特性を持つオプト系コンプレッサー。',
    detail: 'ボーカルやバス全体のレベルを自然に整え、まとまりのある質感に仕上げます。',
  },
  {
    id: 'fet-comp',
    name: 'FET COMP',
    category: 'Fast Dynamics',
    accent: '#fb923c',
    maxInstances: 4,
    summary: '高速アタックとパンチのある倍音感が特長のFETコンプレッサー。',
    detail: 'ドラムやスネア、アタックを前に出したいリードに力強い存在感を与えます。',
  },
  {
    id: 'soft-clip',
    name: 'SOFT CLIP',
    category: 'Harmonic Saturation',
    accent: '#f87171',
    maxInstances: 4,
    summary: 'トランジェントを丸めながら音圧と密度を稼ぐソフトクリッパー。',
    detail: 'リミッターの前段に挿すことで、ピークを自然に削ってクリアなラウドネスを実現します。',
  },
  {
    id: 'limiter',
    name: 'LIMITER',
    category: 'Peak Ceiling',
    accent: '#84cc16',
    maxInstances: 4,
    summary: '最終段のピークを確実に抑え込むブリックウォール・リミッター。',
    detail: 'ラック全体の出力上限を管理し、オーバーロードを防ぎつつ音圧を仕上げます。',
  },
];

const MODULE_MAP: Record<ModuleId, ModuleSpec> = MODULES.reduce(
  (acc, mod) => {
    acc[mod.id] = mod;
    return acc;
  },
  {} as Record<ModuleId, ModuleSpec>,
);

const MAX_SLOTS = 12;

const PRESETS: PresetDefinition[] = [
  {
    id: 'vocal',
    label: 'Vocal Polish',
    description: '不要な低域整理 → FETでアタック制御 → OPTで滑らかに整え → Dynamic EQで歯擦音ケア。',
    modules: ['static-eq', 'fet-comp', 'opt-comp', 'dynamic-eq'],
    blend: 100,
    dry: 100,
    rack: 100,
  },
  {
    id: 'drum-bus',
    label: 'Drum Bus Parallel',
    description: '原音(Dry A)を残しつつ、FET + Soft Clipの濃いラック音(Rack B)をパラレル混合。',
    modules: ['static-eq', 'fet-comp', 'soft-clip', 'limiter'],
    blend: 48,
    dry: 100,
    rack: 88,
  },
  {
    id: 'master-glue',
    label: 'Mix Bus Glue',
    description: 'Opt Compの接着感とDynamic EQ、Soft Clip + Limiterの2段ピーク処理で仕上げ。',
    modules: ['dynamic-eq', 'opt-comp', 'soft-clip', 'limiter'],
    blend: 100,
    dry: 100,
    rack: 100,
  },
];

const INTERFACE_HOTSPOTS: InterfaceHotspot[] = [
  {
    id: 'header-slots',
    label: 'SLOTS: 0/12 & Spec: ON',
    left: 25,
    top: 5,
    width: 44,
    height: 9,
    description:
      '現在ラックにロードしているモジュール数（最大12スロット）と、上部スペクトラム表示（Spec: ON/OFF）をワンクリックで切り替えられます。',
  },
  {
    id: 'view-mode',
    label: 'Mini View Switcher',
    left: 88,
    top: 5,
    width: 11,
    height: 9,
    description:
      '画面サイズや作業密度に応じて「Mini」などのUI表示サイズを切り替えられるコンパクト・セレクターです。',
  },
  {
    id: 'spectrum',
    label: '20Hz – 20kHz Spectrum Bar',
    left: 42,
    top: 16,
    width: 82,
    height: 13,
    description:
      '20Hzから20kHzまでの周波数バランスを常時モニタリング。ラック全体の変化をひと目で把握できます。',
  },
  {
    id: 'rack-bay',
    label: 'Modular Drop Rack (Up to 12 Slots)',
    left: 42,
    top: 56,
    width: 82,
    height: 62,
    description:
      '右側のSHELFからエフェクトをドラッグ＆ドロップして信号順を自由に組み替えられるメインのモジュラーラック領域です。',
  },
  {
    id: 'shelf',
    label: 'Right Module Shelf (0/4 Each)',
    left: 91.5,
    top: 54,
    width: 15,
    height: 82,
    description:
      '6種類のコアエフェクトを格納するシェルフ。色分けされた各モジュールはそれぞれ最大4基（0/4）までラックへ配置できます。',
  },
  {
    id: 'parallel-mixer',
    label: 'Blend · Dry (A) · Rack (B)',
    left: 42,
    top: 93,
    width: 82,
    height: 11,
    description:
      'ラック全体のかかり具合を調整するBlendと、原音Dry (A)／処理音Rack (B)の個別ゲインを搭載。ニューヨーク・コンプレッションなどのパラレル処理が即座に完結します。',
  },
];

const WORKFLOW_STEPS = [
  {
    number: '01',
    title: 'シェルフからモジュールを配置',
    text: '右側のSHELFから必要なエフェクトをドラッグ＆ドロップ。EQ・コンプ・クリッパーを最大12スロットまで自由に直列構成できます。',
  },
  {
    number: '02',
    title: 'スペクトラムを見ながら順番を最適化',
    text: '上部の20Hz–20kHzアナライザーで帯域の偏りを監視しつつ、モジュールの順序をワンアクションで入れ替えて音色を追い込みます。',
  },
  {
    number: '03',
    title: 'Dry (A) / Rack (B) でパラレル仕上げ',
    text: '下部のBlend・Dry (A)・Rack (B)スライダーで原音の芯を残しながらラックの質感をブレンドし、ミックスへ自然に馴染ませます。',
  },
];

export default function SoundPatcherPage() {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [modulesImgFailed, setModulesImgFailed] = useState(false);
  const [uiImgFailed, setUiImgFailed] = useState(false);

  const [activeTab, setActiveTab] = useState<'simulator' | 'interface'>('simulator');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('rack-bay');

  const [rack, setRack] = useState<RackSlotItem[]>([
    { uid: 'init-1', moduleId: 'static-eq' },
    { uid: 'init-2', moduleId: 'fet-comp' },
    { uid: 'init-3', moduleId: 'soft-clip' },
    { uid: 'init-4', moduleId: 'limiter' },
  ]);
  const [specEnabled, setSpecEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'Mini' | 'Standard'>('Mini');
  const [blend, setBlend] = useState(48);
  const [dryLevel, setDryLevel] = useState(100);
  const [rackLevel, setRackLevel] = useState(88);
  const [activePresetId, setActivePresetId] = useState<string | null>('drum-bus');

  useEffect(() => {
    document.title = 'SOUND PATCHER | Products | CHRIS';
  }, []);

  const countByModule = (moduleId: ModuleId) =>
    rack.filter((item) => item.moduleId === moduleId).length;

  const addModuleToRack = (moduleId: ModuleId) => {
    if (rack.length >= MAX_SLOTS) return;
    if (countByModule(moduleId) >= MODULE_MAP[moduleId].maxInstances) return;
    setActivePresetId(null);
    setRack((prev) => [
      ...prev,
      { uid: `${moduleId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, moduleId },
    ]);
  };

  const removeSlot = (uid: string) => {
    setActivePresetId(null);
    setRack((prev) => prev.filter((item) => item.uid !== uid));
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rack.length) return;
    setActivePresetId(null);
    setRack((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const applyPreset = (preset: PresetDefinition) => {
    setActivePresetId(preset.id);
    setRack(
      preset.modules.map((moduleId, idx) => ({
        uid: `${preset.id}-${idx}-${Date.now()}`,
        moduleId,
      })),
    );
    setBlend(preset.blend);
    setDryLevel(preset.dry);
    setRackLevel(preset.rack);
  };

  const clearRack = () => {
    setActivePresetId(null);
    setRack([]);
  };

  const selectedHotspot =
    INTERFACE_HOTSPOTS.find((item) => item.id === selectedHotspotId) ?? INTERFACE_HOTSPOTS[0];

  const effectiveRackWeight = Math.round((blend / 100) * rackLevel);
  const effectiveDryWeight = Math.round(((100 - blend) / 100) * dryLevel);

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
            <Link
              to="/products"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              Products
            </Link>
            <a
              href="#rack-interactive"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              Interactive Rack
            </a>
            <a
              href="#modules"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              Modules
            </a>
            <Link
              to="/bassfitter"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              BassFitter
            </Link>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <SiteMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-14">
        <div className="mb-8 flex items-center gap-2 text-xs text-neutral-500">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Products</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-neutral-200">SOUND PATCHER</span>
        </div>

        {/* Hero Section — Kilohearts-style tactile hardware centerpiece */}
        <section aria-labelledby="sound-patcher-title">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="text-xs tracking-[0.14em] text-cyan-300">
              CHRIS Audio <span aria-hidden="true">·</span> Modular Multi-Effect Rack <span aria-hidden="true">·</span> Up to 12 Slots
            </p>
            <h1
              id="sound-patcher-title"
              className="mt-3 text-4xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
            >
              SOUND PATCHER
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-300">
              必要なダイナミクスとEQを、1つのラックに瞬時にパッチング。最大12スロットのモジュラー構成と
              Dry (A) / Rack (B) のパラレルブレンドで、音作りのスピードと精度を両立するマルチエフェクト・プラグイン。
            </p>
          </motion.div>

          {/* 3D Hardware Hero Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="mt-9 overflow-hidden rounded-xl border border-white/10 bg-[#0d1015] shadow-2xl"
          >
            {!heroImgFailed ? (
              <div className="relative aspect-video w-full overflow-hidden bg-[#0b0d12]">
                <img
                  src={soundPatcherHeroImg}
                  alt="SOUND PATCHER 3D physical modular audio hardware concept render"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07080a]/90 via-[#07080a]/35 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-6 bottom-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs tabular-nums text-cyan-300">
                      MODULAR DSP CHASSIS · 6 CORE MODULES · PARALLEL A/B MIXER
                    </p>
                    <p className="mt-1 text-sm text-neutral-200">
                      実機ラックを扱う感覚で、ドラッグ＆ドロップだけで理想のエフェクトチェインを構築。
                    </p>
                  </div>
                  <a
                    href="#rack-interactive"
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-neutral-950 whitespace-nowrap shrink-0 transition-colors hover:bg-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                  >
                    <span>ラック構成を試す</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-[#10141c] via-[#0a0c10] to-[#07080a] p-8 text-center">
                <Layers className="h-10 w-10 text-cyan-400" aria-hidden="true" />
                <p className="mt-3 text-lg font-semibold text-white">SOUND PATCHER</p>
                <p className="mt-1 text-xs text-neutral-400">12-Slot Modular Audio Rack by CHRIS</p>
              </div>
            )}
          </motion.div>

          {/* 4-column full-width spec strip below hero */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-[#0e1116] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-cyan-300">12</p>
              <p className="mt-1 text-xs font-medium text-white">最大スロット数</p>
              <p className="mt-1 text-xs text-neutral-400">直列チェインを自由に並び替え</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0e1116] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-yellow-300">6 × 4</p>
              <p className="mt-1 text-xs font-medium text-white">6種モジュール搭載</p>
              <p className="mt-1 text-xs text-neutral-400">各モジュール最大4基まで重複配置</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0e1116] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-white">A / B</p>
              <p className="mt-1 text-xs font-medium text-white">パラレルミックス</p>
              <p className="mt-1 text-xs text-neutral-400">Blend・Dry (A)・Rack (B) を独立制御</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0e1116] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-emerald-300">20kHz</p>
              <p className="mt-1 text-xs font-medium text-white">内蔵スペクトラム</p>
              <p className="mt-1 text-xs text-neutral-400">20Hz–20kHz の帯域を常時可視化</p>
            </div>
          </div>
        </section>

        {/* Interactive Rack Simulator & Real Interface Guide */}
        <section
          id="rack-interactive"
          className="mt-20 border-t border-white/10 pt-14"
          aria-labelledby="interactive-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs text-neutral-400">
                Interactive Preview <span aria-hidden="true">·</span> Signal Chain &amp; UI Guide
              </p>
              <h2
                id="interactive-heading"
                className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                モジュラーラックを体験する
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="SOUND PATCHER プレビューモード切替"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0e1116] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'simulator'}
                onClick={() => setActiveTab('simulator')}
                className={`rounded-md px-4 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'simulator'
                    ? 'bg-cyan-400 text-neutral-950'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                ラック構成シミュレーター
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'interface'}
                onClick={() => setActiveTab('interface')}
                className={`rounded-md px-4 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'interface'
                    ? 'bg-cyan-400 text-neutral-950'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                実機UIガイド
              </button>
            </div>
          </div>

          {activeTab === 'simulator' ? (
            <div className="mt-8">
              {/* Preset selector bar */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs text-neutral-400">おすすめプリセット:</span>
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        activePresetId === preset.id
                          ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-200'
                          : 'border-white/10 bg-[#101319] text-neutral-300 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={clearRack}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#101319] px-3 py-1.5 text-xs text-neutral-300 whitespace-nowrap shrink-0 transition-colors hover:border-white/25 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>ラックを空にする</span>
                </button>
              </div>

              {activePresetId && (
                <p className="mb-4 text-xs text-neutral-400">
                  {PRESETS.find((p) => p.id === activePresetId)?.description}
                </p>
              )}

              {/* Plugin Chassis Simulator mirroring the exact screenshot layout */}
              <div className="overflow-hidden rounded-xl border border-white/15 bg-[#121417] shadow-2xl">
                {/* Top bar matching screenshot */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d0f12] px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-5">
                    <span className="font-mono text-sm font-bold tracking-wider text-cyan-400">
                      SOUND PATCHER
                    </span>
                    <span className="font-mono text-xs font-semibold tabular-nums text-yellow-300">
                      SLOTS: {rack.length}/{MAX_SLOTS}
                    </span>
                    <label className="inline-flex items-center gap-2 text-xs text-neutral-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={specEnabled}
                        onChange={(e) => setSpecEnabled(e.target.checked)}
                        className="h-3.5 w-3.5 accent-cyan-400"
                      />
                      <span>Spec: {specEnabled ? 'ON' : 'OFF'}</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setViewMode((m) => (m === 'Mini' ? 'Standard' : 'Mini'))}
                      className="rounded border border-white/20 bg-[#171a20] px-3 py-1 font-mono text-xs text-neutral-200 transition-colors hover:border-cyan-400/60 cursor-pointer"
                    >
                      {viewMode}
                    </button>
                    <span className="font-mono text-xs font-semibold tracking-[0.2em] text-neutral-200">
                      CHRIS
                    </span>
                  </div>
                </div>

                {/* Main body: Left (Spectrum + Rack + Mixer) | Right (SHELF) */}
                <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="flex flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
                    {/* Spectrum Strip */}
                    <div className="border-b border-cyan-400/40 bg-[#090b0e] px-3 py-2">
                      <div className="grid grid-cols-8 font-mono text-[10px] tabular-nums text-neutral-500">
                        <span>20</span>
                        <span>50</span>
                        <span>100</span>
                        <span>200</span>
                        <span>500</span>
                        <span>1k</span>
                        <span>2k</span>
                        <span className="text-right">20k</span>
                      </div>
                      <div className="mt-1.5 flex h-6 items-end gap-1 overflow-hidden">
                        {Array.from({ length: 36 }).map((_, i) => {
                          const weight = specEnabled
                            ? Math.max(
                                12,
                                Math.round(
                                  18 +
                                    Math.sin(i * 0.45 + rack.length * 0.7) * 26 +
                                    (rack.length * 5) % 30,
                                ),
                              )
                            : 4;
                          return (
                            <span
                              key={i}
                              className="flex-1 rounded-t-[1px] bg-cyan-400/70 transition-all duration-200"
                              style={{ height: `${Math.min(100, weight)}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Central Drop Rack */}
                    <div
                      className={`flex flex-1 flex-col justify-center bg-[#0c0d10] p-4 ${
                        viewMode === 'Mini' ? 'min-h-[220px]' : 'min-h-[290px]'
                      }`}
                    >
                      {rack.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-8 text-center">
                          <p className="font-mono text-xs tracking-[0.18em] text-neutral-500">
                            CLICK EFFECTS FROM RIGHT SHELF TO PATCH
                          </p>
                          <p className="mt-2 text-xs text-neutral-500">
                            右側のSHELFからモジュールを選ぶと、ここに信号順で追加されます。
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {rack.map((slot, index) => {
                            const spec = MODULE_MAP[slot.moduleId];
                            return (
                              <div
                                key={slot.uid}
                                className="flex flex-col justify-between rounded-md border border-white/15 bg-[#171a20] p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="h-3 w-1.5 shrink-0 rounded-[1px]"
                                      style={{ backgroundColor: spec.accent }}
                                      aria-hidden="true"
                                    />
                                    <div className="min-w-0">
                                      <p className="truncate font-mono text-xs font-semibold text-white">
                                        {spec.name}
                                      </p>
                                      <p className="font-mono text-[10px] tabular-nums text-neutral-400">
                                        SLOT {String(index + 1).padStart(2, '0')} · {spec.category}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeSlot(slot.uid)}
                                    aria-label={`${spec.name} をラックから削除`}
                                    className="rounded p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                                  <span className="font-mono text-[10px] text-neutral-400">
                                    IN → DSP → OUT
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => moveSlot(index, -1)}
                                      disabled={index === 0}
                                      aria-label="前のスロットへ移動"
                                      className="rounded border border-white/10 p-1 text-neutral-300 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                      <ChevronLeft className="h-3 w-3" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveSlot(index, 1)}
                                      disabled={index === rack.length - 1}
                                      aria-label="次のスロットへ移動"
                                      className="rounded border border-white/10 p-1 text-neutral-300 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Parallel Mixer Bar: Blend | Dry (A) | Rack (B) */}
                    <div className="grid gap-4 border-t border-white/10 bg-[#0d0f12] px-4 py-3 md:grid-cols-3">
                      <label className="flex items-center gap-3 text-xs">
                        <span className="w-14 shrink-0 font-mono text-neutral-200">Blend</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={blend}
                          onChange={(e) => setBlend(Number(e.target.value))}
                          className="h-1.5 flex-1 cursor-pointer accent-yellow-400"
                        />
                        <span className="w-12 shrink-0 rounded border border-white/20 bg-black px-1.5 py-0.5 text-right font-mono text-[11px] tabular-nums text-white">
                          {blend.toFixed(1)}
                        </span>
                      </label>

                      <label className="flex items-center gap-3 text-xs">
                        <span className="w-14 shrink-0 font-mono text-neutral-200">Dry (A)</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={dryLevel}
                          onChange={(e) => setDryLevel(Number(e.target.value))}
                          className="h-1.5 flex-1 cursor-pointer accent-cyan-400"
                        />
                        <span className="w-12 shrink-0 rounded border border-white/20 bg-black px-1.5 py-0.5 text-right font-mono text-[11px] tabular-nums text-white">
                          {dryLevel.toFixed(1)}
                        </span>
                      </label>

                      <label className="flex items-center gap-3 text-xs">
                        <span className="w-14 shrink-0 font-mono text-neutral-200">Rack (B)</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={rackLevel}
                          onChange={(e) => setRackLevel(Number(e.target.value))}
                          className="h-1.5 flex-1 cursor-pointer accent-cyan-400"
                        />
                        <span className="w-12 shrink-0 rounded border border-white/20 bg-black px-1.5 py-0.5 text-right font-mono text-[11px] tabular-nums text-white">
                          {rackLevel.toFixed(1)}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Right SHELF */}
                  <aside className="bg-[#15181e] p-3" aria-label="Module Shelf">
                    <div className="mb-2.5 flex items-center justify-between px-1">
                      <span className="font-mono text-[11px] tracking-wider text-neutral-400">
                        SHELF
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500">CLICK TO ADD</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                      {MODULES.map((mod) => {
                        const used = countByModule(mod.id);
                        const isFull = used >= mod.maxInstances || rack.length >= MAX_SLOTS;
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => addModuleToRack(mod.id)}
                            className="group flex items-center justify-between gap-2 rounded border border-white/15 bg-[#1d2129] px-2.5 py-2.5 text-left transition-colors hover:border-white/35 hover:bg-[#252a34] disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span
                                className="h-5 w-1 shrink-0 rounded-[1px]"
                                style={{ backgroundColor: mod.accent }}
                                aria-hidden="true"
                              />
                              <span className="truncate font-mono text-xs font-semibold text-white">
                                {mod.name}
                              </span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0 font-mono text-[10px] tabular-nums text-neutral-300">
                              <span>
                                {used}/{mod.maxInstances}
                              </span>
                              <Plus className="h-3 w-3 text-neutral-400 group-hover:text-white" aria-hidden="true" />
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-3 font-mono text-[11px] tabular-nums text-neutral-400">
                      <div className="flex justify-between">
                        <span>Dry Out</span>
                        <span className="text-neutral-200">{effectiveDryWeight}%</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span>Rack Out</span>
                        <span className="text-cyan-300">{effectiveRackWeight}%</span>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.75fr)]">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1015] p-3">
                {!uiImgFailed ? (
                  <div className="relative">
                    <img
                      src="/assets/aistudio/image_c4f90b85.png"
                      alt="SOUND PATCHER actual plugin interface"
                      referrerPolicy="no-referrer"
                      onError={() => setUiImgFailed(true)}
                      className="block h-auto w-full rounded"
                    />
                    {INTERFACE_HOTSPOTS.map((spot) => {
                      const isSelected = selectedHotspotId === spot.id;
                      return (
                        <button
                          key={spot.id}
                          type="button"
                          aria-label={`${spot.label} の説明を表示`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedHotspotId(spot.id)}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded border transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                            isSelected
                              ? 'border-cyan-300 bg-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.28)]'
                              : 'border-white/20 bg-transparent hover:border-cyan-300/70 hover:bg-cyan-400/10'
                          }`}
                          style={{
                            left: `${spot.left}%`,
                            top: `${spot.top}%`,
                            width: `${spot.width}%`,
                            height: `${spot.height}%`,
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex aspect-[3/1] items-center justify-center bg-[#090b0f] text-xs text-neutral-400">
                    SOUND PATCHER Interface Preview
                  </div>
                )}
                <p className="mt-3 text-xs text-neutral-400">
                  実機UIの各エリアをクリックすると、右側に詳細説明が表示されます。
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.aside
                  key={selectedHotspot.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                  aria-live="polite"
                  className="rounded-xl border border-white/10 bg-[#0e1116] p-5"
                >
                  <p className="font-mono text-xs text-cyan-300">Selected Section</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{selectedHotspot.label}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    {selectedHotspot.description}
                  </p>
                </motion.aside>
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* 6 Core Modules Showcase */}
        <section
          id="modules"
          className="mt-24 border-t border-white/10 pt-14"
          aria-labelledby="modules-heading"
        >
          <p className="text-xs text-neutral-400">
            Modular Shelf <span aria-hidden="true">·</span> 6 Essential Processors
          </p>
          <h2
            id="modules-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            厳選された6つのスナップイン・モジュール
          </h2>

          <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0e1116]">
              {!modulesImgFailed ? (
                <img
                  src={soundPatcherModulesImg}
                  alt="Six physical anodized snap-in effect blocks for SOUND PATCHER"
                  referrerPolicy="no-referrer"
                  onError={() => setModulesImgFailed(true)}
                  className="h-full min-h-[280px] w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center p-8 text-center">
                  <Sliders className="h-8 w-8 text-cyan-400" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-white">6 Snap-In Modules</p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {MODULES.map((mod, idx) => (
                <article
                  key={mod.id}
                  className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#0e1116] p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-mono text-xs font-semibold text-white">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: mod.accent }}
                          aria-hidden="true"
                        />
                        {mod.name}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-neutral-500">
                        0{idx + 1} · MAX {mod.maxInstances}
                      </span>
                    </div>
                    <p className="mt-2.5 text-sm font-medium leading-6 text-neutral-200">
                      {mod.summary}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">{mod.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow / Quick Start */}
        <section className="mt-24 border-t border-white/10 pt-14" aria-labelledby="workflow-heading">
          <p className="text-xs text-neutral-400">
            Quick Start <span aria-hidden="true">·</span> 3-Step Workflow
          </p>
          <h2
            id="workflow-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            使い方
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {WORKFLOW_STEPS.map((step) => (
              <article
                key={step.number}
                className="rounded-xl border border-white/10 bg-[#0e1116] p-6"
              >
                <p className="font-mono text-xs tabular-nums text-cyan-300">{step.number}.</p>
                <h3 className="mt-3 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-neutral-400">{step.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-neutral-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>すべてのプロダクトを見る</span>
            </Link>
            <Link
              to="/bassfitter"
              className="inline-flex items-center gap-2 text-neutral-300 transition-colors hover:text-cyan-300"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>BassFitter を見る</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
