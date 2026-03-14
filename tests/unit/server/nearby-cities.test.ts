import { describe, expect, it } from "vitest";
import { getNearbyCities } from "@server/nearby-cities";

describe("getNearbyCities", () => {
  it("returns nearby cities for a known one-word city", () => {
    const result = getNearbyCities("Seattle, Washington");

    expect(result).toHaveLength(4);
    expect(result.map((c) => c.name)).toEqual(["Tacoma", "Bellevue", "Everett", "Olympia"]);
  });

  it("handles mixed-case input for city key lookup", () => {
    const result = getNearbyCities("New York, New York");

    expect(result).toHaveLength(4);
    expect(result[0]?.name).toBe("Newark");
  });

  it("handles multi-word city keys", () => {
    const result = getNearbyCities("San Francisco, California");

    expect(result).toHaveLength(4);
    expect(result.map((c) => c.name)).toContain("Oakland");
  });

  it("returns an empty array for unknown cities", () => {
    const result = getNearbyCities("Boise, Idaho");

    expect(result).toEqual([]);
  });
});
