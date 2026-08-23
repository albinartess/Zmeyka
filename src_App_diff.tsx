--- src/App.tsx (原始)
export default function App() {
  return (
    <div/>
  );
}


+++ src/App.tsx (修改后)
import { useCallback, useState } from "react";
import SnakeGame from "./components/SnakeGame";
import { DIFFICULTIES, loadBest, type DifficultyKey } from "./game/core";
import { sound } from "./game/sound";
import {
  LogoMark,
  SoundOnIcon,
  SoundOffIcon,
  TrophyIcon,
  BoltIcon,
  StarIcon,
  TurnIcon,
  SwipeIcon,
} from "./components/icons";

const NOISE =
  "url(\"image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-ink" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(58% 46% at 18% 8%, rgba(34,197,94,0.11), transparent 62%)," +
            "radial-gradient(48% 42% at 86% 92%, rgba(249,115,22,0.08), transparent 62%)," +
            "radial-gradient(40% 38% at 84% 10%, rgba(34,211,238,0.07), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,246,90,0.045) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(168,246,90,0.045) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(120% 90% at 50% 30%, #000 30%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(120% 90% at 50% 30%, #000 30%, transparent 90%)",
        }}
      />
      <div className="animate-drift absolute -left-44 -top-44 h-[36rem] w-[36rem] rounded-full bg-[#22c55e]/[0.13] blur-[110px]" />
      <div className="animate-drift-slow absolute -bottom-52 -right-40 h-[34rem] w-[34rem] rounded-full bg-[#f97316]/[0.09] blur-[120px]" />
      <div className="animate-drift absolute right-[12%] top-[6%] h-64 w-64 rounded-full bg-[#22d3ee]/[0.08] blur-[90px]" />
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: NOISE }} />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(125% 120% at 50% 38%, transparent 52%, rgba(2,8,5,0.8) 100%)",
        }}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.28em] text-fog">
      <span className="h-px w-5 bg-acid/80" />
      {children}
    </h3>
  );
}

function KeyRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-[7px]">
      <span className="flex flex-wrap items-center gap-1">
        {keys.map((k) => (
          <span key={k} className="kbd">
            {k}
          </span>
        ))}
      </span>
      <span className="text-xs text-mist/80">{label}</span>
    </li>
  );
}

