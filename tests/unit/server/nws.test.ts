import { afterEach, describe, expect, it, vi } from "vitest";
import { conditionToIcon, getCurrentWeather } from "@server/nws";

describe("conditionToIcon", () => {
    it("maps clear conditions for day and night", () => {
        expect(conditionToIcon("Clear", true)).toBe("sunny");
        expect(conditionToIcon("Clear", false)).toBe("clear-night");
    });

    it("maps known weather keywords", () => {
        expect(conditionToIcon("Thunderstorms likely")).toBe("thunderstorm");
        expect(conditionToIcon("Light Rain")).toBe("rainy");
        expect(conditionToIcon("Patchy Fog")).toBe("foggy");
    });
});

describe("getCurrentWeather", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns NWS_ERROR when the points lookup fails", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            json: vi.fn(),
        } as unknown as Response);

        const result = await getCurrentWeather({
            lat: 47.6062,
            lon: -122.3321,
            displayName: "Seattle, Washington",
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("NWS_ERROR");
            expect(result.error.message).toContain("500");
        }
    });

    it("returns NWS_ERROR when no observation stations are found", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        fetchSpy
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    properties: {
                        forecast: "https://api.weather.gov/gridpoints/SEW/125,67/forecast",
                        forecastHourly: "https://api.weather.gov/gridpoints/SEW/125,67/forecast/hourly",
                        observationStations: "https://api.weather.gov/gridpoints/SEW/125,67/stations",
                    },
                }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({ features: [] }),
            } as unknown as Response);

        const result = await getCurrentWeather({
            lat: 47.6062,
            lon: -122.3321,
            displayName: "Seattle, Washington",
        });

        expect(result).toEqual({
            ok: false,
            error: {
                message: "No observation stations found nearby.",
                code: "NWS_ERROR",
            },
        });
    });

    it("maps NWS responses into current weather", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch");

        fetchSpy
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    properties: {
                        forecast: "https://api.weather.gov/gridpoints/SEW/125,67/forecast",
                        forecastHourly: "https://api.weather.gov/gridpoints/SEW/125,67/forecast/hourly",
                        observationStations: "https://api.weather.gov/gridpoints/SEW/125,67/stations",
                    },
                }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    features: [{ properties: { stationIdentifier: "KSEA" } }],
                }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    properties: {
                        temperature: { value: 10 },
                        dewpoint: { value: 5 },
                        relativeHumidity: { value: 67.6 },
                        windSpeed: { value: 10, unitCode: "unit:m_s-1" },
                        windDirection: { value: 225 },
                        windChill: { value: null },
                        heatIndex: { value: 12 },
                        textDescription: "Mostly Cloudy",
                        presentWeather: [],
                    },
                }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    properties: {
                        periods: [
                            {
                                isDaytime: true,
                                probabilityOfPrecipitation: { value: 40 },
                            },
                        ],
                    },
                }),
            } as unknown as Response);

        const result = await getCurrentWeather({
            lat: 47.6062,
            lon: -122.3321,
            displayName: "Seattle, Washington",
        });

        expect(result).toEqual({
            ok: true,
            data: {
                city: "Seattle, Washington",
                temperature: 50,
                feelsLike: 54,
                humidity: 68,
                windSpeed: "22 mph",
                windDirection: "SW",
                condition: "Mostly Cloudy",
                precipChance: 40,
                icon: "cloudy",
            },
        });

        expect(fetchSpy).toHaveBeenCalledTimes(4);
        const [firstUrl] = fetchSpy.mock.calls[0];
        expect(firstUrl).toBe("https://api.weather.gov/points/47.6062,-122.3321");
    });
});
