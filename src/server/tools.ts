// Registers all MCP tools on the server
// Called once from server.ts during setup

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { geocodeCity, type GeocodedLocation } from "./geocoding";
import { getCurrentWeather, getHourlyForecast, getWeeklyForecast } from "./nws";
import { getNearbyCities } from "./nearby-cities";
import { MAIN_RESOURCE_URI, NEARBY_RESOURCE_URI } from "./constants";
import type { NearbyCity as NearbyWeatherCity, WeatherError } from "@shared/types";

// --- Shared input schema ---

const citySchema = {
  city: z
    .string()
    .trim()
    .min(2, "City name is required and must be at least 2 characters.")
    .describe(
      "US city name, optionally with state abbreviation. " +
        "Examples: 'Seattle', 'Seattle, WA', 'New York', 'Austin, TX'. " +
        "Do not include country name. US locations only.",
    ),
};

// --- Shared helper: standardized tool error payload ---

type ToolErrorResponse = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: { error: WeatherError };
};

function toToolError(error: WeatherError): ToolErrorResponse {
  return {
    content: [{ type: "text", text: error.message }],
    structuredContent: { error },
  };
}

// --- Shared helper: geocode city before running tool-specific logic ---

async function withGeocodedCity<T>(
  city: string,
  run: (location: GeocodedLocation) => Promise<T>,
): Promise<T | ToolErrorResponse> {
  const geoResult = await geocodeCity(city);
  if (!geoResult.ok) return toToolError(geoResult.error);
  return run(geoResult.location);
}

// --- Tools ---

export function registerTools(server: McpServer): void {
  // get-current-weather
  registerAppTool(
    server,
    "get-current-weather",
    {
      title: "Get Current Weather",
      description:
        "Get current weather conditions for a US city. " +
        "Returns temperature, wind, humidity, and precipitation chance. " +
        "Triggers the weather UI.",
      inputSchema: citySchema,
      _meta: {
        ui: {
          resourceUri: MAIN_RESOURCE_URI,
          visibility: ["model", "app"],
        },
      },
    },
    async ({ city }) =>
      withGeocodedCity(city, async (location) => {
        const weatherResult = await getCurrentWeather(location);
        if (!weatherResult.ok) return toToolError(weatherResult.error);

        const w = weatherResult.data;
        return {
          content: [
            {
              type: "text",
              text:
                `Current weather in ${w.city}: ${w.temperature}°F, ${w.condition}. ` +
                `Wind ${w.windSpeed} ${w.windDirection}. Humidity ${w.humidity}%. ` +
                `Precipitation chance ${w.precipChance}%.`,
            },
          ],
          structuredContent: { current: w },
        };
      }),
  );

  // get-hourly-forecast
  registerAppTool(
    server,
    "get-hourly-forecast",
    {
      title: "Get Hourly Forecast",
      description:
        "Get the hourly weather forecast for the next 24 hours for a US city. " +
        "Use this when the user asks about weather hour-by-hour or wants to plan " +
        "activities.",
      inputSchema: citySchema,
      _meta: {
        ui: {
          resourceUri: MAIN_RESOURCE_URI,
          visibility: ["model", "app"],
        },
      },
    },
    async ({ city }) =>
      withGeocodedCity(city, async (location) => {
        const forecastResult = await getHourlyForecast(location);
        if (!forecastResult.ok) return toToolError(forecastResult.error);

        const hours = forecastResult.data;
        const summary = hours
          .slice(0, 6)
          .map((h) => `${h.time}: ${h.temperature}°F, ${h.condition}`)
          .join("; ");

        return {
          content: [
            {
              type: "text",
              text: `Hourly forecast for ${location.displayName}: ${summary}`,
            },
          ],
          structuredContent: {
            hourly: hours,
            city: location.displayName,
          },
        };
      }),
  );

  // get-weekly-forecast
  registerAppTool(
    server,
    "get-weekly-forecast",
    {
      title: "Get Weekly Forecast",
      description:
        "Get the 7-day weather forecast for a US city. Use this when the user " +
        "asks about weather this week, the weekend, or planning days ahead.",
      inputSchema: citySchema,
      _meta: {
        ui: {
          resourceUri: MAIN_RESOURCE_URI,
          visibility: ["model", "app"],
        },
      },
    },
    async ({ city }) =>
      withGeocodedCity(city, async (location) => {
        const forecastResult = await getWeeklyForecast(location);
        if (!forecastResult.ok) return toToolError(forecastResult.error);

        const days = forecastResult.data;
        const summary = days
          .map((d) => `${d.day}: High ${d.high}°F / Low ${d.low}°F, ${d.condition}`)
          .join("; ");

        return {
          content: [
            {
              type: "text",
              text: `7-day forecast for ${location.displayName}: ${summary}`,
            },
          ],
          structuredContent: {
            weekly: days,
            city: location.displayName,
          },
        };
      }),
  );

  // get-nearby-weather
  registerAppTool(
    server,
    "get-nearby-weather",
    {
      title: "Get Nearby Weather",
      description:
        "Compare current weather across cities near a given US city. " +
        "Use when the user asks how nearby areas compare, or wants to find " +
        "better weather nearby.",
      inputSchema: citySchema,
      _meta: {
        ui: {
          // Note: this tool uses the NEARBY resource, not the main one
          resourceUri: NEARBY_RESOURCE_URI,
          visibility: ["model", "app"],
        },
      },
    },
    async ({ city }) =>
      withGeocodedCity(city, async (location) => {
        const nearbyCities = getNearbyCities(location.displayName);
        if (nearbyCities.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No nearby city data is available for ${location.displayName} yet.`,
              },
            ],
            structuredContent: {
              nearby: {
                origin: location.displayName,
                cities: [],
              },
            },
          };
        }

        // Fetch current weather for each nearby city in parallel
        const weatherPromises = nearbyCities.map(async (nearbyCity) => {
          const cityLocation: GeocodedLocation = {
            lat: nearbyCity.lat,
            lon: nearbyCity.lon,
            displayName: `${nearbyCity.name}, ${nearbyCity.state}`,
          };

          const result = await getCurrentWeather(cityLocation);
          if (!result.ok) return null;
          return {
            name: nearbyCity.name,
            distance: nearbyCity.distance,
            temperature: result.data.temperature,
            condition: result.data.condition,
            icon: result.data.icon,
          };
        });

        const results = await Promise.all(weatherPromises);
        const cities = results.filter((value): value is NearbyWeatherCity => value !== null);

        if (cities.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Could not fetch nearby weather right now for ${location.displayName}.`,
              },
            ],
            structuredContent: {
              nearby: {
                origin: location.displayName,
                cities: [],
              },
            },
          };
        }

        const summary = cities
          .map((c) => `${c.name}: ${c.temperature}°F, ${c.condition}`)
          .join("; ");

        return {
          content: [
            {
              type: "text",
              text: `Nearby weather around ${location.displayName}: ${summary}`,
            },
          ],
          structuredContent: {
            nearby: {
              origin: location.displayName,
              cities,
            },
          },
        };
      }),
  );
}
