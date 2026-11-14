import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowDown,
  ArrowLeft,
  AudioLines,
  CircleHelp,
  Gauge,
  Headphones,
  SlidersHorizontal,
  Waves,
} from 'lucide-react';

const controls = [
  {
    id: 'mode',
    label: 'Downward / Upward',
    shortLabel: 'Mode',
    x: 12.5,
    y: 8.6,
    description:
      'コンプレッションの動作方向を選びます。DownwardはThresholdを超えた信号を抑え、Upwardは小さな信号を持ち上げる方式です。',
  },
  {
    id: 'spectrum',
    label: 'Spectrum',
    shortLabel: 'Spectrum',
    x: 32.5,
    y: 8.6,
    description:
      'スペクトラム表示のオン／オフを切り替えます。オンにすると、再生中の周波数バランスを画面上で確認できます。',
  },
  {
    id: 'meter',
    label: 'Meter',
    shortLabel: 'Meter',
    x: 49.5,
    y: 8.6,
    description:
      'メーター表示のオン／オフを切り替えます。処理中のレベルを確認し、出力が大きくなりすぎていないかチェックします。',
  },
  {
    id: 'subsonic',
    label: 'Subsonic',
    shortLabel: 'Subsonic',
    x: 65,
    y: 8.6,
    description:
      'サブソニック処理を切り替えます。音楽的な低音として不要な超低域を扱う設定です。効果を聴き比べながら使います。',
  },
  {
    id: 'bypass',
    label: 'Bypass',
    shortLabel: 'Bypass',
    x: 76,
    y: 8.6,
    description:
      'プラグインの処理を一時的に迂回します。オン／オフを切り替えて、加工前と加工後の音を同じ音量感で比較します。',
  },
  {
    id: 'spectrum-display',
    label: 'Spectrum display',
    shortLabel: 'Spectrum',
    x: 50,
    y: 38,
    description:
      '横軸は周波数です。20 Hz付近の超低域から高域までを見渡し、低音がどの帯域に集まっているか確認します。',
  },
  {
    id: 'target',
    label: 'Target',
    shortLabel: 'Target',
    x: 7.5,
    y: 76,
    description:
      '処理の目標値を調整するノブです。値を少しずつ動かし、低域のまとまりと元の音の自然さのバランスを取ります。',
  },
  {
    id: 'freq',
    label: 'Freq',
    shortLabel: 'Freq',
    x: 18.5,
    y: 76,
    description:
      '処理の基準となる周波数を設定します。表示例は150 Hzです。対象にしたいベースやキックの帯域に合わせます。',
  },
  {
    id: 'sub-hpf',
    label: 'Sub HPF',
    shortLabel: 'Sub HPF',
    x: 30,
    y: 76,
    description:
      'サブ帯域にかけるハイパスフィルターの周波数を設定します。表示例は25 Hz。不要な超低域を整理する際に使います。',
  },
  {
    id: 'threshold',
    label: 'Threshold',
    shortLabel: 'Thresh',
    x: 42,
    y: 76,
    description:
      'コンプレッションが動き始めるレベルです。下げるほど処理される信号が増えます。表示例は−12 dBです。',
  },
  {
    id: 'ratio',
    label: 'Ratio',
    shortLabel: 'Ratio',
    x: 53.5,
    y: 76,
    description:
      'Thresholdを超えた信号をどの程度圧縮するか決めます。表示例の2.0は、穏やかな圧縮から始める設定です。',
  },
  {
    id: 'attack',
    label: 'Attack',
    shortLabel: 'Attack',
    x: 65.5,
    y: 76,
    description:
      'Thresholdを超えてから圧縮が働くまでの時間です。短くすると素早く反応し、長くすると音の立ち上がりを残しやすくなります。',
  },
  {
    id: 'release',
    label: 'Release',
    shortLabel: 'Release',
    x: 77,
    y: 76,
    description:
      '信号がThresholdを下回った後、圧縮が戻るまでの時間です。低音の揺れやポンピングが自然になる位置を探します。',
  },
  {
    id: 'rms',
    label: 'RMS',
    shortLabel: 'RMS',
    x: 88.5,
    y: 76,
    description:
      '信号レベルを平均化して検出する時間を調整します。短い設定は細かな変化に、長い設定は音量の平均的な動きに反応します。',
  },
  {
    id: 'output',
    label: 'Output meter',
    shortLabel: 'Output',
    x: 96.5,
    y: 86,
    description:
      '処理後の出力レベルを確認します。音割れを避け、バイパス時と比較できる音量に整えます。',
  },
];

