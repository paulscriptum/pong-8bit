// ===========================================================
// ПОНГ · 8БИТ — отрисовка в стиле брендбука.
// Светлый фон, фиолетовые акценты, маскоты как ракетки и мяч.
// ===========================================================

import BRAND from "./brand.js";
import {
  drawCaterpillar,
  drawSpikyColumn,
  drawChip,
  drawPixelNumber,
  drawBug,
  drawStar,
} from "./mascots.js";

export function computeSceneLayout(w, h) {
  const min = Math.min(w, h);
  const fieldH = h * BRAND.layout.fieldHeightRatio;
  const fieldW = Math.min(w * BRAND.layout.fieldWidthRatio, fieldH * 1.8);
  const field = {
    w: fieldW,
    h: fieldH,
    x: (w - fieldW) / 2,
    y: h * 0.22,
  };
  field.r = min * 0.02;

  const sideGap = field.x;
  const controlSize = Math.max(48, Math.min(80, min * 0.06));
  const labelY = field.y + field.h * 0.25;
  const controlsY = field.y + field.h * 0.55;

  return {
    min,
    field,
    title: {
      x: w / 2,
      y: field.y * 0.45,
      w: Math.min(field.w * 0.5, w * 0.4),
      h: min * 0.065,
    },
    controls: {
      size: controlSize,
      gap: min * 0.018,
      y: controlsY,
      leftX: Math.max(min * 0.018, (sideGap - controlSize) / 2),
      rightX: Math.max(min * 0.018, (sideGap - controlSize) / 2),
      labelY,
    },
    // Кнопки внизу
    bottomButtons: {
      y: field.y + field.h + min * 0.05,
      h: min * 0.045,
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
    const { field, title, controls, min, bottomButtons } = this.layout;
    ctx.save();

    // Светлый фон
    ctx.fillStyle = BRAND.colors.bg;
    ctx.fillRect(0, 0, this.w, this.h);

    // Декоративные элементы (волны, звезды)
    this.drawDecorations(t);

    // Заголовок на фиолетовом баннере
    this.drawTitleBanner(title, min);

    // Спич-баббл справа
    this.drawSpeechBubble(t);

    // Лого слева
    this.drawLogo(min);

    // Лейблы игроков
    this.drawPlayerLabels(controls, min);

    // Внешняя рамка поля (светлая с фиолетовой обводкой)
    const padding = min * 0.015;
    ctx.fillStyle = BRAND.colors.bg;
    ctx.strokeStyle = BRAND.colors.accent;
    ctx.lineWidth = 3;
    
    // Закругленный прямоугольник
    const rx = field.r;
    ctx.beginPath();
    ctx.roundRect(field.x - padding, field.y - padding, field.w + padding * 2, field.h + padding * 2, rx + padding);
    ctx.fill();
    ctx.stroke();

    // Внутреннее черное поле
    ctx.fillStyle = BRAND.colors.field;
    ctx.beginPath();
    ctx.roundRect(field.x, field.y, field.w, field.h, rx);
    ctx.fill();

    // Нижние кнопки
    this.drawBottomButtons(bottomButtons, field, min);

    ctx.restore();
  }

  drawTitleBanner(title, min) {
    const ctx = this.ctx;
    const bannerW = title.w;
    const bannerH = title.h * 1.4;
    const cx = title.x;
    const cy = title.y;

    ctx.save();

    // Фиолетовый баннер с волнистым краем
    ctx.fillStyle = BRAND.colors.accent;
    ctx.beginPath();
    
    // Рисуем облачную/волнистую форму
    const points = 24;
    const baseR = bannerW / 2;
    const baseRy = bannerH / 2;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wobble = 1 + Math.sin(angle * 6) * 0.08;
      const rx = baseR * wobble;
      const ry = baseRy * wobble;
      const px = cx + Math.cos(angle) * rx;
      const py = cy + Math.sin(angle) * ry;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Текст заголовка
    ctx.font = `500 ${title.h * 0.5}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(BRAND.title, cx, cy);

    ctx.restore();
  }

  drawSpeechBubble(t) {
    const ctx = this.ctx;
    const { field, min } = this.layout;
    const bx = field.x + field.w + min * 0.06;
    const by = field.y - min * 0.02;
    const bw = min * 0.18;
    const bh = min * 0.055;

    ctx.save();

    // Баббл
    ctx.fillStyle = BRAND.colors.bg;
    ctx.strokeStyle = BRAND.colors.text;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    // Хвостик
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.15, by + bh);
    ctx.lineTo(bx + bw * 0.08, by + bh + min * 0.015);
    ctx.lineTo(bx + bw * 0.25, by + bh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Текст
    ctx.font = `500 ${min * 0.016}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillText(BRAND.cta, bx + bw / 2, by + bh / 2);

    // Маскот-жучок рядом
    drawBug(ctx, bx + bw * 0.9, by - min * 0.01, min * 0.028, BRAND.colors.text);

    ctx.restore();
  }

  drawLogo(min) {
    const ctx = this.ctx;
    const { field } = this.layout;
    const lx = field.x - min * 0.08;
    const ly = field.y * 0.5;

    ctx.save();
    ctx.font = `700 ${min * 0.035}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillText("8БИТ", lx - min * 0.04, ly - min * 0.01);

    ctx.font = `400 ${min * 0.012}px ${BRAND.fonts.ui}`;
    ctx.fillText("Журнал", lx - min * 0.04, ly + min * 0.025);
    ctx.fillText("Яндекс Образования", lx - min * 0.04, ly + min * 0.042);
    ctx.restore();
  }

  drawDecorations(t) {
    const ctx = this.ctx;
    const { field, min } = this.layout;

    ctx.save();
    ctx.strokeStyle = BRAND.colors.accent;
    ctx.lineWidth = 1.5;

    // Волнистые линии по углам
    const drawSquiggle = (x, y, size, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const px = (i / 10) * size;
        const py = Math.sin(i * 0.8 + t * 2) * size * 0.15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    };

    // Различные декорации
    drawSquiggle(field.x - min * 0.1, field.y + field.h * 0.8, min * 0.05, 0.3);
    drawSquiggle(field.x + field.w + min * 0.05, field.y + field.h * 0.7, min * 0.04, -0.2);
    
    // Звезды
    drawStar(ctx, field.x + field.w + min * 0.12, field.y - min * 0.05, min * 0.018, BRAND.colors.accent, 1.5);
    drawStar(ctx, field.x - min * 0.06, field.y + field.h * 0.3, min * 0.012, BRAND.colors.accent, 1.5);

    ctx.restore();
  }

  drawPlayerLabels(controls, min) {
    const ctx = this.ctx;
    const { field } = this.layout;
    const labelW = min * 0.06;
    const labelH = min * 0.02;

    ctx.save();

    // Левый игрок - фиолетовый баннер повернутый
    ctx.save();
    ctx.translate(controls.leftX + controls.size / 2, controls.labelY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = BRAND.colors.accent;
    ctx.beginPath();
    ctx.roundRect(-labelW / 2, -labelH / 2, labelW, labelH, 3);
    ctx.fill();
    ctx.font = `500 ${min * 0.014}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ИГРОК 1", 0, 0);
    ctx.restore();

    // Правый игрок
    ctx.save();
    ctx.translate(this.w - controls.rightX - controls.size / 2, controls.labelY);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = BRAND.colors.accent;
    ctx.beginPath();
    ctx.roundRect(-labelW / 2, -labelH / 2, labelW, labelH, 3);
    ctx.fill();
    ctx.font = `500 ${min * 0.014}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ИГРОК 2", 0, 0);
    ctx.restore();

    // Маскот-жучок возле каждого игрока
    drawBug(ctx, controls.leftX + controls.size / 2, controls.labelY - min * 0.06, min * 0.022, BRAND.colors.accent);
    drawBug(ctx, this.w - controls.rightX - controls.size / 2, controls.labelY - min * 0.06, min * 0.022, BRAND.colors.accent);

    ctx.restore();
  }

  drawBottomButtons(bottomButtons, field, min) {
    const ctx = this.ctx;
    const btnH = bottomButtons.h;
    const btnW1 = min * 0.16;
    const btnW2 = min * 0.2;
    const gap = min * 0.03;

    ctx.save();

    // Левая кнопка - "8БИТ-РЕКОРД"
    const btn1X = field.x;
    const btn1Y = bottomButtons.y;
    ctx.fillStyle = BRAND.colors.accent;
    ctx.beginPath();
    ctx.roundRect(btn1X, btn1Y, btnW1, btnH, 6);
    ctx.fill();
    ctx.font = `500 ${min * 0.016}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("8БИТ-РЕКОРД", btn1X + btnW1 / 2, btn1Y + btnH / 2);
    
    // Жучок на кнопке
    drawBug(ctx, btn1X + min * 0.02, btn1Y + btnH / 2, min * 0.014, "#ffffff");

    // Правая кнопка - "ПОБЕЖДАЙ ПО-8БИТНОМУ!"
    const btn2X = field.x + field.w - btnW2;
    ctx.fillStyle = BRAND.colors.bg;
    ctx.strokeStyle = BRAND.colors.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(btn2X, btn1Y, btnW2, btnH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.font = `500 ${min * 0.013}px ${BRAND.fonts.brand}`;
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillText("ПОБЕЖДАЙ ПО-8БИТНОМУ!", btn2X + btnW2 / 2, btn1Y + btnH / 2);

    // Жучок и звезда
    drawBug(ctx, btn2X + min * 0.018, btn1Y + btnH / 2, min * 0.012, BRAND.colors.accent);
    drawStar(ctx, btn2X + btnW2 - min * 0.025, btn1Y + btnH / 2, min * 0.01, BRAND.colors.accent, 1.5);

    ctx.restore();
  }

  drawFieldNet() {
    const ctx = this.ctx;
    const f = this.layout.field;
    ctx.save();
    ctx.strokeStyle = BRAND.colors.line;
    ctx.lineWidth = 2;
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
    ctx.roundRect(f.x, f.y, f.w, f.h, f.r);
    ctx.clip();
    ctx.translate(f.x, f.y);

    this.drawFieldNet();
    this.drawPaddles(state, t);

    // Мяч - чип с лицом
    const b = state.ball;
    const dir = b.vx < 0 ? -1 : 1;
    drawChip(ctx, b.x, b.y, b.r * 1.2, BRAND.colors.ink, dir);

    ctx.restore();
  }

  drawPaddles(state, t) {
    const ctx = this.ctx;
    const left = state.paddles[0];
    const right = state.paddles[1];

    // Левая ракетка - гусеница
    drawCaterpillar(
      ctx,
      left.x + left.w / 2,
      left.y,
      left.w,
      left.h,
      BRAND.colors.ink,
      t
    );

    // Правая ракетка - колючие блобы
    drawSpikyColumn(
      ctx,
      right.x + right.w / 2,
      right.y,
      right.w,
      right.h,
      BRAND.colors.ink,
      t
    );
  }

  drawScores(scores) {
    const ctx = this.ctx;
    const f = this.layout.field;
    const min = Math.min(this.w, this.h);
    const cell = min * 0.008; // размер пикселя для цифр

    ctx.save();

    // Пиксельные цифры в стиле брендбука
    const scoreY = f.y + f.h * 0.12;

    // Счет слева (двухзначный)
    const leftScore = String(scores[0]).padStart(2, "0");
    drawPixelNumber(ctx, leftScore, f.x + f.w * 0.28, scoreY, cell, BRAND.colors.ink);

    // Счет справа
    const rightScore = String(scores[1]).padStart(2, "0");
    drawPixelNumber(ctx, rightScore, f.x + f.w * 0.72, scoreY, cell, BRAND.colors.ink);

    ctx.restore();
  }
}

export default Renderer;
