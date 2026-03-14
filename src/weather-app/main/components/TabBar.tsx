// The three-tab switcher: Current | Hourly | Weekly

// Note: the parent (WeatherApp) owns the active tab state
// TabBar recieves the current value and a callback to change it

import type { CSSProperties } from "react";

export type WeatherTab = "current" | "hourly" | "weekly";

interface TabBarProps {
  activeTab: WeatherTab;
  onTabChange: (tab: WeatherTab) => void;
}

interface Tab {
  id: WeatherTab;
  label: string;
}

const TABS: Tab[] = [
  { id: "current", label: "Now" },
  { id: "hourly", label: "Hourly" },
  { id: "weekly", label: "7-Day" },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div style={styles.container}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          style={{
            ...styles.tab,
            ...(activeTab === tab.id ? styles.tabActive : styles.tabInactive),
          }}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    background: "rgba(255,255,255,0.1)" as string,
    borderRadius: "var(--radius-full)" as string,
    padding: "3px",
    gap: "2px",
    width: "100%",
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: "var(--radius-full)" as string,
    fontSize: "var(--font-size-sm)" as string,
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "var(--color-text-primary)" as string,
    fontFamily: "inherit",
  },
  tabActive: {
    background: "var(--color-tab-active)" as string,
  },
  tabInactive: {
    background: "transparent",
    opacity: 0.7,
  },
};
