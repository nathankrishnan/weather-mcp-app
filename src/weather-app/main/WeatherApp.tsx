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

// Build the next state from a current-conditions payload
// If the city changed, clear hourly/weekly so we do not mix cities in the UI
function applyCurrentResult(prev: WeatherState, current: CurrentWeather): WeatherState {
  const cityChanged = prev.city !== null && prev.city !== current.city;
  return {
    city: current.city,
    current,
    hourly: cityChanged ? null : prev.hourly,
    weekly: cityChanged ? null : prev.weekly,
  };
}

// Build the next state from an hourly payload
// Keep existing current/weekly only when the payload is for the same city
function applyHourlyResult(prev: WeatherState, city: string, hourly: HourlyPeriod[]): WeatherState {
  const cityChanged = prev.city !== null && prev.city !== city;
  return {
    city,
    current: cityChanged ? null : prev.current,
    hourly,
    weekly: cityChanged ? null : prev.weekly,
  };
}

// Build the next state from a weekly payload
// Clear stale current/hourly data if this weekly forecast is for a new city
function applyWeeklyResult(prev: WeatherState, city: string, weekly: DailyPeriod[]): WeatherState {
  const cityChanged = prev.city !== null && prev.city !== city;
  return {
    city,
    current: cityChanged ? null : prev.current,
    hourly: cityChanged ? null : prev.hourly,
    weekly,
  };
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
          setIsLoadingHourly(false);
          setIsLoadingWeekly(false);
          return;
        }

        // Route based on what the server returned
        if (hasCurrentWeather(data)) {
          const { current } = data;
          // A current-weather tool result should move the user to the Current tab.
          setActiveTab("current");
          setWeather((prev) => applyCurrentResult(prev, current));
          setIsLoadingCurrent(false);
          setError(null);
        }

        if (hasHourlyForecast(data)) {
          const { city, hourly } = data;
          // If the AI asked for hourly first, show that tab immediately
          setActiveTab("hourly");
          setWeather((prev) => applyHourlyResult(prev, city, hourly));
          setIsLoadingCurrent(false);
          setIsLoadingHourly(false);
          setError(null);
        }

        if (hasWeeklyForecast(data)) {
          const { city, weekly } = data;
          // Weekly tool results should also drive the visible tab
          setActiveTab("weekly");
          setWeather((prev) => applyWeeklyResult(prev, city, weekly));
          setIsLoadingCurrent(false);
          setIsLoadingWeekly(false);
          setError(null);
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
            const { city, hourly } = data;
            setWeather((prev) => applyHourlyResult(prev, city, hourly));
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
            const { city, weekly } = data;
            setWeather((prev) => applyWeeklyResult(prev, city, weekly));
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
  // Allow the app to render if any tab has data, even when current conditions
  // have not been fetched yet. This is what makes hourly-first/weekly-first work
  const hasWeatherData =
    weather.current !== null || weather.hourly !== null || weather.weekly !== null;

  if (appError) {
    return <FullScreenMessage message={appError.message} isError />;
  }

  if (!isConnected || (!hasWeatherData && isLoadingCurrent)) {
    return <FullScreenMessage message="Loading weather..." />;
  }

  if (error) {
    return <FullScreenMessage message={error} isError />;
  }

  // --- Main render ---
  return (
    <main style={styles.container}>
      {/* Tab bar */}
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab content — conditionally render based on active tab */}
      {activeTab === "current" &&
        (weather.current ? (
          <CurrentConditions current={weather.current} isRefreshing={isLoadingCurrent} />
        ) : (
          <FullScreenMessage message="Current conditions not loaded yet." />
        ))}

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
