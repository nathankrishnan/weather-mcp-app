// Vertical list of daily forecast rows

import type { CSSProperties } from "react";
import type { DailyPeriod } from "@shared/types";
import { ICON_MAP } from "@shared/icons";

interface WeeklyForecastProps {
  days: DailyPeriod[];
  isLoading: boolean;
}

export function WeeklyForecast({ days, isLoading }: WeeklyForecastProps) {
  if (isLoading) {
    return (
      <div style={styles.loading}>
        <span style={{ color: "var(--color-text-secondary)" as string }}>
          Loading 7-day forecast...
        </span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {days.map((day, index) => (
        <DayRow key={day.day} day={day} isLast={index === days.length - 1} />
      ))}
    </div>
  );
}

function DayRow({ day, isLast }: { day: DailyPeriod; isLast: boolean }) {
  return (
    <div
      style={{
        ...styles.row,
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
      }}
    >
      {/* Day name */}
      <span style={styles.dayName}>{day.day}</span>

      {/* Precip chance (shown if > 10%) */}
      <span style={styles.precipCol}>
        {day.precipChance > 10 && <span style={styles.precip}>💧{day.precipChance}%</span>}
      </span>

      {/* Icon */}
      <span style={styles.icon}>{ICON_MAP[day.icon]}</span>

      {/* High / Low */}
      <div style={styles.tempRange}>
        <span style={styles.tempHigh}>{day.high}°</span>
        <span style={styles.tempLow}>{day.low}°</span>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    background: "var(--color-surface)" as string,
    borderRadius: "var(--radius-lg)" as string,
    border: "1px solid var(--color-border)" as string,
    overflow: "hidden",
    width: "100%",
  },
  row: {
    display: "flex",
    alignItems: "center",
    padding: "var(--spacing-md)" as string,
    gap: "var(--spacing-sm)" as string,
  },
  dayName: {
    flex: 1,
    fontSize: "var(--font-size-base)" as string,
    fontWeight: "500",
    color: "var(--color-text-primary)" as string,
  },
  precipCol: {
    width: "48px",
    textAlign: "right" as const,
  },
  precip: {
    fontSize: "var(--font-size-xs)" as string,
    color: "#5ac8fa",
  },
  icon: {
    fontSize: "1.3rem",
    width: "28px",
    textAlign: "center" as const,
  },
  tempRange: {
    display: "flex",
    gap: "var(--spacing-sm)" as string,
    minWidth: "72px",
    justifyContent: "flex-end",
  },
  tempHigh: {
    fontSize: "var(--font-size-base)" as string,
    fontWeight: "600",
    color: "var(--color-text-primary)" as string,
  },
  tempLow: {
    fontSize: "var(--font-size-base)" as string,
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
