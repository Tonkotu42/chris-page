import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Headphones,
  Layers,
  SlidersHorizontal,
  Waves,
} from 'lucide-react';
import { SiteMenu } from '../components/SiteMenu';
import bassFitterHeroImg from '../assets/images/bassfitter_hero_1795094734236.jpg';

const controls = [
  {
    id: 'mode',
    label: 'Downward',
    x: 11,
    y: 9,
    hitWidth: 19,
    shape: 'pill',
    description: 'コンプレッションの動作モードを選びます。画面ではDownwardが選択されています。',
  },
  {
    id: 'spectrum',
    label: 'Spectrum',
    x: 25,
    y: 9,
    hitWidth: 14,
    shape: 'pill',
    description: '周波数スペクトラム表示のオン／オフを切り替えます。',
  },
  {
    id: 'meter',
    label: 'Meter',
    x: 42.5,
    y: 9,
    hitWidth: 14,
    shape: 'pill',
    description: 'レベルメーター表示のオン／オフを切り替えます。',
  },
  {
    id: 'subsonic',
    label: 'Subsonic',
    x: 57.5,
    y: 9,
    hitWidth: 15,
    shape: 'pill',
    description: 'サブソニック機能のオン／オフを切り替えます。',
  },
  {
    id: 'bypass',
    label: 'Bypass',
    x: 75,
    y: 9,
    hitWidth: 13,
    shape: 'pill',
    description: 'エフェクト処理を迂回し、処理前と処理後の音を聴き比べます。',
  },
  {
    id: 'spectrum-display',
    label: 'Spectrum display',
    x: 50,
    y: 38,
    hitWidth: 94,
    shape: 'panel',
    description: '周波数スペクトラムを表示するエリアです。横軸は周波数を表します。',
  },
  {
    id: 'target',
    label: 'Target',
    x: 7.5,
    y: 77.5,
    hitWidth: 10,
    shape: 'knob',
    description: 'Targetを調整し、低域処理のかかり方を整えます。',
  },
  {
    id: 'freq',
    label: 'Freq',
    x: 18.5,
    y: 77.5,
    hitWidth: 10,
    shape: 'knob',
    description: '処理の基準となる周波数を設定します。画像では150.0 Hzです。',
  },
  {
    id: 'sub-hpf',
    label: 'Sub HPF',
    x: 29.5,
    y: 77.5,
    hitWidth: 10,
    shape: 'knob',
    description: 'サブ帯域のハイパスフィルターを設定します。画像では25.0 Hzです。',
  },
  {
    id: 'threshold',
    label: 'Thresh',
    x: 41,
    y: 77.5,
    hitWidth: 10,
    shape: 'knob',
    description: 'コンプレッションが動作を始めるしきい値を設定します。画像では−12.0 dBです。',
  },
  {
    id: 'ratio',
    label: 'Ratio',
    x: 53.5,
    y: 77.5,
    hitWidth: 10,
    shape: 'knob',
    description: 'しきい値を超えた信号への圧縮比を設定します。画像では2.0です。',
  },
  {
    id: 'attack',
    label: 'Attack',
    x: 64.5,
    y: 77.5,
    hitWidth: 10,
    shape: 'knob',
    description: 'コンプレッションが動作し始めるまでの時間を設定します。画像では10.0です。',
  },
  {
    id: 'release',
    label: 'Release',
    x: 76.5,
    y: 77.5,
    hitWidth: 10,
    shape: 'knob',
    description: 'コンプレッションが戻るまでの時間を設定します。画像では100.0です。',
  },
  {
    id: 'rms',
    label: 'RMS',
    x: 87.5,
    y: 77.5,
    hitWidth: 10,
    shape: 'knob',
    description: '信号レベルの検出時間を設定します。画像では10.0です。',
  },
  {
    id: 'output',
    label: 'Output meter',
    x: 96.5,
    y: 86,
    hitWidth: 8,
    shape: 'meter',
    description: '処理後の出力レベルを確認するメーターです。',
  },
];

