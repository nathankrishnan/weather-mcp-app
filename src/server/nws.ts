// Client for the National Weather Service API (api.weather.gov)
// All methods take a GeocodedLocation and return typed weather data
//
//   1. /points/{lat},{lon}                           -> gets gridId, gridX, gridY, stationsUrl
//   2. /gridpoints/{office}/{x},{y}/forecast         -> 7-day periods
//   3. /gridpoints/{office}/{x},{y}/forecast/hourly  -> hourly periods
//   4. /stations/{stationId}/observations/latest     -> current obs

import type { GeocodedLocation } from "./geocoding";
import type {
  CurrentWeather,
  DailyPeriod,
  HourlyPeriod,
  WeatherIcon,
  WeatherError,
} from "@shared/types";

const NWS_BASE = "https://api.weather.gov";
const USER_AGENT = "WeatherMCPApp/1.0";
const NWS_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "application/geo+json",
};

// --- Result type ---

export type NWSResult<T> = { ok: true; data: T } | { ok: false; error: WeatherError };

// --- Internal NWS response types
// NWS returns much more data, we ignore what we don't need

interface PointsResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    forecast: string; // Full URL to forecast endpoint
    forecastHourly: string; // Full URL to hourly endpoint
    observationStations: string; // Full URL to stations list
  };
}

interface ForecastPeriod {
  name: string; // "Monday", "Monday Night", etc. (empty string for hourly periods)
  startTime: string; // ISO 8601 timestamp e.g. "2024-11-15T14:00:00-07:00"
  temperature: number; // Already in °F from /forecast (not /gridpoints)
  temperatureUnit: string; // "F" or "C"
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation: {
    value: number | null;
  };
  isDaytime: boolean;
}

interface ObservationResponse {
  properties: {
    temperature: { value: number | null }; // Celsius
    dewpoint: { value: number | null }; // Celsius
    relativeHumidity: { value: number | null };
    windSpeed: {
      value: number | null;
      unitCode: string; // "wmoUnit:km_h-1" or "unit:m_s-1" — NWS is inconsistent across stations
    };
    windDirection: { value: number | null }; // degrees
    windChill?: { value: number | null }; // Celsius — present only in cold/wind conditions
    heatIndex?: { value: number | null }; // Celsius — present only in hot/humid conditions
    textDescription: string;
    presentWeather: Array<{ rawString: string }>;
  };
}

// --- Helper: fetch with error handling ---

async function nwsFetch<T>(url: string): Promise<NWSResult<T>> {
  try {
    const response = await fetch(url, { headers: NWS_HEADERS });
    if (!response.ok) {
      return {
        ok: false,
        error: {
          message: `NWS API error: ${response.status} ${response.statusText}`,
          code: "NWS_ERROR",
        },
      };
    }
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: { message: "Could not reach NWS API.", code: "NWS_ERROR" },
    };
  }
}

// --- Helper: get NWS grid info for a location ---

interface GridInfo {
  forecastUrl: string;
  hourlyUrl: string;
  stationsUrl: string;
}