const workflow = [
  {
    title: '1. まずは再生して観察',
    text: 'ベースとキックが鳴る箇所をループし、スペクトラムとメーターで低域の状態を確認します。',
  },
  {
    title: '2. 基準と圧縮を調整',
    text: 'FreqやSub HPFで対象帯域を定め、ThresholdとRatioを控えめに設定。AttackとReleaseで音の動きを整えます。',
  },
  {
    title: '3. Bypassで聴き比べ',
    text: 'Bypassを切り替えて変化を確認し、出力レベルを揃えます。低音が自然に聞こえる設定を選びます。',
  },
];

export default function BassFitterPage() {
  const [selectedControlId, setSelectedControlId] = useState('mode');
  const selectedControl =
    controls.find((control) => control.id === selectedControlId) ?? controls[0];

  useEffect(() => {
    document.title = 'BassFitter | CHRIS';
  }, []);

  return (
    <div className="min-h-screen bg-[#08090c] text-neutral-100 selection:bg-red-500/25 selection:text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.07),transparent_35%)]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-white/10 bg-[#08090c]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            CHRIS
          </Link>
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-400">
            BassFitter
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-16">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-12"
        >
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
            <Waves className="h-4 w-4 text-red-300" />
            Bass processing, made clear
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            BassFitter
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-300">
            低域を整えるためのコンプレッサープラグイン。
            実際の画面を見ながら各コントロールの役割を確認し、音を聴いて少しずつ調整する流れを紹介します。
          </p>
        </motion.section>

        <section aria-labelledby="interface-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                Interactive guide
              </p>
              <h2 id="interface-title" className="mt-1 text-xl font-semibold text-white">
                画面のポイントを選んで解説を見る
              </h2>
            </div>
            <p className="text-xs text-neutral-500">番号をクリックしてください</p>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.75fr)]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111316] p-2 shadow-2xl">
              <div className="relative">
                <img
                  src="/bassfitter-interface.png"
                  alt="BassFitterプラグインの画面。上部にモードと各種表示設定、中央に周波数スペクトラム、下部にTarget、Freq、Sub HPF、Thresh、Ratio、Attack、Release、RMSのノブが並ぶ。"
                  className="block h-auto w-full"
                  width="624"
                  height="396"
                />
                {controls.map((control, index) => {
                  const isSelected = selectedControlId === control.id;
                  return (
                    <button
                      key={control.id}
                      type="button"
                      aria-label={`${index + 1}. ${control.label}の説明を表示`}
                      aria-pressed={isSelected}
                      title={control.label}
                      onClick={() => setSelectedControlId(control.id)}
                      className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent transition hover:bg-red-400/15 hover:ring-1 hover:ring-red-300/80 focus-visible:bg-red-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300"
                      style={{ left: `${control.x}%`, top: `${control.y}%` }}
                    />
                  );
                })}
              </div>
            </div>

            <motion.aside
              key={selectedControl.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              aria-live="polite"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-200">
                <CircleHelp className="h-4 w-4" />
                Selected control
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">
                {selectedControl.label}
              </h3>
              <p className="mt-3 text-sm leading-7 text-neutral-300">
                {selectedControl.description}
              </p>
              <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-neutral-500">
                まずは小さな変化から試し、音量を揃えて前後を聴き比べてください。
              </p>
            </motion.aside>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {controls.map((control, index) => (
              <button
                key={control.id}
                type="button"
                onClick={() => setSelectedControlId(control.id)}
                aria-pressed={selectedControlId === control.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                  selectedControlId === control.id
                    ? 'border-red-300/50 bg-red-300/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="font-mono text-[10px] text-red-200">{index + 1}</span>
                <span>{control.shortLabel}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-7">
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
              Signal flow
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              基本の使い方
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((step, index) => {
              const icons = [AudioLines, SlidersHorizontal, Headphones];
              const Icon = icons[index];
              return (
                <article
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-red-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-400">{step.text}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-neutral-400">
            <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />
            <p>
              画面上の値は共有いただいたスクリーンショットに表示されている初期値です。
              実際の効果や最適値は素材、音量、再生環境によって変わるため、耳で確認しながら調整してください。
              ユーザーガイドは画面の操作を紹介するもので、音声処理を実行するものではありません。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
