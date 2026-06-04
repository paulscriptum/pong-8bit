// ===========================================================
// ПОНГ · 8БИТ — bootstrap, game loop и конечный автомат экранов.
//
//   Attract  -> Countdown(3..2..1) -> Playing -> PointScored
//   PointScored -> Countdown (счёт < target) | GameOver (счёт == target)
//   GameOver -> Attract (таймаут gameOverSeconds или касание)
//
// Адаптивный canvas под тач-стол (devicePixelRatio), kiosk-гигиена.
// ===========================================================

import BRAND from "./brand.js";
import { Sfx } from "./audio.js";
import { drawSmiley, createBlobLaunch, makeQRCanvas } from "./blobs.js";
import { PongGame } from "./game.js";
import { Renderer } from "./render.js";
import { setupControls } from "./controls.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const game = new PongGame(BRAND.game);
const renderer = new Renderer(ctx);

let W = 0;
let H = 0;
let dpr = 1;

const STATE = {
  ATTRACT: "attract",
  COUNTDOWN: "countdown",
  PLAYING: "playing",
  POINT: "point",
  GAMEOVER: "gameover",
};

let state = STATE.ATTRACT;
let stateTime = 0; // секунд в текущем состоянии
let winner = -1;
let blobs = [];
let qrCanvas = null;
let elapsed = 0; // глобальное время для анимаций (дыхание лого и т.п.)

const POINT_PAUSE = 1.1; // пауза после гола перед новой подачей

function syncControlsLayout() {
  const layout = renderer.getLayout();
  const c = layout.controls;
  const root = document.documentElement;
  root.style.setProperty("--control-top", `${c.y}px`);
  root.style.setProperty("--control-left-x", `${c.leftX}px`);
  root.style.setProperty("--control-right-x", `${c.rightX}px`);
  root.style.setProperty("--control-gap", `${c.gap}px`);
  root.style.setProperty("--control-size", `${c.size}px`);
  root.style.setProperty("--label-top", `${c.labelY}px`);
}

// ----------------------------------------------------------
// Размер canvas под devicePixelRatio + чистый ресайз.
// ----------------------------------------------------------
function resize() {
  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderer.setSize(W, H);
  const field = renderer.getFieldRect();
  game.resize(field.w, field.h);
  syncControlsLayout();
}

// ----------------------------------------------------------
// Переходы состояний.
// ----------------------------------------------------------
function setState(s) {
  state = s;
  stateTime = 0;
}

function startMatch() {
  game.resetMatch();
  winner = -1;
  renderer.clearParticles();
  blobs = [];
  game.reset(Math.random() < 0.5 ? -1 : 1);
  setState(STATE.COUNTDOWN);
}

function goAttract() {
  blobs = [];
  qrCanvas = null;
  game.clearInput();
  setState(STATE.ATTRACT);
}

function goGameOver() {
  winner = game.winner;
  game.clearInput();
  spawnBlobs();
  qrCanvas = null;
  Sfx.win();
  setState(STATE.GAMEOVER);
}

// Подача после гола: мяч летит к проигравшему очко.
function serveAfterPoint() {
  const dir = game.lastScorer === 0 ? +1 : -1;
  game.reset(dir);
  setState(STATE.COUNTDOWN);
}

// Запрос полноэкранного режима (один раз, в обработчике жеста).
let fullscreenTried = false;
function tryFullscreen() {
  if (fullscreenTried) return;
  fullscreenTried = true;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req && !document.fullscreenElement) {
    try {
      const p = req.call(el);
      if (p && p.catch) p.catch(() => {});
    } catch (_) {
      /* fullscreen может быть запрещён политикой — не критично */
    }
  }
}

// Касание/клик: разблокировка звука + старт/возврат с нужных экранов.
function onUserTap() {
  Sfx.unlock();
  tryFullscreen();
  if (state === STATE.ATTRACT) {
    startMatch();
    return true;
  }
  if (state === STATE.GAMEOVER) {
    goAttract();
    return true;
  }
  return false;
}

// ----------------------------------------------------------
// Блобы на победном экране.
// ----------------------------------------------------------
function spawnBlobs() {
  blobs = [];
  const base = Math.min(W, H);
  for (let i = 0; i < 3; i++) {
    blobs.push(makeBlob(base, i));
  }
}

