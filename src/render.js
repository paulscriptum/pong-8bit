// ===========================================================
// ПОНГ · 8БИТ — отрисовка в стиле брендбука.
// Используем PNG изображения для ракеток и мяча.
// ===========================================================

import BRAND from "./brand.js";
import {
  drawPixelNumber,
  drawBug,
  drawStar,
} from "./mascots.js";

// Загружаем PNG изображения из архива
const caterpillarImg = new Image();
caterpillarImg.crossOrigin = "anonymous";
caterpillarImg.src = "/images/left_paddle_caterpillar.png";

const spikyImg = new Image();
spikyImg.crossOrigin = "anonymous";
spikyImg.src = "/images/right_paddle_spiky.png";

// Мяч - оригинальный чип с лицом и "ножками"
const ballImg = new Image();
ballImg.crossOrigin = "anonymous";
ballImg.src = "/images/ball.png";

// Рамка игрового поля (hand-drawn style)
const frameBorderImg = new Image();
frameBorderImg.crossOrigin = "anonymous";
frameBorderImg.src = "/images/frame_border.svg";

// UI элементы из архива
const titleImg = new Image();
titleImg.crossOrigin = "anonymous";
titleImg.src = "/images/title_8bit_pong.png";

const speechBubbleImg = new Image();
speechBubbleImg.crossOrigin = "anonymous";
speechBubbleImg.src = "/images/speech_bubble_play_8bit.png";

const labelPlayer1Img = new Image();
labelPlayer1Img.crossOrigin = "anonymous";
labelPlayer1Img.src = "/images/label_player_1.png";

const labelPlayer2Img = new Image();
labelPlayer2Img.crossOrigin = "anonymous";
labelPlayer2Img.src = "/images/label_player_2.png";

const badge8bitRecordImg = new Image();
badge8bitRecordImg.crossOrigin = "anonymous";
badge8bitRecordImg.src = "/images/badge_8bit_record.png";

const badgeWin8bitImg = new Image();
badgeWin8bitImg.crossOrigin = "anonymous";
badgeWin8bitImg.src = "/images/badge_win_8bit.png";

// Декоративные элементы (doodles)
const doodleBottomLeftImg = new Image();
doodleBottomLeftImg.crossOrigin = "anonymous";
doodleBottomLeftImg.src = "/images/doodle_bottom_left.png";

const doodleBottomRightImg = new Image();
doodleBottomRightImg.crossOrigin = "anonymous";
doodleBottomRightImg.src = "/images/doodle_bottom_right.png";

// Иконки игроков (маскоты рядом с лейблами)
const iconPlayer1Img = new Image();
iconPlayer1Img.crossOrigin = "anonymous";
iconPlayer1Img.src = "/images/icon_player_1.png";

const iconPlayer2Img = new Image();
iconPlayer2Img.crossOrigin = "anonymous";
iconPlayer2Img.src = "/images/icon_player_2.png";

// Кнопки управления из архива
const buttonLeftImg = new Image();
buttonLeftImg.crossOrigin = "anonymous";
buttonLeftImg.src = "/images/button_left.png";

const buttonRightImg = new Image();
buttonRightImg.crossOrigin = "anonymous";
buttonRightImg.src = "/images/button_right.png";

// Маскоты для эффектов при отбивании и голах (PNG с прозрачным фоном)
const mascotImages = [];
const mascotPaths = [
  "/images/mascots/hello.png",   // 0 - черный, нужен invert
  "/images/mascots/wow.png",     // 1 - черный, нужен invert
  "/images/mascots/win.png",     // 2 - черный, нужен invert
  "/images/mascots/score.png",   // 3 - черный, нужен invert
  "/images/mascots/star.png",    // 4 - черный, нужен invert
  "/images/mascots/smile.png",   // 5 - черный, нужен invert
  "/images/mascots/gamepad.png", // 6 - черный, нужен invert
  "/images/mascots/cool.png",    // 7 - черный, нужен invert
  "/images/mascots/caterpillar.png", // 8 - белый
  "/images/mascots/wavy.svg",    // 9 - оставляем SVG
  "/images/mascots/sad.svg"      // 10 - оставляем SVG
];

