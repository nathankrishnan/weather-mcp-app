// Interfaces shared between server.ts and the React UI
// These describe the data shapes that flow through structuredContent

// --- Weather Icons ---

export type WeatherIcon =
    | "sunny"
    | "partly-cloudy"
    | "cloudy"
    | "rainy"
    | "thunderstorm"
    | "snowy"
    | "foggy"
    | "windy"
    | "clear-night"
    | "partly-cloudy-night"
    | "unknown";

// --- Current Conditions ---

export interface CurrentWeather {
    city: string; // Human-readable location name e.g. "Seattle, WA"
    temperature: number; // °F, already converted from NWS Celsius
    feelsLike: number;
    humidity: number; // Percentage 0-100
    windSpeed: string; // e.g. "12 mph"
    windDirection: string; // e.g. "SW"
    condition: string; // Short description e.g. "Mostly Cloudy"
    precipChance: number; // Percentage 0-100
    icon: WeatherIcon; // Derived from NWS condition text
}

// --- Hourly Forecast ---

export interface HourlyPeriod {
    time: string; // e.g. "2 PM"
    temperature: number; // °F
    condition: string;
    icon: WeatherIcon;
    precipChance: number;
}

// --- Weekly Forecast ---

export interface DailyPeriod {
    day: string; // e.g. "Monday" or "Today"
    high: number; // °F
    low: number; // °F
    condition: string;
    icon: WeatherIcon;
    precipChance: number;
}

// --- Nearby Locations ---

export interface NearbyCity {
    name: string; // e.g. "Tacoma"
    distance: string; // e.g. "30 mi south"
    temperature: number; // °F
    condition: string;
    icon: WeatherIcon;
}

export interface NearbyWeather {
    origin: string; // The city the user orginally searched
    cities: NearbyCity[];
}

// --- Error response ---

export interface WeatherError {
    message: string; // Human-readable error for the UI to display
    code: "NOT_US" | "CITY_NOT_FOUND" | "NWS_ERROR" | "GEOCODE_ERROR";
}

// --- Tool result wrappers ---

// Each tool's structuredContent is one of these shapes.
// The UI casts result.structuredContent to the appropriate type.
export interface CurrentWeatherResult {
    current: CurrentWeather;
}

export interface HourlyForecastResult {
    hourly: HourlyPeriod[];
    city: string;
}

export interface WeeklyForecastResult {
    weekly: DailyPeriod[];
    city: string;
}

export interface NearbyWeatherResult {
    nearby: NearbyWeather;
}