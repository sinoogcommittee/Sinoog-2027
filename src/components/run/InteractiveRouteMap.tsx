import { useEffect, useRef, useState } from 'react';
import {
  FullscreenControl,
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type StyleSpecification,
} from 'maplibre-gl';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPinned,
  Route,
} from 'lucide-react';
import type { FeatureCollection } from 'geojson';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './InteractiveRouteMap.css';
import {
  ROUTES,
  type Coordinate,
  type CourseFeature,
  type CourseGeoJson,
  type CourseProperties,
} from './routeData';

setWorkerUrl(mapLibreWorkerUrl);

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

function fitCourse(map: MapLibreMap, data: CourseGeoJson) {
  const route = data.features.find((feature) => feature.geometry.type === 'LineString');
  if (!route || route.geometry.type !== 'LineString' || route.geometry.coordinates.length === 0) return;
  const bounds = route.geometry.coordinates.reduce(
    (current, coordinate) => current.extend(coordinate),
    new LngLatBounds(route.geometry.coordinates[0], route.geometry.coordinates[0]),
  );
  map.fitBounds(bounds, { padding: 54, duration: 700, maxZoom: 15.5 });
}

function makePopup(feature: MapGeoJSONFeature | CourseFeature) {
  const properties = feature.properties as CourseProperties;
  const content = document.createElement('div');
  content.className = 'run-map-popup';

  const kicker = document.createElement('span');
  const roleLabel =
    properties.role === 'start'
      ? 'Start Line'
      : properties.role === 'finish'
        ? 'Finish Line'
        : properties.role === 'turnaround'
          ? 'Turnaround Point'
          : properties.role === 'junction'
            ? 'Key Junction'
            : 'Course Checkpoint';
  kicker.textContent = `${roleLabel} · Point ${properties.order ?? ''}`;
  content.appendChild(kicker);

  const title = document.createElement('strong');
  title.textContent = properties.name;
  content.appendChild(title);

  if (properties.plus_code) {
    const code = document.createElement('small');
    code.textContent = properties.plus_code;
    content.appendChild(code);
  }

  if ('geometry' in feature && feature.geometry && 'coordinates' in feature.geometry) {
    const coords = feature.geometry.coordinates as [number, number];
    const navLink = document.createElement('a');
    navLink.href = `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}&travelmode=walking`;
    navLink.target = '_blank';
    navLink.rel = 'noopener noreferrer';
    navLink.className = 'run-map-popup__gmaps-btn';
    navLink.textContent = 'Navigate here in Google Maps →';
    content.appendChild(navLink);
  }

  return content;
}

