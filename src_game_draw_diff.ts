--- src/game/draw.ts (原始)


+++ src/game/draw.ts (修改后)
import { GRID, DIRS, type Run } from "./core";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function segColor(t: number): string {
  const h = 86 + t * 84; // лайм → бирюза к хвосту
  const l = 62 - t * 20;
  return `hsl(${h} 82% ${l}%)`;
}

function star(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  r: number,
  rot: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = rot + (i * Math.PI) / 4;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawGame(ctx: CanvasRenderingContext2D, run: Run, size: number) {
  const cs = size / GRID;
  const cx = (v: number) => (v + 0.5) * cs;
  const fx = run.fx;

  ctx.clearRect(0, 0, size, size);
  ctx.save();

  if (fx.shake > 0) {
    const s = fx.shake * fx.shake * 9;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  /* ── доска ── */
  ctx.fillStyle = "#0a1d15";
  ctx.fillRect(-10, -10, size + 20, size + 20);

  ctx.fillStyle = "rgba(168,246,90,0.032)";
  for (let y = 0; y < GRID; y++) {
    for (let x = (y % 2 === 0 ? 0 : 1); x < GRID; x += 2) {
      ctx.fillRect(x * cs, y * cs, cs, cs);
    }
  }

  const glow = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.62,
  );
  glow.addColorStop(0, "rgba(168,246,90,0.05)");
  glow.addColorStop(1, "rgba(168,246,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  /* ── круги-рябь ── */
  for (const r of fx.ripples) {
    const t = clamp01(r.life / r.max);
    ctx.beginPath();
    ctx.arc(cx(r.x), cx(r.y), Math.max(1, t * cs * 2.6), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${r.rgb},${((1 - t) * 0.55).toFixed(3)})`;
    ctx.lineWidth = cs * 0.1 * (1 - t) + 1;
    ctx.stroke();
  }

  /* ── бонусная звезда ── */
  if (run.bonus) {
    const b = run.bonus;
    const bx = cx(b.pos.x);
    const by = cx(b.pos.y);
    const frac = clamp01(b.ttl / b.max);
    const pulse = 1 + 0.08 * Math.sin(fx.time / 140);

    ctx.beginPath();
    ctx.arc(bx, by, cs * 0.55, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.strokeStyle = "rgba(103,232,249,0.85)";
    ctx.lineWidth = Math.max(2, cs * 0.07);
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(fx.time / 620);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = "rgba(103,232,249,0.9)";
    ctx.shadowBlur = 16;
    star(ctx, 0, 0, cs * 0.34, cs * 0.13, 0);
    ctx.fillStyle = "#a5f3fc";
    ctx.fill();
    ctx.restore();
  }

  /* ── яблоко ── */
  {
    const px = cx(run.food.x);
    const py = cx(run.food.y);
    const r = cs * 0.3 * (1 + 0.09 * Math.sin(fx.time / 170));
    ctx.save();
    ctx.shadowColor = "rgba(249,115,22,0.85)";
    ctx.shadowBlur = 15;
    const g = ctx.createRadialGradient(px - r * 0.35, py - r * 0.4, r * 0.15, px, py, r);
    g.addColorStop(0, "#fde68a");
    g.addColorStop(0.55, "#fb923c");
    g.addColorStop(1, "#ea580c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // листик и черенок
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = Math.max(1.4, cs * 0.05);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px, py - r);
    ctx.lineTo(px + cs * 0.05, py - r - cs * 0.12);
    ctx.stroke();
    ctx.save();
    ctx.translate(px + cs * 0.14, py - r - cs * 0.1);
    ctx.rotate(-0.5);
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.ellipse(0, 0, cs * 0.13, cs * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ── змейка ── */
  const n = run.snake.length;
  const t =
    run.status === "playing" || run.status === "paused" ? clamp01(run.acc / run.interval) : 1;
  const pts: { x: number; y: number }[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const cur = run.snake[i];
    const pv = run.prev[i === 0 ? 0 : Math.min(i - 1, run.prev.length - 1)] ?? cur;
    pts[i] = {
      x: cx(pv.x + (cur.x - pv.x) * t),
      y: cx(pv.y + (cur.y - pv.y) * t),
    };
  }

  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
  };

  // мягкое свечение под телом
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  tracePath();
  ctx.strokeStyle = "rgba(168,246,90,0.10)";
  ctx.lineWidth = cs * 1.15;
  ctx.stroke();

  // тёмный контур для отделения от доски
  tracePath();
  ctx.strokeStyle = "rgba(4,22,15,0.9)";
  ctx.lineWidth = cs * 0.8;
  ctx.stroke();

  // сегменты с плавным переходом цвета и сужением
  for (let i = n - 1; i >= 1; i--) {
    const k = n <= 1 ? 0 : i / (n - 1);
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
    ctx.strokeStyle = segColor(k);
    ctx.lineWidth = cs * (0.66 - 0.24 * k);
    ctx.stroke();
  }

  // голова
  {
    const hx = pts[0].x;
    const hy = pts[0].y;
    const r = cs * 0.42;
    ctx.save();
    ctx.shadowColor = "rgba(190,242,100,0.9)";
    ctx.shadowBlur = 16;
    const g = ctx.createRadialGradient(hx - r * 0.35, hy - r * 0.35, r * 0.15, hx, hy, r);
    g.addColorStop(0, "#eaffb8");
    g.addColorStop(0.6, "#a8f65a");
    g.addColorStop(1, "#65a30d");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const d = DIRS[run.dir];
    const px = -d.y;
    const py = d.x;
    const blink = fx.time % 3300 < 130;
    for (const s of [1, -1]) {
      const ex = hx + d.x * cs * 0.11 + px * cs * 0.17 * s;
      const ey = hy + d.y * cs * 0.11 + py * cs * 0.17 * s;
      ctx.fillStyle = "#f7ffe9";
      ctx.beginPath();
      if (blink) ctx.ellipse(ex, ey, cs * 0.105, cs * 0.02, 0, 0, Math.PI * 2);
      else ctx.arc(ex, ey, cs * 0.105, 0, Math.PI * 2);
      ctx.fill();
      if (!blink) {
        ctx.fillStyle = "#10231a";
        ctx.beginPath();
        ctx.arc(ex + d.x * cs * 0.045, ey + d.y * cs * 0.045, cs * 0.055, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ── частицы ── */
  for (const p of fx.particles) {
    const a = 1 - p.life / p.max;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(cx(p.x), cx(p.y), Math.max(0.6, p.size * cs * (0.5 + a * 0.5)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* ── всплывающие очки ── */
  for (const f of fx.floats) {
    const k = f.life / f.max;
    const a = 1 - k;
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = `800 ${Math.max(11, cs * 0.5)}px Unbounded, Rubik, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const y = cx(f.y) - k * cs * 1.3;
    ctx.strokeStyle = "rgba(4,16,11,0.8)";
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, cx(f.x), y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, cx(f.x), y);
  }
  ctx.globalAlpha = 1;

  /* ── красная вспышка смерти ── */
  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(248,113,113,${(fx.flash * 0.22).toFixed(3)})`;
    ctx.fillRect(-10, -10, size + 20, size + 20);
  }

  ctx.restore();

  /* ── виньетка ── */
  const v = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.36,
    size / 2,
    size / 2,
    size * 0.78,
  );
  v.addColorStop(0, "rgba(3,10,7,0)");
  v.addColorStop(1, "rgba(3,10,7,0.55)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, size, size);
}