// Маски для инвертирования (черные маскоты нуждаются в инверсии чтобы стать белыми)
const invertMascots = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
mascotPaths.forEach((path, i) => {
  mascotImages[i] = new Image();
  mascotImages[i].crossOrigin = "anonymous";
  mascotImages[i].src = path;
});

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
    this.mascotPopups = []; // Маскоты, появляющиеся при отбивании/голах
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

  // ---- маскоты при отбивании/голах ----

  showMascot(x, y, isGoal = false) {
    const base = Math.min(this.w, this.h);
    const imgIndex = Math.floor(Math.random() * mascotImages.length);
    const size = base * (isGoal ? 0.15 : 0.1);
    const life = isGoal ? 1.2 : 0.7;
    
    this.mascotPopups.push({
      x,
      y,
      size,
      life,
      maxLife: life,
      imgIndex,
      scale: 0, // Начинаем с 0 для анимации появления
      vy: -base * 0.05, // Небольшое движение вверх
    });
  }

  updateMascots(dt) {
    const arr = this.mascotPopups;
    for (let i = arr.length - 1; i >= 0; i--) {
      const m = arr[i];
      m.life -= dt;
      m.y += m.vy * dt;
      
      // Анимация масштаба: появление -> показ -> исчезновение
      const progress = 1 - (m.life / m.maxLife);
      if (progress < 0.2) {
        m.scale = progress / 0.2; // Появление
      } else if (progress < 0.7) {
        m.scale = 1; // Полный размер
      } else {
        m.scale = (1 - progress) / 0.3; // Исчезновение
      }
      
      if (m.life <= 0) arr.splice(i, 1);
    }
  }

  drawMascots() {
    const ctx = this.ctx;
    const f = this.layout.field;
    
    ctx.save();
    ctx.translate(f.x, f.y);
    
    for (const m of this.mascotPopups) {
      const img = mascotImages[m.imgIndex];
      if (!img || !img.complete || !img.naturalWidth) continue;
      
      const scale = m.size * m.scale;
      if (scale <= 0) continue;
      
      // Сохраняем пропорции изображения
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let drawW, drawH;
      if (aspectRatio > 1) {
        drawW = scale;
        drawH = scale / aspectRatio;
      } else {
        drawH = scale;
        drawW = scale * aspectRatio;
      }
      
      ctx.globalAlpha = Math.min(1, m.scale * 1.5);
      
      // Применяем инверсию для черных маскотов
      if (invertMascots.has(m.imgIndex)) {
        ctx.filter = "invert(1)";
      }
      
      ctx.drawImage(img, m.x - drawW / 2, m.y - drawH / 2, drawW, drawH);
      
      ctx.filter = "none";
    }
    
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  clearMascots() {
    this.mascotPopups.length = 0;
  }

  // ---- хром/обрамление ----

  drawChrome(t = 0) {
    const ctx = this.ctx;
    const { field, title, controls, min, bottomButtons } = this.layout;
    ctx.save();

    // Светлый фон
    ctx.fillStyle = BRAND.colors.bg;
    ctx.fillRect(0, 0, this.w, this.h);

    // Декоративные элементы (doodles из PNG)
    this.drawDecorations(t);

    // Заголовок (PNG из архива)
    this.drawTitleBanner(title, min);

    // Спич-баббл справа (PNG из архива)
    this.drawSpeechBubble(t);

    // Лого слева
    this.drawLogo(min);

    // Лейблы игроков (PNG из архива)
    this.drawPlayerLabels(controls, min);

    // Рамка поля - используем SVG frame_border
    this.drawFieldFrame(field, min);

    // Внутреннее черное поле
    ctx.fillStyle = BRAND.colors.field;
    ctx.beginPath();
    ctx.roundRect(field.x, field.y, field.w, field.h, field.r);
    ctx.fill();

    // Нижние кнопки (PNG из архива)
    this.drawBottomButtons(bottomButtons, field, min);

    ctx.restore();
  }
  
  drawFieldFrame(field, min) {
    const ctx = this.ctx;
    const padding = min * 0.015;
    
    // Простая фиолетовая рамка с скругленными углами
    ctx.strokeStyle = BRAND.colors.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(field.x - padding, field.y - padding, field.w + padding * 2, field.h + padding * 2, field.r + padding);
    ctx.stroke();
  }

  drawTitleBanner(title, min) {
    const ctx = this.ctx;
    const cx = title.x;
    const cy = title.y;

    // Используем PNG заголовка из архива
    if (titleImg.complete && titleImg.naturalWidth > 0) {
      const imgH = title.h * 1.2;
      const imgW = (titleImg.naturalWidth / titleImg.naturalHeight) * imgH;
      ctx.drawImage(titleImg, cx - imgW / 2, cy - imgH / 2, imgW, imgH);
    } else {
      // Fallback - рисуем программно
      const bannerW = title.w;
      const bannerH = title.h * 1.4;

      ctx.save();
      ctx.fillStyle = BRAND.colors.accent;
      ctx.beginPath();
      
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

      ctx.font = `500 ${title.h * 0.5}px ${BRAND.fonts.brand}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(BRAND.title, cx, cy);
      ctx.restore();
    }
  }

  drawSpeechBubble(t) {
    const ctx = this.ctx;
    const { field, min } = this.layout;
    const bx = field.x + field.w + min * 0.03;
    const by = field.y - min * 0.02;

    // Используем PNG speech bubble из архива
    if (speechBubbleImg.complete && speechBubbleImg.naturalWidth > 0) {
      const imgH = min * 0.08;
      const imgW = (speechBubbleImg.naturalWidth / speechBubbleImg.naturalHeight) * imgH;
      ctx.drawImage(speechBubbleImg, bx, by - imgH * 0.3, imgW, imgH);
    } else {
      // Fallback
      const bw = min * 0.16;
      const bh = min * 0.05;

      ctx.save();
      ctx.fillStyle = BRAND.colors.bg;
      ctx.strokeStyle = BRAND.colors.text;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = `500 ${min * 0.014}px ${BRAND.fonts.brand}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = BRAND.colors.text;
      ctx.fillText(BRAND.cta, bx + bw / 2, by + bh / 2);
      drawBug(ctx, bx + bw * 0.92, by - min * 0.008, min * 0.024, BRAND.colors.text);
      ctx.restore();
    }
  }

  drawLogo(min) {
    const ctx = this.ctx;
    const { field } = this.layout;
    const lx = field.x - min * 0.06;
    const ly = field.y * 0.5;

    ctx.save();
    ctx.font = `700 ${min * 0.032}px ${BRAND.fonts.brand}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillText("8БИТ", lx - min * 0.04, ly - min * 0.01);

    ctx.font = `400 ${min * 0.011}px ${BRAND.fonts.ui}`;
    ctx.fillText("Журнал", lx - min * 0.04, ly + min * 0.022);
    ctx.fillText("Яндекс Образования", lx - min * 0.04, ly + min * 0.038);
    ctx.restore();
  }

  drawDecorations(t) {
    const ctx = this.ctx;
    const { field, min } = this.layout;

    ctx.save();
    ctx.strokeStyle = BRAND.colors.accent;
    ctx.lineWidth = 1.5;

    // Волнистые линии (небольшие декоративные элементы)
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

    drawSquiggle(field.x - min * 0.06, field.y + field.h * 0.85, min * 0.035, 0.3);
    drawSquiggle(field.x + field.w + min * 0.03, field.y + field.h * 0.75, min * 0.03, -0.2);
    
    // Звезды
    drawStar(ctx, field.x + field.w + min * 0.08, field.y - min * 0.02, min * 0.012, BRAND.colors.accent, 1.5);
    drawStar(ctx, field.x - min * 0.04, field.y + field.h * 0.35, min * 0.008, BRAND.colors.accent, 1.5);

    ctx.restore();
  }

  drawPlayerLabels(controls, min) {
    const ctx = this.ctx;

    // Используем PNG лейблы из архива
    const usePngLabels = labelPlayer1Img.complete && labelPlayer1Img.naturalWidth > 0;
    
    if (usePngLabels) {
      // Левый игрок - PNG (поворот на -90° - текст читается снизу вверх слева)
      const labelH = min * 0.08;
      const labelW = (labelPlayer1Img.naturalWidth / labelPlayer1Img.naturalHeight) * labelH;
      
      ctx.save();
      ctx.translate(controls.leftX + controls.size / 2, controls.labelY);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(labelPlayer1Img, -labelW / 2, -labelH / 2, labelW, labelH);
      ctx.restore();
      
      // Правый игрок - PNG (поворот на +90° - текст читается сверху вниз справа)
      if (labelPlayer2Img.complete && labelPlayer2Img.naturalWidth > 0) {
        const labelH2 = min * 0.08;
        const labelW2 = (labelPlayer2Img.naturalWidth / labelPlayer2Img.naturalHeight) * labelH2;
        
        ctx.save();
        ctx.translate(this.w - controls.rightX - controls.size / 2, controls.labelY);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(labelPlayer2Img, -labelW2 / 2, -labelH2 / 2, labelW2, labelH2);
        ctx.restore();
      }
      
      // Иконки игроков (маскоты над ле��блами)
      if (iconPlayer1Img.complete && iconPlayer1Img.naturalWidth > 0) {
        const iconH = min * 0.03;
        const iconW = (iconPlayer1Img.naturalWidth / iconPlayer1Img.naturalHeight) * iconH;
        ctx.drawImage(iconPlayer1Img, controls.leftX + controls.size / 2 - iconW / 2, controls.labelY - min * 0.06, iconW, iconH);
      }
      if (iconPlayer2Img.complete && iconPlayer2Img.naturalWidth > 0) {
        const iconH = min * 0.03;
        const iconW = (iconPlayer2Img.naturalWidth / iconPlayer2Img.naturalHeight) * iconH;
        ctx.drawImage(iconPlayer2Img, this.w - controls.rightX - controls.size / 2 - iconW / 2, controls.labelY - min * 0.06, iconW, iconH);
      }
    } else {
      // Fallback - рисуем программно
      const labelW = min * 0.055;
      const labelH = min * 0.018;

      ctx.save();

      // Левый игрок
      ctx.save();
      ctx.translate(controls.leftX + controls.size / 2, controls.labelY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = BRAND.colors.accent;
      ctx.beginPath();
      ctx.roundRect(-labelW / 2, -labelH / 2, labelW, labelH, 3);
      ctx.fill();
      ctx.font = `500 ${min * 0.012}px ${BRAND.fonts.brand}`;
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
      ctx.font = `500 ${min * 0.012}px ${BRAND.fonts.brand}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("ИГРОК 2", 0, 0);
      ctx.restore();

      // Маскоты
      drawBug(ctx, controls.leftX + controls.size / 2, controls.labelY - min * 0.055, min * 0.018, BRAND.colors.accent);
      drawBug(ctx, this.w - controls.rightX - controls.size / 2, controls.labelY - min * 0.055, min * 0.018, BRAND.colors.accent);

      ctx.restore();
    }
  }

  drawBottomButtons(bottomButtons, field, min) {
    const ctx = this.ctx;
    const btnH = bottomButtons.h;

    ctx.save();

    // Используем PNG badges из архива
    if (badge8bitRecordImg.complete && badge8bitRecordImg.naturalWidth > 0) {
      const imgH = btnH * 1.2;
      const imgW = (badge8bitRecordImg.naturalWidth / badge8bitRecordImg.naturalHeight) * imgH;
      ctx.drawImage(badge8bitRecordImg, field.x, bottomButtons.y, imgW, imgH);
    } else {
      // Fallback левая кнопка
      const btnW1 = min * 0.14;
      const btn1X = field.x;
      const btn1Y = bottomButtons.y;
      ctx.fillStyle = BRAND.colors.accent;
      ctx.beginPath();
      ctx.roundRect(btn1X, btn1Y, btnW1, btnH, 6);
      ctx.fill();
      ctx.font = `500 ${min * 0.014}px ${BRAND.fonts.brand}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("8БИТ-РЕКОРД", btn1X + btnW1 / 2, btn1Y + btnH / 2);
      drawBug(ctx, btn1X + min * 0.016, btn1Y + btnH / 2, min * 0.012, "#ffffff");
    }

    if (badgeWin8bitImg.complete && badgeWin8bitImg.naturalWidth > 0) {
      const imgH = btnH * 1.2;
      const imgW = (badgeWin8bitImg.naturalWidth / badgeWin8bitImg.naturalHeight) * imgH;
      ctx.drawImage(badgeWin8bitImg, field.x + field.w - imgW, bottomButtons.y, imgW, imgH);
    } else {
      // Fallback правая кнопка
      const btnW2 = min * 0.18;
      const btn2X = field.x + field.w - btnW2;
      const btn1Y = bottomButtons.y;
      ctx.fillStyle = BRAND.colors.bg;
      ctx.strokeStyle = BRAND.colors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(btn2X, btn1Y, btnW2, btnH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.font = `500 ${min * 0.011}px ${BRAND.fonts.brand}`;
      ctx.fillStyle = BRAND.colors.text;
      ctx.fillText("ПОБЕЖДАЙ ПО-8БИТНОМУ!", btn2X + btnW2 / 2, btn1Y + btnH / 2);
      drawBug(ctx, btn2X + min * 0.015, btn1Y + btnH / 2, min * 0.01, BRAND.colors.accent);
      drawStar(ctx, btn2X + btnW2 - min * 0.02, btn1Y + btnH / 2, min * 0.008, BRAND.colors.accent, 1.5);
    }

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
    ctx.beginPath();
    ctx.roundRect(f.x, f.y, f.w, f.h, f.r);
    ctx.clip();
    ctx.translate(f.x, f.y);

    this.drawFieldNet();
    this.drawPaddles(state, t);
    this.drawBall(state, t);

    ctx.restore();
  }

  drawPaddles(state, t) {
    const ctx = this.ctx;
    const left = state.paddles[0];
    const right = state.paddles[1];

    // Левая ракетка - гусеница PNG
    if (caterpillarImg.complete && caterpillarImg.naturalWidth > 0) {
      const imgAspect = caterpillarImg.naturalWidth / caterpillarImg.naturalHeight;
      const drawH = left.h;
      const drawW = drawH * imgAspect;
      ctx.drawImage(
        caterpillarImg,
        left.x + left.w / 2 - drawW / 2,
        left.y,
        drawW,
        drawH
      );
    } else {
      // Фолбек - белый прямоугольник
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(left.x, left.y, left.w, left.h);
    }

    // Правая ракетка - колючая PNG
    if (spikyImg.complete && spikyImg.naturalWidth > 0) {
      const imgAspect = spikyImg.naturalWidth / spikyImg.naturalHeight;
      const drawH = right.h;
      const drawW = drawH * imgAspect;
      ctx.drawImage(
        spikyImg,
        right.x + right.w / 2 - drawW / 2,
        right.y,
        drawW,
        drawH
      );
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(right.x, right.y, right.w, right.h);
    }
  }

  drawBall(state, t) {
    const ctx = this.ctx;
    const b = state.ball;
    const size = b.r * 2.5;

    if (ballImg.complete && ballImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(b.x, b.y);
      
      // Поворачиваем мяч в направлении движения
      if (b.vx < 0) {
        ctx.scale(-1, 1);
      }
      
      const imgAspect = ballImg.naturalWidth / ballImg.naturalHeight;
      const drawW = size * imgAspect;
      const drawH = size;
      
      ctx.drawImage(
        ballImg,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH
      );
      ctx.restore();
    } else {
      // Фолбек - белый квадрат
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
  }

  drawScores(scores) {
    const ctx = this.ctx;
    const f = this.layout.field;
    const min = Math.min(this.w, this.h);
    const cell = min * 0.008;

    ctx.save();

    const scoreY = f.y + f.h * 0.12;

    // Счет слева
    const leftScore = String(scores[0]).padStart(2, "0");
    drawPixelNumber(ctx, leftScore, f.x + f.w * 0.28, scoreY, cell, BRAND.colors.ink);

    // Счет справа
    const rightScore = String(scores[1]).padStart(2, "0");
    drawPixelNumber(ctx, rightScore, f.x + f.w * 0.72, scoreY, cell, BRAND.colors.ink);

    ctx.restore();
  }
}

export default Renderer;
