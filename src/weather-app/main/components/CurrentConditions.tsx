// Displays the current weather: large temperature, condition, and stats row

import type { CSSProperties } from "react";
import type { CurrentWeather } from "@shared/types";
import { ICON_MAP } from "@shared/icons";

interface CurrentConditionsProps {
  current: CurrentWeather;
  isRefreshing: boolean;
}

export function CurrentConditions({ current, isRefreshing }: CurrentConditionsProps) {
  return (
    <div style={{ ...styles.container, opacity: isRefreshing ? 0.6 : 1 }}>
      {/* City name */}
      <p style={styles.cityName}>{current.city}</p>

      {/* Large temperature */}
      <p style={styles.temperature}>{current.temperature}°</p>

      {/* Condition with icon */}
      <div style={styles.conditionRow}>
        <span style={styles.icon}>{ICON_MAP[current.icon]}</span>
        <p style={styles.condition}>{current.condition}</p>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <StatPill label="Feels like" value={`${current.feelsLike}°`} />
        <StatPill label="Humidity" value={`${current.humidity}%`} />
        <StatPill label="Wind" value={`${current.windSpeed} ${current.windDirection}`} />
        <StatPill label="Precip" value={`${current.precipChance}%`} />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statPill}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--spacing-sm)" as string,
    padding: "var(--spacing-lg)" as string,
    transition: "opacity 0.2s",
  },
  cityName: {
    fontSize: "var(--font-size-xl)" as string,
    fontWeight: "300",
    letterSpacing: "0.5px",
    color: "var(--color-text-primary)" as string,
  },
  temperature: {
    fontSize: "var(--font-size-3xl)" as string,
    fontWeight: "200",
    lineHeight: 1,
    color: "var(--color-text-primary)" as string,
  },
  conditionRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-xs)" as string,
  },
  icon: {
    fontSize: "1.5rem",
  },
  condition: {
    fontSize: "var(--font-size-lg)" as string,
    color: "var(--color-text-secondary)" as string,
  },
  statsRow: {
    display: "flex",
    gap: "var(--spacing-sm)" as string,
    flexWrap: "wrap" as const,
    justifyContent: "center",
    marginTop: "var(--spacing-sm)" as string,
  },
  statPill: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    background: "var(--color-surface)" as string,
    borderRadius: "var(--radius-md)" as string,
    padding: "var(--spacing-sm) var(--spacing-md)" as string,
    minWidth: "80px",
    border: "1px solid var(--color-border)" as string,
  },
  statLabel: {
    fontSize: "var(--font-size-xs)" as string,
    color: "var(--color-text-secondary)" as string,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "var(--font-size-base)" as string,
    fontWeight: "600",
    color: "var(--color-text-primary)" as string,
    marginTop: "2px",
  },
};