export default function App() {
  const [difficulty, setDifficulty] = useState<DifficultyKey>(() => {
    try {
      const saved = localStorage.getItem("snake:diff") as DifficultyKey | null;
      return saved && DIFFICULTIES.some((d) => d.key === saved) ? saved : "normal";
    } catch {
      return "normal";
    }
  });
  const [bests, setBests] = useState<Record<DifficultyKey, number>>(() => ({
    easy: loadBest("easy"),
    normal: loadBest("normal"),
    hard: loadBest("hard"),
  }));
  const [muted, setMuted] = useState(sound.muted);

  const changeDifficulty = useCallback((k: DifficultyKey) => {
    setDifficulty(k);
    try {
      localStorage.setItem("snake:diff", k);
    } catch {
      /* noop */
    }
    sound.ui();
  }, []);

  const refreshBests = useCallback(() => {
    setBests({ easy: loadBest("easy"), normal: loadBest("normal"), hard: loadBest("hard") });
  }, []);

  const toggleMute = useCallback(() => {
    const m = !sound.muted;
    sound.setMuted(m);
    setMuted(m);
    if (!m) sound.ui();
  }, []);

  return (
    <div className="relative min-h-screen font-body text-[#e9f6ee]">
      <Background />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
        {/* ── шапка ── */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <LogoMark size={46} className="animate-floaty drop-shadow-[0_0_18px_rgba(168,246,90,0.35)]" />
            <div>
              <div className="flex items-baseline gap-2.5">
                <h1 className="font-display text-[26px] font-black leading-none tracking-tight sm:text-3xl">
                  ЗМЕЙКА
                </h1>
                <span className="rounded-sm border border-acid/40 bg-acid/10 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.2em] text-acid">
                  arcade
                </span>
              </div>
              <p className="mt-1 text-xs text-fog">
                Канвас · 60 FPS · клавиатура и свайпы
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-md border border-line bg-pine/70 px-2.5 py-1.5 text-[11px] font-semibold text-fog sm:flex">
              <span className="animate-blinkdot h-1.5 w-1.5 rounded-full bg-acid" />
              готова к игре
            </span>
            <button
              type="button"
              className="icon-btn"
              onClick={toggleMute}
              aria-label={muted ? "Включить звук" : "Выключить звук"}
              title={muted ? "Включить звук" : "Выключить звук"}
            >
              {muted ? <SoundOffIcon size={17} /> : <SoundOnIcon size={17} />}
            </button>
          </div>
        </header>

        {/* ── основная сетка ── */}
        <main className="mt-7 grid items-start gap-7 lg:grid-cols-[250px_minmax(0,1fr)_250px] lg:gap-8">
          {/* левая панель */}
          <aside className="order-2 space-y-7 lg:order-1">
            <section>
              <SectionTitle>Сложность</SectionTitle>
              <div className="mt-3 space-y-2.5">
                {DIFFICULTIES.map((d) => {
                  const active = d.key === difficulty;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => changeDifficulty(d.key)}
                      className={`group w-full rounded-lg border p-3 text-left transition-all duration-150 ${
                        active
                          ? "border-acid/70 bg-acid/[0.07] shadow-[0_0_24px_rgba(168,246,90,0.12)]"
                          : "border-line bg-pine/60 hover:-translate-y-0.5 hover:border-acid/40"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`font-display text-sm font-bold ${active ? "text-acid" : "text-mist"}`}
                        >
                          {d.label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="rounded-sm border border-line px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-fog">
                            {d.tag}
                          </span>
                          <span
                            className={`h-2 w-2 rounded-full transition-colors ${
                              active ? "animate-blinkdot bg-acid" : "bg-edge"
                            }`}
                          />
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-fog">{d.desc}</span>
                      <span className="mt-2 flex items-center gap-1.5 text-[11px] text-fog">
                        <TrophyIcon size={12} className="text-amber-400" />
                        Рекорд:
                        <span className="tabular font-bold text-amber-300">
                          {bests[d.key] || "—"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-pine/50 p-3.5 text-xs leading-relaxed text-fog">
              <p>
                Сложность можно менять в любой момент — забег начнётся заново, а рекорд сохранится
                отдельно для каждого уровня.
              </p>
            </section>
          </aside>

          {/* центр — игра */}
          <section className="order-1 lg:order-2">
            <SnakeGame
              difficulty={difficulty}
              onDifficulty={changeDifficulty}
              onBestChanged={refreshBests}
            />
          </section>

          {/* правая панель */}
          <aside className="order-3 space-y-7">
            <section>
              <SectionTitle>Управление</SectionTitle>
              <ul className="mt-3 divide-y divide-line/60 rounded-lg border border-line bg-pine/60 px-3.5 py-1">
                <KeyRow keys={["←", "↑", "↓", "→"]} label="движение" />
                <KeyRow keys={["W", "A", "S", "D"]} label="движение (люб. раскладка)" />
                <KeyRow keys={["Пробел"]} label="старт / пауза" />
                <KeyRow keys={["R"]} label="перезапуск" />
                <KeyRow keys={["Esc"]} label="пауза" />
                <li className="flex items-center justify-between gap-3 py-[7px]">
                  <span className="flex items-center gap-1.5 text-acid">
                    <SwipeIcon size={15} />
                  </span>
                  <span className="text-xs text-mist/80">свайпы и крест — на сенсорных</span>
                </li>
              </ul>
            </section>

            <section>
              <SectionTitle>Советы</SectionTitle>
              <ul className="mt-3 space-y-2.5">
                <li className="flex gap-2.5 rounded-lg border border-line bg-pine/60 p-3 text-xs leading-snug text-fog transition-colors hover:border-cyan-400/40">
                  <StarIcon size={15} className="mt-0.5 shrink-0 text-cyan-300" />
                  Каждые 5 яблок появляется звезда на <b className="text-cyan-300">+50</b> — успейте
                  дойти, пока кольцо не растаяло.
                </li>
                <li className="flex gap-2.5 rounded-lg border border-line bg-pine/60 p-3 text-xs leading-snug text-fog transition-colors hover:border-amber-400/40">
                  <BoltIcon size={15} className="mt-0.5 shrink-0 text-amber-300" />
                  Каждое яблоко чуть ускоряет змейку — следите за шкалой темпа под полем.
                </li>
                <li className="flex gap-2.5 rounded-lg border border-line bg-pine/60 p-3 text-xs leading-snug text-fog transition-colors hover:border-acid/40">
                  <TurnIcon size={15} className="mt-0.5 shrink-0 text-acid" />
                  Разворот на 180° невозможен, зато повороты можно вводить заранее — очередь из трёх
                  команд.
                </li>
              </ul>
            </section>
          </aside>
        </main>

        {/* ── футер ── */}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[11px] text-fog">
          <p className="flex items-center gap-2">
            <LogoMark size={20} />
            <span>
              Змейка · аркада на <span className="font-semibold text-mist">React + Canvas</span>
            </span>
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="hidden sm:inline">
              <span className="kbd">←↑↓→</span> движение
            </span>
            <span className="hidden sm:inline">
              <span className="kbd">Пробел</span> пауза
            </span>
            <span className="hidden sm:inline">
              <span className="kbd">R</span> рестарт
            </span>
            <span className="text-fog/70">рекорды хранятся в вашем браузере</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
