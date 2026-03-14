import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  registerAppToolMock,
  geocodeCityMock,
  getNearbyCitiesMock,
  getCurrentWeatherMock,
  getHourlyForecastMock,
  getWeeklyForecastMock,
} = vi.hoisted(() => ({
  registerAppToolMock: vi.fn(),
  geocodeCityMock: vi.fn(),
  getNearbyCitiesMock: vi.fn(),
  getCurrentWeatherMock: vi.fn(),
  getHourlyForecastMock: vi.fn(),
  getWeeklyForecastMock: vi.fn(),
}));

vi.mock("@modelcontextprotocol/ext-apps/server", () => ({
  registerAppTool: registerAppToolMock,
}));

vi.mock("@server/geocoding", () => ({
  geocodeCity: geocodeCityMock,
}));

vi.mock("@server/nearby-cities", () => ({
  getNearbyCities: getNearbyCitiesMock,
}));

vi.mock("@server/nws", () => ({
  getCurrentWeather: getCurrentWeatherMock,
  getHourlyForecast: getHourlyForecastMock,
  getWeeklyForecast: getWeeklyForecastMock,
}));

import { registerTools } from "@server/tools";

function getToolCall(toolName: string) {
  const call = registerAppToolMock.mock.calls.find((c) => c[1] === toolName);
  if (!call) throw new Error(`Tool not registered: ${toolName}`);
  return call;
}

function getToolHandler(toolName: string) {
  return getToolCall(toolName)[3] as (input: { city: string }) => Promise<unknown>;
}

function getToolConfig(toolName: string) {
  return getToolCall(toolName)[2] as {
    inputSchema: { city: { safeParse: (value: string) => { success: boolean } } };
  };
}

const defaultGeo = {
  ok: true as const,
  location: {
    lat: 47.6062,
    lon: -122.3321,
    displayName: "Seattle, Washington",
  },
};

