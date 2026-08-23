--- src/components/SnakeGame.tsx (原始)


+++ src/components/SnakeGame.tsx (修改后)
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRun,
  stepRun,
  pushDir,
  updateFx,
  speedLevel,
  getDifficulty,
  loadBest,
  saveBest,
  formatTime,
  DIFFICULTIES,
  type Dir,
  type DifficultyKey,
  type Run,
  type Status,
} from "../game/core";
import { drawGame } from "../game/draw";
import { sound } from "../game/sound";
import {
  PlayIcon,
  PauseIcon,
  RestartIcon,
  TrophyIcon,
  BoltIcon,
  StarIcon,
  ClockIcon,
  ArrowIcon,
  HomeIcon,
  SwipeIcon,
} from "./icons";

interface Props {
  difficulty: DifficultyKey;
  onDifficulty: (k: DifficultyKey) => void;
  onBestChanged: () => void;
}

const DIR_KEYS: Record<string, Dir> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

function StatCell({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">
        {icon}
        {label}
      </span>
      <span className="tabular font-display text-sm font-bold text-mist">{value}</span>
    </div>
  );
}

function SpeedMeter({ level }: { level: number }) {
  return (
    <div className="flex items-end justify-center gap-[3px]" title={`Темп ${level}/10`}>
      {Array.from({ length: 10 }, (_, i) => {
        const on = i < level;
        const hot = level >= 8;
        return (
          <span
            key={i}
            className="w-[5px] rounded-[2px] transition-all duration-300"
            style={{
              height: `${7 + i * 1.1}px`,
              background: on ? (hot ? "#fbbf24" : "#a8f65a") : "rgba(44,74,60,0.55)",
              boxShadow: on ? `0 0 6px ${hot ? "rgba(251,191,36,0.55)" : "rgba(168,246,90,0.5)"}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

export default function SnakeGame({ difficulty, onDifficulty, onBestChanged }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>(createRun(getDifficulty(difficulty)));
  const statusRef = useRef<Status>("menu");
  const diffRef = useRef(getDifficulty(difficulty));
  const hudClock = useRef(0);
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const [status, setStatusState] = useState<Status>("menu");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => loadBest(difficulty));
  const [isNewBest, setIsNewBest] = useState(false);
  const [foods, setFoods] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [timeAlive, setTimeAlive] = useState(0);

  const setStatus = useCallback((s: Status) => {
    runRef.current.status = s;
    statusRef.current = s;
    setStatusState(s);
  }, []);

  /* ── действия ── */
  const start = useCallback(() => {
    const cur = runRef.current;
    if (cur.status === "playing") return;
    if (cur.status === "over" || cur.status === "paused") {
      runRef.current = createRun(diffRef.current);
    }
    runRef.current.acc = 0;
    setIsNewBest(false);
    setScore(0);
    setFoods(0);
    setSpeed(1);
    setTimeAlive(0);
    setStatus("playing");
    sound.start();
  }, [setStatus]);

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") return;
    setStatus("paused");
    sound.pause();
  }, [setStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    setStatus("playing");
    sound.resume();
  }, [setStatus]);

  const restart = useCallback(() => {
    runRef.current = createRun(diffRef.current);
    setIsNewBest(false);
    setScore(0);
    setFoods(0);
    setSpeed(1);
    setTimeAlive(0);
    setStatus("playing");
    sound.start();
  }, [setStatus]);

  const toMenu = useCallback(() => {
    runRef.current = createRun(diffRef.current);
    setScore(0);
    setFoods(0);
    setSpeed(1);
    setTimeAlive(0);
    setIsNewBest(false);
    setStatus("menu");
    sound.ui();
  }, [setStatus]);

  /* ── смена сложности ── */
  useEffect(() => {
    const diff = getDifficulty(difficulty);
    diffRef.current = diff;
    runRef.current = createRun(diff);
    statusRef.current = "menu";
    setStatusState("menu");
    setScore(0);
    setFoods(0);
    setSpeed(1);
    setTimeAlive(0);
    setIsNewBest(false);
    setBest(loadBest(difficulty));
  }, [difficulty]);

  /* ── игровой цикл ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = () => Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const w = wrap.clientWidth || 300;
      canvas.width = Math.round(w * dpr());
      canvas.height = Math.round(w * dpr());
      canvas.style.width = `${w}px`;
      canvas.style.height = `${w}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(48, now - last);
      last = now;
      const run = runRef.current;
      const diff = diffRef.current;

      if (run.status === "playing") {
        run.time += dt;
        run.acc += dt;
        let guard = 0;
        while (run.acc >= run.interval && run.status === "playing" && guard++ < 4) {
          run.acc -= run.interval;
          const hadBonus = run.bonus !== null;
          const ev = stepRun(run, diff);
          if (ev.ate) {
            sound.eat();
            setScore(run.score);
            setFoods(run.foods);
            setSpeed(speedLevel(run, diff));
            if (!hadBonus && run.bonus) sound.bonusSpawn();
          }
          if (ev.bonusAte) {
            sound.bonus();
            setScore(run.score);
          }
          if (ev.died) {
            sound.die();
            statusRef.current = "over";
            setStatusState("over");
            setScore(run.score);
            setFoods(run.foods);
            setTimeAlive(run.time);
            const prevBest = loadBest(diff.key);
            if (run.score > prevBest) {
              saveBest(diff.key, run.score);
              setBest(run.score);
              setIsNewBest(run.score > 0);
              onBestChanged();
            }
          }
        }
        if (now - hudClock.current > 250) {
          hudClock.current = now;
          setTimeAlive(run.time);
        }
      }

      updateFx(run, dt);
      const d = dpr();
      ctx.setTransform(d, 0, 0, d, 0, 0);
      drawGame(ctx, run, canvas.width / d);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [onBestChanged]);

  /* ── клавиатура ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = statusRef.current;
      const dir = DIR_KEYS[e.code];
      if (dir) {
        e.preventDefault();
        sound.unlock();
        if (st === "menu") {
          start();
          pushDir(runRef.current, dir);
        } else if (st === "playing") {
          pushDir(runRef.current, dir);
        } else if (st === "paused") {
          resume();
          pushDir(runRef.current, dir);
        }
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        sound.unlock();
        if (st === "menu" || st === "over") start();
        else if (st === "playing") pause();
        else if (st === "paused") resume();
        return;
      }
      if (e.code === "KeyR") {
        e.preventDefault();
        if (st !== "menu") restart();
        return;
      }
      if (e.code === "Escape" || e.code === "KeyP") {
        if (st === "playing") pause();
        else if (st === "paused") resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, pause, resume, restart]);

  /* ── автопауза при сворачивании ── */
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && statusRef.current === "playing") pause();
    };
    const onBlur = () => {
      if (statusRef.current === "playing") pause();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onBlur);
    };
  }, [pause]);

  /* ── свайпы ── */
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: performance.now() };
    sound.unlock();
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touchRef.current;
    if (!s || statusRef.current !== "playing") return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) < 22 && Math.abs(dy) < 22) return;
    const dir: Dir =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    pushDir(runRef.current, dir);
    touchRef.current = { x: t.clientX, y: t.clientY, t: s.t };
  };
  const onTouchEnd = () => {
    const s = touchRef.current;
    touchRef.current = null;
    if (!s) return;
    const st = statusRef.current;
    if (st === "playing") return;
    if (performance.now() - s.t < 260) {
      if (st === "paused") resume();
      else start();
    }
  };

  const dpad = (dir: Dir) => {
    sound.unlock();
    const st = statusRef.current;
    if (st === "menu" || st === "over") start();
    if (st === "playing" || statusRef.current === "playing") pushDir(runRef.current, dir);
  };

  const diff = getDifficulty(difficulty);

  return (
    <div className="mx-auto w-full max-w-[560px] select-none">
      {/* ── кабинет ── */}
      <div className="relative rounded-xl border border-[#24483a] bg-gradient-to-b from-[#0e241b] to-[#0a1c14] p-2 shadow-[0_36px_90px_-24px_rgba(0,0,0,0.85)] sm:p-3">
        {/* уголки-скобки */}
        <span className="pointer-events-none absolute -left-px -top-px h-6 w-6 rounded-tl-xl border-l-2 border-t-2 border-acid/80" />
        <span className="pointer-events-none absolute -right-px -top-px h-6 w-6 rounded-tr-xl border-r-2 border-t-2 border-acid/80" />
        <span className="pointer-events-none absolute -bottom-px -left-px h-6 w-6 rounded-bl-xl border-b-2 border-l-2 border-acid/80" />
        <span className="pointer-events-none absolute -bottom-px -right-px h-6 w-6 rounded-br-xl border-b-2 border-r-2 border-acid/80" />

        {/* верхняя панель HUD */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-2 pb-2.5 sm:px-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fog">Счёт</span>
            <span
              key={score}
              className="tabular animate-pop inline-block font-display text-2xl font-extrabold leading-none text-acid"
            >
              {String(score).padStart(4, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrophyIcon size={15} className="text-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fog">Рекорд</span>
            <span className="tabular font-display text-base font-bold leading-none text-amber-300">
              {String(best).padStart(4, "0")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="icon-btn"
              onClick={() => (status === "playing" ? pause() : status === "paused" ? resume() : start())}
              aria-label={status === "playing" ? "Пауза" : "Играть"}
              title={status === "playing" ? "Пауза (Пробел)" : "Играть (Пробел)"}
            >
              {status === "playing" ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={restart}
              aria-label="Перезапуск"
              title="Перезапуск (R)"
            >
              <RestartIcon size={16} />
            </button>
          </div>
        </div>

        {/* игровое поле */}
        <div
          ref={wrapRef}
          className="relative mt-2 aspect-square w-full touch-none overflow-hidden rounded-lg border border-line bg-board"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas ref={canvasRef} className="absolute inset-0 block" />

          {/* ── оверлей: меню ── */}
          {status === "menu" && (
            <div className="animate-fadein absolute inset-0 z-20 flex items-center justify-center bg-[#04120c]/85 p-4 backdrop-blur-[3px]">
              <div className="animate-pop w-full max-w-xs text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-acid">
                  Аркадный режим
                </p>
                <h2 className="mt-2 font-display text-3xl font-black leading-tight sm:text-4xl">
                  ГОТОВЫ
                  <span className="text-acid">?</span>
                </h2>

                <div className="mt-5 flex justify-center gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => onDifficulty(d.key)}
                      className={`rounded-md border px-3 py-1.5 font-display text-[11px] font-bold transition-all duration-150 ${
                        d.key === difficulty
                          ? "border-transparent bg-acid text-[#0a1d15] shadow-[0_0_18px_rgba(168,246,90,0.4)]"
                          : "border-edge text-fog hover:border-acid/60 hover:text-mist"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-fog">{diff.desc}</p>

                <button type="button" className="btn-primary mt-5 w-full" onClick={start}>
                  <PlayIcon size={18} />
                  ИГРАТЬ
                </button>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-fog">
                  <TrophyIcon size={13} className="text-amber-400" />
                  Рекорд на «{diff.label.toLowerCase()}»:
                  <span className="tabular font-bold text-amber-300">{best || "—"}</span>
                </div>

                <div className="mt-4 hidden flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-fog sm:flex">
                  <span className="flex items-center gap-1.5">
                    <span className="kbd">←↑↓→</span> / <span className="kbd">WASD</span> движение
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="kbd">Пробел</span> пауза
                  </span>
                </div>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-fog sm:hidden">
                  <SwipeIcon size={14} className="text-acid" />
                  Свайпы по полю или кнопки под ним
                </p>
              </div>
            </div>
          )}

          {/* ── оверлей: пауза ── */}
          {status === "paused" && (
            <div className="animate-fadein absolute inset-0 z-20 flex items-center justify-center bg-[#04120c]/80 p-4 backdrop-blur-[3px]">
              <div className="animate-pop w-full max-w-[260px] text-center">
                <div className="animate-floaty mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-edge bg-pine text-acid shadow-[0_0_30px_rgba(168,246,90,0.2)]">
                  <PauseIcon size={26} />
                </div>
                <h2 className="mt-3 font-display text-2xl font-black tracking-wide">ПАУЗА</h2>
                <p className="tabular mt-1 text-sm text-fog">
                  Счёт: <span className="font-bold text-mist">{score}</span> · длина:{" "}
                  <span className="font-bold text-mist">{3 + foods}</span>
                </p>
                <button type="button" className="btn-primary mt-5 w-full" onClick={resume}>
                  <PlayIcon size={17} />
                  ПРОДОЛЖИТЬ
                </button>
                <div className="mt-2.5 flex gap-2">
                  <button type="button" className="btn-ghost flex-1" onClick={restart}>
                    <RestartIcon size={15} />
                    Заново
                  </button>
                  <button type="button" className="btn-ghost flex-1" onClick={toMenu}>
                    <HomeIcon size={15} />
                    В меню
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-fog">
                  <span className="kbd">Пробел</span> — продолжить
                </p>
              </div>
            </div>
          )}

          {/* ── оверлей: конец игры ── */}
          {status === "over" && (
            <div className="animate-fadein absolute inset-0 z-20 flex items-center justify-center bg-[#120807]/85 p-4 backdrop-blur-[3px]">
              <div className="animate-pop w-full max-w-[280px] text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-400">
                  Столкновение
                </p>
                <h2 className="mt-1 font-display text-2xl font-black sm:text-[27px]">
                  ИГРА ОКОНЧЕНА
                </h2>

                <div className="mt-4 rounded-lg border border-edge bg-pine/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-fog">Счёт</p>
                  <p className="tabular font-display text-4xl font-black text-acid">{score}</p>
                  {isNewBest ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                      <TrophyIcon size={12} />
                      НОВЫЙ РЕКОРД!
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-fog">
                      Рекорд: <span className="tabular font-bold text-amber-300">{best}</span>
                    </p>
                  )}
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: "Длина", v: String(3 + foods) },
                    { l: "Яблоки", v: String(foods) },
                    { l: "Время", v: formatTime(timeAlive) },
                  ].map((s) => (
                    <div key={s.l} className="rounded-md border border-line bg-board/70 py-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-fog">{s.l}</p>
                      <p className="tabular font-display text-sm font-bold text-mist">{s.v}</p>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn-primary mt-4 w-full" onClick={restart}>
                  <RestartIcon size={17} />
                  ЕЩЁ РАЗ
                </button>
                <button type="button" className="btn-ghost mt-2.5 w-full" onClick={toMenu}>
                  <HomeIcon size={15} />
                  В меню
                </button>
                <p className="mt-3 text-[11px] text-fog">
                  <span className="kbd">Пробел</span> или <span className="kbd">R</span> — реванш
                </p>
              </div>
            </div>
          )}
        </div>

        {/* нижняя панель статистики */}
        <div className="mt-2 grid grid-cols-4 divide-x divide-line rounded-lg border border-line bg-board/60">
          <StatCell label="Длина" value={String(3 + foods)} />
          <StatCell label="Яблоки" value={String(foods)} icon={<StarIcon size={10} className="text-amber-400" />} />
          <StatCell label="Время" value={formatTime(timeAlive)} icon={<ClockIcon size={11} className="text-fog" />} />
          <div className="flex flex-col items-center justify-center gap-1 py-2.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">
              <BoltIcon size={10} className="text-acid" />
              Темп
            </span>
            <SpeedMeter level={speed} />
          </div>
        </div>
      </div>

      {/* ── сенсорный крест (мобильные) ── */}
      <div className="mx-auto mt-5 grid w-48 grid-cols-3 gap-2 sm:w-52 lg:hidden">
        <span />
        <DpadBtn label="Вверх" onPress={() => dpad("up")}>
          <ArrowIcon size={22} />
        </DpadBtn>
        <span />
        <DpadBtn label="Влево" onPress={() => dpad("left")}>
          <ArrowIcon size={22} className="-rotate-90" />
        </DpadBtn>
        <DpadBtn
          label={status === "playing" ? "Пауза" : "Старт"}
          onPress={() => (status === "playing" ? pause() : status === "paused" ? resume() : start())}
          accent
        >
          {status === "playing" ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
        </DpadBtn>
        <DpadBtn label="Вправо" onPress={() => dpad("right")}>
          <ArrowIcon size={22} className="rotate-90" />
        </DpadBtn>
        <span />
        <DpadBtn label="Вниз" onPress={() => dpad("down")}>
          <ArrowIcon size={22} className="rotate-180" />
        </DpadBtn>
        <span />
      </div>
      <p className="mt-3 text-center text-[11px] text-fog lg:hidden">
        Свайпы по полю тоже работают — ведите палец в нужную сторону
      </p>
    </div>
  );
}

function DpadBtn({
  children,
  onPress,
  label,
  accent,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`flex aspect-square items-center justify-center rounded-lg border transition-all duration-100 active:scale-90 ${
        accent
          ? "border-acid/70 bg-acid/15 text-acid active:bg-acid/30"
          : "border-edge bg-pine text-mist active:border-acid/70 active:bg-acid/15 active:text-acid"
      }`}
    >
      {children}
    </button>
  );
}
