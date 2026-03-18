// Displays nearby city weather comparison
// button clicks call get-current-weather and show inline current conditions

import { useCallback, useState, type CSSProperties } from "react";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type {
  CurrentWeather,
  NearbyCity,
  NearbyWeather,
  NearbyWeatherResult,
  WeatherError,
  CurrentWeatherResult,
} from "@shared/types";
import { ICON_MAP } from "@shared/icons";
import { CurrentConditions } from "../main/components/CurrentConditions";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasWeatherError(data: unknown): data is { error: WeatherError } {
  return isObject(data) && "error" in data;
}

function hasNearbyWeather(data: unknown): data is NearbyWeatherResult {
  return isObject(data) && "nearby" in data;
}

function hasCurrentWeather(data: unknown): data is CurrentWeatherResult {
  return isObject(data) && "current" in data;
}

export function NearbyApp() {
  const [nearby, setNearby] = useState<NearbyWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected city state — set when a city card is clicked
  const [selectedCity, setSelectedCity] = useState<CurrentWeather | null>(null);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);

  // Tracks which city's card is in a loading state
  const [refreshingCity, setRefreshingCity] = useState<string | null>(null);

  // Shared result handler for ontoolresult
  function applyToolResult(result: CallToolResult): void {
    const data = result.structuredContent;

    if (hasWeatherError(data)) {
      setError(data.error.message);
      setIsLoading(false);
      return;
    }

    if (hasNearbyWeather(data)) {
      setNearby(data.nearby);
      setIsLoading(false);
      setError(null);
    }
  }

  const {
    app,
    isConnected,
    error: appError,
  } = useApp({
    appInfo: { name: "Nearby Weather", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (result: CallToolResult) => {
        applyToolResult(result);
      };

      app.onteardown = async () => ({});
    },
  });

  useHostStyles(app, app?.getHostContext());

  // --- Handle city card click ---
  // Fetches get-current-weather for the clicked city and shows inline conditions
  // with a ← Back button to return to the nearby grid

  const handleCityClick = useCallback(
    async (cityName: string) => {
      if (!app || refreshingCity) return;

      setRefreshingCity(cityName);
      setIsLoadingSelected(true);

      try {
        const result = await app.callServerTool({
          name: "get-current-weather",
          arguments: { city: cityName },
        });

        const data = result.structuredContent;
        if (hasWeatherError(data)) {
          setError(data.error.message);
        } else if (hasCurrentWeather(data)) {
          setSelectedCity(data.current);
        }
      } catch {
        setError("Failed to load city weather. Please try again.");
      } finally {
        setRefreshingCity(null);
        setIsLoadingSelected(false);
      }
    },
    [app, refreshingCity],
  );

  // --- Render guards ---

  if (appError) {
    return <MessageScreen message={appError.message} isError />;
  }

  if (!isConnected || (isLoading && !nearby)) {
    return <MessageScreen message="Loading nearby weather..." />;
  }

  if (error) {
    return <MessageScreen message={error} isError />;
  }

  const data = nearby!;

  // --- Selected city detail view ---

  if (selectedCity) {
    return (
      <main style={styles.container}>
        <button style={styles.backButton} onClick={() => setSelectedCity(null)}>
          ← Back
        </button>
        <CurrentConditions current={selectedCity} isRefreshing={isLoadingSelected} />
      </main>
    );
  }

  // --- Main render ---

  return (
    <main style={styles.container}>
      <p style={styles.title}>Near {data.origin}</p>
      <div style={styles.grid}>
        {data.cities.map((city) => (
          <CityCard
            key={city.name}
            city={city}
            isRefreshing={refreshingCity === city.name}
            onClick={() => handleCityClick(city.name)}
          />
        ))}
      </div>
      <p style={styles.hint}>Select a city to see its current conditions</p>
    </main>
  );
}

// --- CityCard ---

function CityCard({
  city,
  isRefreshing,
  onClick,
}: {
  city: NearbyCity;
  isRefreshing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      style={{
        ...styles.card,
        opacity: isRefreshing ? 0.5 : 1,
        cursor: isRefreshing ? "wait" : "pointer",
      }}
      onClick={onClick}
      disabled={isRefreshing}
    >
      <div style={styles.cardHeader}>
        <span style={styles.cityName}>{city.name}</span>
        <span style={styles.icon}>{ICON_MAP[city.icon]}</span>
      </div>
      <p style={styles.temp}>{city.temperature}°</p>
      <p style={styles.condition}>{city.condition}</p>
      <p style={styles.distance}>{city.distance}</p>
    </button>
  );
}

// --- Message screen ---

function MessageScreen({ message, isError = false }: { message: string; isError?: boolean }) {
  return (
    <main style={styles.container}>
      <p
        style={{
          color: isError ? "#ff6b6b" : ("var(--color-text-secondary)" as string),
          textAlign: "center" as const,
        }}
      >
        {message}
      </p>
    </main>
  );
}

// --- Styles ---

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "var(--spacing-md)" as string,
    padding: "var(--spacing-md)" as string,
    maxWidth: "480px",
    margin: "0 auto",
    minHeight: "100vh",
  },
  title: {
    fontSize: "var(--font-size-xl)" as string,
    fontWeight: "300",
    color: "var(--color-text-primary)" as string,
    textAlign: "center" as const,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--spacing-sm)" as string,
  },
  card: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: "var(--spacing-xs)" as string,
    padding: "var(--spacing-md)" as string,
    background: "var(--color-surface)" as string,
    border: "1px solid var(--color-border)" as string,
    borderRadius: "var(--radius-lg)" as string,
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left" as const,
    fontFamily: "inherit",
    color: "inherit",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  cityName: {
    fontSize: "var(--font-size-base)" as string,
    fontWeight: "600",
    color: "var(--color-text-primary)" as string,
  },
  icon: { fontSize: "1.5rem" },
  temp: {
    fontSize: "var(--font-size-2xl)" as string,
    fontWeight: "200",
    color: "var(--color-text-primary)" as string,
  },
  condition: {
    fontSize: "var(--font-size-xs)" as string,
    color: "var(--color-text-secondary)" as string,
  },
  distance: {
    fontSize: "var(--font-size-xs)" as string,
    color: "var(--color-text-secondary)" as string,
    opacity: 0.7,
  },
  hint: {
    textAlign: "center" as const,
    fontSize: "var(--font-size-xs)" as string,
    color: "var(--color-text-secondary)" as string,
    opacity: 0.6,
  },
  backButton: {
    alignSelf: "flex-start",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "var(--font-size-base)" as string,
    color: "var(--color-text-secondary)" as string,
    padding: "var(--spacing-xs) 0" as string,
    fontFamily: "inherit",
  },
};
