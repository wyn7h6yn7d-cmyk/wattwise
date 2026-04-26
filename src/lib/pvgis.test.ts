import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPvgisProduction } from "./pvgis";

describe("fetchPvgisProduction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds correct PVGIS URL parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        outputs: {
          totals: { fixed: { E_y: 12000 } },
          monthly: {
            fixed: [
              { month: 1, E_m: 300 },
              { month: 2, E_m: 500 },
            ],
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchPvgisProduction({
      latitude: 59.437,
      longitude: 24.7536,
      systemKw: 10,
      slope: 35,
      azimuth: 0,
      lossesPercent: 14,
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("https://re.jrc.ec.europa.eu/api/v5_3/PVcalc");
    expect(calledUrl).toContain("lat=59.437");
    expect(calledUrl).toContain("lon=24.7536");
    expect(calledUrl).toContain("peakpower=10");
    expect(calledUrl).toContain("angle=35");
    expect(calledUrl).toContain("aspect=0");
    expect(calledUrl).toContain("loss=14");
    expect(calledUrl).toContain("outputformat=json");
  });

  it("returns controlled error for invalid coordinates", async () => {
    const result = await fetchPvgisProduction({
      latitude: 999,
      longitude: 24.7536,
      systemKw: 10,
      slope: 35,
      azimuth: 0,
      lossesPercent: 14,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid PVGIS coordinates");
    }
  });

  it("returns fallback error when upstream API does not respond", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network timeout")),
    );

    const result = await fetchPvgisProduction({
      latitude: 59.437,
      longitude: 24.7536,
      systemKw: 10,
      slope: 35,
      azimuth: 0,
      lossesPercent: 14,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("PVGIS request failed");
    }
  });
});