async function getGridInfo(location: GeocodedLocation): Promise<NWSResult<GridInfo>> {
  const url = `${NWS_BASE}/points/${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
  const result = await nwsFetch<PointsResponse>(url);

  if (!result.ok) return result;

  const { forecast, forecastHourly, observationStations } = result.data.properties;

  return {
    ok: true,
    data: {
      forecastUrl: forecast,
      hourlyUrl: forecastHourly,
      stationsUrl: observationStations,
    },
  };
}

// --- Helper: derive WeatherIcon from NWS condition string ---

export function conditionToIcon(condition: string, isDaytime = true): WeatherIcon {
  const c = condition.toLowerCase();
  if (c.includes("thunderstorm") || c.includes("thunder")) return "thunderstorm";
  if (c.includes("snow") || c.includes("blizzard") || c.includes("flurr")) return "snowy";
  if (c.includes("rain") || c.includes("shower") || c.includes("drizzle")) return "rainy";
  if (c.includes("fog") || c.includes("haze") || c.includes("mist")) return "foggy";
  if (c.includes("wind") || c.includes("breezy") || c.includes("blustery")) return "windy";
  if (c.includes("sunny") || c.includes("clear")) {
    return isDaytime ? "sunny" : "clear-night";
  }
  if (c.includes("mostly cloudy") || c.includes("overcast")) return "cloudy";
  if (c.includes("partly") || c.includes("scattered")) {
    return isDaytime ? "partly-cloudy" : "partly-cloudy-night";
  }
  return "unknown";
}

// --- Helper: Celsius → Fahrenheit ---

function cToF(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

// --- Helper: wind speed -> mph ---

// NWS observations report windSpeed in either "wmoUnit:km_h-1" (km/h) or
// "unit:m_s-1" (meters/second) depending on the station. Always check unitCode.
function windToMph(value: number, unitCode: string): number {
  if (unitCode.includes("m_s-1")) {
    // m/s -> mph: multiply by 2.23694
    return Math.round(value * 2.23694);
  }
  // km/h -> mph: multiply by 0.621371
  return Math.round(value * 0.621371);
}

// --- Helper: degrees -> cardinal direction ---

function degreesToCardinal(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

// --- Public APIs ---

export async function getCurrentWeather(
  location: GeocodedLocation,
): Promise<NWSResult<CurrentWeather>> {
  // Step 1: get grid info
  const gridResult = await getGridInfo(location);
  if (!gridResult.ok) return gridResult;

  // Step 2: get list of nearby observation stations
  const stationsResult = await nwsFetch<{
    features: Array<{ properties: { stationIdentifier: string } }>;
  }>(gridResult.data.stationsUrl);

  if (!stationsResult.ok) return stationsResult;

  const stations = stationsResult.data.features;
  if (stations.length === 0) {
    return {
      ok: false,
      error: { message: "No observation stations found nearby.", code: "NWS_ERROR" },
    };
  }

  // Step 3: get latest observation from closest station
  const stationId = stations[0].properties.stationIdentifier;
  const obsResult = await nwsFetch<ObservationResponse>(
    `${NWS_BASE}/stations/${stationId}/observations/latest`,
  );

  if (!obsResult.ok) return obsResult;

  // Step 4: also get the 7-day forecast for precipitation chance
  const forecastResult = await nwsFetch<{ properties: { periods: ForecastPeriod[] } }>(
    gridResult.data.forecastUrl,
  );

  const props = obsResult.data.properties;
  const tempC = props.temperature.value ?? 20;
  const windValue = props.windSpeed.value ?? 0;
  const windUnitCode = props.windSpeed.unitCode ?? "wmoUnit:km_h-1";
  const windDeg = props.windDirection.value ?? 0;

  // Apparent temperature: use windChill if cold, heatIndex if hot, else same as temp
  // NWS only includes these fields when conditions warrant them
  const feelsLikeC = props.windChill?.value ?? props.heatIndex?.value ?? tempC;

  // Get precip chance from first daytime forecast period if available
  let precipChance = 0;
  if (forecastResult.ok) {
    const firstDay = forecastResult.data.properties.periods.find((p) => p.isDaytime);
    precipChance = firstDay?.probabilityOfPrecipitation?.value ?? 0;
  }

  const condition = props.textDescription || "Unknown";

  return {
    ok: true,
    data: {
      city: location.displayName,
      temperature: cToF(tempC),
      feelsLike: cToF(feelsLikeC),
      humidity: Math.round(props.relativeHumidity.value ?? 50),
      windSpeed: `${windToMph(windValue, windUnitCode)} mph`,
      windDirection: degreesToCardinal(windDeg),
      condition,
      precipChance,
      icon: conditionToIcon(condition),
    },
  };
}

export async function getHourlyForecast(
  location: GeocodedLocation,
): Promise<NWSResult<HourlyPeriod[]>> {
  const gridResult = await getGridInfo(location);
  if (!gridResult.ok) return gridResult;

  const forecastResult = await nwsFetch<{
    properties: { periods: ForecastPeriod[] };
  }>(gridResult.data.hourlyUrl);

  if (!forecastResult.ok) return forecastResult;

  // Take next 24 hours only
  const periods = forecastResult.data.properties.periods.slice(0, 24);

  const hourly: HourlyPeriod[] = periods.map((period) => {
    // NWS hourly endpoint returns °F already for US locations
    const temp = period.temperatureUnit === "F" ? period.temperature : cToF(period.temperature);

    // Parse the ISO timestamp from startTime
    const hour = new Date(period.startTime).getHours();
    const timeStr =
      hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;

    return {
      time: timeStr,
      temperature: temp,
      condition: period.shortForecast,
      icon: conditionToIcon(period.shortForecast, period.isDaytime),
      precipChance: period.probabilityOfPrecipitation?.value ?? 0,
    };
  });

  return { ok: true, data: hourly };
}

export async function getWeeklyForecast(
  location: GeocodedLocation,
): Promise<NWSResult<DailyPeriod[]>> {
  const gridResult = await getGridInfo(location);
  if (!gridResult.ok) return gridResult;

  const forecastResult = await nwsFetch<{
    properties: { periods: ForecastPeriod[] };
  }>(gridResult.data.forecastUrl);

  if (!forecastResult.ok) return forecastResult;

  const periods = forecastResult.data.properties.periods;

  // NWS returns alternating day/night periods
  // We pair them to get high/low
  const daily: DailyPeriod[] = [];

  for (let i = 0; i < periods.length - 1 && daily.length < 7; i += 2) {
    const day = periods[i];
    const night = periods[i + 1];

    if (!day.isDaytime) continue;

    daily.push({
      day: day.name === "Today" ? "Today" : day.name,
      high: day.temperature,
      low: night?.temperature ?? day.temperature - 10,
      condition: day.shortForecast,
      icon: conditionToIcon(day.shortForecast, true),
      precipChance: day.probabilityOfPrecipitation?.value ?? 0,
    });
  }

  return { ok: true, data: daily };
}
