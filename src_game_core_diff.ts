--- src/game/core.ts (原始)


+++ src/game/core.ts (修改后)
export type Vec = { x: number; y: number };
export type Dir = "up" | "down" | "left" | "right";
export type Status = "menu" | "playing" | "paused" | "over";
export type DifficultyKey = "easy" | "normal" | "hard";

export const GRID = 21;
export const BONUS_EVERY = 5;
export const BONUS_TTL = 6500;

export interface Difficulty {
  key: DifficultyKey;
  label: string;
  desc: string;
  tag: string;
  /** базовый интервал тика, мс */
  base: number;
  /** минимальный интервал тика, мс */
  min: number;
  /** ускорение за каждое яблоко, мс */
  step: number;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    key: "easy",
    label: "Лёгкий",
    desc: "Неспешный темп для разминки рефлексов",
    tag: "черепаха",
    base: 165,
    min: 100,
    step: 3.0,
  },
  {
    key: "normal",
    label: "Средний",
    desc: "Классическая аркадная скорость",
    tag: "баланс",
    base: 118,
    min: 68,
    step: 2.4,
  },
  {
    key: "hard",
    label: "Сложный",
    desc: "Темп нарастает почти мгновенно",
    tag: "хардкор",
    base: 86,
    min: 50,
    step: 1.8,
  },
];

export const getDifficulty = (k: DifficultyKey): Difficulty =>
  DIFFICULTIES.find((d) => d.key === k) ?? DIFFICULTIES[1];

export const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
}

export interface Ripple {
  x: number;
  y: number;
  life: number;
  max: number;
  /** "r,g,b" для strokeStyle */
  rgb: string;
}

export interface Bonus {
  pos: Vec;
  ttl: number;
  max: number;
}

export interface Fx {
  particles: Particle[];
  floats: FloatText[];
  ripples: Ripple[];
  shake: number;
  flash: number;
  time: number;
}

export interface Run {
  snake: Vec[];
  prev: Vec[];
  dir: Dir;
  queue: Dir[];
  food: Vec;
  bonus: Bonus | null;
  foods: number;
  score: number;
  interval: number;
  acc: number;
  time: number;
  status: Status;
  fx: Fx;
}

export interface StepEvents {
  ate: boolean;
  bonusAte: boolean;
  died: boolean;
  head: Vec;
}

const rnd = (n: number) => Math.floor(Math.random() * n);

function freeCell(occupied: Set<string>): Vec {
  let p: Vec = { x: 0, y: 0 };
  let guard = 0;
  do {
    p = { x: rnd(GRID), y: rnd(GRID) };
    guard++;
  } while (occupied.has(p.x + "," + p.y) && guard < 2000);
  return p;
}

function occupiedSet(run: Run): Set<string> {
  const s = new Set(run.snake.map((v) => v.x + "," + v.y));
  s.add(run.food.x + "," + run.food.y);
  if (run.bonus) s.add(run.bonus.pos.x + "," + run.bonus.pos.y);
  return s;
}

export function createRun(diff: Difficulty): Run {
  const cy = Math.floor(GRID / 2);
  const snake: Vec[] = [
    { x: 5, y: cy },
    { x: 4, y: cy },
    { x: 3, y: cy },
  ];
  const run: Run = {
    snake,
    prev: snake.map((s) => ({ ...s })),
    dir: "right",
    queue: [],
    food: { x: 15, y: cy },
    bonus: null,
    foods: 0,
    score: 0,
    interval: diff.base,
    acc: 0,
    time: 0,
    status: "menu",
    fx: { particles: [], floats: [], ripples: [], shake: 0, flash: 0, time: 0 },
  };
  run.food = freeCell(occupiedSet(run));
  return run;
}

/** Поставить направление в очередь (макс. 3), отклоняя разворот на 180°. */
export function pushDir(run: Run, dir: Dir): boolean {
  const last = run.queue.length ? run.queue[run.queue.length - 1] : run.dir;
  if (dir === last || dir === OPPOSITE[last]) return false;
  if (run.queue.length < 3) {
    run.queue.push(dir);
    return true;
  }
  return false;
}

export function burst(run: Run, x: number, y: number, color: string, n: number) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.6 + Math.random() * 3.4;
    run.fx.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      max: 380 + Math.random() * 320,
      size: 0.05 + Math.random() * 0.09,
      color,
    });
  }
  if (run.fx.particles.length > 220) {
    run.fx.particles.splice(0, run.fx.particles.length - 220);
  }
}

