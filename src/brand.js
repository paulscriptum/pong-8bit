// ===========================================================
// Бренд-токены 8БИТ + игровой конфиг. Единый источник правды.
// Цвета приближены к брендбуку (чёрный фон, белый текст, фиолетовый
// акцент, мультиколор-палитра). Точные значения легко заменить.
// ===========================================================

export const BRAND = {
  colors: {
    bg: "#d9d6d1", // тёплый светло-серый фон сцены (как в референсе)
    field: "#050505",
    text: "#ffffff",
    ink: "#0c0c0c",
    accent: "#6e2bff", // фирменный фиолет из референса
    accentDark: "#4521b4",
    dim: "#6f6b78",
    line: "rgba(255,255,255,0.9)",
  },

  // Мультиколор-палитра 8БИТ — для частиц/конфетти/блобов.
  palette: ["#6e2bff", "#2d8cff", "#00e0b8", "#ff3dae", "#ffd000"],

  fonts: {
    display: '"Press Start 2P", monospace', // пиксельный, 8-bit вайб
    brand: '"CoFo Driffter", "Comic Sans MS", cursive',
    ui: '"CoFo Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },

  // Брендинг победного экрана.
  brandName: "8БИТ",
  title: "8БИТ PONG",
  cta: "ИГРАЙ ПО-8БИТНОМУ!",
  ctaSub: "Сканируй и переходи",
  // TODO: заменить на актуальный URL 8БИТ.
  url: "https://8bit.example",

  layout: {
    fieldWidthRatio: 0.72,
    fieldHeightRatio: 0.68,
    fieldRadiusRatio: 0.06,
    controlsInsetRatio: 0.035,
  },

  // Игровые параметры (можно крутить).
  game: {
    targetScore: 5, // играем до N очков
    paddleHeightRatio: 0.31, // высота маскот-столбика от высоты поля
    paddleWidthPx: 72,
    paddleMarginRatio: 0.085, // отступ ракетки от края внутреннего поля
    ballRadiusPx: 15,
    ballStartSpeedRatio: 0.45, // стартовая скорость мяча (ширина/сек)
    ballSpeedup: 1.04, // множитель скорости за удар ракеткой
    maxBallSpeedRatio: 1.1, // потолок скорости (ширина/сек)
    maxBounceAngle: Math.PI / 3, // макс. угол отскока от ракетки
    paddleSpeedRatio: 1.3, // скорость движения ракетки (высота/сек)
    countdownSeconds: 3,
    gameOverSeconds: 14, // авто-возврат на attract
  },
};

export default BRAND;