const steps = [
  {
    number: '01',
    title: '音を再生する',
    text: 'ベースやキックを含む箇所を再生し、スペクトラムとメーターを見ながら低域の状態を確認します。',
    icon: Headphones,
  },
  {
    number: '02',
    title: '低域を調整する',
    text: 'FreqやSub HPFで対象を決め、ThreshとRatioを調整します。AttackとReleaseで音の動きを整えます。',
    icon: SlidersHorizontal,
  },
  {
    number: '03',
    title: '音を聴き比べる',
    text: 'Bypassを切り替えて処理前後を比較し、出力レベルにも注意しながら自然な設定を選びます。',
    icon: Waves,
  },
];

export default function BassFitterPage() {
  const [selectedControlId, setSelectedControlId] = useState<string | null>('freq');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [uiImgFailed, setUiImgFailed] = useState(false);
  const selectedControl = controls.find((control) => control.id === selectedControlId) ?? controls[7];

  useEffect(() => {
    document.title = 'BassFitter | Products | CHRIS';
  }, []);

  return (
    <div
      className="min-h-screen bg-[#07080a] text-neutral-100 selection:bg-cyan-400/25 selection:text-white"
      onClick={() => setSelectedControlId(null)}
    >
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
              href="#bassfitter-interface"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              Interface
            </a>
            <a
              href="#bassfitter-quickstart"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              Quick Start
            </a>
            <Link
              to="/products/sound-patcher"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
            >
              Sound Patcher
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
          <span className="text-neutral-200">BassFitter</span>
        </div>

        {/* Hero Section — matching SoundPatcher Kilohearts-style 3D hardware hero */}
        <section aria-labelledby="bassfitter-title">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <p className="text-xs tracking-[0.14em] text-cyan-300">
              CHRIS Audio <span aria-hidden="true">·</span> Low-End Dynamics Processor <span aria-hidden="true">·</span> Sub HPF &amp; Spectrum
            </p>
            <h1
              id="bassfitter-title"
              className="mt-3 text-4xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
            >
              BassFitter
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-300">
              ベースとキックの低域に狙いを定め、タイトで揺るぎないボトムエンドへ整える専用コンプレッサー。
              Sub HPF とリアルタイム・スペクトラムを見ながら、8つのエンコーダーで低域の動きを精密にコントロールできます。
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
                  src={bassFitterHeroImg}
                  alt="BassFitter 3D physical low-end compressor hardware concept render"
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
                      LOW-END DYNAMICS · SUB HPF &amp; CROSSOVER · 8 PRECISION ENCODERS
                    </p>
                    <p className="mt-1 text-sm text-neutral-200">
                      超低域の整理からパンチあるベース制御まで、視覚的なフィードバックとともに直感操作。
                    </p>
                  </div>
                  <a
                    href="#bassfitter-interface"
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-neutral-950 whitespace-nowrap shrink-0 transition-colors hover:bg-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                  >
                    <span>実機UIガイドを見る</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-[#10141c] via-[#0a0c10] to-[#07080a] p-8 text-center">
                <SlidersHorizontal className="h-10 w-10 text-cyan-400" aria-hidden="true" />
                <p className="mt-3 text-lg font-semibold text-white">BassFitter</p>
                <p className="mt-1 text-xs text-neutral-400">Low-End Compressor by CHRIS</p>
              </div>
            )}
          </motion.div>

          {/* 4-column full-width spec strip below hero */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-[#0e1116] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-red-400">25 Hz</p>
              <p className="mt-1 text-xs font-medium text-white">Sub HPF 搭載</p>
              <p className="mt-1 text-xs text-neutral-400">不要な超低域をカットしヘッドルームを確保</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0e1116] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-yellow-300">150 Hz</p>
              <p className="mt-1 text-xs font-medium text-white">Freq クロスオーバー</p>
              <p className="mt-1 text-xs text-neutral-400">低域処理の対象レンジをピンポイント設定</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0e1116] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-cyan-300">8 Knobs</p>
              <p className="mt-1 text-xs font-medium text-white">精密ダイナミクス制御</p>
              <p className="mt-1 text-xs text-neutral-400">Target・Thresh・Ratio・Attack・Release・RMS</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0e1116] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-white">20kHz</p>
              <p className="mt-1 text-xs font-medium text-white">リアルタイム可視化</p>
              <p className="mt-1 text-xs text-neutral-400">Spectrum・Meter・Subsonic・Bypass 切替</p>
            </div>
          </div>
        </section>

        {/* Interactive Real Plugin Interface Guide */}
        <section
          id="bassfitter-interface"
          className="mt-20 border-t border-white/10 pt-14"
          aria-labelledby="interface-heading"
        >
          <p className="text-xs text-neutral-400">
            Interactive UI Guide <span aria-hidden="true">·</span> Click Any Control
          </p>
          <h2
            id="interface-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            実機インターフェースガイド
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            画面上のノブやボタン、スペクトラムエリアをクリックすると各パラメーターの役割を確認できます。
          </p>

          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.75fr)]">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1015] p-3 shadow-2xl">
              {!uiImgFailed ? (
                <div className="relative">
                  <img
                    src="/bassfitter-interface.png"
                    alt="BassFitter plugin interface"
                    referrerPolicy="no-referrer"
                    onError={() => setUiImgFailed(true)}
                    className="block h-auto w-full rounded"
                    width="624"
                    height="396"
                  />
                  {controls.map((control) => {
                    const isSelected = selectedControl.id === control.id;
                    return (
                      <button
                        key={control.id}
                        type="button"
                        aria-label={`${control.label}の説明を表示`}
                        aria-pressed={isSelected}
                        title={control.label}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedControlId(control.id);
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 border transition-colors duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                          control.shape === 'knob' || control.shape === 'meter'
                            ? 'aspect-square rounded-full'
                            : control.shape === 'pill'
                              ? 'rounded-full'
                              : 'rounded-md'
                        } ${
                          isSelected
                            ? 'border-cyan-300 bg-cyan-400/20 shadow-[0_0_16px_rgba(34,211,238,0.3)]'
                            : 'border-transparent bg-transparent hover:border-white/50 hover:bg-white/10'
                        }`}
                        style={{
                          left: `${control.x}%`,
                          top: `${control.y}%`,
                          width: `${control.hitWidth}%`,
                          aspectRatio:
                            control.shape === 'panel'
                              ? '3.2 / 1'
                              : control.shape === 'pill'
                                ? '4 / 1'
                                : '1 / 1',
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-black text-xs text-neutral-400">
                  BassFitter Interface Preview
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.aside
                key={selectedControl.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                aria-live="polite"
                onClick={(event) => event.stopPropagation()}
                className="rounded-xl border border-white/10 bg-[#0e1116] p-5"
              >
                <p className="font-mono text-xs text-cyan-300">Selected Control</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{selectedControl.label}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-300">
                  {selectedControl.description}
                </p>
              </motion.aside>
            </AnimatePresence>
          </div>
        </section>

        {/* Quick Start */}
        <motion.section
          id="bassfitter-quickstart"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="mt-24 border-t border-white/10 pt-14"
        >
          <p className="text-xs text-neutral-400">
            Quick Start <span aria-hidden="true">·</span> 3-Step Workflow
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            使い方
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="rounded-xl border border-white/10 bg-[#0e1116] p-6"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs tabular-nums text-cyan-300">{step.number}.</p>
                    <Icon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-6 text-neutral-400">{step.text}</p>
                </article>
              );
            })}
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
              to="/products/sound-patcher"
              className="inline-flex items-center gap-2 text-neutral-300 transition-colors hover:text-cyan-300"
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>SOUND PATCHER を見る</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