describe("registerTools", () => {
  beforeEach(() => {
    registerAppToolMock.mockClear();
    geocodeCityMock.mockReset();
    getNearbyCitiesMock.mockReset();
    getCurrentWeatherMock.mockReset();
    getHourlyForecastMock.mockReset();
    getWeeklyForecastMock.mockReset();
    registerTools({} as never);
  });

  it("uses a city schema that trims and rejects short input", () => {
    const config = getToolConfig("get-current-weather");

    expect(config.inputSchema.city.safeParse("   ").success).toBe(false);
    expect(config.inputSchema.city.safeParse("A").success).toBe(false);
    expect(config.inputSchema.city.safeParse("LA").success).toBe(true);
  });

  it("returns structured geocode errors for all tools", async () => {
    geocodeCityMock.mockResolvedValue({
      ok: false,
      error: { message: "City not found", code: "CITY_NOT_FOUND" },
    });

    const toolNames = [
      "get-current-weather",
      "get-hourly-forecast",
      "get-weekly-forecast",
      "get-nearby-weather",
    ];

    for (const toolName of toolNames) {
      const handler = getToolHandler(toolName);
      const result = (await handler({ city: "Nowhere" })) as {
        content: Array<{ text: string }>;
        structuredContent: { error: { message: string; code: string } };
      };

      expect(result.content[0]?.text).toBe("City not found");
      expect(result.structuredContent.error).toEqual({
        message: "City not found",
        code: "CITY_NOT_FOUND",
      });
    }
  });

  it("returns structured downstream errors for current/hourly/weekly tools", async () => {
    geocodeCityMock.mockResolvedValue(defaultGeo);
    getCurrentWeatherMock.mockResolvedValue({
      ok: false,
      error: { message: "Current failed", code: "NWS_ERROR" },
    });
    getHourlyForecastMock.mockResolvedValue({
      ok: false,
      error: { message: "Hourly failed", code: "NWS_ERROR" },
    });
    getWeeklyForecastMock.mockResolvedValue({
      ok: false,
      error: { message: "Weekly failed", code: "NWS_ERROR" },
    });

    const scenarios = [
      {
        toolName: "get-current-weather",
        expectedMessage: "Current failed",
      },
      {
        toolName: "get-hourly-forecast",
        expectedMessage: "Hourly failed",
      },
      {
        toolName: "get-weekly-forecast",
        expectedMessage: "Weekly failed",
      },
    ];

    for (const scenario of scenarios) {
      const handler = getToolHandler(scenario.toolName);
      const result = (await handler({ city: "Seattle" })) as {
        content: Array<{ text: string }>;
        structuredContent: { error: { message: string; code: string } };
      };

      expect(result.content[0]?.text).toBe(scenario.expectedMessage);
      expect(result.structuredContent.error).toEqual({
        message: scenario.expectedMessage,
        code: "NWS_ERROR",
      });
    }
  });

  it("returns expected success shape for current/hourly/weekly tools", async () => {
    geocodeCityMock.mockResolvedValue(defaultGeo);
    getCurrentWeatherMock.mockResolvedValue({
      ok: true,
      data: {
        city: "Seattle, Washington",
        temperature: 55,
        feelsLike: 54,
        humidity: 60,
        windSpeed: "8 mph",
        windDirection: "SW",
        condition: "Cloudy",
        precipChance: 20,
        icon: "cloudy",
      },
    });
    getHourlyForecastMock.mockResolvedValue({
      ok: true,
      data: [
        {
          time: "1 PM",
          temperature: 55,
          condition: "Cloudy",
          icon: "cloudy",
          precipChance: 20,
        },
      ],
    });
    getWeeklyForecastMock.mockResolvedValue({
      ok: true,
      data: [
        {
          day: "Today",
          high: 58,
          low: 46,
          condition: "Cloudy",
          icon: "cloudy",
          precipChance: 30,
        },
      ],
    });

    const current = (await getToolHandler("get-current-weather")({
      city: "Seattle",
    })) as { structuredContent: { current: { city: string } } };
    const hourly = (await getToolHandler("get-hourly-forecast")({
      city: "Seattle",
    })) as { structuredContent: { hourly: unknown[]; city: string } };
    const weekly = (await getToolHandler("get-weekly-forecast")({
      city: "Seattle",
    })) as { structuredContent: { weekly: unknown[]; city: string } };

    expect(current.structuredContent.current.city).toBe("Seattle, Washington");
    expect(hourly.structuredContent.hourly).toHaveLength(1);
    expect(hourly.structuredContent.city).toBe("Seattle, Washington");
    expect(weekly.structuredContent.weekly).toHaveLength(1);
    expect(weekly.structuredContent.city).toBe("Seattle, Washington");
  });

  it("returns a clear response when no nearby city data exists", async () => {
    geocodeCityMock.mockResolvedValue({
      ok: true,
      location: {
        lat: 43.615,
        lon: -116.2023,
        displayName: "Boise, Idaho",
      },
    });
    getNearbyCitiesMock.mockReturnValue([]);

    const handler = getToolHandler("get-nearby-weather");
    const result = (await handler({ city: "Boise" })) as {
      content: Array<{ text: string }>;
      structuredContent: { nearby: { cities: unknown[] } };
    };

    expect(result.content[0]?.text).toContain("No nearby city data is available");
    expect(result.structuredContent.nearby.cities).toEqual([]);
    expect(getCurrentWeatherMock).not.toHaveBeenCalled();
  });

  it("returns a clear response when nearby weather calls all fail", async () => {
    geocodeCityMock.mockResolvedValue(defaultGeo);
    getNearbyCitiesMock.mockReturnValue([
      {
        name: "Tacoma",
        state: "WA",
        lat: 47.2529,
        lon: -122.4443,
        distance: "35 mi south",
      },
      {
        name: "Bellevue",
        state: "WA",
        lat: 47.6101,
        lon: -122.2015,
        distance: "10 mi east",
      },
    ]);
    getCurrentWeatherMock.mockResolvedValue({
      ok: false,
      error: { message: "NWS down", code: "NWS_ERROR" },
    });

    const handler = getToolHandler("get-nearby-weather");
    const result = (await handler({ city: "Seattle" })) as {
      content: Array<{ text: string }>;
      structuredContent: { nearby: { cities: unknown[] } };
    };

    expect(result.content[0]?.text).toContain("Could not fetch nearby weather right now");
    expect(result.structuredContent.nearby.cities).toEqual([]);
    expect(getCurrentWeatherMock).toHaveBeenCalledTimes(2);
  });
});