export function InteractiveRouteMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const activePopupRef = useRef<Popup | null>(null);
  const [selectedId, setSelectedId] = useState(ROUTES[0].id);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [courseData, setCourseData] = useState<CourseGeoJson | null>(null);
  const [selectedPointOrder, setSelectedPointOrder] = useState<number | null>(null);
  const selectedRoute = ROUTES.find((route) => route.id === selectedId) ?? ROUTES[0];

  const showPointPopup = (map: MapLibreMap, feature: CourseFeature | MapGeoJSONFeature, coords: Coordinate) => {
    activePopupRef.current?.remove();
    const popup = new Popup({ offset: 18, closeButton: true, closeOnClick: false })
      .setLngLat(coords)
      .setDOMContent(makePopup(feature))
      .addTo(map);
    popup.on('close', () => {
      setSelectedPointOrder(null);
    });
    activePopupRef.current = popup;
  };

  const handleSelectPoint = (point: CourseFeature) => {
    if (!mapRef.current || point.geometry.type !== 'Point') return;
    const coords = point.geometry.coordinates as Coordinate;
    setSelectedPointOrder(point.properties.order ?? null);
    mapRef.current.flyTo({ center: coords, zoom: 15.5, duration: 600 });
    showPointPopup(mapRef.current, point, coords);
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [124.449, 9.735],
      zoom: 13,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new FullscreenControl(), 'top-right');
    mapRef.current = map;
    return () => {
      activePopupRef.current?.remove();
      activePopupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    setStatus('loading');
    activePopupRef.current?.remove();
    activePopupRef.current = null;
    setSelectedPointOrder(null);

    const showRoute = async () => {
      try {
        const response = await fetch(selectedRoute.file);
        if (!response.ok) throw new Error(`Route request failed with ${response.status}`);
        const data = (await response.json()) as CourseGeoJson;
        if (cancelled) return;

        setCourseData(data);

        const applyData = () => {
          const source = map.getSource('course') as GeoJSONSource | undefined;
          if (source) {
            source.setData(data as unknown as FeatureCollection);
            map.setPaintProperty('course-line', 'line-color', selectedRoute.color);
          } else {
            map.addSource('course', { type: 'geojson', data: data as unknown as FeatureCollection });
            map.addLayer({
              id: 'course-line-casing',
              type: 'line',
              source: 'course',
              filter: ['==', ['get', 'feature_type'], 'route'],
              paint: { 'line-color': '#fffdf8', 'line-width': 9, 'line-opacity': 0.9 },
              layout: { 'line-cap': 'round', 'line-join': 'round' },
            });
            map.addLayer({
              id: 'course-line',
              type: 'line',
              source: 'course',
              filter: ['==', ['get', 'feature_type'], 'route'],
              paint: { 'line-color': selectedRoute.color, 'line-width': 5 },
              layout: { 'line-cap': 'round', 'line-join': 'round' },
            });
            map.addLayer({
              id: 'course-points-circle',
              type: 'circle',
              source: 'course',
              filter: ['==', ['get', 'feature_type'], 'course_point'],
              paint: {
                'circle-radius': 12,
                'circle-color': [
                  'match',
                  ['get', 'role'],
                  'start',
                  '#2e7d32',
                  'finish',
                  '#741f29',
                  'turnaround',
                  '#d69d2e',
                  'junction',
                  '#6d28d9',
                  '#2563a8',
                ],
                'circle-stroke-color': '#fffdf8',
                'circle-stroke-width': 3,
              },
            });
            map.addLayer({
              id: 'course-points-label',
              type: 'symbol',
              source: 'course',
              filter: ['==', ['get', 'feature_type'], 'course_point'],
              layout: {
                'text-field': ['to-string', ['get', 'order']],
                'text-size': 11,
                'text-allow-overlap': true,
                'text-ignore-placement': true,
              },
              paint: { 'text-color': '#ffffff' },
            });
            map.on('mouseenter', 'course-points-circle', () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'course-points-circle', () => {
              map.getCanvas().style.cursor = '';
            });
            map.on('click', 'course-points-circle', (event) => {
              const feature = event.features?.[0];
              if (!feature || feature.geometry.type !== 'Point') return;
              const props = feature.properties as CourseProperties;
              setSelectedPointOrder(props.order ?? null);
              showPointPopup(map, feature, feature.geometry.coordinates as Coordinate);
            });
          }
          fitCourse(map, data);
          setStatus('ready');
        };
        if (map.loaded()) applyData();
        else map.once('load', applyData);
      } catch (error) {
        console.warn('Failed to load Sinoog route map:', error);
        if (!cancelled) setStatus('error');
      }
    };
    void showRoute();
    return () => {
      cancelled = true;
    };
  }, [selectedRoute]);

  const coursePoints = (courseData?.features ?? [])
    .filter(
      (feature): feature is CourseFeature & { geometry: { type: 'Point'; coordinates: Coordinate } } =>
        feature.geometry.type === 'Point' && feature.properties.feature_type === 'course_point',
    )
    .sort((a, b) => (a.properties.order ?? 0) - (b.properties.order ?? 0));

  const activePointIndex = Math.max(
    0,
    coursePoints.findIndex((p) => p.properties.order === selectedPointOrder),
  );
  const activeMobilePoint = coursePoints[activePointIndex] ?? coursePoints[0];

  return (
    <section className="interactive-route" aria-labelledby="interactive-route-title">
      <div className="interactive-route__header">
        <div>
          <span className="interactive-route__eyebrow">
            <MapPinned size={16} /> Interactive course guide
          </span>
          <h3 id="interactive-route-title">{selectedRoute.title}</h3>
          <p>{selectedRoute.description}</p>
        </div>
        <div className="interactive-route__header-actions">
          <div className="interactive-route__compact-row">
            <strong className="interactive-route__distance">
              <Route size={16} /> {selectedRoute.distance}
            </strong>
            <a
              href={selectedRoute.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="interactive-route__gmaps-compact-btn"
              title="Open route in Google Maps"
            >
              <span>Google Maps</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
      <div className="interactive-route__switcher" role="group" aria-label="Choose a course route">
        {ROUTES.map((route) => (
          <button
            key={route.id}
            type="button"
            className={route.id === selectedRoute.id ? 'is-active' : ''}
            aria-pressed={route.id === selectedRoute.id}
            onClick={() => setSelectedId(route.id)}
          >
            <span>{route.shortLabel}</span>
            <small>{route.distance}</small>
          </button>
        ))}
      </div>
      <div className="interactive-route__map-wrap" aria-busy={status === 'loading'}>
        <div ref={containerRef} className="interactive-route__map" aria-label={`Map of ${selectedRoute.title}`} />
        {status === 'loading' && <div className="interactive-route__status">Loading course map…</div>}
        {status === 'error' && (
          <div className="interactive-route__status interactive-route__status--error" role="alert">
            <AlertCircle size={22} />
            <strong>Map unavailable</strong>
            <span>Please check your connection and try again.</span>
          </div>
        )}
      </div>

      {coursePoints.length > 0 && (
        <div className="interactive-route__points-section" aria-label="Course checkpoints sequence">
          <div className="interactive-route__points-header">
            <h4>Checkpoints & Course Landmarks</h4>
            <span>{coursePoints.length} verified waypoints</span>
          </div>
          <div className="interactive-route__points-grid">
            {coursePoints.map((point) => {
              const role = point.properties.role ?? 'checkpoint';
              const order = point.properties.order;
              const isSelected = selectedPointOrder === order;
              return (
                <button
                  key={`${point.properties.order}-${point.properties.name}`}
                  type="button"
                  className={`interactive-route__point-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectPoint(point)}
                  aria-pressed={isSelected}
                  title={`View ${point.properties.name} on map`}
                >
                  <span className={`route-key route-key--${role}`}>{order}</span>
                  <div className="interactive-route__point-info">
                    <strong>{point.properties.name}</strong>
                    <small>
                      {role === 'start'
                        ? 'Race Start'
                        : role === 'finish'
                          ? 'Race Finish'
                          : role === 'turnaround'
                            ? 'U-Turn Point'
                            : role === 'junction'
                              ? 'Intersection / Turn'
                              : 'Checkpoint'}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile Checkpoint Single Button with Inner Left & Right Arrows */}
          <div className="interactive-route__points-mobile" aria-label="Mobile course checkpoints navigation">
            <div className="interactive-route__nav-pill">
              <button
                type="button"
                className="interactive-route__nav-pill-arrow interactive-route__nav-pill-arrow--prev"
                onClick={() => {
                  const prev = activePointIndex > 0 ? activePointIndex - 1 : coursePoints.length - 1;
                  handleSelectPoint(coursePoints[prev]);
                }}
                aria-label="Previous checkpoint"
                title="Previous checkpoint"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className="interactive-route__nav-pill-content"
                onClick={() => handleSelectPoint(activeMobilePoint)}
                title="Tap to focus on map"
              >
                <span className={`route-key route-key--${activeMobilePoint.properties.role ?? 'checkpoint'}`}>
                  {activeMobilePoint.properties.order}
                </span>
                <div className="interactive-route__nav-pill-text">
                  <div className="interactive-route__nav-pill-top">
                    <strong>{activeMobilePoint.properties.name}</strong>
                    <span className="interactive-route__nav-pill-counter">
                      {activePointIndex + 1}/{coursePoints.length}
                    </span>
                  </div>
                  <small>
                    {activeMobilePoint.properties.role === 'start'
                      ? 'Race Start'
                      : activeMobilePoint.properties.role === 'finish'
                        ? 'Race Finish'
                        : activeMobilePoint.properties.role === 'turnaround'
                          ? 'U-Turn Point'
                          : activeMobilePoint.properties.role === 'junction'
                            ? 'Intersection / Turn'
                            : 'Checkpoint'}
                  </small>
                </div>
              </button>

              <button
                type="button"
                className="interactive-route__nav-pill-arrow interactive-route__nav-pill-arrow--next"
                onClick={() => {
                  const next = activePointIndex < coursePoints.length - 1 ? activePointIndex + 1 : 0;
                  handleSelectPoint(coursePoints[next]);
                }}
                aria-label="Next checkpoint"
                title="Next checkpoint"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="interactive-route__footer">
        <ul className="interactive-route__legend" aria-label="Map legend">
          <li>
            <span className="route-key route-key--start" /> Start
          </li>
          <li>
            <span className="route-key route-key--finish" /> Finish
          </li>
          <li>
            <span className="route-key route-key--junction" /> Junction
          </li>
          <li>
            <span className="route-key route-key--turnaround" /> Turnaround
          </li>
          <li>
            <span className="route-key route-key--checkpoint" /> Checkpoint
          </li>
        </ul>
        <div className="interactive-route__footer-note">
          <p>Tap a numbered point or click the waypoint buttons above to inspect details and zoom in.</p>
        </div>
      </div>
    </section>
  );
}
