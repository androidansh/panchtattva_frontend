import { useEffect, useRef, useState } from "react";
import Map from "ol/Map.js";
import View from "ol/View.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import LineString from "ol/geom/LineString.js";
import Polygon from "ol/geom/Polygon.js";
import CircleGeom from "ol/geom/Circle.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import OSM from "ol/source/OSM.js";
import XYZ from "ol/source/XYZ.js";
import VectorSource from "ol/source/Vector.js";
import { fromLonLat } from "ol/proj.js";
import { ScaleLine } from "ol/control.js";
import Style from "ol/style/Style.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";
import CircleStyle from "ol/style/Circle.js";
import "ol/ol.css";

const views = {
  india: { center: [79, 22.5], zoom: 5 },
  bihar: { center: [85.5, 25.8], zoom: 7 },
  patna: { center: [85.155, 25.625], zoom: 12.5 },
};

const toMap = ([lat, lon]) => fromLonLat([lon, lat]);
const polygonCoordinates = (positions) => [positions.map(toMap)];
const terrainTileUrl = (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;

function resilientTileLoad(tile, sourceUrl) {
  const image = tile.getImage();
  image.crossOrigin = "anonymous";
  image.onerror = () => {
    image.onerror = null;
    const match = sourceUrl.match(/\/tile\/(\d+)\/(\d+)\/(\d+)$/);
    if (match) {
      image.src = terrainTileUrl(match[1], match[3], match[2]);
    }
  };
  image.src = sourceUrl;
}

function fillStyle(fill, fillOpacity = 0.3, stroke = fill, width = 2, dash) {
  return new Style({
    fill: new Fill({ color: `${fill}${Math.round(fillOpacity * 255).toString(16).padStart(2, "0")}` }),
    stroke: new Stroke({ color: stroke, width, lineDash: dash }),
  });
}

function lineStyle(color, width = 3, dash) {
  return new Style({ stroke: new Stroke({ color, width, lineDash: dash }) });
}

function circleFeature(position, radius, style, properties = {}) {
  const feature = new Feature({ geometry: new CircleGeom(toMap(position), radius), ...properties });
  feature.setStyle(style);
  return feature;
}

function polygonFeature(positions, style, properties = {}) {
  const feature = new Feature({ geometry: new Polygon(polygonCoordinates(positions)), ...properties });
  feature.setStyle(style);
  return feature;
}

function lineFeature(positions, style, properties = {}) {
  const feature = new Feature({ geometry: new LineString(positions.map(toMap)), ...properties });
  feature.setStyle(style);
  return feature;
}

function pointFeature(position, color, properties = {}) {
  const feature = new Feature({ geometry: new Point(toMap(position)), ...properties });
  feature.setStyle(new Style({
    image: new CircleStyle({ radius: 8, fill: new Fill({ color }), stroke: new Stroke({ color: "#ffffff", width: 2 }) }),
  }));
  return feature;
}

function OpenLayersMap({
  level,
  cinematic,
  baseMap,
  activeTheme,
  selectedArea,
  onSelectArea,
  onLevelChange,
  showContours,
  showPonds,
  showDrainage,
  showVegetation,
  showCheckDams,
  showWaterBodies,
  priorityZones,
  thematicZones,
  vegetationPoints,
  getThemeStyle,
  mapOnly,
}) {
  const targetRef = useRef(null);
  const mapRef = useRef(null);
  const [popup, setPopup] = useState(null);
  const [popupPixel, setPopupPixel] = useState(null);
  const [zoom, setZoom] = useState(5);
  const [resolution, setResolution] = useState(0);

  useEffect(() => {
    const street = new TileLayer({ source: new OSM({ maxZoom: 24 }), visible: false });
    const satellite = new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 24,
        tileLoadFunction: (tile, sourceUrl) => resilientTileLoad(tile, sourceUrl),
      }),
      visible: false,
    });
    const labels = new TileLayer({
      source: new XYZ({ url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", maxZoom: 24 }),
      visible: false,
      opacity: 0.9,
    });
    const terrain = new TileLayer({
      source: new XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", maxZoom: 24 }),
      visible: false,
    });
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({ source: vectorSource });
    const map = new Map({
      target: targetRef.current,
      layers: [street, satellite, labels, terrain, vectorLayer],
      view: new View({ center: fromLonLat(views.india.center), zoom: views.india.zoom, minZoom: 4, maxZoom: 24 }),
      controls: [new ScaleLine({ units: "metric", bar: true, minWidth: 120 })],
    });
    map.on("singleclick", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate);
      if (!feature) {
        setPopup(null);
        setPopupPixel(null);
        return;
      }
      const message = feature.get("popup");
      if (feature.get("selectArea")) {
        onSelectArea(feature.get("selectArea"));
        map.getView().animate({ center: toMap(feature.get("center")), zoom: 14, duration: 1200 });
      }
      if (feature.get("nextLevel")) onLevelChange(feature.get("nextLevel"));
      if (message) {
        setPopup({ html: message, coordinate: event.coordinate });
        setPopupPixel(event.pixel);
      }
    });
    mapRef.current = { map, street, satellite, labels, terrain, vectorSource };
    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [onLevelChange, onSelectArea]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;
    instance.street.setVisible(baseMap === "street");
    instance.satellite.setVisible(baseMap === "satellite" || baseMap === "hybrid");
    instance.labels.setVisible(baseMap === "hybrid");
    instance.terrain.setVisible(baseMap === "terrain");
  }, [baseMap]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;
    const view = instance.map.getView();
    const target = views[level];
    view.animate({ center: fromLonLat(target.center), zoom: target.zoom, duration: cinematic ? { india: 3900, bihar: 2900, patna: 2900 }[level] : 1150 });
  }, [level, cinematic]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;
    const source = instance.vectorSource;
    source.clear();
    const add = (feature) => source.addFeature(feature);

    if (level === "india") {
      add(circleFeature([25.9, 85.3], 85000, fillStyle("#67b7c8", 0.16, "#67b7c8", 3, [8, 8]), {
        nextLevel: "bihar", popup: "<b>Bihar</b><br>Click to enter Bihar watershed analysis.",
      }));
    }
    if (level === "bihar") {
      add(polygonFeature([[26.7, 83.4], [27.5, 84.7], [27.3, 86.6], [25.5, 87.2], [24.3, 86.0], [24.5, 84.0], [25.2, 83.5], [26.7, 83.4]], fillStyle("#67b7c8", 0.04, "#67b7c8", 4)));
      add(circleFeature([25.5941, 85.1376], 30000, fillStyle("#d59a2a", 0.14, "#d59a2a", 4), { nextLevel: "patna", popup: "<b>Patna District</b><br>Click to explore rural watershed zones." }));
    }
    if (level !== "patna") return;
    add(circleFeature([25.5941, 85.1376], 25000, fillStyle("#ffffff", 0.008, "#ffffff", 3, [8, 8]), { popup: "<b>Patna Watershed Study Area</b><br>Click a red/yellow priority watershed to reveal its GIS layers." }));

    if (activeTheme !== "none") {
      thematicZones.forEach((zone) => {
        const theme = getThemeStyle(activeTheme, zone);
        add(circleFeature(zone.center, zone.radius, fillStyle(theme.fill, 0.42, theme.fill, 2), { popup: `<b>${activeTheme.toUpperCase()}</b><br>${theme.label}` }));
      });
    } else {
      priorityZones.forEach((zone) => {
        const chosen = selectedArea === zone.key;
        add(circleFeature(zone.center, zone.radius, fillStyle(chosen ? "#ffffff" : zone.color, chosen ? 0 : 0.3, chosen ? "#ffffff" : zone.color, chosen ? 2 : 3, chosen ? [6, 7] : undefined), {
          selectArea: zone.key, center: zone.center, popup: `<b>${zone.label} Priority Watershed</b><br>Click to zoom in and inspect.`,
        }));
      });
    }
    if (!selectedArea) return;
    if (showContours) [0, 1, 2, 3, 4].forEach((offset) => add(lineFeature([[25.675 - offset * 0.008, 85.145 + offset * 0.006], [25.665 - offset * 0.008, 85.165 + offset * 0.006], [25.645 - offset * 0.008, 85.18 + offset * 0.004], [25.625 - offset * 0.008, 85.185 + offset * 0.002]], lineStyle(offset % 2 ? "#f3d47a" : "#d59a2a", offset === 2 ? 3 : 2))));
    if (showDrainage) {
      add(lineFeature([[25.68, 85.145], [25.665, 85.155], [25.65, 85.165], [25.635, 85.175]], lineStyle("#67b7c8", 5)));
      add(lineFeature([[25.665, 85.155], [25.65, 85.145], [25.638, 85.14]], lineStyle("#9bd4df", 3)));
      add(lineFeature([[25.65, 85.165], [25.65, 85.18], [25.65, 85.19]], lineStyle("#9bd4df", 3)));
    }
    if (showPonds) {
      add(circleFeature([25.635, 85.176], 450, fillStyle("#67b7c8", 0.85, "#247d9b", 2), { popup: "<b>Farm Pond</b><br>Existing water storage." }));
      add(circleFeature([25.65, 85.19], 350, fillStyle("#8acbd7", 0.85, "#247d9b", 2), { popup: "<b>Pond</b><br>Existing water body." }));
    }
    if (showWaterBodies) add(circleFeature([25.615, 85.16], 850, fillStyle("#67b7c8", 0.38, "#247d9b", 2), { popup: "<b>Water Body</b><br>Surface water feature." }));
    if (showVegetation) vegetationPoints.forEach((position) => add(pointFeature(position, "#4e9a69", { popup: "Vegetation zone" })));
    if (showCheckDams) {
      add(pointFeature([25.655, 85.17], "#d94b55", { popup: "<b>Proposed Check Dam</b><br>Runoff control & groundwater recharge.<br>Priority: High" }));
      add(pointFeature([25.642, 85.178], "#d94b55", { popup: "<b>Proposed Check Dam</b><br>Sediment and runoff management." }));
    }
  }, [level, activeTheme, selectedArea, showContours, showPonds, showDrainage, showVegetation, showCheckDams, showWaterBodies, priorityZones, thematicZones, vegetationPoints, getThemeStyle, onSelectArea, onLevelChange]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return undefined;
    const update = () => {
      const view = instance.map.getView();
      const currentZoom = view.getZoom() || 0;
      const center = view.getCenter() || fromLonLat([85, 25]);
      const lat = (Math.atan(Math.sinh((center[1] / 6378137))) * 180) / Math.PI;
      setZoom(currentZoom);
      setResolution((156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** currentZoom);
    };
    update();
    instance.map.on("moveend", update);
    return () => instance.map.un("moveend", update);
  }, [mapOnly]);

  function changeZoom(value) {
    mapRef.current?.map.getView().animate({ zoom: Number(value), duration: 180 });
  }

  return (
    <div className="main-map openlayers-map">
      <div ref={targetRef} className="openlayers-target" />
      <div className="custom-map-controls">
        <button onClick={() => changeZoom((mapRef.current?.map.getView().getZoom() || 0) + 1)} aria-label="Zoom in">+</button>
        <button onClick={() => changeZoom((mapRef.current?.map.getView().getZoom() || 0) - 1)} aria-label="Zoom out">−</button>
      </div>
      {mapOnly && level === "patna" && (
        <div className="resolution-control">
          <div className="resolution-readout"><b>Map Resolution</b><span>Zoom {zoom.toFixed(0)} · {resolution < 1 ? `${Math.round(resolution * 100)} cm/px` : `${resolution.toFixed(1)} m/px`}</span></div>
          <span className="resolution-symbol">−</span>
          <input type="range" min="8" max="24" step="1" value={Math.round(zoom)} onChange={(event) => changeZoom(event.target.value)} aria-label="Map resolution" />
          <span className="resolution-symbol">+</span>
        </div>
      )}
      {popup && popupPixel && (
        <div
          className="ol-popup"
          style={{ left: `${popupPixel[0]}px`, top: `${popupPixel[1]}px` }}
          dangerouslySetInnerHTML={{ __html: popup.html }}
        />
      )}
    </div>
  );
}

export default OpenLayersMap;