function makeBlob(base, i) {
  const size = base * (0.08 + Math.random() * 0.06);
  return createBlobLaunch({
    x: W * (0.3 + Math.random() * 0.4),
    y: H + size,
    vx: (Math.random() * 2 - 1) * H * 0.06,
    vy: -H * (0.4 + Math.random() * 0.25),
    size,
    color: BRAND.palette[i % BRAND.palette.length],
  });
}

// ----------------------------------------------------------
// Текстовые помощники.
// ----------------------------------------------------------
function drawText(text, x, y, size, color, font = BRAND.fonts.display) {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
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

function fillFieldOverlay(field, color) {
  ctx.save();
  roundRectPath(ctx, field.x, field.y, field.w, field.h, field.r || Math.min(field.w, field.h) * 0.04);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(field.x, field.y, field.w, field.h);
  ctx.restore();
}

// Выполнить отрисовку в ориентации игрока (0 — обычная, 1 — 180°).
function withOrientation(player, fn) {
  ctx.save();
  if (player === 1) {
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.PI);
    ctx.translate(-W / 2, -H / 2);
  }
  fn();
  ctx.restore();
}

// ----------------------------------------------------------
// Обновление по состояниям.
// ----------------------------------------------------------
function update(dt) {
  renderer.updateParticles(dt);

  switch (state) {
    case STATE.ATTRACT:
      break;

    case STATE.COUNTDOWN:
      if (stateTime >= BRAND.game.countdownSeconds) setState(STATE.PLAYING);
      break;

    case STATE.PLAYING: {
      const events = game.update(dt);
      let scored = false;
      for (const e of events) {
        if (e.type === "paddle") {
          renderer.burst(e.x, e.y, 14, BRAND.palette);
        } else if (e.type === "wall") {
          renderer.burst(e.x, e.y, 8, [BRAND.colors.text, BRAND.colors.accent]);
        } else if (e.type === "score") {
          scored = true;
        }
      }
      if (game.over) {
        goGameOver();
      } else if (scored) {
        setState(STATE.POINT);
      }
      break;
    }

    case STATE.POINT:
      if (stateTime >= POINT_PAUSE) serveAfterPoint();
      break;

    case STATE.GAMEOVER:
      for (let i = 0; i < blobs.length; i++) {
        blobs[i].update(dt);
        if (blobs[i].done) blobs[i] = makeBlob(Math.min(W, H), i);
      }
      if (stateTime >= BRAND.game.gameOverSeconds) goAttract();
      break;
  }
}

// ----------------------------------------------------------
// Отрисовка по состояниям.
// ----------------------------------------------------------
function draw() {
  switch (state) {
    case STATE.ATTRACT:
      drawAttract();
      break;
    case STATE.COUNTDOWN:
      drawCountdown();
      break;
    case STATE.PLAYING:
      drawPlay();
      break;
    case STATE.POINT:
      drawPoint();
      break;
    case STATE.GAMEOVER:
      drawGameOver();
      break;
  }
}

