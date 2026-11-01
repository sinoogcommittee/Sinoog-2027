import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROUTES,
  buildGoogleMapsDirectionsUrl,
  computeRouteTelemetry,
  CURVED_COORDS_3K,
  CURVED_COORDS_5K,
  CURVED_COORDS_10K_CHAPEL,
  CURVED_COORDS_10K_CALIBRATED,
} from './routeData';

describe('InteractiveRouteMap — Official Highway Course Data & Options', () => {
  it('defines the three official Sinoog Run 2027 highway course options', () => {
    expect(ROUTES).toHaveLength(3);

    const ids = ROUTES.map((r) => r.id);
    expect(ids).toContain('sinoog-3k');
    expect(ids).toContain('sinoog-5k');
    expect(ids).toContain('sinoog-10k');

    for (const route of ROUTES) {
      expect(route.title).toBeTruthy();
      expect(route.distance).toMatch(/^(3K|5K|10K)$/);
      expect(route.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(route.file).toMatch(/^\/data\/routes\/.+\.geojson$/);
      expect(route.googleMapsUrl).toContain('https://www.google.com/maps/dir/');
      expect(route.googleMapsUrl).toContain('travelmode=walking');
      expect(route.curvedCoords.length).toBeGreaterThan(50);
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
      expect(routeLine.geometry.coordinates.length).toBeGreaterThan(50);

      const points = json.features.filter((f: { geometry?: { type?: string } }) => f.geometry?.type === 'Point');
      expect(points.length).toBeGreaterThanOrEqual(6);

      const startPoint = points.find((p: { properties?: { role?: string } }) => p.properties?.role === 'start');
      const finishPoint = points.find((p: { properties?: { role?: string } }) => p.properties?.role === 'finish');

      expect(startPoint, `Start point should exist in ${route.id}`).toBeDefined();
      expect(finishPoint, `Finish point should exist in ${route.id}`).toBeDefined();
      expect(startPoint.properties.order).toBe(1);
      // Start and Finish have separated coordinates so badges do not overlap
      expect(startPoint.geometry.coordinates).not.toEqual(finishPoint.geometry.coordinates);
    }
  });

  it('validates 3K route has Cabantian Chapel turnaround', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/routes/sinoog-3k.geojson');
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const turnaround = json.features.find(
      (f: { properties?: { role?: string } }) => f.properties?.role === 'turnaround',
    );
    expect(turnaround).toBeDefined();
    expect(turnaround.properties.name).toContain('Cabantian');
  });

  it('validates 5K route has Pangpang Chapel turnaround', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/routes/sinoog-5k.geojson');
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const turnaround = json.features.find(
      (f: { properties?: { role?: string } }) => f.properties?.role === 'turnaround',
    );
    expect(turnaround).toBeDefined();
    expect(turnaround.properties.name).toContain('Pangpang');
  });

  it('validates 10K route has both Pangpang and East Guinacot turnarounds', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/routes/sinoog-10k.geojson');
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const turnarounds = json.features.filter(
      (f: { properties?: { role?: string } }) => f.properties?.role === 'turnaround',
    );
    expect(turnarounds.length).toBeGreaterThanOrEqual(2);

    const names = turnarounds.map((t: { properties?: { name?: string } }) => t.properties?.name);
    expect(names.some((n: string) => n.includes('Pangpang'))).toBe(true);
    expect(names.some((n: string) => n.includes('East Guinacot'))).toBe(true);
  });

  it('computes realistic telemetry and elevation gain along the Bohol Circumferential Road', () => {
    const telemetry3K = computeRouteTelemetry(CURVED_COORDS_3K);
    expect(telemetry3K.totalKm).toBeGreaterThan(2.5);
    expect(telemetry3K.elevGain).toBeGreaterThanOrEqual(0);
    expect(telemetry3K.sampled.length).toBeGreaterThan(10);

    const telemetry5K = computeRouteTelemetry(CURVED_COORDS_5K);
    expect(telemetry5K.totalKm).toBeGreaterThan(4.5);

    const telemetry10K = computeRouteTelemetry(CURVED_COORDS_10K_CHAPEL);
    expect(telemetry10K.totalKm).toBeGreaterThan(7.5);

    const telemetry10KCal = computeRouteTelemetry(CURVED_COORDS_10K_CALIBRATED);
    expect(telemetry10KCal.totalKm).toBeGreaterThan(telemetry10K.totalKm);
  });

  it('builds a valid Google Maps directions URL with origin, destination, and waypoints', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/routes/sinoog-3k.geojson');
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const url = buildGoogleMapsDirectionsUrl(json.features);
    expect(url).toContain('https://www.google.com/maps/dir/');
    expect(url).toContain('origin=');
    expect(url).toContain('destination=');
    expect(url).toContain('travelmode=walking');
  });

  it('ensures all points on the same course have distinct coordinates to prevent marker overlap', () => {
    for (const route of ROUTES) {
      const filePath = path.resolve(process.cwd(), 'public', route.file.replace(/^\//, ''));
      const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const points = json.features.filter((f: { geometry?: { type?: string } }) => f.geometry?.type === 'Point');
      const coordKeys = points.map((p: { geometry: { coordinates: [number, number] } }) =>
        `${p.geometry.coordinates[0].toFixed(5)},${p.geometry.coordinates[1].toFixed(5)}`
      );
      const uniqueKeys = new Set(coordKeys);
      expect(uniqueKeys.size, `Every point in ${route.id} should have distinct coordinates`).toBe(points.length);
    }
  });
});