export function stepRun(run: Run, diff: Difficulty): StepEvents {
  let dir = run.dir;
  while (run.queue.length) {
    const c = run.queue.shift() as Dir;
    if (c !== dir && c !== OPPOSITE[dir]) {
      dir = c;
      break;
    }
  }
  run.dir = dir;

  const head = run.snake[0];
  const nh: Vec = { x: head.x + DIRS[dir].x, y: head.y + DIRS[dir].y };
  const ev: StepEvents = { ate: false, bonusAte: false, died: false, head: nh };

  const hitWall = nh.x < 0 || nh.y < 0 || nh.x >= GRID || nh.y >= GRID;
  const eatsFood = !hitWall && nh.x === run.food.x && nh.y === run.food.y;
  const eatsBonus =
    !hitWall && run.bonus !== null && nh.x === run.bonus.pos.x && nh.y === run.bonus.pos.y;
  const grows = eatsFood || eatsBonus;
  const body = grows ? run.snake : run.snake.slice(0, -1);
  const hitSelf = !hitWall && body.some((s) => s.x === nh.x && s.y === nh.y);

  if (hitWall || hitSelf) {
    ev.died = true;
    run.status = "over";
    run.fx.shake = 1;
    run.fx.flash = 1;
    burst(run, head.x, head.y, "#f87171", 24);
    burst(run, head.x, head.y, "#a8f65a", 10);
    return ev;
  }

  run.prev = run.snake.map((s) => ({ ...s }));
  run.snake.unshift(nh);

  if (eatsFood) {
    ev.ate = true;
    run.score += 10;
    run.foods += 1;
    run.interval = Math.max(diff.min, diff.base - run.foods * diff.step);
    burst(run, run.food.x, run.food.y, "#fbbf24", 12);
    run.fx.ripples.push({ x: run.food.x, y: run.food.y, life: 0, max: 430, rgb: "251,191,36" });
    run.fx.floats.push({ x: nh.x, y: nh.y, text: "+10", life: 0, max: 720, color: "#fbbf24" });
    const occ = new Set(run.snake.map((v) => v.x + "," + v.y));
    if (run.bonus) occ.add(run.bonus.pos.x + "," + run.bonus.pos.y);
    run.food = freeCell(occ);
    if (run.foods % BONUS_EVERY === 0 && !run.bonus) {
      occ.add(run.food.x + "," + run.food.y);
      run.bonus = { pos: freeCell(occ), ttl: BONUS_TTL, max: BONUS_TTL };
    }
  } else if (eatsBonus && run.bonus) {
    ev.bonusAte = true;
    run.score += 50;
    burst(run, run.bonus.pos.x, run.bonus.pos.y, "#67e8f9", 18);
    run.fx.ripples.push({
      x: run.bonus.pos.x,
      y: run.bonus.pos.y,
      life: 0,
      max: 540,
      rgb: "103,232,249",
    });
    run.fx.floats.push({ x: nh.x, y: nh.y, text: "+50", life: 0, max: 820, color: "#67e8f9" });
    run.bonus = null;
  } else {
    run.snake.pop();
  }

  if (run.bonus) {
    run.bonus.ttl -= run.interval;
    if (run.bonus.ttl <= 0) {
      burst(run, run.bonus.pos.x, run.bonus.pos.y, "#38bdf8", 6);
      run.bonus = null;
    }
  }

  return ev;
}

export function updateFx(run: Run, dt: number) {
  const fx = run.fx;
  fx.time += dt;
  fx.shake = Math.max(0, fx.shake - dt / 480);
  fx.flash = Math.max(0, fx.flash - dt / 430);

  const damp = Math.exp(-dt / 210);
  const k = dt / 1000;
  for (let i = fx.particles.length - 1; i >= 0; i--) {
    const p = fx.particles[i];
    p.life += dt;
    if (p.life >= p.max) {
      fx.particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * k;
    p.y += p.vy * k;
    p.vx *= damp;
    p.vy *= damp;
  }
  for (let i = fx.floats.length - 1; i >= 0; i--) {
    fx.floats[i].life += dt;
    if (fx.floats[i].life >= fx.floats[i].max) fx.floats.splice(i, 1);
  }
  for (let i = fx.ripples.length - 1; i >= 0; i--) {
    fx.ripples[i].life += dt;
    if (fx.ripples[i].life >= fx.ripples[i].max) fx.ripples.splice(i, 1);
  }
}

export function speedLevel(run: Run, diff: Difficulty): number {
  if (diff.base === diff.min) return 1;
  const t = (diff.base - run.interval) / (diff.base - diff.min);
  return Math.max(1, Math.min(10, 1 + Math.round(t * 9)));
}

/* ── персистентность ────────────────────────────── */

const bestKey = (k: DifficultyKey) => "snake:best:" + k;

export function loadBest(k: DifficultyKey): number {
  try {
    return Number(localStorage.getItem(bestKey(k))) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(k: DifficultyKey, v: number) {
  try {
    localStorage.setItem(bestKey(k), String(v));
  } catch {
    /* приватный режим — молча пропускаем */
  }
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem("snake:muted") === "1";
  } catch {
    return false;
  }
}

export function saveMuted(m: boolean) {
  try {
    localStorage.setItem("snake:muted", m ? "1" : "0");
  } catch {
    /* noop */
  }
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
