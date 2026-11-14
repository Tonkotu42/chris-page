import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowLeft, Headphones, SlidersHorizontal, Waves } from 'lucide-react';

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
    title: '音を再生する',
    text: 'ベースやキックを含む箇所を再生し、スペクトラムとメーターを見ながら低域の状態を確認します。',
    icon: Headphones,
  },
  {
    title: '低域を調整する',
    text: 'FreqやSub HPFで対象を決め、ThreshとRatioを調整します。AttackとReleaseで音の動きを整えます。',
    icon: SlidersHorizontal,
  },
  {
    title: '音を聴き比べる',
    text: 'Bypassを切り替えて処理前後を比較し、出力レベルにも注意しながら自然な設定を選びます。',
    icon: Waves,
  },
];

export default function BassFitterPage() {
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const selectedControl = controls.find((control) => control.id === selectedControlId);

  useEffect(() => {
    document.title = 'BassFitter | CHRIS';
  }, []);

  return (
    <div
      className="min-h-screen bg-black text-neutral-100 selection:bg-white/25 selection:text-white"
      onClick={() => setSelectedControlId(null)}
    >
      <header className="border-b border-white/10 bg-black">
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

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-12 md:pt-16">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            BassFitter
          </h1>
          <p className="mt-4 text-sm text-neutral-400 sm:text-base">
            低域を整えるコンプレッサープラグイン。
          </p>

          <div className="mt-10 grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.7fr)]">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black p-2 shadow-2xl">
              <div className="relative">
                <img
                  src="/bassfitter-interface.png"
                  alt="BassFitter plugin interface"
                  className="block h-auto w-full"
                  width="624"
                  height="396"
                />
                {controls.map((control) => {
                  const isSelected = selectedControlId === control.id;
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
                      className={`absolute -translate-x-1/2 -translate-y-1/2 border transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                        control.shape === 'knob' || control.shape === 'meter'
                          ? 'aspect-square rounded-full'
                          : control.shape === 'pill'
                            ? 'rounded-full'
                            : 'rounded-md'
                      } ${
                        isSelected
                          ? 'border-white/80 bg-white/20 shadow-[0_0_16px_rgba(255,255,255,0.28)]'
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
            </div>

            <AnimatePresence mode="wait">
              {selectedControl && (
                <motion.aside
                  key={selectedControl.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                  aria-live="polite"
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <h2 className="text-xl font-semibold text-white">{selectedControl.label}</h2>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    {selectedControl.description}
                  </p>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mt-24 border-t border-white/10 pt-10"
        >
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                Quick start
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">使い方</h2>
            </div>
            <ArrowDown className="h-5 w-5 text-neutral-500" aria-hidden="true" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
                >
                  <div className="flex justify-end">
                    <Icon className="h-4 w-4 text-red-200" />
                  </div>
                  <h3 className="mt-5 font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">{step.text}</p>
                </article>
              );
            })}
          </div>

          <Link
            to="/"
            className="mt-8 inline-flex text-sm text-neutral-400 transition hover:text-white"
          >
            CHRIS Official Site
          </Link>
        </motion.section>
      </main>
    </div>
  );
}
