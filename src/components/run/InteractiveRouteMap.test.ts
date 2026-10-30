import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ROUTES, buildGoogleMapsDirectionsUrl } from './routeData';

describe('InteractiveRouteMap — GeoJSON Course Data & Options', () => {
  it('defines the three official Sinoog Run 2027 course options', () => {
    expect(ROUTES).toHaveLength(3);

    const ids = ROUTES.map((r) => r.id);
    expect(ids).toContain('sta-cruz-stampa');
    expect(ids).toContain('no-stampa');
    expect(ids).toContain('cabantian-stampa');

    for (const route of ROUTES) {
      expect(route.title).toBeTruthy();
      expect(route.distance).toMatch(/\d+(\.\d+)?\s*km/);
      expect(route.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(route.file).toMatch(/^\/data\/routes\/.+\.geojson$/);
      expect(route.googleMapsUrl).toContain('https://www.google.com/maps/dir/');
      expect(route.googleMapsUrl).toContain('travelmode=walking');
    }
  });

  it('verifies that each referenced GeoJSON file exists and is valid', () => {
    for (const route of ROUTES) {
      const relativePath = route.file.replace(/^\//, '');
      const filePath = path.resolve(process.cwd(), 'public', relativePath.replace(/^data\//, 'data/'));

      expect(fs.existsSync(filePath), `File should exist: ${filePath}`).toBe(true);

      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);

      expect(json.type).toBe('FeatureCollection');
      expect(json.properties?.distance_km).toBeGreaterThan(0);
      expect(Array.isArray(json.features)).toBe(true);

      const routeLine = json.features.find((f: { geometry?: { type?: string } }) => f.geometry?.type === 'LineString');
      expect(routeLine, `Route line should exist in ${route.id}`).toBeDefined();
      expect(routeLine.geometry.coordinates.length).toBeGreaterThan(100);

      const points = json.features.filter((f: { geometry?: { type?: string } }) => f.geometry?.type === 'Point');
      expect(points.length).toBeGreaterThanOrEqual(6);

      const startPoint = points.find((p: { properties?: { role?: string } }) => p.properties?.role === 'start');
      const finishPoint = points.find((p: { properties?: { role?: string } }) => p.properties?.role === 'finish');

      expect(startPoint, `Start point should exist in ${route.id}`).toBeDefined();
      expect(finishPoint, `Finish point should exist in ${route.id}`).toBeDefined();
      expect(startPoint.properties.order).toBe(1);
    }
  });

  it('validates Sta. Cruz + Stampa contains the Stampa turnaround', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/routes/sinoog-sta-cruz-stampa.geojson');
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const turnaround = json.features.find(
      (f: { properties?: { role?: string } }) => f.properties?.role === 'turnaround',
    );
    expect(turnaround).toBeDefined();
    expect(turnaround.properties.name).toContain('Stampa Hills');
  });

  it('builds a valid Google Maps directions URL with origin, destination, and waypoints', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/routes/sinoog-no-stampa.geojson');
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const url = buildGoogleMapsDirectionsUrl(json.features);
    expect(url).toContain('https://www.google.com/maps/dir/');
    expect(url).toContain('origin=9.7319968');
    expect(url).toContain('destination=9.7319968');
    expect(url).toContain('travelmode=walking');
    expect(url).toContain('waypoints=');
  });
});
