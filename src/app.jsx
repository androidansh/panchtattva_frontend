import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Polygon,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./app.css";
import iconImage from "../icon.jpeg";
import heroMapImage from "../icon1.png";

const watershedData = {
  high: {
    name: "High Priority Watershed",
    rainfall: 1180,
    monsoonRainfall: 910,
    ndvi: 0.25,
    slope: 9,
    elevationMin: 48,
    elevationMax: 76,
    erosion: "High",
    runoff: "High",
    waterAvailability: "Low",
    area: 42.6,
    ponds: 2,
    waterBodies: 1,
    checkDams: 0,
    score: 86,
    recommendation: "Immediate intervention recommended",
  },
  medium: {
    name: "Medium Priority Watershed",
    rainfall: 1040,
    monsoonRainfall: 790,
    ndvi: 0.42,
    slope: 6,
    elevationMin: 45,
    elevationMax: 68,
    erosion: "Moderate",
    runoff: "Medium",
    waterAvailability: "Moderate",
    area: 36.8,
    ponds: 3,
    waterBodies: 2,
    checkDams: 1,
    score: 57,
    recommendation: "Targeted conservation recommended",
  },
  low: {
    name: "Low Priority Watershed",
    rainfall: 960,
    monsoonRainfall: 710,
    ndvi: 0.61,
    slope: 3,
    elevationMin: 42,
    elevationMax: 59,
    erosion: "Low",
    runoff: "Low",
    waterAvailability: "Good",
    area: 31.4,
    ponds: 4,
    waterBodies: 3,
    checkDams: 2,
    score: 28,
    recommendation: "Routine monitoring recommended",
  },
};

const priorityZones = [
  {
    key: "high",
    center: [25.63, 85.18],
    radius: 6500,
    color: "#ef4444",
    label: "High",
  },
  {
    key: "medium",
    center: [25.55, 85.10],
    radius: 5500,
    color: "#f59e0b",
    label: "Medium",
  },
  {
    key: "low",
    center: [25.67, 85.08],
    radius: 5000,
    color: "#22c55e",
    label: "Low",
  },
];

const thematicZones = [
  { center: [25.63, 85.18], radius: 9000, rainfall: 1180, ndvi: 0.25, slope: 9, erosion: 85 },
  { center: [25.56, 85.10], radius: 8000, rainfall: 1040, ndvi: 0.42, slope: 6, erosion: 52 },
  { center: [25.67, 85.08], radius: 7500, rainfall: 960, ndvi: 0.61, slope: 3, erosion: 25 },
  { center: [25.60, 85.22], radius: 6500, rainfall: 1100, ndvi: 0.34, slope: 8, erosion: 72 },
];

const vegetationPoints = [
  [25.645, 85.15],
  [25.65, 85.158],
  [25.64, 85.16],
  [25.655, 85.175],
  [25.635, 85.185],
  [25.66, 85.185],
];

