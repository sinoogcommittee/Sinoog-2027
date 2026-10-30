export type Coordinate = [number, number];

export type CourseProperties = {
  order?: number;
  name: string;
  feature_type: 'course_point' | 'route';
  role?: 'start' | 'finish' | 'checkpoint' | 'junction' | 'turnaround';
  plus_code?: string;
  description?: string;
};

export type CourseFeature = {
  type: 'Feature';
  properties: CourseProperties;
  geometry: { type: 'Point'; coordinates: Coordinate } | { type: 'LineString'; coordinates: Coordinate[] };
};

export type CourseGeoJson = {
  type: 'FeatureCollection';
  name: string;
  properties: { distance_km: number; generated?: string; coordinate_system?: string };
  features: CourseFeature[];
};

export type RouteOption = {
  id: string;
  shortLabel: string;
  title: string;
  distance: string;
  description: string;
  file: string;
  kmlFile: string;
  gpxFile: string;
  googleMapsUrl: string;
  color: string;
};

export const ROUTES: RouteOption[] = [
  {
    id: 'sta-cruz-stampa',
    shortLabel: 'Sta. Cruz + Stampa',
    title: 'Sta. Cruz and Stampa Course',
    distance: '12.383 km',
    description: 'Passes Sta. Cruz Chapel and completes the scenic Stampa Hills out-and-back loop.',
    file: '/data/routes/sinoog-sta-cruz-stampa.geojson',
    kmlFile: '/data/routes/sinoog-sta-cruz-stampa.kml',
    gpxFile: '/data/routes/sinoog-sta-cruz-stampa.gpx',
    googleMapsUrl:
      'https://www.google.com/maps/dir/?api=1&origin=9.7319968%2C124.4560451&destination=9.7319968%2C124.4560451&waypoints=9.7215079%2C124.4356667%7C9.742056%2C124.439667%7C9.7405904%2C124.4416643%7C9.7472375%2C124.4394844%7C9.7447647%2C124.4565937%7C9.7387455%2C124.4616356&travelmode=walking',
    color: '#741f29',
  },
  {
    id: 'no-stampa',
    shortLabel: 'No Stampa',
    title: 'No-Stampa Course',
    distance: '10.905 km',
    description: 'Passes Sta. Cruz Chapel and continues directly to Cansiwang–Guinacot Junction.',
    file: '/data/routes/sinoog-no-stampa.geojson',
    kmlFile: '/data/routes/sinoog-no-stampa.kml',
    gpxFile: '/data/routes/sinoog-no-stampa.gpx',
    googleMapsUrl:
      'https://www.google.com/maps/dir/?api=1&origin=9.7319968%2C124.4560451&destination=9.7319968%2C124.4560451&waypoints=9.7215079%2C124.4356667%7C9.7472375%2C124.439484375%7C9.7447647%2C124.4565937%7C9.7387455%2C124.4616356&travelmode=walking',
    color: '#0f766e',
  },
  {
    id: 'cabantian-stampa',
    shortLabel: 'Cabantian + Stampa',
    title: 'Cabantian–Cansiwang and Stampa Course',
    distance: '10.342 km',
    description: 'Skips Sta. Cruz, visits Cabantian–Cansiwang Junction, then completes Stampa Hills.',
    file: '/data/routes/sinoog-cabantian-stampa.geojson',
    kmlFile: '/data/routes/sinoog-cabantian-stampa.kml',
    gpxFile: '/data/routes/sinoog-cabantian-stampa.gpx',
    googleMapsUrl:
      'https://www.google.com/maps/dir/?api=1&origin=9.7319968%2C124.4560451&destination=9.7319968%2C124.4560451&waypoints=9.7252875%2C124.450296875%7C9.742056%2C124.439667%7C9.7405904%2C124.4416643%7C9.7472375%2C124.439484375%7C9.7447647%2C124.4565937%7C9.7387455%2C124.4616356&travelmode=walking',
    color: '#6d28d9',
  },
];

export function buildGoogleMapsDirectionsUrl(features: CourseFeature[]): string {
  const points = features
    .filter(
      (f): f is CourseFeature & { geometry: { type: 'Point'; coordinates: Coordinate } } =>
        f.geometry.type === 'Point' && f.properties.feature_type === 'course_point',
    )
    .sort((a, b) => (a.properties.order ?? 0) - (b.properties.order ?? 0));

  if (points.length < 2) return '';
  const origin = points[0].geometry.coordinates;
  const destination = points[points.length - 1].geometry.coordinates;

  const intermediates: string[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const key = p.properties.name.replace(' - Outbound', '').replace(' - Return', '');
    if (seen.has(key)) continue;
    seen.add(key);
    intermediates.push(`${p.geometry.coordinates[1]},${p.geometry.coordinates[0]}`);
  }

  const originParam = `${origin[1]},${origin[0]}`;
  const destParam = `${destination[1]},${destination[0]}`;
  const waypointsParam = intermediates.join('|');

  return (
    'https://www.google.com/maps/dir/?api=1&origin=' +
    encodeURIComponent(originParam) +
    '&destination=' +
    encodeURIComponent(destParam) +
    (waypointsParam ? '&waypoints=' + encodeURIComponent(waypointsParam) : '') +
    '&travelmode=walking'
  );
}
