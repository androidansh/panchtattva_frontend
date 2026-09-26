import { Fragment, useEffect, useMemo, useState } from "react";
import {
  CircleF,
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";

const views = {
  india: { center: { lat: 22.5, lng: 79 }, zoom: 5 },
  bihar: { center: { lat: 24.95, lng: 85.8 }, zoom: 8 },
  patna: { center: { lat: 24.95, lng: 85.8 }, zoom: 8 },
};

const mapContainerStyle = { width: "100%", height: "100%" };
const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

function GoogleMapsMap({
  level,
  cinematic,
  baseMap,
  selectedArea,
  onSelectArea,
  onLevelChange,
  priorityZones,
  mapOnly,
}) {
  const [map, setMap] = useState(null);
  const [scriptTimedOut, setScriptTimedOut] = useState(false);
  const [zoom, setZoom] = useState(5);
  const [resolution, setResolution] = useState(0);
  const currentView = useMemo(() => {
    if (level === "patna" && priorityZones.length > 0) {
      const center = priorityZones.reduce(
        (total, zone) => ({
          lat: total.lat + zone.center[0] / priorityZones.length,
          lng: total.lng + zone.center[1] / priorityZones.length,
        }),
        { lat: 0, lng: 0 }
      );
      return { center, zoom: priorityZones.length === 1 ? 12 : 10 };
    }
    return views[level];
  }, [level, priorityZones]);
  const { isLoaded, loadError } = useJsApiLoader({
    id: "panch-tattva-google-maps-script",
    googleMapsApiKey: googleKey,
  });

  useEffect(() => {
    if (!googleKey) return undefined;
    if (isLoaded || loadError) {
      return undefined;
    }
    const timer = window.setTimeout(() => setScriptTimedOut(true), 12000);
    return () => window.clearTimeout(timer);
  }, [isLoaded, loadError]);

  useEffect(() => {
    if (!map) return undefined;
    const update = () => {
      const currentZoom = map.getZoom() || 0;
      const center = map.getCenter();
      const latitude = center?.lat() ?? 25;
      setZoom(currentZoom);
      setResolution((156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** currentZoom);
    };
    update();
    const listener = map.addListener("bounds_changed", update);
    return () => listener.remove();
  }, [map]);

  useEffect(() => {
    if (!map) return;
    map.panTo(currentView.center);
    map.setZoom(currentView.zoom);
  }, [map, currentView.center, currentView.zoom, cinematic]);

  const mapTypeId = baseMap === "street" ? "roadmap" : baseMap;
  const mapOptions = useMemo(() => ({
    mapTypeId,
    minZoom: 4,
    maxZoom: 24,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    clickableIcons: false,
    gestureHandling: "greedy",
  }), [mapTypeId]);

  function selectFeature(feature, zoomTo) {
    if (feature.area) {
      onSelectArea(feature.area);
      map?.panTo(feature.position);
      map?.setZoom(zoomTo);
    }
    if (feature.nextLevel) onLevelChange(feature.nextLevel);
  }

  function changeZoom(value) {
    map?.setZoom(Number(value));
  }

  if (!googleKey) {
    return (
      <div className="google-map-missing-key">
        <b>Google Maps API key required</b>
        <span>Create `frontend2/.env.local` and add `VITE_GOOGLE_MAPS_API_KEY=your_key`.</span>
      </div>
    );
  }

  if (loadError || (scriptTimedOut && !isLoaded)) {
    return (
      <div className="google-map-missing-key">
        <b>Google Maps could not load</b>
        <span>{loadError?.message || "The Google Maps script timed out. Check the API key, billing, Maps JavaScript API, and allowed website referrers."}</span>
        <button type="button" onClick={() => window.location.reload()}>Retry map</button>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="google-map-loading">Loading Google Maps...</div>;
  }

  return (
    <div className="main-map google-map-wrapper">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentView.center}
          zoom={currentView.zoom}
          options={mapOptions}
          onLoad={setMap}
        >
          {level === "india" && (
            <CircleF
              center={{ lat: 25.9, lng: 85.3 }} radius={85000}
              options={{ strokeColor: "#67b7c8", strokeWeight: 3, strokeOpacity: 1, fillColor: "#67b7c8", fillOpacity: 0.16 }}
              onClick={() => selectFeature({ nextLevel: "bihar", position: { lat: 25.9, lng: 85.3 }, title: "Bihar", description: "Click to enter Bihar watershed analysis." }, 7)}
            />
          )}

          {(level === "bihar" || level === "patna") && (
            <>
              {priorityZones.map((zone) => {
                const selected = selectedArea === zone.key;
                const position = { lat: zone.center[0], lng: zone.center[1] };
                const feature = { area: zone.key, position, title: `${zone.label} Priority Watershed`, description: "Exact watershed location." };
                return (
                  <Fragment key={zone.key}>
                    <CircleF
                      center={position}
                      radius={zone.radius}
                      options={{ strokeColor: selected ? "#ffffff" : zone.color, strokeWeight: selected ? 2 : 3, fillColor: zone.color, fillOpacity: selected ? 0 : 0.3 }}
                      onClick={() => selectFeature(feature, 14)}
                    />
                    <MarkerF
                      position={position}
                      title={`${zone.label} Priority Watershed`}
                      onClick={() => selectFeature(feature, 14)}
                    />
                  </Fragment>
                );
              })}
            </>
          )}

        </GoogleMap>
        <div className="custom-map-controls">
          <button onClick={() => changeZoom((map?.getZoom() || 0) + 1)} aria-label="Zoom in">+</button>
          <button onClick={() => changeZoom((map?.getZoom() || 0) - 1)} aria-label="Zoom out">−</button>
        </div>
        {mapOnly && level === "patna" && (
          <div className="resolution-control">
            <div className="resolution-readout"><b>Map Resolution</b><span>Zoom {zoom.toFixed(0)} · {resolution < 1 ? `${Math.round(resolution * 100)} cm/px` : `${resolution.toFixed(1)} m/px`}</span></div>
            <span className="resolution-symbol">−</span>
            <input type="range" min="8" max="24" step="1" value={Math.round(zoom)} onChange={(event) => changeZoom(event.target.value)} aria-label="Map resolution" />
            <span className="resolution-symbol">+</span>
          </div>
        )}
    </div>
  );
}

export default GoogleMapsMap;
