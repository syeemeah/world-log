import { Router } from "express";
import { db, visitsTable } from "@workspace/db";
import { sql, desc, asc } from "drizzle-orm";

const router = Router();

router.get("/stats/overview", async (_req, res) => {
  const rows = await db.select().from(visitsTable);

  const totalVisits = rows.length;
  const countries = new Set(rows.map((r) => r.country));
  const cities = new Set(rows.map((r) => `${r.city}|${r.country}`));
  const totalCountries = countries.size;
  const totalCities = cities.size;

  const countryCounts: Record<string, number> = {};
  for (const r of rows) {
    countryCounts[r.country] = (countryCounts[r.country] ?? 0) + 1;
  }
  const topCountry =
    totalVisits > 0
      ? Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      : null;

  const dates = rows.map((r) => r.visitDate).sort();
  const firstVisit = dates[0] ?? null;
  const latestVisit = dates[dates.length - 1] ?? null;

  res.json({ totalVisits, totalCountries, totalCities, topCountry, firstVisit, latestVisit });
});

router.get("/stats/years", async (_req, res) => {
  const rows = await db.select().from(visitsTable);

  const byYear: Record<number, typeof rows> = {};
  for (const r of rows) {
    const year = new Date(r.visitDate).getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(r);
  }

  const summaries = Object.entries(byYear)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([yearStr, yearRows]) => {
      const year = Number(yearStr);
      const countries = new Set(yearRows.map((r) => r.country));
      const cities = new Set(yearRows.map((r) => r.city));
      return {
        year,
        countries: countries.size,
        cities: cities.size,
        visits: yearRows.length,
        countryList: Array.from(countries).sort(),
        cityList: Array.from(cities).sort(),
      };
    });

  res.json(summaries);
});

router.get("/stats/timeline", async (_req, res) => {
  const rows = await db
    .select()
    .from(visitsTable)
    .orderBy(asc(visitsTable.visitDate), asc(visitsTable.id));

  res.json(
    rows.map((v) => ({
      id: v.id,
      country: v.country,
      countryCode: v.countryCode,
      city: v.city,
      visitDate: v.visitDate,
      notes: v.notes ?? null,
      lat: v.lat,
      lng: v.lng,
      createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
    }))
  );
});

export default router;
