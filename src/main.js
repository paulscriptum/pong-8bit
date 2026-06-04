// ===========================================================
// ПОНГ · 8БИТ — bootstrap, game loop и конечный автомат экранов.
// Дизайн в стиле брендбука: черный фон, белый текст, CoFo Drifter.
// ===========================================================

import BRAND from "./brand.js";
import { Sfx } from "./audio.js";
import { makeQRCanvas } from "./blobs.js";
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
let stateTime = 0;
let winner = -1;
let qrCanvas = null;
let elapsed = 0;

const POINT_PAUSE = 1.1;

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

function setState(s) {
  state = s;
  stateTime = 0;
}

function startMatch() {
  game.resetMatch();
  winner = -1;
  renderer.clearParticles();
  game.reset(Math.random() < 0.5 ? -1 : 1);
  setState(STATE.COUNTDOWN);
}

function goAttract() {
  qrCanvas = null;
  game.clearInput();
  setState(STATE.ATTRACT);
}

function goGameOver() {
  winner = game.winner;
  game.clearInput();
  qrCanvas = null;
  Sfx.win();
  setState(STATE.GAMEOVER);
}

function serveAfterPoint() {
  const dir = game.lastScorer === 0 ? +1 : -1;
  game.reset(dir);
  setState(STATE.COUNTDOWN);
}

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
    } catch (_) {}
  }
}

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

// Текстовые помощники
function drawText(text, x, y, size, color, font = BRAND.fonts.brand) {
  ctx.font = `500 ${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

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
          renderer.burst(e.x, e.y, 12, BRAND.palette);
        } else if (e.type === "wall") {
          renderer.burst(e.x, e.y, 6, [BRAND.colors.text]);
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
      if (stateTime >= BRAND.game.gameOverSeconds) goAttract();
      break;
  }
}

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
  // Затемнение центра для текста (не перекрывает ракетки по бокам)
  const overlayMargin = field.w * 0.15;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(field.x + overlayMargin, field.y, field.w - overlayMargin * 2, field.h);

  // Пульсирующий текст
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(elapsed * 2.5);
  drawText(
    "КОСНИСЬ, ЧТОБЫ НАЧАТЬ",
    W / 2,
    field.y + field.h * 0.5,
    min * 0.035,
    BRAND.colors.text,
    BRAND.fonts.brand
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
  ctx.globalAlpha = 0.9;
  drawText(String(n), W / 2, field.y + field.h * 0.5, min * 0.15, BRAND.colors.text);
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

  const t = stateTime / POINT_PAUSE;
  const a = Math.max(0, 1 - t);
  const min = Math.min(W, H);
  const field = renderer.getFieldRect();
  
  ctx.globalAlpha = a;
  drawText("ГОЛ!", W / 2, field.y + field.h * 0.5, min * 0.1, BRAND.colors.text, BRAND.fonts.brand);
  ctx.globalAlpha = 1;
}

function drawGameOver() {
  const min = Math.min(W, H);
  renderer.drawChrome(elapsed);
  const field = renderer.getFieldRect();

  ctx.save();
  
  // Полупрозрачный фон
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(field.x, field.y, field.w, field.h);

  // Тонкая рамка
  ctx.strokeStyle = BRAND.colors.text;
  ctx.lineWidth = 2;
  ctx.strokeRect(field.x, field.y, field.w, field.h);

  drawText("ПОБЕДА!", W / 2, field.y + field.h * 0.2, min * 0.08, BRAND.colors.text, BRAND.fonts.brand);
  drawText(
    `Игрок ${Math.max(0, winner) + 1}`,
    W / 2,
    field.y + field.h * 0.32,
    min * 0.04,
    BRAND.colors.text,
    BRAND.fonts.ui
  );
  drawText(
    `${game.scores[0]} : ${game.scores[1]}`,
    W / 2,
    field.y + field.h * 0.44,
    min * 0.045,
    BRAND.colors.text
  );

  // CTA текст в стиле брендбука
  drawText("Читайте журнал в телеграме", W / 2, field.y + field.h * 0.58, min * 0.032, BRAND.colors.text, BRAND.fonts.brand);

  const qrSize = min * 0.16;
  drawQR(W / 2, field.y + field.h * 0.76, qrSize);

  drawText(
    BRAND.ctaSub,
    W / 2,
    field.y + field.h * 0.76 + qrSize * 0.7,
    min * 0.022,
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
    // Плейсхолдер
    ctx.fillStyle = BRAND.colors.text;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.fillStyle = BRAND.colors.bg;
    ctx.fillRect(cx - size / 2 + 4, cy - size / 2 + 4, size - 8, size - 8);
  }
}

let lastTs = 0;
function frame(ts) {
  if (!lastTs) lastTs = ts;
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.05) dt = 0.05;
  elapsed += dt;
  stateTime += dt;

  update(dt);
  draw();

  requestAnimationFrame(frame);
}

function setupKiosk() {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("gesturestart", (e) => e.preventDefault());
  window.addEventListener("gesturechange", (e) => e.preventDefault());
  window.addEventListener("gestureend", (e) => e.preventDefault());
  window.addEventListener("dblclick", (e) => e.preventDefault());
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false }
  );
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
      if (isDown && onUserTap()) return;
      game.setInput(player, dir, isDown);
    },
  });

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    onUserTap();
  });

  requestAnimationFrame(frame);
}

init();