function drawAttract() {
  const min = Math.min(W, H);
  const state = game.getState();
  renderer.drawPlayfield(state, elapsed);
  renderer.drawScores(game.scores);

  const field = renderer.getFieldRect();
  ctx.save();
  fillFieldOverlay(field, "rgba(0,0,0,0.42)");
  drawSmiley(ctx, W / 2, field.y + field.h * 0.5, min * 0.15, elapsed);
  ctx.globalAlpha = 0.58 + 0.42 * Math.sin(elapsed * 2.4);
  drawText(
    "КОСНИСЬ, ЧТОБЫ НАЧАТЬ",
    W / 2,
    field.y + field.h * 0.78,
    min * 0.032,
    BRAND.colors.text,
    BRAND.fonts.ui
  );
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCountdown() {
  renderer.drawPlayfield(game.getState(), elapsed);
  renderer.drawScores(game.scores);

  const min = Math.min(W, H);
  const field = renderer.getFieldRect();
  const left = Math.max(0, BRAND.game.countdownSeconds - stateTime);
  const n = Math.max(1, Math.ceil(left));
  ctx.save();
  ctx.globalAlpha = 0.92;
  drawText(String(n), W / 2, field.y + field.h * 0.5, min * 0.16, BRAND.colors.accent);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPlay() {
  renderer.drawPlayfield(game.getState(), elapsed);
  renderer.drawScores(game.scores);
  renderer.drawParticles();
}

function drawPoint() {
  renderer.drawPlayfield(game.getState(), elapsed);
  renderer.drawScores(game.scores);
  renderer.drawParticles();

  // Короткая вспышка «ГОЛ!» в ориентации забившего, гаснущая со временем.
  const t = stateTime / POINT_PAUSE;
  const a = Math.max(0, 1 - t);
  const min = Math.min(W, H);
  const field = renderer.getFieldRect();
  ctx.globalAlpha = 0.22 * a;
  fillFieldOverlay(field, BRAND.colors.accent);
  ctx.globalAlpha = a;
  drawText("ГОЛ!", W / 2, field.y + field.h * 0.5, min * 0.11, BRAND.colors.text, BRAND.fonts.brand);
  ctx.globalAlpha = 1;
}

function drawGameOver() {
  const min = Math.min(W, H);
  renderer.drawChrome(elapsed);
  const field = renderer.getFieldRect();

  // Блобы — в экранных координатах (взлетают снизу вверх).
  for (const b of blobs) b.draw(ctx);

  ctx.save();
  fillFieldOverlay(field, "rgba(0,0,0,0.82)");
  drawText("ПОБЕДА!", W / 2, field.y + field.h * 0.19, min * 0.09, BRAND.colors.accent, BRAND.fonts.brand);
    drawText(
      `Игрок ${Math.max(0, winner) + 1}`,
      W / 2,
    field.y + field.h * 0.31,
    min * 0.045,
    BRAND.colors.text,
    BRAND.fonts.ui
    );
    drawText(
      `${game.scores[0]} : ${game.scores[1]}`,
      W / 2,
    field.y + field.h * 0.42,
      min * 0.05,
    BRAND.colors.text
    );

  drawText("ПОБЕЖДАЙ ПО-8БИТНОМУ!", W / 2, field.y + field.h * 0.56, min * 0.032, BRAND.colors.text, BRAND.fonts.ui);

  const qrSize = min * 0.18;
  drawQR(W / 2, field.y + field.h * 0.76, qrSize);

    drawText(
      BRAND.ctaSub,
      W / 2,
    field.y + field.h * 0.76 + qrSize * 0.72,
      min * 0.024,
    BRAND.colors.text,
      BRAND.fonts.ui
    );
  ctx.restore();
}

function drawQR(cx, cy, size) {
  if (!qrCanvas) qrCanvas = makeQRCanvas(BRAND.url, Math.round(size));
  if (qrCanvas) {
    ctx.drawImage(qrCanvas, cx - size / 2, cy - size / 2, size, size);
  } else {
    // Плейсхолдер, пока QR-библиотека не готова.
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.fillStyle = BRAND.colors.bg;
    ctx.fillRect(cx - size / 2 + 6, cy - size / 2 + 6, size - 12, size - 12);
  }
}

// ----------------------------------------------------------
// Главный цикл.
// ----------------------------------------------------------
let lastTs = 0;
function frame(ts) {
  if (!lastTs) lastTs = ts;
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.05) dt = 0.05; // защита от больших скачков (вкладка в фоне)
  elapsed += dt;
  stateTime += dt;

  update(dt);
  draw();

  requestAnimationFrame(frame);
}

// ----------------------------------------------------------
// Kiosk-гигиена + ввод.
// ----------------------------------------------------------
function setupKiosk() {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  // Pinch-zoom жесты Safari/iOS.
  window.addEventListener("gesturestart", (e) => e.preventDefault());
  window.addEventListener("gesturechange", (e) => e.preventDefault());
  window.addEventListener("gestureend", (e) => e.preventDefault());
  window.addEventListener("dblclick", (e) => e.preventDefault());
  // Ctrl/⌘ + колесо — зум страницы.
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false }
  );
  // Ctrl/⌘ + (+/-/0) — зум с клавиатуры.
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) {
      e.preventDefault();
    }
  });
}

function init() {
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  setupKiosk();

  setupControls({
    onFirstGesture: () => Sfx.unlock(),
    onInput: (player, dir, isDown) => {
      // Нажатие на кнопку на attract/gameover работает как «касание».
      if (isDown && onUserTap()) return;
      game.setInput(player, dir, isDown);
    },
  });

  // Касание/клик по полю (вне кнопок) — старт/возврат + разблокировка звука.
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    onUserTap();
  });

  requestAnimationFrame(frame);
}

init();
