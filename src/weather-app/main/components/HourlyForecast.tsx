// Horizontally scrollable row of hourly forecast tiles

import type { CSSProperties } from "react";
import type { HourlyPeriod } from "@shared/types";
import { ICON_MAP } from "@shared/icons";

interface HourlyForecastProps {
  hours: HourlyPeriod[];
  isLoading: boolean;
}

export function HourlyForecast({ hours, isLoading }: HourlyForecastProps) {
  if (isLoading) {
    return <LoadingState label="Loading hourly forecast..." />;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.scrollContainer}>
        {hours.map((hour, index) => (
          <HourTile key={hour.time} hour={hour} />
        ))}
      </div>
    </div>
  );
}

function HourTile({ hour }: { hour: HourlyPeriod }) {
  return (
    <div style={styles.tile}>
      <span style={styles.time}>{hour.time}</span>
      <span style={styles.icon}>{ICON_MAP[hour.icon]}</span>
      <span style={styles.temp}>{hour.temperature}°</span>
      {hour.precipChance > 10 && <span style={styles.precip}>💧{hour.precipChance}%</span>}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div style={styles.loading}>
      <span style={{ color: "var(--color-text-secondary)" as string }}>{label}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    width: "100%",
    overflow: "hidden",
    background: "var(--color-surface)" as string,
    borderRadius: "var(--radius-lg)" as string,
    border: "1px solid var(--color-border)" as string,
  },
  scrollContainer: {
    display: "flex",
    overflowX: "auto" as const,
    gap: "0",
    padding: "var(--spacing-md) var(--spacing-sm)" as string,
    scrollbarWidth: "thin" as const,
  },
  tile: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "var(--spacing-xs)" as string,
    padding: "var(--spacing-sm) var(--spacing-md)" as string,
    minWidth: "70px",
    flexShrink: 0,
  },
  time: {
    fontSize: "var(--font-size-xs)" as string,
    color: "var(--color-text-secondary)" as string,
    fontWeight: "500",
  },
  icon: { fontSize: "1.5rem" },
  temp: {
    fontSize: "var(--font-size-base)" as string,
    fontWeight: "600",
    color: "var(--color-text-primary)" as string,
  },
  precip: {
    fontSize: "var(--font-size-xs)" as string,
    color: "var(--color-text-secondary)" as string,
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    padding: "var(--spacing-xl)" as string,
    background: "var(--color-surface)" as string,
    borderRadius: "var(--radius-lg)" as string,
    border: "1px solid var(--color-border)" as string,
  },
};
