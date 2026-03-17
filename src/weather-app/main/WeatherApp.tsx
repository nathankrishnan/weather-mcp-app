// Root component for the main weather UI
// Owns all state and MCP communication

import { useCallback, useState, type CSSProperties } from "react";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type {
  CurrentWeather,
  HourlyPeriod,
  DailyPeriod,
  CurrentWeatherResult,
  HourlyForecastResult,
  WeeklyForecastResult,
  WeatherError,
} from "@shared/types";

import { TabBar, type WeatherTab } from "./components/TabBar";
import { CurrentConditions } from "./components/CurrentConditions";
import { HourlyForecast } from "./components/HourlyForecast";
import { WeeklyForecast } from "./components/WeeklyForecast";

// Note: fetch the current colditions immediately from the ontoolresult
// but fetch hourly and weekly data only when the user opens that tab

// State shape
// null = not yet fetched
interface WeatherState {
  city: string | null;
  current: CurrentWeather | null;
  hourly: HourlyPeriod[] | null;
  weekly: DailyPeriod[] | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasWeatherError(data: unknown): data is { error: WeatherError } {
  return isObject(data) && "error" in data;
}

function hasCurrentWeather(data: unknown): data is CurrentWeatherResult {
  return isObject(data) && "current" in data;
}

function hasHourlyForecast(data: unknown): data is HourlyForecastResult {
  return isObject(data) && "hourly" in data && "city" in data;
}

function hasWeeklyForecast(data: unknown): data is WeeklyForecastResult {
  return isObject(data) && "weekly" in data && "city" in data;
}

export function WeatherApp() {
  // Tab state
  const [activeTab, setActiveTab] = useState<WeatherTab>("current");

  // Loading states: one per tab
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);

  // Weather data
  const [weather, setWeather] = useState<WeatherState>({
    city: null,
    current: null,
    hourly: null,
    weekly: null,
  });

  // Error state
  const [error, setError] = useState<string | null>(null);

  // MCP connection
  const {
    app,
    isConnected,
    error: appError,
  } = useApp({
    appInfo: { name: "Weather App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (result: CallToolResult) => {
        const data = result.structuredContent;

        // Handle error from server
        if (hasWeatherError(data)) {
          setError(data.error.message);
          setIsLoadingCurrent(false);
          return;
        }

        // Route based on what the server returned
        if (hasCurrentWeather(data)) {
          const { current } = data;
          setWeather((prev) => {
            return {
              city: current.city,
              current,
              hourly: prev.hourly,
              weekly: prev.weekly,
            };
          });
          setIsLoadingCurrent(false);
          setError(null);
        }

        if (hasHourlyForecast(data)) {
          const { hourly } = data;
          setWeather((prev) => {
            return {
              city: prev.city,
              current: prev.current,
              hourly,
              weekly: prev.weekly,
            };
          });
          setIsLoadingHourly(false);
        }

        if (hasWeeklyForecast(data)) {
          const { weekly } = data;
          setWeather((prev) => {
            return {
              city: prev.city,
              current: prev.current,
              hourly: prev.hourly,
              weekly,
            };
          });
          setIsLoadingWeekly(false);
        }
      };

      app.onteardown = async () => ({});
    },
  });

  useHostStyles(app, app?.getHostContext());

  // --- Tab change handler ---
  // [app, weather] dependency array to only recreate this function
  // when app or weather changes

  const handleTabChange = useCallback(
    async (tab: WeatherTab) => {
      setActiveTab(tab);

      // Lazy loading: only fetch when the first tab is opened
      // and the city is known (we've recieved at least one tool result)
      if (!app || !weather.city) return;

      if (tab === "hourly" && weather.hourly === null) {
        setIsLoadingHourly(true);

        try {
          const result = await app.callServerTool({
            name: "get-hourly-forecast",
            arguments: { city: weather.city },
          });

          const data = result.structuredContent;
          if (hasHourlyForecast(data)) {
            const { hourly } = data;
            setWeather((prev) => {
              return {
                city: prev.city,
                current: prev.current,
                hourly,
                weekly: prev.weekly,
              };
            });
          }
        } catch {
          // Show empty state
        } finally {
          setIsLoadingHourly(false);
        }
      }

      if (tab === "weekly" && weather.weekly === null) {
        setIsLoadingWeekly(true);
        try {
          const result = await app.callServerTool({
            name: "get-weekly-forecast",
            arguments: { city: weather.city },
          });

          const data = result.structuredContent;
          if (hasWeeklyForecast(data)) {
            const { weekly } = data;
            setWeather((prev) => {
              return {
                city: prev.city,
                current: prev.current,
                hourly: prev.hourly,
                weekly,
              };
            });
          }
        } catch {
          // Non-critical
        } finally {
          setIsLoadingWeekly(false);
        }
      }
    },
    [app, weather],
  );

  // --- Render guards ---
  if (appError) {
    return <FullScreenMessage message={appError.message} isError />;
  }

  if (!isConnected || (isLoadingCurrent && !weather.current)) {
    return <FullScreenMessage message="Loading weather..." />;
  }

  if (error) {
    return <FullScreenMessage message={error} isError />;
  }

  // weather.current is guaranteed non-null past this point
  const current = weather.current!;

  // --- Main render ---
  return (
    <main style={styles.container}>
      {/* Tab bar */}
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab content — conditionally render based on active tab */}
      {activeTab === "current" && (
        <CurrentConditions current={current} isRefreshing={isLoadingCurrent} />
      )}

      {activeTab === "hourly" && (
        <HourlyForecast hours={weather.hourly ?? []} isLoading={isLoadingHourly} />
      )}

      {activeTab === "weekly" && (
        <WeeklyForecast days={weather.weekly ?? []} isLoading={isLoadingWeekly} />
      )}
    </main>
  );
}

// --- Full-screen message (loading / error) ---

function FullScreenMessage({ message, isError = false }: { message: string; isError?: boolean }) {
  return (
    <main style={styles.container}>
      <p
        style={{
          color: isError ? "#ff6b6b" : ("var(--color-text-secondary)" as string),
          fontSize: "var(--font-size-base)" as string,
          textAlign: "center" as const,
        }}
      >
        {message}
      </p>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "var(--spacing-md)" as string,
    padding: "var(--spacing-md)" as string,
    maxWidth: "480px",
    margin: "0 auto",
    minHeight: "100vh",
    justifyContent: "flex-start" as const,
  },
};
