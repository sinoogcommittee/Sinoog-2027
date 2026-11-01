import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FullscreenControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
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
  Layers,
  MapPin,
  MapPinned,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { FeatureCollection } from 'geojson';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './InteractiveRouteMap.css';
import {
  computeRouteTelemetry,
  OFFICIAL_WAYPOINTS,
  ROUTES,
  type Coordinate,
  type CourseFeature,
  type CourseGeoJson,
  type CourseProperties,
  type RouteOption,
  type SampledPoint,
} from './routeData';

setWorkerUrl(mapLibreWorkerUrl);

const CARTO_API_KEY = 'cb1_4zeq_1_d2f0196e71144ec51690acb5';

// Map Styles: Google Maps Roadmap & Google Satellite by default, with Carto Voyager fallback
const MAP_STYLES: Record<'google-roadmap' | 'google-hybrid' | 'voyager' | 'satellite', StyleSpecification> = {
  'google-roadmap': {
    version: 8,
    sources: {
      'google-roadmap': {
        type: 'raster',
        tiles: [
          'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
        attribution: '© Google Maps',
      },
    },
    layers: [{ id: 'google-roadmap-layer', type: 'raster', source: 'google-roadmap' }],
  },
  'google-hybrid': {
    version: 8,
    sources: {
      'google-hybrid': {
        type: 'raster',
        tiles: [
          'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
        attribution: '© Google Maps Satellite',
      },
    },
    layers: [{ id: 'google-hybrid-layer', type: 'raster', source: 'google-hybrid' }],
  },
  voyager: {
    version: 8,
    sources: {
      'carto-voyager': {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
          `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
          `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
          `https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
        ],
        tileSize: 256,
        attribution: '© CARTO © OpenStreetMap contributors',
      },
    },
    layers: [{ id: 'carto-voyager-layer', type: 'raster', source: 'carto-voyager' }],
  },
  satellite: {
    version: 8,
    sources: {
      'esri-sat': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© Esri — Aerial Imagery',
      },
      'carto-labels': {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
          `https://b.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
          `https://c.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
          `https://d.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,
        ],
        tileSize: 256,
      },
    },
    layers: [
      { id: 'esri-sat-layer', type: 'raster', source: 'esri-sat' },
      { id: 'carto-labels-layer', type: 'raster', source: 'carto-labels' },
    ],
  },
};

function fitCourse(map: MapLibreMap, data: CourseGeoJson) {
  const route = data.features.find((feature) => feature.geometry.type === 'LineString');
  if (!route || route.geometry.type !== 'LineString' || route.geometry.coordinates.length === 0) return;
  const bounds = route.geometry.coordinates.reduce(
    (current, coordinate) => current.extend(coordinate),
    new LngLatBounds(route.geometry.coordinates[0], route.geometry.coordinates[0]),
  );
  map.fitBounds(bounds, { padding: 36, duration: 650, maxZoom: 15.5 });
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
  kicker.textContent = properties.order ? `${roleLabel} · Point ${properties.order}` : roleLabel;
  content.appendChild(kicker);

  const title = document.createElement('strong');
  title.textContent = properties.name;
  content.appendChild(title);

  if (properties.description) {
    const desc = document.createElement('p');
    desc.textContent = properties.description;
    content.appendChild(desc);
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
  const runnerMarkerRef = useRef<Marker | null>(null);
  const simAnimationRef = useRef<number | null>(null);

  const [selectedId, setSelectedId] = useState<string>(ROUTES[1].id); // 5K by default
  const [baseLayer, setBaseLayer] = useState<'google-roadmap' | 'google-hybrid' | 'voyager' | 'satellite'>('google-roadmap');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [courseData, setCourseData] = useState<CourseGeoJson | null>(null);
  const [activeWaypointIndex, setActiveWaypointIndex] = useState(0);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0.0 to 1.0

  const selectedRoute: RouteOption = useMemo(() => {
    return ROUTES.find((route) => route.id === selectedId) ?? ROUTES[0];
  }, [selectedId]);

  // Active curved road coordinates along Bohol Circumferential Road
  const activeCurvedCoords = selectedRoute.curvedCoords;

  // Telemetry computation (sampled profile & elevation gain)
  const telemetry = useMemo(() => {
    return computeRouteTelemetry(activeCurvedCoords);
  }, [activeCurvedCoords]);

  // Current runner telemetry at simProgress
  const currentRunnerSample = useMemo((): SampledPoint => {
    if (!telemetry.sampled || telemetry.sampled.length === 0) {
      return { lng: OFFICIAL_WAYPOINTS.PARISH_ARCH[0], lat: OFFICIAL_WAYPOINTS.PARISH_ARCH[1], distKm: 0, elev: 19 };
    }
    const idx = Math.min(
      telemetry.sampled.length - 1,
      Math.max(0, Math.floor(simProgress * (telemetry.sampled.length - 1))),
    );
    return telemetry.sampled[idx];
  }, [telemetry.sampled, simProgress]);

  const coursePoints = useMemo(() => {
    return (courseData?.features ?? [])
      .filter(
        (feature): feature is CourseFeature & { geometry: { type: 'Point'; coordinates: Coordinate } } =>
          feature.geometry.type === 'Point' && feature.properties.feature_type === 'course_point',
      )
      .sort((a, b) => (a.properties.order ?? 0) - (b.properties.order ?? 0));
  }, [courseData]);

  const activePoint = coursePoints[activeWaypointIndex] ?? coursePoints[0];

  // Category turnaround points: strictly filtered to active category
  const categoryTurnarounds = useMemo(() => {
    if (selectedRoute.id === 'sinoog-3k') {
      return [
        {
          name: 'Start & Finish Arch',
          sub: 'Sto. Niño Parish Grounds, Guinacot',
          coord: OFFICIAL_WAYPOINTS.PARISH_ARCH,
          role: 'start',
        },
        {
          name: '3K Turn: Sta. Cruz Chapel',
          sub: 'Cabantian, Bohol Circumferential Rd',
          coord: OFFICIAL_WAYPOINTS.CABANTIAN_3K_TURN,
          role: 'turnaround',
        },
      ];
    }
    if (selectedRoute.id === 'sinoog-5k') {
      return [
        {
          name: 'Start & Finish Arch',
          sub: 'Sto. Niño Parish Grounds, Guinacot',
          coord: OFFICIAL_WAYPOINTS.PARISH_ARCH,
          role: 'start',
        },
        {
          name: '5K Turn: Pangpang Chapel',
          sub: 'Sta. Cruz - Cabantian / Pangpang',
          coord: OFFICIAL_WAYPOINTS.PANGPANG_5K_TURN,
          role: 'turnaround',
        },
      ];
    }
    // 10K
    return [
      {
        name: 'Start & Finish Arch',
        sub: 'Sto. Niño Parish Grounds, Guinacot',
        coord: OFFICIAL_WAYPOINTS.PARISH_ARCH,
        role: 'start',
      },
      {
        name: 'Turn 1: Pangpang Chapel',
        sub: 'Sta. Cruz - Cabantian / Pangpang',
        coord: OFFICIAL_WAYPOINTS.PANGPANG_5K_TURN,
        role: 'turnaround',
      },
      {
        name: 'Turn 2: East Guinacot Chapel',
        sub: 'Sta. Cruz - East Guinacot Highway',
        coord: OFFICIAL_WAYPOINTS.EAST_GUINACOT_10K_TURN,
        role: 'turnaround',
      },
    ];
  }, [selectedRoute.id]);

  const showPointPopup = useCallback((map: MapLibreMap, feature: CourseFeature | MapGeoJSONFeature, coords: Coordinate) => {
    if (activePopupRef.current) {
      activePopupRef.current.remove();
    }
    const popup = new Popup({
      offset: 18,
      closeButton: true,
      closeOnClick: false,
      focusAfterOpen: false,
    })
      .setLngLat(coords)
      .setDOMContent(makePopup(feature))
      .addTo(map);

    activePopupRef.current = popup;
  }, []);

  const handleSelectWaypointByIndex = useCallback((index: number) => {
    if (!mapRef.current || !coursePoints[index]) return;
    const targetPoint = coursePoints[index];
    if (targetPoint.geometry.type !== 'Point') return;
    setActiveWaypointIndex(index);
    const coords = targetPoint.geometry.coordinates as Coordinate;
    mapRef.current.flyTo({ center: coords, zoom: 16.0, duration: 600 });
    showPointPopup(mapRef.current, targetPoint, coords);
  }, [coursePoints, showPointPopup]);

  const flyToCoord = useCallback((coord: Coordinate, title: string) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: coord, zoom: 16.5, duration: 700 });
    const dummyFeature: CourseFeature = {
      type: 'Feature',
      properties: {
        name: title,
        feature_type: 'course_point',
      },
      geometry: { type: 'Point', coordinates: coord },
    };
    showPointPopup(mapRef.current, dummyFeature, coord);
  }, [showPointPopup]);

  const handlePrevPoint = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (coursePoints.length === 0) return;
    const prev = activeWaypointIndex > 0 ? activeWaypointIndex - 1 : coursePoints.length - 1;
    handleSelectWaypointByIndex(prev);
  }, [activeWaypointIndex, coursePoints.length, handleSelectWaypointByIndex]);

  const handleNextPoint = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (coursePoints.length === 0) return;
    const next = activeWaypointIndex < coursePoints.length - 1 ? activeWaypointIndex + 1 : 0;
    handleSelectWaypointByIndex(next);
  }, [activeWaypointIndex, coursePoints.length, handleSelectWaypointByIndex]);

  // Initialize MapLibre
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLES['google-roadmap'],
      center: [124.4535, 9.733],
      zoom: 14.5,
      cooperativeGestures: true,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: true }), 'top-left');
    map.addControl(new FullscreenControl(), 'top-left');

    // Runner animated Marker
    const runnerEl = document.createElement('div');
    runnerEl.className = 'interactive-route__runner-pin';
    runnerEl.innerHTML = `
      <div class="interactive-route__runner-pulse"></div>
      <div class="interactive-route__runner-badge">🏃</div>
    `;
    const runnerMarker = new Marker({ element: runnerEl, anchor: 'center' })
      .setLngLat(OFFICIAL_WAYPOINTS.PARISH_ARCH)
      .addTo(map);

    runnerMarkerRef.current = runnerMarker;
    mapRef.current = map;

    return () => {
      runnerMarker.remove();
      runnerMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Update Base Layer
  const handleLayerSwitch = (layer: 'google-roadmap' | 'google-hybrid' | 'voyager' | 'satellite') => {
    setBaseLayer(layer);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[layer]);
  };

  // Build & Render Course GeoJSON on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    setStatus('loading');
    activePopupRef.current?.remove();
    activePopupRef.current = null;
    setActiveWaypointIndex(0);
    setSimProgress(0);
    setIsSimulating(false);

    const loadData = async () => {
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

            // Route casing (outer shadow)
            map.addLayer({
              id: 'course-line-casing',
              type: 'line',
              source: 'course',
              filter: ['==', ['get', 'feature_type'], 'route'],
              paint: {
                'line-color': '#0f172a',
                'line-width': 8,
                'line-opacity': 0.5,
              },
              layout: { 'line-cap': 'round', 'line-join': 'round' },
            });

            // Route solid line curving along Bohol Circumferential Road
            map.addLayer({
              id: 'course-line',
              type: 'line',
              source: 'course',
              filter: ['==', ['get', 'feature_type'], 'route'],
              paint: { 'line-color': selectedRoute.color, 'line-width': 5 },
              layout: { 'line-cap': 'round', 'line-join': 'round' },
            });

            // Waypoint circles
            map.addLayer({
              id: 'course-points-circle',
              type: 'circle',
              source: 'course',
              filter: ['==', ['get', 'feature_type'], 'course_point'],
              paint: {
                'circle-radius': 11,
                'circle-color': [
                  'match',
                  ['get', 'role'],
                  'start',
                  '#10b981',
                  'finish',
                  '#8a2430',
                  'turnaround',
                  '#f59e0b',
                  'junction',
                  '#3b82f6',
                  '#64748b',
                ],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2.5,
              },
            });

            // Waypoint numbers
            map.addLayer({
              id: 'course-points-label',
              type: 'symbol',
              source: 'course',
              filter: ['==', ['get', 'feature_type'], 'course_point'],
              layout: {
                'text-field': ['to-string', ['get', 'order']],
                'text-size': 11,
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-allow-overlap': true,
                'text-ignore-placement': true,
              },
              paint: {
                'text-color': '#ffffff',
              },
            });

            // Interactive clicks on points
            map.on('click', 'course-points-circle', (e) => {
              const feature = e.features?.[0];
              if (!feature || feature.geometry.type !== 'Point') return;
              const coords = feature.geometry.coordinates as Coordinate;
              const order = feature.properties?.order as number | undefined;
              if (order) {
                const targetIdx = (data.features ?? [])
                  .filter((f) => f.geometry.type === 'Point' && f.properties.feature_type === 'course_point')
                  .sort((a, b) => (a.properties.order ?? 0) - (b.properties.order ?? 0))
                  .findIndex((f) => f.properties.order === order);
                if (targetIdx >= 0) setActiveWaypointIndex(targetIdx);
              }
              showPointPopup(map, feature, coords);
            });

            map.on('mouseenter', 'course-points-circle', () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'course-points-circle', () => {
              map.getCanvas().style.cursor = '';
            });
          }

          fitCourse(map, data);
          setStatus('ready');
        };

        if (map.isStyleLoaded()) {
          applyData();
        } else {
          map.once('load', applyData);
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [selectedRoute, showPointPopup]);

  // Update runner pin position when simProgress changes
  useEffect(() => {
    if (!runnerMarkerRef.current || !telemetry.sampled || telemetry.sampled.length === 0) return;
    const pt = currentRunnerSample;
    runnerMarkerRef.current.setLngLat([pt.lng, pt.lat]);
  }, [currentRunnerSample, telemetry.sampled]);

  // Smooth simulation animation loop
  useEffect(() => {
    if (!isSimulating) {
      if (simAnimationRef.current) {
        cancelAnimationFrame(simAnimationRef.current);
        simAnimationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    // 35-second full course sweep
    const totalDurationMs = 35000;

    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      setSimProgress((prev) => {
        const next = prev + dt / totalDurationMs;
        if (next >= 1.0) {
          setIsSimulating(false);
          return 1.0;
        }
        return next;
      });

      simAnimationRef.current = requestAnimationFrame(tick);
    };

    simAnimationRef.current = requestAnimationFrame(tick);

    return () => {
      if (simAnimationRef.current) {
        cancelAnimationFrame(simAnimationRef.current);
        simAnimationRef.current = null;
      }
    };
  }, [isSimulating]);

  // SVG Elevation Profile calculations
  const elevationSvgData = useMemo(() => {
    const { sampled, totalKm, minElev, maxElev } = telemetry;
    if (!sampled || sampled.length < 2) return null;

    const width = 600;
    const height = 65;
    const elevRange = Math.max(8, maxElev - minElev);

    const pts = sampled.map((p) => {
      const x = (p.distKm / (totalKm || 1)) * width;
      const y = height - ((p.elev - minElev) / elevRange) * (height - 16) - 6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const areaPath = `M 0,${height} L ${pts.join(' L ')} L ${width},${height} Z`;
    const linePath = `M ${pts.join(' L ')}`;

    // Scrubber position
    const currentDist = currentRunnerSample.distKm;
    const scrubberX = Math.max(0, Math.min(width, (currentDist / (totalKm || 1)) * width));
    const scrubberY =
      height - ((currentRunnerSample.elev - minElev) / elevRange) * (height - 16) - 6;

    return { width, height, areaPath, linePath, scrubberX, scrubberY, minElev, maxElev };
  }, [telemetry, currentRunnerSample]);

  const handleElevationScrub = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setSimProgress(relX);
  };

  const handleToggleSimulation = () => {
    setIsSimulating((prev) => !prev);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimProgress(0);
    if (mapRef.current && courseData) {
      fitCourse(mapRef.current, courseData);
    }
  };

  return (
    <section className="interactive-route" aria-labelledby="interactive-route-title">
      {/* 1. Ultra-Compact Header */}
      <div className="interactive-route__header">
        <div className="interactive-route__header-title-group">
          <span className="interactive-route__eyebrow">
            <MapPinned size={14} /> Interactive Course Guide · Bohol Circumferential Rd
          </span>
          <h3 id="interactive-route-title">{selectedRoute.title}</h3>
        </div>

        <div className="interactive-route__header-actions">
          <a
            href={selectedRoute.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="interactive-route__gmaps-compact-btn"
            title="Open course in Google Maps"
          >
            <span>Google Maps</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* 2. Compact Category Switcher Tabs */}
      <div className="interactive-route__switcher" role="group" aria-label="Choose a course category">
        {ROUTES.map((route) => {
          const isActive = route.id === selectedRoute.id;
          return (
            <button
              key={route.id}
              type="button"
              className={isActive ? 'is-active' : ''}
              aria-pressed={isActive}
              onClick={(e) => {
                e.preventDefault();
                if (route.id !== selectedId) {
                  setSelectedId(route.id);
                  setActiveWaypointIndex(0);
                  setIsSimulating(false);
                  setSimProgress(0);
                }
              }}
            >
              <span className="interactive-route__switcher-badge" style={{ backgroundColor: route.color }}>
                {route.badge}
              </span>
              <span className="interactive-route__switcher-label">{route.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace: Map Column + Sidebar */}
      <div className="interactive-route__workspace">
        {/* Left / Center: Map & Simulation Controls Directly Below */}
        <div className="interactive-route__map-column">
          <div className="interactive-route__map-wrap" aria-busy={status === 'loading'}>
            {/* Floating Layer Switcher */}
            <div className="interactive-route__layer-control" role="group" aria-label="Map base style">
              <span className="interactive-route__layer-label">
                <Layers size={12} />
              </span>
              <button
                type="button"
                className={baseLayer === 'google-roadmap' ? 'is-active' : ''}
                onClick={() => handleLayerSwitch('google-roadmap')}
                title="Google Maps Roadmap"
              >
                Google Maps
              </button>
              <button
                type="button"
                className={baseLayer === 'google-hybrid' ? 'is-active' : ''}
                onClick={() => handleLayerSwitch('google-hybrid')}
                title="Google Maps Satellite"
              >
                Google Satellite
              </button>
              <button
                type="button"
                className={baseLayer === 'voyager' ? 'is-active' : ''}
                onClick={() => handleLayerSwitch('voyager')}
                title="Carto Voyager"
              >
                Voyager
              </button>
            </div>

            <div
              ref={containerRef}
              className="interactive-route__map"
              aria-label={`Map of ${selectedRoute.title}`}
            />

            {status === 'loading' && <div className="interactive-route__status">Loading official highway map…</div>}
            {status === 'error' && (
              <div className="interactive-route__status interactive-route__status--error" role="alert">
                <AlertCircle size={22} />
                <strong>Map unavailable</strong>
                <span>Please check your connection and try again.</span>
              </div>
            )}
          </div>

          {/* SIMULATE RUN DIRECTLY BELOW THE MAP */}
          <div className="interactive-route__sim-bar">
            <div className="interactive-route__sim-controls">
              <button
                type="button"
                onClick={handleToggleSimulation}
                className={`interactive-route__sim-play-btn ${isSimulating ? 'is-playing' : ''}`}
                aria-label={isSimulating ? 'Pause simulation' : 'Simulate run'}
              >
                {isSimulating ? <Pause size={14} /> : <Play size={14} />}
                <span>{isSimulating ? 'Pause' : 'Simulate Run'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetSimulation}
                className="interactive-route__sim-reset-btn"
                title="Reset runner to start"
                aria-label="Reset runner to start"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            <div className="interactive-route__sim-metrics">
              <span className="interactive-route__sim-badge">
                Progress: <strong>{Math.round(simProgress * 100)}%</strong>
              </span>
              <span className="interactive-route__sim-badge">
                Elev: <strong>{currentRunnerSample.elev}m ASL</strong>
              </span>
              <span className="interactive-route__sim-badge desktop-only">
                Gun: <strong>{selectedRoute.gunTime}</strong>
              </span>
            </div>

            {/* Mobile Checkpoint Single-Pill Navigation below simulation */}
            {activePoint && (
              <div className="interactive-route__mobile-nav-pill">
                <button
                  type="button"
                  className="interactive-route__nav-pill-arrow interactive-route__nav-pill-arrow--prev"
                  onClick={handlePrevPoint}
                  aria-label="Previous point"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="interactive-route__nav-pill-content"
                  onClick={() => handleSelectWaypointByIndex(activeWaypointIndex)}
                  title="Focus on map"
                >
                  <span className={`route-key route-key--${activePoint.properties.role ?? 'checkpoint'}`}>
                    {activePoint.properties.order}
                  </span>
                  <div className="interactive-route__nav-pill-text">
                    <span className="interactive-route__nav-pill-name">{activePoint.properties.name}</span>
                    <span className="interactive-route__nav-pill-counter">
                      Point {activeWaypointIndex + 1} of {coursePoints.length}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="interactive-route__nav-pill-arrow interactive-route__nav-pill-arrow--next"
                  onClick={handleNextPoint}
                  aria-label="Next point"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Compact Elevation Profile Scrubber */}
          {elevationSvgData && (
            <div className="interactive-route__chart-wrap">
              <svg
                viewBox={`0 0 ${elevationSvgData.width} ${elevationSvgData.height}`}
                className="interactive-route__elevation-svg"
                onMouseMove={handleElevationScrub}
                onTouchMove={handleElevationScrub}
                onClick={handleElevationScrub}
              >
                <defs>
                  <linearGradient id={`elev-grad-${selectedRoute.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={selectedRoute.color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={selectedRoute.color} stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                <path d={elevationSvgData.areaPath} fill={`url(#elev-grad-${selectedRoute.id})`} />
                <path d={elevationSvgData.linePath} fill="none" stroke={selectedRoute.color} strokeWidth="2" strokeLinecap="round" />
                <line
                  x1={elevationSvgData.scrubberX}
                  y1="0"
                  x2={elevationSvgData.scrubberX}
                  y2={elevationSvgData.height}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
                <circle cx={elevationSvgData.scrubberX} cy={elevationSvgData.scrubberY} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>

        {/* Right Column: Category Turnarounds & Checkpoints */}
        <div className="interactive-route__sidebar" aria-label="Course landmarks & sequence">
          {/* Turnarounds Card: ONLY for the selected category */}
          <div className="interactive-route__pluscodes-card">
            <div className="interactive-route__pluscodes-header">
              <span>
                <MapPin size={13} /> {selectedRoute.badge} Key Turnaround{categoryTurnarounds.length > 2 ? 's' : ''}
              </span>
            </div>
            <div className="interactive-route__pluscodes-list">
              {categoryTurnarounds.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  className="interactive-route__pluscode-item"
                  onClick={() => flyToCoord(t.coord, t.name)}
                >
                  <div>
                    <div className="interactive-route__pluscode-name">
                      <span className={`route-key route-key--${t.role}`} /> {t.name}
                    </div>
                    <small>{t.sub}</small>
                  </div>
                  <ChevronRight size={14} className="interactive-route__item-chevron" />
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Checkpoints List */}
          <div className="interactive-route__sidebar-header desktop-only">
            <h4>Checkpoints &amp; Landmarks</h4>
            <span>{coursePoints.length} points</span>
          </div>

          <div className="interactive-route__sidebar-list desktop-only">
            {coursePoints.map((point, index) => {
              const role = point.properties.role ?? 'checkpoint';
              const order = point.properties.order;
              const isSelected = activeWaypointIndex === index;
              const roleLabel =
                role === 'start'
                  ? 'Race Start'
                  : role === 'finish'
                    ? 'Race Finish'
                    : role === 'turnaround'
                      ? 'U-Turn Point'
                      : role === 'junction'
                        ? 'Key Turn / Junction'
                        : 'Checkpoint';

              return (
                <button
                  key={`${point.properties.order}-${point.properties.name}`}
                  type="button"
                  className={`interactive-route__point-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectWaypointByIndex(index);
                  }}
                  aria-pressed={isSelected}
                  title={`View ${point.properties.name} on map`}
                >
                  <span className={`route-key route-key--${role}`}>{order}</span>
                  <div className="interactive-route__point-info">
                    <strong>{point.properties.name}</strong>
                    <small>{roleLabel}</small>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar Legend Footer */}
          <div className="interactive-route__sidebar-footer">
            <ul className="interactive-route__legend" aria-label="Map legend">
              <li>
                <span className="route-key route-key--start" /> Start
              </li>
              <li>
                <span className="route-key route-key--finish" /> Finish
              </li>
              <li>
                <span className="route-key route-key--turnaround" /> U-Turn
              </li>
              <li>
                <span className="route-key route-key--checkpoint" /> Point
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
