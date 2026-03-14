import type { WeatherIcon } from "./types";

// TODO: Replace emojis with SVG icons when the designs are ready
export const ICON_MAP: Record<WeatherIcon, string> = {
  sunny: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  rainy: "🌧️",
  thunderstorm: "⛈️",
  snowy: "❄️",
  foggy: "🌫️",
  windy: "💨",
  "clear-night": "🌙",
  "partly-cloudy-night": "🌤️",
  unknown: "🌡️",
};
