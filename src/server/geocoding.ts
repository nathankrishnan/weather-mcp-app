// Converts a city name string to lat/lon coordinates using the Open-Meteo API
//
// NWS will reject non-US locations at the /points step
//
// Flow: city name -> Open-Meteo API -> { lat, lon, displayName }

import type { WeatherError } from "@shared/types";

// --- Types ---

export interface GeocodedLocation {
  lat: number;
  lon: number;
  displayName: string; // e.g. "Seattle, Washington"
}

export type GeoResult =
  | { ok: true; location: GeocodedLocation }
  | { ok: false; error: WeatherError };

interface OpenMeteoGeoSearchResult {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string; // e.g. "Washington"
  country_code?: string; // e.g. "US"
}

interface OpenMeteoGeoResponse {
  results?: OpenMeteoGeoSearchResult[];
}

// --- Main export ---

export async function geocodeCity(city: string): Promise<GeoResult> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    return {
      ok: false,
      error: {
        message: "Could not reach geocoding service.",
        code: "GEOCODE_ERROR",
      },
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        message: "Geocoding service returned an error.",
        code: "GEOCODE_ERROR",
      },
    };
  }

  const data = (await response.json()) as OpenMeteoGeoResponse;
  const results = data.results;

  if (!results || results.length === 0) {
    return {
      ok: false,
      error: {
        message: `Could not find "${city}. Try a more specific name, e.g. "Seattle, WA".`,
        code: "CITY_NOT_FOUND",
      },
    };
  }

  const match = results[0];
  const displayName = match.admin1 ? `${match.name}, ${match.admin1}` : match.name;

  return {
    ok: true,
    location: {
      lat: match.latitude,
      lon: match.longitude,
      displayName,
    },
  };
}
