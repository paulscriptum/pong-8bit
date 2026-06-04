// ===========================================================
// ПОНГ · 8БИТ — отрисовка поля, ракеток, мяча, счёта и частиц.
// Стиль 8-bit: чёрный фон, белые элементы, фиолетовый акцент (#6e2bff).
// HUD дабл-ориентирован: счёт каждого игрока читается со своей стороны
// (счёт правого игрока повёрнут на 180°).
//
// Renderer владеет ctx и системой частиц. Логику экранов держит main.js.
// ===========================================================

import BRAND from "./brand.js";
import { drawMascot, drawSmiley } from "./blobs.js";
import { drawSvgAsset } from "./assets.js";

export function computeSceneLayout(w, h) {
  const min = Math.min(w, h);
  const fieldH = h * BRAND.layout.fieldHeightRatio;
  const fieldW = Math.min(w * BRAND.layout.fieldWidthRatio, fieldH * 2.08);
  const field = {
    w: fieldW,
    h: fieldH,
    x: (w - fieldW) / 2,
    y: h * 0.15,
  };
  field.r = Math.min(min * 0.04, field.h * 0.08);

  const sideGap = field.x;
  const controlSize = Math.max(72, Math.min(118, min * 0.088));
  const labelY = field.y + field.h * 0.28;
  const controlsY = field.y + field.h * 0.55;

  return {
    min,
    field,
    title: {
      x: w / 2,
      y: Math.max(min * 0.08, field.y * 0.48),
      w: Math.min(field.w * 0.5, w * 0.46),
      h: min * 0.09,
    },
    controls: {
      size: controlSize,
      gap: min * 0.024,
      y: controlsY,
      leftX: Math.max(min * 0.025, (sideGap - controlSize) / 2),
      rightX: Math.max(min * 0.025, (sideGap - controlSize) / 2),
      labelY,
    },
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawTornBanner(ctx, x, y, w, h, fill) {
  const teeth = 18;
  const amp = h * 0.12;
  ctx.beginPath();
  for (let i = 0; i <= teeth; i++) {
    const px = x - w / 2 + (w * i) / teeth;
    const py = y - h / 2 + (i % 2 ? amp : 0);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  for (let i = teeth; i >= 0; i--) {
    const px = x - w / 2 + (w * i) / teeth;
    const py = y + h / 2 - (i % 2 ? amp : 0);
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawBubble(ctx, x, y, w, h, text) {
  ctx.save();
  ctx.strokeStyle = BRAND.colors.ink;
  ctx.fillStyle = BRAND.colors.bg;
  ctx.lineWidth = Math.max(3, h * 0.055);
  roundRectPath(ctx, x - w / 2, y - h / 2, w, h, h * 0.38);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.42, y + h * 0.12);
  ctx.quadraticCurveTo(x - w * 0.58, y + h * 0.34, x - w * 0.72, y + h * 0.14);
  ctx.stroke();
  ctx.font = `700 ${h * 0.25}px ${BRAND.fonts.ui}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = BRAND.colors.ink;
  ctx.fillText(text.split(" ")[0], x, y - h * 0.1);
  ctx.fillText(text.split(" ").slice(1).join(" "), x, y + h * 0.18);
  ctx.restore();
}

function drawDoodles(ctx, layout, t) {
  const { field, min } = layout;
  ctx.save();
  drawSvgAsset(ctx, "spiky", field.x + field.w + min * 0.07, field.y + min * 0.13, min * 0.07, min * 0.07, {
    tint: BRAND.colors.accent,
  });
  drawSvgAsset(ctx, "faceBug", field.x - min * 0.065, field.y + field.h * 0.18, min * 0.06, min * 0.07, {
    tint: BRAND.colors.accent,
  });
  ctx.strokeStyle = BRAND.colors.accent;
  ctx.lineWidth = Math.max(3, min * 0.004);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(field.x + field.w + min * 0.07, field.y + field.h + min * 0.02);
  ctx.lineTo(field.x + field.w + min * 0.1, field.y + field.h + min * 0.01);
  ctx.moveTo(field.x + field.w + min * 0.095, field.y + field.h + min * 0.045);
  ctx.lineTo(field.x + field.w + min * 0.125, field.y + field.h + min * 0.06);
  ctx.moveTo(field.x - min * 0.08, field.y + field.h - min * 0.04);
  ctx.quadraticCurveTo(field.x - min * 0.06, field.y + field.h - min * 0.07, field.x - min * 0.04, field.y + field.h - min * 0.04);
  ctx.quadraticCurveTo(field.x - min * 0.02, field.y + field.h - min * 0.01, field.x, field.y + field.h - min * 0.04);
  ctx.stroke();
  ctx.restore();
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
        size: base * (0.006 + Math.random() * 0.01),
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  updateParticles(dt) {
    const g = this.h * 0.6; // лёгкая «гравитация» для конфетти
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

  // ---- поле ----

  drawChrome(t = 0) {
    const ctx = this.ctx;
    const { field, title, controls, min } = this.layout;
    ctx.save();

    ctx.fillStyle = BRAND.colors.bg;
    ctx.fillRect(0, 0, this.w, this.h);
    drawDoodles(ctx, this.layout, t);

    const logoW = Math.min(min * 0.19, field.x * 0.9);
    drawSvgAsset(ctx, "logo", Math.max(min * 0.075, field.x - min * 0.08), title.y - min * 0.002, logoW, min * 0.075, {
      tint: BRAND.colors.ink,
      crop: { x: 0, y: 0, w: 930, h: 311 },
    });

    if (
      !drawSvgAsset(ctx, "titleStrip", title.x, title.y, title.w, title.h, {
        tint: BRAND.colors.accent,
      })
    ) {
      drawTornBanner(ctx, title.x, title.y, title.w, title.h, BRAND.colors.accent);
    }
    ctx.font = `700 ${title.h * 0.55}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillText(BRAND.title, title.x, title.y + title.h * 0.02);

    const bubbleX = field.x + field.w + min * 0.11;
    drawBubble(ctx, bubbleX, title.y, min * 0.18, min * 0.086, BRAND.cta);
    drawSvgAsset(ctx, "smileBug", bubbleX - min * 0.095, title.y + min * 0.045, min * 0.065, min * 0.05, {
      tint: BRAND.colors.ink,
    });

    this.drawPlayerLabels(controls, min);

    const border = Math.max(5, min * 0.006);
    ctx.fillStyle = BRAND.colors.accent;
    roundRectPath(ctx, field.x, field.y, field.w, field.h, field.r);
    ctx.fill();
    ctx.fillStyle = BRAND.colors.field;
    roundRectPath(ctx, field.x + border, field.y + border, field.w - border * 2, field.h - border * 2, Math.max(0, field.r - border));
    ctx.fill();

    this.drawBottomBadges(min);
    ctx.restore();
  }

  drawPlayerLabels(controls, min) {
    const ctx = this.ctx;
    const labelW = min * 0.14;
    const labelH = min * 0.044;
    const draw = (x, y, text, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      roundRectPath(ctx, -labelW / 2, -labelH / 2, labelW, labelH, labelH / 2);
      ctx.fillStyle = BRAND.colors.accent;
      ctx.fill();
      ctx.fillStyle = BRAND.colors.text;
      ctx.font = `700 ${labelH * 0.45}px ${BRAND.fonts.ui}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };
    draw(controls.leftX + controls.size / 2, controls.labelY, "ИГРОК 1", -Math.PI / 2);
    draw(this.w - controls.rightX - controls.size / 2, controls.labelY, "ИГРОК 2", Math.PI / 2);
    drawSvgAsset(ctx, "smileBug", controls.leftX + controls.size / 2, controls.labelY - min * 0.085, min * 0.065, min * 0.05, {
      tint: BRAND.colors.accent,
    });
    drawSvgAsset(ctx, "spiky", this.w - controls.rightX - controls.size / 2, controls.labelY - min * 0.085, min * 0.065, min * 0.06, {
      tint: BRAND.colors.accent,
    });
  }

  drawBottomBadges(min) {
    const ctx = this.ctx;
    const f = this.layout.field;
    const y = f.y + f.h + min * 0.065;
    ctx.save();
    roundRectPath(ctx, f.x - min * 0.075, y - min * 0.028, min * 0.26, min * 0.056, min * 0.026);
    ctx.fillStyle = BRAND.colors.accent;
    ctx.fill();
    drawSvgAsset(ctx, "smileBug", f.x - min * 0.045, y, min * 0.045, min * 0.032, {
      tint: BRAND.colors.text,
    });
    ctx.fillStyle = BRAND.colors.text;
    ctx.font = `700 ${min * 0.023}px ${BRAND.fonts.ui}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("8БИТ-РЕКОРД", f.x - min * 0.015, y);

    roundRectPath(ctx, f.x + f.w - min * 0.18, y - min * 0.036, min * 0.28, min * 0.072, min * 0.036);
    ctx.fillStyle = BRAND.colors.ink;
    ctx.fill();
    drawSvgAsset(ctx, "smileBug", f.x + f.w - min * 0.145, y, min * 0.05, min * 0.036, {
      tint: BRAND.colors.text,
    });
    ctx.fillStyle = BRAND.colors.text;
    ctx.font = `700 ${min * 0.018}px ${BRAND.fonts.ui}`;
    ctx.fillText("ПОБЕЖДАЙ", f.x + f.w - min * 0.105, y - min * 0.012);
    ctx.fillText("ПО-8БИТНОМУ!", f.x + f.w - min * 0.105, y + min * 0.014);
    drawSvgAsset(ctx, "chip", f.x + f.w + min * 0.045, y - min * 0.018, min * 0.045, min * 0.025, {
      tint: BRAND.colors.accent,
    });
    ctx.restore();
  }

  drawFieldNet() {
    const ctx = this.ctx;
    const f = this.layout.field;
    ctx.save();
    ctx.strokeStyle = BRAND.colors.line;
    ctx.lineWidth = Math.max(3, f.w * 0.003);
    ctx.setLineDash([f.h * 0.035, f.h * 0.025]);
    ctx.beginPath();
    ctx.moveTo(f.w / 2, f.h * 0.02);
    ctx.lineTo(f.w / 2, f.h * 0.98);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayfield(state, t = 0) {
    const ctx = this.ctx;
    const f = this.layout.field;
    this.drawChrome(t);

    ctx.save();
    roundRectPath(ctx, f.x + 8, f.y + 8, f.w - 16, f.h - 16, Math.max(0, f.r - 8));
    ctx.clip();
    ctx.translate(f.x, f.y);
    this.drawFieldNet();

    this.drawPaddles(state, t);

    const b = state.ball;
    if (
      !drawSvgAsset(ctx, "chip", b.x, b.y, b.r * 4.2, b.r * 2.4, {
        filter: "invert(1)",
        rotate: Math.atan2(b.vy, b.vx || 1) * 0.08,
      })
    ) {
      ctx.fillStyle = BRAND.colors.text;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    ctx.restore();
  }

  drawPaddles(state, t) {
    const ctx = this.ctx;
    const left = state.paddles[0];
    const right = state.paddles[1];

    const drawCaterpillar = (p) => {
      const count = 7;
      const step = p.h / count;
      for (let i = 0; i < count; i++) {
        const cy = p.y + step * (i + 0.5);
        const wobble = Math.sin(t * 2 + i * 0.55) * p.w * 0.08;
        if (
          !drawSvgAsset(ctx, "faceBug", p.x + p.w / 2 + wobble, cy, step * 2.05, step * 1.85, {
            filter: "invert(1)",
          })
        ) {
          drawSmiley(ctx, p.x + p.w / 2 + wobble, cy, step * 1.45, t + i * 0.18);
        }
      }
    };

    const drawSpiky = (p) => {
      const step = p.h / 4;
      for (let i = 0; i < 4; i++) {
        const wobble = Math.sin(t * 1.6 + i * 0.7) * p.w * 0.06;
        if (
          !drawSvgAsset(ctx, "spiky", p.x + p.w / 2 + wobble, p.y + step * (i + 0.5), step * 1.75, step * 1.65, {
            filter: "invert(1)",
          })
        ) {
          drawMascot(ctx, `blob-0${(i % 4) + 2}.png`, p.x + p.w / 2 + wobble, p.y + step * (i + 0.5), step * 1.4, BRAND.colors.text, t + i * 0.2);
        }
      }
    };

    drawCaterpillar(left);
    drawSpiky(right);
  }

  drawScores(scores) {
    const ctx = this.ctx;
    const f = this.layout.field;
    const size = Math.min(f.w, f.h) * 0.13;

    ctx.save();
    ctx.font = `${size}px ${BRAND.fonts.display}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = BRAND.colors.text;
    ctx.fillText(String(scores[0]).padStart(2, "0"), f.x + f.w * 0.31, f.y + f.h * 0.105);
    ctx.fillText(String(scores[1]).padStart(2, "0"), f.x + f.w * 0.69, f.y + f.h * 0.105);

    ctx.restore();
  }
}

export default Renderer;
