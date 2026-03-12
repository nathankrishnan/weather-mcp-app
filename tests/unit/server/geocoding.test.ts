import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeCity } from "@server/geocoding";

describe("geocodeCity", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns GEOCODE_ERROR when fetch throws", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

        const result = await geocodeCity("Seattle");

        expect(result).toEqual({
            ok: false,
            error: {
                message: "Could not reach geocoding service.",
                code: "GEOCODE_ERROR",
            },
        });
    });

    it("returns GEOCODE_ERROR when response is not ok", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            json: vi.fn(),
        } as unknown as Response);

        const result = await geocodeCity("Seattle");

        expect(result).toEqual({
            ok: false,
            error: {
                message: "Geocoding service returned an error.",
                code: "GEOCODE_ERROR",
            },
        });
    });

    it("returns CITY_NOT_FOUND when no results are returned", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ results: [] }),
        } as unknown as Response);

        const result = await geocodeCity("Nowhere");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("CITY_NOT_FOUND");
            expect(result.error.message).toContain('Could not find "Nowhere');
        }
    });

    it("formats display name with admin1 when provided", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                results: [
                    {
                        latitude: 47.6062,
                        longitude: -122.3321,
                        name: "Seattle",
                        admin1: "Washington",
                    },
                ],
            }),
        } as unknown as Response);

        const result = await geocodeCity("Seattle");

        expect(result).toEqual({
            ok: true,
            location: {
                lat: 47.6062,
                lon: -122.3321,
                displayName: "Seattle, Washington",
            },
        });
    });

    it("formats display name without admin1 when not provided", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                results: [
                    {
                        latitude: 48.8566,
                        longitude: 2.3522,
                        name: "Paris",
                    },
                ],
            }),
        } as unknown as Response);

        const result = await geocodeCity("Paris");

        expect(result).toEqual({
            ok: true,
            location: {
                lat: 48.8566,
                lon: 2.3522,
                displayName: "Paris",
            },
        });
    });

    it("builds the Open-Meteo request URL with expected query params", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                results: [
                    {
                        latitude: 47.6062,
                        longitude: -122.3321,
                        name: "Seattle",
                    },
                ],
            }),
        } as unknown as Response);

        await geocodeCity("Seattle");

        expect(fetchSpy).toHaveBeenCalledOnce();
        const [requestUrl] = fetchSpy.mock.calls[0];
        expect(typeof requestUrl).toBe("string");

        const parsed = new URL(requestUrl as string);
        expect(parsed.origin).toBe("https://geocoding-api.open-meteo.com");
        expect(parsed.pathname).toBe("/v1/search");
        expect(parsed.searchParams.get("name")).toBe("Seattle");
        expect(parsed.searchParams.get("count")).toBe("1");
        expect(parsed.searchParams.get("language")).toBe("en");
        expect(parsed.searchParams.get("format")).toBe("json");
    });
});