const bushIcon = L.divIcon({
  className: "bush-icon",
  html: '<div class="bush-marker">●</div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapCamera({ level }) {
  const map = useMap();

  useEffect(() => {
    const views = {
      india: [[22.5, 79], 5],
      bihar: [[25.8, 85.5], 7],
      patna: [[25.5941, 85.1376], 11],
    };

    const [center, zoom] = views[level];
    map.flyTo(center, zoom, { duration: 1.1 });
  }, [level, map]);

  return null;
}

function getThemeStyle(theme, zone) {
  if (theme === "rainfall") {
    return {
      fill:
        zone.rainfall >= 1120
          ? "#991b1b"
          : zone.rainfall >= 1020
            ? "#f97316"
            : "#facc15",
      label: `${zone.rainfall} mm`,
    };
  }

  if (theme === "ndvi") {
    return {
      fill: zone.ndvi < 0.3 ? "#ef4444" : zone.ndvi < 0.5 ? "#eab308" : "#22c55e",
      label: `NDVI ${zone.ndvi}`,
    };
  }

  if (theme === "slope") {
    return {
      fill: zone.slope >= 8 ? "#dc2626" : zone.slope >= 5 ? "#f59e0b" : "#22c55e",
      label: `${zone.slope}° slope`,
    };
  }

  return {
    fill: zone.erosion >= 70 ? "#991b1b" : zone.erosion >= 40 ? "#f59e0b" : "#16a34a",
    label: `${zone.erosion}% risk`,
  };
}

function MiniTerrain({ data }) {
  const range = data.elevationMax - data.elevationMin;

  return (
    <div className="mini-terrain">
      <div className="terrain-grid" />
      <div className="terrain-mountain terrain-mountain-back" />
      <div className="terrain-mountain terrain-mountain-front" />
      <div className="terrain-river" />
      <div className="terrain-contour contour-one" />
      <div className="terrain-contour contour-two" />
      <div className="terrain-contour contour-three" />
      <div className="terrain-label elevation-low">{data.elevationMin}m</div>
      <div className="terrain-label elevation-high">{data.elevationMax}m</div>
      <div className="terrain-compass">N</div>
      <div className="terrain-footer">
        <span>DEM terrain</span>
        <b>Range {range} m</b>
      </div>
    </div>
  );
}

function App() {
  const [started, setStarted] = useState(false);
  const [stateName, setStateName] = useState("");
  const [level, setLevel] = useState("india");
  const [selectedArea, setSelectedArea] = useState(null);

  const [baseMap, setBaseMap] = useState("satellite");
  const [activeTheme, setActiveTheme] = useState("none");
  const [showContours, setShowContours] = useState(true);
  const [showPonds, setShowPonds] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showVegetation, setShowVegetation] = useState(true);
  const [showCheckDams, setShowCheckDams] = useState(true);
  const [showWaterBodies, setShowWaterBodies] = useState(true);
  const [showTerrain, setShowTerrain] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selectedData = selectedArea ? watershedData[selectedArea] : null;

  const currentLocation = useMemo(() => {
    if (level === "patna") return "Patna District";
    if (level === "bihar") return "Bihar";
    return "India";
  }, [level]);

  function startExploration() {
    const state = stateName.trim().toLowerCase();

    if (state === "bihar") {
      setStarted(true);
      setLevel("india");
      return;
    }

    alert("For this demonstration, enter Bihar.");
  }

  function selectWatershed(area) {
    setSelectedArea(area);
    setActiveTheme("none");
  }

  function goBack() {
    setStarted(false);
  }

  if (!started) {
    return (
      <div className="app landing-page">

        <main className="landing-main">
          <section className="hero-card">
            <div className="hero-content">
              <span className="hero-kicker">GIS • SATELLITE • TERRAIN • WATER</span>
              <h2>
                PanchTattva: Smart Watershed
                <span> Planning & Analysis</span>
              </h2>
              <p>
                Analyse watershed conditions using satellite imagery, terrain,
                rainfall, vegetation and GIS-based decision support.
              </p>

              <div className="state-search">
                <span>⌖</span>
                <input
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startExploration()}
                  placeholder="Enter state name, e.g. Bihar"
                />
                <button onClick={startExploration}>Explore →</button>
              </div>

              <small className="search-hint">
                Demonstration coverage: <b>Bihar</b>
              </small>

              <div className="landing-features">
                <div><b>Satellite</b><span>Imagery</span></div>
                <div><b>Rainfall</b><span>Thematic Map</span></div>
                <div><b>Terrain</b><span>DEM Analysis</span></div>
                <div><b>Vegetation</b><span>NDVI Analysis</span></div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-map-glow" />
              <img className="hero-map-image" src={heroMapImage} alt="Watershed map" />
              <div className="floating-info info-one"><b>1180 mm</b><span>Rainfall</span></div>
              <div className="floating-info info-two"><b>NDVI 0.25</b><span>Vegetation health</span></div>
              <div className="floating-info info-three"><b>9°</b><span>Average slope</span></div>
            </div>
          </section>

          <section className="landing-stats">
            <div><b>Interactive GIS</b><span>Map visualization</span></div>
            <div><b>Water Resources</b><span>Monitoring & planning</span></div>
            <div><b>Environmental</b><span>Assessment</span></div>
            <div><b>Decision Support</b><span>Data-driven planning</span></div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app dashboard">
          <div className="dashboard-actions">
            <button className="back-button" onClick={goBack}>← Back</button>
          </div>

      <div className="workspace">
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          
          <div className="sidebar-heading">
            <div>
              <span>MAP CONTROL</span>
              <h3>Layers & Analysis</h3>
            </div>
            <button onClick={() => setSidebarOpen(false)}>×</button>
          </div>

          <div className="sidebar-section">
            <label>BASE MAP</label>
            {[
              ["satellite", "Satellite", "▦"],
              ["hybrid", "Hybrid", "⊞"],
              ["street", "Street", "⌖"],
            ].map(([key, label, icon]) => (
              <button
                key={key}
                className={`layer-button ${baseMap === key ? "active" : ""}`}
                onClick={() => setBaseMap(key)}
              >
                <span className="layer-icon">{icon}</span>
                {label}
                {baseMap === key && <b>✓</b>}
              </button>
            ))}
          </div>

          {level === "patna" && (
            <>
              <div className="sidebar-section">
                <label>THEMATIC MAPS</label>
                {[
                  ["rainfall", "Rainfall", "≈"],
                  ["ndvi", "NDVI / Vegetation", "◈"],
                  ["slope", "Slope", "△"],
                  ["erosion", "Erosion Risk", "!"],
                ].map(([key, label, icon]) => (
                  <button
                    key={key}
                    className={`layer-button ${activeTheme === key ? "active" : ""}`}
                    onClick={() => setActiveTheme(activeTheme === key ? "none" : key)}
                  >
                    <span className="layer-icon">{icon}</span>
                    {label}
                    {activeTheme === key && <b>✓</b>}
                  </button>
                ))}
              </div>

              {selectedData && (
                <div className="sidebar-section">
                  <label>GIS LAYERS</label>
                  {[
                    ["Contours", showContours, setShowContours, "⌁"],
                    ["Ponds", showPonds, setShowPonds, "○"],
                    ["Water Bodies", showWaterBodies, setShowWaterBodies, "≈"],
                    ["Drainage", showDrainage, setShowDrainage, "╱"],
                    ["Vegetation", showVegetation, setShowVegetation, "●"],
                    ["Proposed Check Dams", showCheckDams, setShowCheckDams, "▰"],
                  ].map(([label, checked, setter, icon]) => (
                    <label className="toggle-row" key={label}>
                      <span><i>{icon}</i>{label}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setter(!checked)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="sidebar-footer">
            <div className="coverage-card">
              <span>●</span>
              <div><b>Coverage</b><small>Bihar demonstration area</small></div>
            </div>
          </div>
        </aside>

        <main className="content">
          <section className="map-section">
            <div className="section-heading">
              
              <div className="map-location">⌖ {currentLocation}</div>
            </div>

            <div className="map-frame">
              <MapContainer
                center={[22.5, 79]}
                zoom={5}
                minZoom={4}
                maxZoom={18}
                scrollWheelZoom
                dragging
                touchZoom
                doubleClickZoom
                zoomControl={true}
                className="main-map"
              >
                {baseMap === "satellite" && (
                  <TileLayer
                    attribution="Esri World Imagery"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                )}

                {baseMap === "hybrid" && (
                  <>
                    <TileLayer
                      attribution="Esri World Imagery"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <TileLayer
                      attribution="Esri Labels"
                      url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                      opacity={0.9}
                    />
                  </>
                )}

                {baseMap === "street" && (
                  <TileLayer
                    attribution="© OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                )}

                <MapCamera level={level} />

                {level === "india" && (
                  <Circle
                    center={[25.9, 85.3]}
                    radius={85000}
                    pathOptions={{
                      color: "#38bdf8",
                      weight: 3,
                      fillColor: "#22d3ee",
                      fillOpacity: 0.18,
                      dashArray: "8 8",
                    }}
                    eventHandlers={{ click: () => setLevel("bihar") }}
                  >
                    <Popup><b>Bihar</b><br />Click to enter Bihar watershed analysis.</Popup>
                  </Circle>
                )}

                {level === "bihar" && (
                  <>
                    <Polygon
                      positions={[
                        [26.7, 83.4], [27.5, 84.7], [27.3, 86.6],
                        [25.5, 87.2], [24.3, 86.0], [24.5, 84.0],
                        [25.2, 83.5], [26.7, 83.4],
                      ]}
                      pathOptions={{ color: "#38bdf8", weight: 4, fillOpacity: 0.04 }}
                    />
                    <Circle
                      center={[25.5941, 85.1376]}
                      radius={30000}
                      pathOptions={{
                        color: "#f59e0b",
                        weight: 4,
                        fillColor: "#f59e0b",
                        fillOpacity: 0.16,
                      }}
                      eventHandlers={{ click: () => setLevel("patna") }}
                    >
                      <Popup><b>Patna District</b><br />Click to explore rural watershed zones.</Popup>
                    </Circle>
                  </>
                )}

                {level === "patna" && (
                  <>
                    <Circle
                      center={[25.5941, 85.1376]}
                      radius={25000}
                      pathOptions={{
                        color: "#ffffff",
                        weight: 3,
                        fillOpacity: 0,
                        dashArray: "8 8",
                      }}
                    />

                    {activeTheme !== "none" ? (
                      thematicZones.map((zone, index) => {
                        const theme = getThemeStyle(activeTheme, zone);
                        return (
                          <Circle
                            key={`${activeTheme}-${index}`}
                            center={zone.center}
                            radius={zone.radius}
                            pathOptions={{
                              color: theme.fill,
                              fillColor: theme.fill,
                              fillOpacity: 0.42,
                              weight: 2,
                            }}
                          >
                            <Popup><b>{activeTheme.toUpperCase()}</b><br />{theme.label}</Popup>
                          </Circle>
                        );
                      })
                    ) : (
                      priorityZones.map((zone) => (
                        <Circle
                          key={zone.key}
                          center={zone.center}
                          radius={zone.radius}
                          pathOptions={{
                            color: zone.color,
                            weight: 3,
                            fillColor: zone.color,
                            fillOpacity: selectedArea === zone.key ? 0.62 : 0.3,
                          }}
                          eventHandlers={{ click: () => selectWatershed(zone.key) }}
                        >
                          <Popup><b>{zone.label} Priority Watershed</b><br />Click to inspect.</Popup>
                        </Circle>
                      ))
                    )}

                    {selectedArea && (
                      <>
                        {showContours && [0, 1, 2, 3, 4].map((offset) => (
                          <Polyline
                            key={`contour-${offset}`}
                            positions={[
                              [25.675 - offset * 0.008, 85.145 + offset * 0.006],
                              [25.665 - offset * 0.008, 85.165 + offset * 0.006],
                              [25.645 - offset * 0.008, 85.18 + offset * 0.004],
                              [25.625 - offset * 0.008, 85.185 + offset * 0.002],
                            ]}
                            pathOptions={{
                              color: offset % 2 ? "#fde68a" : "#f59e0b",
                              weight: offset === 2 ? 3 : 2,
                            }}
                          />
                        ))}

                        {showDrainage && (
                          <>
                            <Polyline positions={[[25.68, 85.145], [25.665, 85.155], [25.65, 85.165], [25.635, 85.175]]} pathOptions={{ color: "#38bdf8", weight: 5 }} />
                            <Polyline positions={[[25.665, 85.155], [25.65, 85.145], [25.638, 85.14]]} pathOptions={{ color: "#7dd3fc", weight: 3 }} />
                            <Polyline positions={[[25.65, 85.165], [25.65, 85.18], [25.65, 85.19]]} pathOptions={{ color: "#7dd3fc", weight: 3 }} />
                          </>
                        )}

                        {showPonds && (
                          <>
                            <Circle center={[25.635, 85.176]} radius={450} pathOptions={{ color: "#0284c7", fillColor: "#38bdf8", fillOpacity: 0.85 }}>
                              <Popup><b>Farm Pond</b><br />Existing water storage.</Popup>
                            </Circle>
                            <Circle center={[25.65, 85.19]} radius={350} pathOptions={{ color: "#0284c7", fillColor: "#60a5fa", fillOpacity: 0.85 }}>
                              <Popup><b>Pond</b><br />Existing water body.</Popup>
                            </Circle>
                          </>
                        )}

                        {showWaterBodies && (
                          <Circle center={[25.615, 85.16]} radius={850} pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.38 }}>
                            <Popup><b>Water Body</b><br />Surface water feature.</Popup>
                          </Circle>
                        )}

                        {showVegetation && vegetationPoints.map((position, index) => (
                          <Marker key={`veg-${index}`} position={position} icon={bushIcon}>
                            <Popup>Vegetation zone</Popup>
                          </Marker>
                        ))}

                        {showCheckDams && (
                          <>
                            <Marker position={[25.655, 85.17]}>
                              <Popup><b>Proposed Check Dam</b><br />Runoff control & groundwater recharge.<br />Priority: High</Popup>
                            </Marker>
                            <Marker position={[25.642, 85.178]}>
                              <Popup><b>Proposed Check Dam</b><br />Sediment and runoff management.</Popup>
                            </Marker>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </MapContainer>

              <div className="map-overlay-badge">
                <span className="pulse-dot" /> {baseMap.toUpperCase()} MAP
              </div>

              <div className="map-help">
                {level === "india" && "Click the highlighted Bihar region"}
                {level === "bihar" && "Click Patna to enter the watershed view"}
                {level === "patna" && !selectedArea && "Click a priority watershed"}
                {selectedArea && "Toggle layers from the left panel"}
              </div>
            </div>
          </section>

          <section className="analysis-section">
            <div className="section-heading compact">
              <div>
                <span className="section-kicker">DECISION SUPPORT</span>
                <h2>Analysis of the selected area</h2>
              </div>
              {selectedData && (
                <span className={`priority-badge ${selectedArea}`}>
                  {selectedArea.toUpperCase()} PRIORITY
                </span>
              )}
            </div>

            {!selectedData ? (
              <div className="empty-analysis">
                <div className="empty-icon">⌖</div>
                <div>
                  <b>No watershed selected</b>
                  <span>Select a priority zone on the map to view rainfall, NDVI, slope, erosion and water-resource indicators.</span>
                </div>
              </div>
            ) : (
              <div className="analysis-grid">
                <div className="analysis-card primary">
                  <div className="analysis-card-top">
                    <div>
                      <span>SELECTED WATERSHED</span>
                      <h3>{selectedData.name}</h3>
                      <p>Patna District • Rural Watershed Zone</p>
                    </div>
                    <div className="score-ring">
                      <b>{selectedData.score}</b>
                      <span>Priority</span>
                    </div>
                  </div>
                  <div className="metric-row">
                    <div><span>Rainfall</span><b>{selectedData.rainfall} <small>mm</small></b></div>
                    <div><span>NDVI</span><b>{selectedData.ndvi}</b></div>
                    <div><span>Slope</span><b>{selectedData.slope}°</b></div>
                    <div><span>Area</span><b>{selectedData.area} <small>km²</small></b></div>
                  </div>
                </div>

                <div className="analysis-card conditions">
                  <span className="card-label">CURRENT CONDITIONS</span>
                  <div className="condition-item"><span>Erosion Risk</span><b>{selectedData.erosion}</b></div>
                  <div className="condition-item"><span>Surface Runoff</span><b>{selectedData.runoff}</b></div>
                  <div className="condition-item"><span>Water Availability</span><b>{selectedData.waterAvailability}</b></div>
                  <div className="condition-item"><span>Monsoon Rainfall</span><b>{selectedData.monsoonRainfall} mm</b></div>
                </div>

                <div className="analysis-card recommendation-card">
                  <span className="card-label">RECOMMENDED ACTION</span>
                  <h3>{selectedData.recommendation}</h3>
                  <div className="recommendation-list">
                    <span>✓ Farm ponds & rainwater harvesting</span>
                    <span>✓ Check dams in high-runoff channels</span>
                    <span>✓ Vegetation and soil-cover improvement</span>
                  </div>
                </div>

                <div className="analysis-card resources-card">
                  <span className="card-label">WATER RESOURCES</span>
                  <div className="resource-stats">
                    <div><b>{selectedData.ponds}</b><span>Ponds</span></div>
                    <div><b>{selectedData.waterBodies}</b><span>Water Bodies</span></div>
                    <div><b>{selectedData.checkDams}</b><span>Check Dams</span></div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="visualization-section">
            <div className="section-heading compact">
              <div>
                <span className="section-kicker">WATERSHED DEVELOPMENT</span>
                <h2>Visualization for the watershed development</h2>
              </div>
              {selectedData && (
                <button className="terrain-action" onClick={() => setShowTerrain(true)}>
                  Open detailed 3D analysis →
                </button>
              )}
            </div>

            <div className="visual-grid">
              <div className="visual-card">
                <div className="visual-card-header">
                  <div><h3>2D Visualization</h3></div>
                  <span>GIS LAYERS</span>
                </div>
                {selectedData ? (
                  <div className="visual-2d">
                    <div className="contour-map-line line-a" />
                    <div className="contour-map-line line-b" />
                    <div className="contour-map-line line-c" />
                    <div className="visual-stream" />
                    <div className="visual-pond pond-a" />
                    <div className="visual-pond pond-b" />
                    <div className="visual-dam dam-a" />
                    <div className="visual-dam dam-b" />
                    <span className="visual-label label-high">HIGH</span>
                    <span className="visual-label label-water">WATER</span>
                    <span className="visual-label label-dam">CHECK DAM</span>
                  </div>
                ) : (
                  <div className="visual-placeholder">Select a watershed to generate the development map.</div>
                )}
              </div>

              <div className="visual-card">
                <div className="visual-card-header">
                  <div><h3>3D Visualization</h3></div>
                </div>
                {selectedData ? (
                  <div onClick={() => setShowTerrain(true)} className="visual-clickable">
                    <MiniTerrain data={selectedData} />
                    <button className="visual-open-button">Explore 3D terrain</button>
                  </div>
                ) : (
                  <div className="visual-placeholder">Select a watershed to preview its terrain model.</div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      {showTerrain && selectedData && (
        <div className="terrain-overlay" onClick={() => setShowTerrain(false)}>
          <div className="terrain-modal terrain-modal-shell" onClick={(e) => e.stopPropagation()}>
            <button className="terrain-close" onClick={() => setShowTerrain(false)}>x</button>
            <div className="terrain-modal-header">
              <div>
                
                <h2>3D Watershed Terrain</h2>
                <p>{selectedData.name} • Patna, Bihar</p>
              </div>
              
            </div>
            <MiniTerrain data={selectedData} />
            <div className="terrain-stats">
              <div><span>Minimum Elevation</span><b>{selectedData.elevationMin} m</b></div>
              <div><span>Maximum Elevation</span><b>{selectedData.elevationMax} m</b></div>
              <div><span>Elevation Range</span><b>{selectedData.elevationMax - selectedData.elevationMin} m</b></div>
              <div><span>Average Slope</span><b>{selectedData.slope}°</b></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
