// ===========================================================
// Бренд-токены 8БИТ + игровой конфиг. Единый источник правды.
// Дизайн из брендбука: черный фон, белый текст, шрифт CoFo Drifter.
// ===========================================================

export const BRAND = {
  colors: {
    bg: "#000000", // черный фон как в брендбуке
    field: "#000000",
    text: "#ffffff",
    ink: "#ffffff",
    accent: "#ffffff", // белый акцент
    accentDark: "#cccccc",
    dim: "#666666",
    line: "rgba(255,255,255,0.3)",
  },

  // Мультиколор-палитра 8БИТ — для частиц/конфетти/блобов.
  palette: ["#ffffff", "#cccccc", "#999999", "#666666"],

  fonts: {
    display: '"CoFo Driffter", "Comic Sans MS", cursive', // брендовый шрифт
    brand: '"CoFo Driffter", "Comic Sans MS", cursive',
    ui: '"CoFo Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },

  // Брендинг победного экрана.
  brandName: "8БИТ",
  title: "8БИТ PONG",
  cta: "ИГРАЙ ПО-8БИТНОМУ!",
  ctaSub: "Сканируй и переходи",
  url: "https://t.me/bit8journal",

  layout: {
    fieldWidthRatio: 0.82,
    fieldHeightRatio: 0.72,
    fieldRadiusRatio: 0.02,
    controlsInsetRatio: 0.035,
  },

  // Игровые параметры (можно крутить).
  game: {
    targetScore: 5, // играем до N очков
    paddleHeightRatio: 0.28, // высота маскот-столбика от высоты поля
    paddleWidthPx: 60,
    paddleMarginRatio: 0.06, // отступ ракетки от края внутреннего поля
    ballRadiusPx: 12,
    ballStartSpeedRatio: 0.42, // стартовая скорость мяча (ширина/сек)
    ballSpeedup: 1.04, // множитель скорости за удар ракеткой
    maxBallSpeedRatio: 1.1, // потолок скорости (ширина/сек)
    maxBounceAngle: Math.PI / 3, // макс. угол отскока от ракетки
    paddleSpeedRatio: 1.3, // скорость движения ракетки (высота/сек)
    countdownSeconds: 3,
    gameOverSeconds: 14, // авто-возврат на attract
  },
};

export default BRAND;
