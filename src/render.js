// ===========================================================
// ПОНГ · 8БИТ — отрисовка в стиле брендбука.
// Минималистичный дизайн: черный фон, белые элементы, CoFo Drifter.
// ===========================================================

import BRAND from "./brand.js";

export function computeSceneLayout(w, h) {
  const min = Math.min(w, h);
  const fieldH = h * BRAND.layout.fieldHeightRatio;
  const fieldW = Math.min(w * BRAND.layout.fieldWidthRatio, fieldH * 2.2);
  const field = {
    w: fieldW,
    h: fieldH,
    x: (w - fieldW) / 2,
    y: h * 0.18,
  };
  field.r = min * 0.01;

  const sideGap = field.x;
  const controlSize = Math.max(56, Math.min(100, min * 0.07));
  const labelY = field.y + field.h * 0.25;
  const controlsY = field.y + field.h * 0.5;

  return {
    min,
    field,
    title: {
      x: w / 2,
      y: field.y * 0.5,
      w: Math.min(field.w * 0.6, w * 0.5),
      h: min * 0.08,
    },
    controls: {
      size: controlSize,
      gap: min * 0.02,
      y: controlsY,
      leftX: Math.max(min * 0.02, (sideGap - controlSize) / 2),
      rightX: Math.max(min * 0.02, (sideGap - controlSize) / 2),
      labelY,
    },
  };
}

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = 0;
    this.h = 0;
    this.particles = [];
    this.layout = computeSceneLayout(0, 0);
  }

  setSize(w, h) {
    this.w = w;
    this.h = h;
    this.layout = computeSceneLayout(w, h);
  }

  getFieldRect() {
    return { ...this.layout.field };
  }

  getLayout() {
    return {
      ...this.layout,
      field: { ...this.layout.field },
      controls: { ...this.layout.controls },
    };
  }

  // ---- частицы ----

  burst(x, y, count = 10, colors = BRAND.palette) {
    const base = Math.min(this.w, this.h);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = base * (0.05 + Math.random() * 0.18);
      const life = 0.35 + Math.random() * 0.45;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life,
        maxLife: life,
        size: base * (0.004 + Math.random() * 0.008),
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  updateParticles(dt) {
    const g = this.h * 0.5;
    const arr = this.particles;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += g * dt;
      p.life -= dt;
      if (p.life <= 0) arr.splice(i, 1);
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    const f = this.layout.field;
    ctx.save();
    ctx.translate(f.x, f.y);
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  clearParticles() {
    this.particles.length = 0;
  }

  // ---- хром/обрамление ----

  drawChrome(t = 0) {
    const ctx = this.ctx;
    const { field, title, controls, min } = this.layout;
    ctx.save();

    // Черный фон
    ctx.fillStyle = BRAND.colors.bg;
    ctx.fillRect(0, 0, this.w, this.h);

    // Заголовок в стиле CoFo Drifter
    ctx.font = `500 ${title.h * 0.6}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillText(BRAND.title, title.x, title.y);

    // Лейблы игроков
    this.drawPlayerLabels(controls, min);

    // Поле - тонкая белая рамка
    ctx.strokeStyle = BRAND.colors.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(field.x, field.y, field.w, field.h);

    // Внутренность поля - черная
    ctx.fillStyle = BRAND.colors.field;
    ctx.fillRect(field.x + 2, field.y + 2, field.w - 4, field.h - 4);

    ctx.restore();
  }

  drawPlayerLabels(controls, min) {
    const ctx = this.ctx;
    const labelSize = min * 0.028;
    
    ctx.save();
    ctx.font = `500 ${labelSize}px ${BRAND.fonts.brand}`;
    ctx.fillStyle = BRAND.colors.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Левый игрок (повернут на -90°)
    ctx.save();
    ctx.translate(controls.leftX + controls.size / 2, controls.labelY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("ИГРОК 1", 0, 0);
    ctx.restore();

    // Правый игрок (повернут на 90°)
    ctx.save();
    ctx.translate(this.w - controls.rightX - controls.size / 2, controls.labelY);
    ctx.rotate(Math.PI / 2);
    ctx.fillText("ИГРОК 2", 0, 0);
    ctx.restore();

    ctx.restore();
  }

  drawFieldNet() {
    const ctx = this.ctx;
    const f = this.layout.field;
    ctx.save();
    ctx.strokeStyle = BRAND.colors.line;
    ctx.lineWidth = 1;
    ctx.setLineDash([f.h * 0.025, f.h * 0.018]);
    ctx.beginPath();
    ctx.moveTo(f.w / 2, 0);
    ctx.lineTo(f.w / 2, f.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawPlayfield(state, t = 0) {
    const ctx = this.ctx;
    const f = this.layout.field;
    this.drawChrome(t);

    ctx.save();
    // Клиппинг по полю
    ctx.beginPath();
    ctx.rect(f.x + 2, f.y + 2, f.w - 4, f.h - 4);
    ctx.clip();
    ctx.translate(f.x, f.y);
    
    this.drawFieldNet();
    this.drawPaddles(state, t);

    // Мяч - квадрат
    const b = state.ball;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    
    ctx.restore();
  }

  drawPaddles(state, t) {
    const ctx = this.ctx;
    const left = state.paddles[0];
    const right = state.paddles[1];

    ctx.save();
    ctx.fillStyle = "#ffffff";

    // Левая ракетка - прямоугольник
    ctx.fillRect(left.x, left.y, left.w, left.h);

    // Правая ракетка - прямоугольник
    ctx.fillRect(right.x, right.y, right.w, right.h);
    
    ctx.restore();
  }

  drawScores(scores) {
    const ctx = this.ctx;
    const f = this.layout.field;
    const size = Math.min(f.w, f.h) * 0.1;

    ctx.save();
    ctx.font = `500 ${size}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND.colors.text;

    // Счет слева
    ctx.fillText(String(scores[0]).padStart(2, "0"), f.x + f.w * 0.28, f.y + f.h * 0.12);
    // Счет справа
    ctx.fillText(String(scores[1]).padStart(2, "0"), f.x + f.w * 0.72, f.y + f.h * 0.12);

    ctx.restore();
  }
}

export default Renderer;
