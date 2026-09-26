import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { csvWatershedData } from "./data/csv-watershed-data";
import GoogleMapsMap from "./GoogleMapsMap";
import high2dImage from "./assets/high-2d.jpeg";
import medium2dImage from "./assets/medium-2d.jpeg";
import low2dImage from "./assets/pond-low-2d.png";
import khatangiLow2dImage from "./assets/low-2d.jpeg";
import high3dImage from "./assets/high-3d.jpeg";
import medium3dImage from "./assets/medium-3d.jpeg";
import low3dImage from "./assets/pond-low-3d.jpeg";
import khatangiLow3dImage from "./assets/low-3d.jpeg";

/* =========================================================
   DEMONSTRATION WATERSHED DATA
========================================================= */

const watershedData = {
  high: {
    name: "High Priority Watershed",
    rainfall: 1203,
    monsoonRainfall: 760,
    ndvi: 0.25,
    slope: 3.53,
    elevationMin: 48,
    elevationMax: 76,
    erosion: "High",
    runoff: "Moderate–High",
    waterAvailability: "Low",
    area: 42.6,
    score: 86,
    recommendation: "High estimated soil loss combined with relatively high rainfall and 3.53° slope indicates a location requiring active soil and water conservation measures.",
    actions: [
      "Farm ponds & rainwater harvesting",
      "Contour bunding and field bund strengthening",
      "Vegetation and soil-cover improvement",
      "Runoff-channel treatment",
    ],
  },
  medium: {
    name: "Medium Priority Watershed",
    rainfall: 1167,
    monsoonRainfall: 748,
    ndvi: 0.42,
    slope: 6,
    elevationMin: 45,
    elevationMax: 68,
    erosion: "Moderate",
    runoff: "Moderate",
    waterAvailability: "Moderate",
    area: 36.8,
    score: 57,
    recommendation: "Moderate estimated soil loss with good seasonal vegetation conditions suggests preventive and maintenance-focused watershed management.",
    actions: [
      "Maintain existing vegetation cover",
      "Small-scale rainwater harvesting",
      "Contour-based soil conservation",
      "Periodic erosion assessment",
    ],
  },
  low: {
    name: "Low Priority Watershed",
    rainfall: 1066,
    monsoonRainfall: 771,
    ndvi: 0.61,
    slope: 3,
    elevationMin: 42,
    elevationMax: 59,
    erosion: "Moderate / relatively controlled",
    runoff: "Low–Moderate",
    waterAvailability: "Good",
    area: 31.4,
    score: 28,
    recommendation: "Lower slope and comparatively lower rainfall indicate lower immediate intervention requirements, while seasonal vegetation response remains strong.",
    actions: [
      "Maintain existing watershed structures",
      "Protect existing vegetation",
      "Localized rainwater harvesting where required",
      "Intervene only where localized degradation is detected",
    ],
  },
  lowKhatangi: {
    name: "Low Priority Watershed",
    rainfall: 1066,
    monsoonRainfall: 771,
    ndvi: 0.33,
    slope: 1.73,
    elevationMin: 72,
    elevationMax: 86,
    erosion: "Moderate / relatively controlled",
    runoff: "Low–Moderate",
    waterAvailability: "Good",
    area: 31.4,
    score: 28,
    recommendation: "Lower slope and comparatively lower rainfall indicate lower immediate intervention requirements, while seasonal vegetation response remains strong.",
    actions: [
      "Maintain existing watershed structures",
      "Protect existing vegetation",
      "Localized rainwater harvesting where required",
      "Intervene only where localized degradation is detected",
    ],
  },
};

const priorityZones = [
  {
    key: "high",
    center: [24.815399, 86.842470],
    radius: 1000,
    color: "#d94b55",
    label: "High",
    createdYear: 2012,
  },
  {
    key: "medium",
    center: [24.831280, 86.783349],
    radius: 1000,
    color: "#d59a2a",
    label: "Medium",
    createdYear: 2012,
  },
  {
    key: "low",
    center: [24.905463, 85.376868],
    radius: 1000,
    color: "#4e9a69",
    label: "Low",
    createdYear: 2023,
  },
  {
    key: "lowKhatangi",
    center: [25.064722, 84.771944],
    radius: 1000,
    color: "#4e9a69",
    label: "Low",
    createdYear: 2023,
  },
];

const districtWatersheds = {
  banka: { label: "Banka", zones: ["high", "medium"] },
  khatangi: { label: "Khatangi", zones: ["lowKhatangi"] },
  gaya: { label: "Gaya", zones: ["low"] },
  jota: { label: "Jota", zones: ["low"] },
};

const watershed2dImages = {
  high: high2dImage,
  medium: medium2dImage,
  low: low2dImage,
  lowKhatangi: khatangiLow2dImage,
};

const watershed3dImages = {
  high: high3dImage,
  medium: medium3dImage,
  low: low3dImage,
  lowKhatangi: khatangiLow3dImage,
};

/* =========================================================
   MINI DEM VISUALIZATION
========================================================= */

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

      <div className="terrain-label elevation-low">
        {data.elevationMin}m
      </div>

      <div className="terrain-label elevation-high">
        {data.elevationMax}m
      </div>

      <div className="terrain-compass">N</div>

      <div className="terrain-footer">
        <span>DEM TERRAIN</span>
        <b>Range {range} m</b>
      </div>
    </div>
  );
}

const metricDefinitions = {
  rainfall: { label: "Rainfall", unit: "mm", precision: 3 },
  ndvi: { label: "NDVI", unit: "", precision: 3 },
  slope: { label: "Slope", unit: "°", precision: 3 },
  area: { label: "Area", unit: "km²", precision: 3 },
};

function formatMetric(value) {
  return Number(value).toFixed(3);
}

const priorityYearwiseData = Object.fromEntries(
  Object.entries(csvWatershedData).map(([area, data]) => [
    area,
    {
      ...data,
      yearly: data.yearly.map((row) => ({
        ...row,
        area: row.area ?? watershedData[area].area,
      })),
      quarterly: data.quarterly.map((row) => ({
        ...row,
        area: row.area ?? watershedData[area].area,
      })),
    },
  ])
);

function MetricChartModal({ area, metric, mode, onModeChange, onClose }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [quarterStartYear, setQuarterStartYear] = useState("");
  const [quarterEndYear, setQuarterEndYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("ALL");
  const definition = metricDefinitions[metric];
  const data = priorityYearwiseData[area];
  const quarterYears = [...new Set(data.quarterly.map((point) => point.year))];
  const hasQuarterRange = mode === "yearly" || (quarterStartYear && quarterEndYear);

  const points = mode === "yearly"
    ? data.yearly
    : data.quarterly.filter((point) => (
      hasQuarterRange
      && Number(point.year) >= Number(quarterStartYear)
      && Number(point.year) <= Number(quarterEndYear)
      && (selectedQuarter === "ALL" || point.period === selectedQuarter)
    ));
  const calculationPoints = points.length > 0 ? points : data.quarterly;
  const years = calculationPoints.map((point) => Number(point.year));
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const values = calculationPoints.map((point) => point[metric]);
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  const spread = maximum - minimum || 1;
  const chartPoints = points.map((point, pointIndex) => ({
    x: points.length === 1 ? 315 : 80 + (pointIndex * 470) / (points.length - 1),
    y: 205 - ((point[metric] - minimum) / spread) * 155,
    label: mode === "yearly" ? point.year : `${point.year} ${point.period}`,
    axisLabel: mode === "yearly"
      ? String(point.year).slice(-2)
      : `${point.period} '${String(point.year).slice(-2)}`,
    value: point[metric],
  }));
  const pointsAttribute = chartPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  const axisValues = [maximum, minimum + spread / 2, minimum];

  function formatValue(value) {
    return `${value.toFixed(definition.precision)}${definition.unit ? ` ${definition.unit}` : ""}`;
  }

  function selectQuarterStartYear(event) {
    setQuarterStartYear(event.target.value);
    setQuarterEndYear("");
    setHoveredPoint(null);
  }

  function selectQuarterEndYear(event) {
    setQuarterEndYear(event.target.value);
    setHoveredPoint(null);
  }

  function selectQuarter(event) {
    setSelectedQuarter(event.target.value);
    setHoveredPoint(null);
  }

  return (
    <div className="metric-modal-overlay" onClick={onClose}>
      <div className="metric-modal" onClick={(event) => event.stopPropagation()}>
        <button className="metric-modal-close" onClick={onClose} aria-label="Close chart">×</button>
        <div className="metric-modal-header">
          <div>
            <h2>{definition.label} trend</h2>
            <p className="metric-year-range">Data from {firstYear} to {lastYear}</p>
          </div>
          <div className="metric-controls">
            <div className="chart-mode-switch" role="tablist" aria-label="Chart period">
              <button className={mode === "yearly" ? "active" : ""} onClick={() => onModeChange("yearly")} role="tab" aria-selected={mode === "yearly"}>Year wise</button>
              <button className={mode === "quarterly" ? "active" : ""} onClick={() => onModeChange("quarterly")} role="tab" aria-selected={mode === "quarterly"}>Quarter wise</button>
            </div>
            {mode === "quarterly" && (
              <div className="quarter-year-range" aria-label="Quarterly year range">
                <span>Year range</span>
                <select value={quarterStartYear} onChange={selectQuarterStartYear} aria-label="Start year">
                  <option value="">From</option>
                  {quarterYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <span className="quarter-range-separator">to</span>
                <select value={quarterEndYear} onChange={selectQuarterEndYear} aria-label="End year">
                  <option value="">To</option>
                  {quarterYears
                    .filter((year) => !quarterStartYear || Number(year) >= Number(quarterStartYear))
                    .map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <span>Quarter</span>
                <select value={selectedQuarter} onChange={selectQuarter} aria-label="Quarter">
                  <option value="ALL">ALL</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {!hasQuarterRange ? (
          <div className="metric-chart metric-empty-chart" role="status">
            select year range first
          </div>
        ) : (
          <div className="metric-chart line-chart" role="img" aria-label={`${definition.label} ${mode} line chart`}>
            <svg viewBox="0 0 600 260" preserveAspectRatio="none">
            <rect className="chart-surface" x="30" y="10" width="540" height="240" />
            {[50, 127.5, 205].map((gridY, axisIndex) => (
              <g key={gridY}>
                <line className="chart-grid-line" x1="80" x2="550" y1={gridY} y2={gridY} />
                <text className="chart-axis-label" x="72" y={gridY + 4} textAnchor="end">
                  {formatValue(axisValues[axisIndex])}
                </text>
              </g>
            ))}
            <polyline className={`chart-line ${area}`} points={pointsAttribute} />
            {chartPoints.map((chartPoint) => (
              <g
                key={chartPoint.label}
                className="chart-point-group"
                onMouseEnter={() => setHoveredPoint(chartPoint)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle className={`chart-point-hit-area ${area}`} cx={chartPoint.x} cy={chartPoint.y} r="14" />
                <circle className={`chart-point ${area}`} cx={chartPoint.x} cy={chartPoint.y} r="5" />
                <text
                  className="chart-label"
                  x={chartPoint.x}
                  y="238"
                  textAnchor="middle"
                  transform={mode === "quarterly" ? `rotate(-90 ${chartPoint.x} 238)` : undefined}
                >
                  {chartPoint.axisLabel}
                </text>
                {hoveredPoint?.label === chartPoint.label && (
                  <g className="chart-tooltip" pointerEvents="none">
                    <rect x={chartPoint.x - 48} y={Math.max(8, chartPoint.y - 43)} width="96" height="26" rx="6" />
                    <text x={chartPoint.x} y={Math.max(25, chartPoint.y - 25)} textAnchor="middle">
                      {formatValue(chartPoint.value)}
                    </text>
                  </g>
                )}
              </g>
            ))}
            </svg>
          </div>
        )}

        <p className="metric-source-note">**data from GOOGLE EARTH ENGINE</p>
      </div>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [started, setStarted] = useState(false);
  const [stateName, setStateName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [uploadedImagePreview, setUploadedImagePreview] = useState("");
  const [uploadedImageName, setUploadedImageName] = useState("");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [level, setLevel] = useState("india");
  const [selectedArea, setSelectedArea] = useState(null);

  // Cinematic dashboard entry sequence
  const [introPhase, setIntroPhase] = useState("idle");
  const [requestedPlace, setRequestedPlace] = useState("Bihar");
  const introTimersRef = useRef([]);

  const [baseMap, setBaseMap] = useState("hybrid");
  const [showTerrain, setShowTerrain] = useState(false);
  const [activeMetric, setActiveMetric] = useState(null);
  const [chartMode, setChartMode] = useState("yearly");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [terrainZoom, setTerrainZoom] = useState(1);
  const [show2dViewer, setShow2dViewer] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);

  const selectedData = selectedArea
    ? {
      ...watershedData[selectedArea],
      ...priorityYearwiseData[selectedArea].yearly.at(-1),
    }
    : null;
  const selectedZone = selectedArea
    ? priorityZones.find((zone) => zone.key === selectedArea)
    : null;
  const isLowPriority = selectedArea === "low" || selectedArea === "lowKhatangi";
  const visiblePriorityZones = useMemo(
    () => {
      // At the Bihar overview, make every watershed discoverable. The detailed
      // district view remains scoped to the watershed(s) mapped to that district.
      if (level === "bihar") return priorityZones;
      return selectedDistrict
        ? priorityZones.filter((zone) => districtWatersheds[selectedDistrict].zones.includes(zone.key))
        : [];
    },
    [level, selectedDistrict]
  );

  const currentLocation = useMemo(() => {
    if (level === "patna" && selectedDistrict) return `${districtWatersheds[selectedDistrict].label}, Bihar`;
    if (level === "patna") return "Bihar Watershed Region";
    if (level === "bihar") return "Bihar";
    return "India";
  }, [level, selectedDistrict]);

  function startExploration() {
    if (uploadedImagePreview) {
      introTimersRef.current.forEach(clearTimeout);
      setStateName("Bihar");
      setDistrictName("Jota");
      setRequestedPlace("Jota, Bihar");
      setSelectedDistrict("jota");
      setSelectedArea("low");
      setStarted(true);
      setLevel("india");
      setIntroPhase("globe");
      introTimersRef.current = [
        setTimeout(() => {
          setIntroPhase("bihar");
          setLevel("bihar");
        }, 2000),
        setTimeout(() => {
          setIntroPhase("patna");
          setLevel("patna");
        }, 5000),
        setTimeout(() => setIntroPhase("ready"), 8000),
      ];
      return;
    }

    const state = stateName.trim().toLowerCase();
    const district = districtName.trim().toLowerCase();

    if (state === "bihar" && districtWatersheds[district]) {
      // Clear any previous animation timers before starting a new journey.
      introTimersRef.current.forEach(clearTimeout);

      setRequestedPlace(`${districtWatersheds[district].label}, Bihar`);
      setSelectedDistrict(district);

      setStarted(true);
      setSelectedArea(null);
      setLevel("india");
      setIntroPhase("globe");

      // Deliberately paced: Earth → Bihar → Patna → watershed map.
      introTimersRef.current = [
        // 0–2s: quick scanning-earth beat, same look as the Bihar step.
        setTimeout(() => {
          setIntroPhase("bihar");
          setLevel("bihar");
        }, 2000),

        // 2–5s: smooth zoom from India into Bihar.
        setTimeout(() => {
          setIntroPhase("patna");
          setLevel("patna");
        }, 5000),

        // 5–8s: Patna zoom finishes, then reveal the watershed dashboard.
        setTimeout(() => {
          setIntroPhase("ready");
        }, 8000),
      ];

      return;
    }

    alert("For this demonstration, enter Bihar and either Banka, Khatangi, Gaya, or Jota.");
  }

  function searchDashboard() {
    const searchParts = dashboardSearch.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
    const [stateInput, districtInput] = searchParts.length === 1
      ? ["bihar", searchParts[0]]
      : searchParts;

    if (stateInput !== "bihar" || !districtWatersheds[districtInput]) {
      alert("For this demonstration, search for Banka, Khatangi, Gaya, or Jota.");
      return;
    }

    introTimersRef.current.forEach(clearTimeout);
    introTimersRef.current = [];
    setRequestedPlace(`${districtWatersheds[districtInput].label}, Bihar`);
    setSelectedDistrict(districtInput);
    setSelectedArea(null);
    setActiveMetric(null);
    setLevel("patna");
    setIntroPhase("ready");
  }

  useEffect(() => {
    return () => introTimersRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => () => {
    if (uploadedImagePreview) URL.revokeObjectURL(uploadedImagePreview);
  }, [uploadedImagePreview]);

  function handleImageUpload(event) {
    const image = event.target.files?.[0];
    if (!image) return;
    if (!image.type.startsWith("image/")) {
      alert("Please upload an image file.");
      event.target.value = "";
      return;
    }
    setUploadedImagePreview(URL.createObjectURL(image));
    setUploadedImageName(image.name);
  }

  function selectWatershed(area) {
    setSelectedArea(area);
    setActiveMetric(null);
  }

  function openTerrainViewer() {
    setTerrainZoom(1);
    setShowTerrain(true);
  }

  function open2dViewer() {
    setMapZoom(1);
    setShow2dViewer(true);
  }

  function goBack() {
    introTimersRef.current.forEach(clearTimeout);
    introTimersRef.current = [];
    setShowTerrain(false);
    setShow2dViewer(false);
    setActiveMetric(null);
    setSelectedArea(null);
    setSelectedDistrict(null);
    setSidebarOpen(false);
    setStateName("");
    setDistrictName("");
    setUploadedImagePreview("");
    setUploadedImageName("");
    setLevel("india");
    setIntroPhase("idle");
    setStarted(false);
  }

  /* =======================================================
     LANDING PAGE
  ======================================================= */

  if (!started) {
    return (
      <div className="app landing-page">

        <div className="landing-bg" aria-hidden="true">
          <span className="bg-blob blob-a" />
          <span className="bg-blob blob-b" />
          <span className="bg-blob blob-c" />
          <span className="flow-layer" />
        </div>

        <div className="landing-logo-corner">
          <img
            src="/panchtattva-logo.png"
            alt="PanchTattva"
            style={{ borderRadius: "8%", border: "4px solid #5f0d0d" }}
          />
        </div>

        <div className="hero-row">

          <aside className="side-panel side-panel-left">

            <div className="side-card">
              <span className="side-card-icon">≈</span>
              <b>Every drop counted</b>
              <p>
                A single watershed captures rainfall for every
                farm, pond and well downstream of it.
              </p>
            </div>

            <div className="side-card">
              <span className="side-card-icon">!</span>
              <b>Erosion risk</b>
              <p>
                Bare, steep slopes lose topsoil fast — often the
                first sign a watershed needs attention.
              </p>
            </div>

            <div className="side-card">
              <span className="side-card-icon">⌁</span>
              <b>Recharge, not just runoff</b>
              <p>
                Restoring a watershed lifts falling groundwater
                tables faster than any pump could.
              </p>
            </div>

          </aside>

          <main className="landing-main">

            <div className="hero-content">

              <span className="hero-kicker">
                GEOSPATIAL • SATELLITE • TERRAIN • WATER
              </span>

              <h2>
                Smart Watershed
                <span>Planning & Analysis</span>
              </h2>

              <p className="hero-description">
                A GIS-based decision support platform for
                watershed monitoring, environmental assessment,
                water-resource planning and sustainable development.
              </p>

              <div className="search-orbit">
                <div className="state-search">

                  <span className="search-icon">⌖</span>

                  <label className="location-search-field">
                    <span>State</span>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") startExploration();
                      }}
                      placeholder="e.g. Bihar"
                      aria-label="State name"
                    />
                  </label>

                  <label className="location-search-field">
                    <span>District / Panchayat</span>
                    <input
                      type="text"
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") startExploration();
                      }}
                      placeholder="e.g. Banka"
                      aria-label="District or panchayat name"
                    />
                  </label>

                  <button onClick={startExploration}>
                    Explore <span>→</span>
                  </button>

                </div>

                <div className="image-upload-entry">
                  <span className="image-upload-divider">or</span>
                  <div className="image-upload-content">
                    <label className="image-upload-control">
                      <span>Upload image</span>
                      <b>{uploadedImageName || "Choose one image"}</b>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        aria-label="Upload one watershed image"
                      />
                    </label>
                    {uploadedImagePreview && (
                      <div className="image-upload-preview">
                        <img src={uploadedImagePreview} alt="Uploaded watershed preview" />
                        <span title={uploadedImageName}>{uploadedImageName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <small className="search-hint">
                Demonstration coverage: <b>Bihar</b> - Banka (High & Medium) or Khatangi, Gaya, and Jota (Low). Uploading one image opens Low Priority directly.
              </small>

            </div>

          </main>

          <aside className="side-panel side-panel-right">

            <div className="side-card">
              <span className="side-card-icon">◉</span>
              <b>Satellite-driven</b>
              <p>
                Terrain, rainfall and vegetation mapped from
                satellite imagery and DEM data.
              </p>
            </div>

            <div className="side-card">
              <span className="side-card-icon">△</span>
              <b>Priority scoring</b>
              <p>
                Every zone ranked by erosion, runoff and slope
                risk, automatically.
              </p>
            </div>

            <div className="side-card">
              <span className="side-card-icon">▰</span>
              <b>Built for planners</b>
              <p>
                Turns raw geospatial data into concrete,
                actionable interventions.
              </p>
            </div>

          </aside>

        </div>

        <section className="info-section">

          <div className="info-column">

            <span className="section-kicker">WHY IT MATTERS</span>
            <h3>Why watersheds matter</h3>

            <ul className="info-list">
              <li>
                <span className="info-icon">≈</span>
                <div>
                  <b>Water security</b>
                  <p>
                    A watershed catches every drop of rainfall
                    and channels it into the wells, ponds and
                    rivers a community depends on.
                  </p>
                </div>
              </li>

              <li>
                <span className="info-icon">◈</span>
                <div>
                  <b>Slower, gentler runoff</b>
                  <p>
                    Healthy vegetation and contours slow monsoon
                    runoff, letting water soak into the soil
                    instead of stripping it away.
                  </p>
                </div>
              </li>

              <li>
                <span className="info-icon">!</span>
                <div>
                  <b>Falling groundwater</b>
                  <p>
                    A degraded watershed means drier summers,
                    lower groundwater tables and shrinking
                    farm yields.
                  </p>
                </div>
              </li>

              <li>
                <span className="info-icon">⌁</span>
                <div>
                  <b>The most cost-effective fix</b>
                  <p>
                    Restoring a watershed remains one of the
                    most cost-effective ways to build long-term
                    water security for a region.
                  </p>
                </div>
              </li>
            </ul>

          </div>

          <div className="info-column approach">

            <span className="section-kicker">OUR APPROACH</span>
            <h3>What PanchTattva does</h3>

            <ul className="info-list">
              <li>
                <span className="info-icon">◉</span>
                <div>
                  <b>Maps the terrain</b>
                  <p>
                    Combines satellite imagery and DEM data to
                    map rainfall, vegetation, slope and
                    elevation for a region.
                  </p>
                </div>
              </li>

              <li>
                <span className="info-icon">△</span>
                <div>
                  <b>Flags priority zones</b>
                  <p>
                    Highlights the zones where erosion and
                    runoff put water security most at risk,
                    ranked by priority.
                  </p>
                </div>
              </li>

              <li>
                <span className="info-icon">▰</span>
                <div>
                  <b>Recommends interventions</b>
                  <p>
                    Suggests specific fixes for each zone —
                    check dams, farm ponds, contour bunding —
                    based on its conditions.
                  </p>
                </div>
              </li>

              <li>
                <span className="info-icon">⌖</span>
                <div>
                  <b>Tracks progress on one dashboard</b>
                  <p>
                    Gives planners a single map to monitor
                    water resources as interventions are
                    built out.
                  </p>
                </div>
              </li>
            </ul>

          </div>

        </section>

      </div>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className={`app dashboard ${introPhase !== "idle" && introPhase !== "ready" ? "cinematic-active" : ""}`}>

      {introPhase !== "idle" && introPhase !== "ready" && (
        <div
          className={`cinematic-intro phase-${introPhase}`}
          aria-live="polite"
        >
          <div className="cinematic-globe" aria-hidden="true">
            <div className="globe-aura" />
            <img
              className="real-earth"
              src="https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg"
              alt=""
            />
            <div className="globe-vignette" />
            <div className="globe-atmosphere" />
          </div>

          <div className="cinematic-copy">
            <span className="cinematic-kicker">
              PANCHTATTVA • GEOSPATIAL ENGINE
            </span>

            <h1>
              {introPhase === "globe" && "Scanning India"}
              {introPhase === "bihar" && "Locating Bihar"}
              {introPhase === "patna" && `Zooming into ${requestedPlace}`}
            </h1>

            <p>
              {introPhase === "globe" &&
                "Rotating Earth • preparing the satellite journey."}
              {introPhase === "bihar" &&
                `State identified: Bihar. Moving toward ${requestedPlace}.`}
              {introPhase === "patna" &&
                `Displaying only the watershed priority zones mapped for ${requestedPlace}.`}
            </p>

            <div className="cinematic-location">
              <span className="location-pulse" />
              <b>
                {introPhase === "globe" && "INDIA"}
                {introPhase === "bihar" && "BIHAR, INDIA"}
                {introPhase === "patna" && requestedPlace.toUpperCase()}
              </b>
            </div>

            <div className="cinematic-progress">
              <span className={introPhase === "globe" ? "active" : ""} />
              <span className={introPhase === "bihar" ? "active" : ""} />
              <span className={introPhase === "patna" ? "active" : ""} />
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-actions">
        <button className="back-button" onClick={goBack}>
          ← Back
        </button>
        <form
          className="dashboard-search"
          onSubmit={(event) => {
            event.preventDefault();
            searchDashboard();
          }}
        >
          <span className="dashboard-search-icon">⌖</span>
          <input
            type="text"
            value={dashboardSearch}
            onChange={(event) => setDashboardSearch(event.target.value)}
            placeholder="Search district or panchayat"
            aria-label="Search watershed location"
          />
          <button type="submit">Search</button>
        </form>
        <img
          className="dashboard-brand"
          src="/panchtattva-logo.png"
          alt="PanchTattva"
        />

      </div>

      <div className="workspace">

        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

          <div className="sidebar-heading">

            <div>
              <span>MAP CONTROL</span>
              <h3>Layers & Analysis</h3>
            </div>

            <button onClick={() => setSidebarOpen(false)}>
              ×
            </button>

          </div>

          <div className="sidebar-logo">
            <img
              src="/panchtattva-logo.png"
              alt="PanchTattva"
            />
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
                className={`layer-button ${baseMap === key ? "active" : ""
                  }`}
                onClick={() => setBaseMap(key)}
              >
                <span className="layer-icon">{icon}</span>
                {label}
                {baseMap === key && <b>✓</b>}
              </button>
            ))}

          </div>

          {selectedZone && (
            <section className="sidebar-watershed-card">
              <span className="sidebar-watershed-card-title">Selected Watershed</span>
              <div className="sidebar-watershed-meta-grid">
                <div className="sidebar-watershed-meta-item">
                  <span>Latitude</span>
                  <b>{selectedZone.center[0].toFixed(6)}</b>
                </div>
                <div className="sidebar-watershed-meta-item">
                  <span>Longitude</span>
                  <b>{selectedZone.center[1].toFixed(6)}</b>
                </div>
                <div className="sidebar-watershed-meta-item">
                  <span>Made in year</span>
                  <b>{selectedZone.createdYear}</b>
                </div>
              </div>
            </section>
          )}


        </aside>

        <main className="content">

          <section className="map-section">

            <div className="section-heading">

              <div className="map-heading-group">
                {!sidebarOpen && (
                  <button
                    className="open-sidebar-button map-heading-sidebar-button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open layers and analysis sidebar"
                  >
                    ☰
                  </button>
                )}
                <div>
                <span className="section-kicker">
                  GEOSPATIAL MONITORING
                </span>
                <h2>Watershed Map</h2>
                </div>
              </div>

              <div className="map-location">
                ⌖ {currentLocation}
              </div>

            </div>

            <div className="map-frame">
              <GoogleMapsMap
                level={level}
                cinematic={introPhase !== "idle"}
                baseMap={baseMap}
                selectedArea={selectedArea}
                onSelectArea={selectWatershed}
                onLevelChange={setLevel}
                priorityZones={visiblePriorityZones}
              />

              <div className="map-overlay-badge">
                <span className="pulse-dot" />
                {baseMap.toUpperCase()} MAP
              </div>

              <div className="map-help">
                {introPhase !== "ready" && level === "india" &&
                  "Preparing global satellite view"}
                {introPhase !== "ready" && level === "bihar" &&
                  "Entering Bihar watershed region"}
                {introPhase !== "ready" && level === "patna" &&
                  "Zooming into Patna watershed areas"}

                {introPhase === "ready" && level === "india" &&
                  "Click the highlighted Bihar region"}
                {introPhase === "ready" && level === "bihar" &&
                  "Click Patna to enter the watershed view"}
                {introPhase === "ready" && level === "patna" &&
                  !selectedArea &&
                  `Showing ${requestedPlace} → watershed priority areas`}
              </div>

            </div>

          </section>

          <section className="visualization-section">
            <div className="section-heading compact">
              <div>
                <h2>Analysis of the selected area</h2>
              </div>
              
              {selectedData && (
                <span className={`priority-badge ${selectedArea}`}>
                  {selectedZone.label.toUpperCase()} PRIORITY
                </span>
              )}
            </div>
            {!selectedData ? (
              <div className="empty-analysis">
                <div className="empty-icon">⌖</div>
                <div>
                  <b>No watershed selected</b>
                  <span>
                    Select a priority zone on the map to view
                    rainfall, NDVI, slope, erosion and
                    water-resource indicators.
                  </span>
                </div>
              </div>
            ) : (
              <div className="analysis-grid">

                <div className={`analysis-card primary ${selectedArea}-priority`}>

                  <div className="analysis-card-top">

                    <div>
                      <h3>{selectedData.name}</h3>
                      <p>{districtWatersheds[selectedDistrict]?.label} District • Rural Watershed Zone</p>
                    </div>

                    <div className="score-ring">
                      <b>{selectedData.score}</b>
                      <span>Priority</span>
                    </div>

                  </div>

                  <div className="metric-row">
                    <button className="metric-button" onClick={() => setActiveMetric("rainfall")}>
                      <span>Rainfall</span>
                      <b>{formatMetric(selectedData.rainfall)}<small> mm</small></b>
                    </button>
                    <button className="metric-button" onClick={() => setActiveMetric("ndvi")}>
                      <span>NDVI</span>
                      <b>{formatMetric(selectedData.ndvi)}</b>
                    </button>
                    <button className="metric-button" onClick={() => setActiveMetric("slope")}>
                      <span>Slope</span>
                      <b>{formatMetric(selectedData.slope)}°</b>
                    </button>
                    <button className="metric-button" onClick={() => setActiveMetric("area")}>
                      <span>Area</span>
                      <b>{formatMetric(selectedData.area)}<small> km²</small></b>
                    </button>
                  </div>

                  <div className="data-source-note">
                    Data source: <b>Google Earth Engine</b>
                  </div>

                </div>

                  <div className="analysis-card conditions">

                    <span className="card-label">
                    CURRENT CONDITIONS
                    </span>

                  {isLowPriority ? (
                    <>
                      <div className="condition-item">
                        <span>Annual Rainfall</span>
                        <b>{Number(selectedData.rainfall).toFixed(3)} mm</b>
                      </div>
                      <div className="condition-item">
                        <span>NDVI</span>
                        <b>{Number(selectedData.ndvi).toFixed(3)}</b>
                      </div>
                      <div className="condition-item">
                        <span>Average Slope</span>
                        <b>{Number(selectedData.slope).toFixed(3)}°</b>
                      </div>
                      <div className="condition-item">
                        <span>Elevation</span>
                        <b>{Number(selectedData.elevation).toFixed(3)} m</b>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="condition-item">
                        <span>Annual Rainfall</span>
                        <b>{Number(selectedData.rainfall).toFixed(3)} mm</b>
                      </div>
                      <div className="condition-item">
                        <span>Erosion Risk</span>
                        <b>{selectedData.erosion}</b>
                      </div>
                      <div className="condition-item">
                        <span>Surface Runoff Potential</span>
                        <b>{selectedData.runoff}</b>
                      </div>
                      <div className="condition-item">
                        <span>Monsoon/Q3 Rainfall</span>
                        <b>{selectedData.monsoonRainfall} mm</b>
                      </div>
                    </>
                  )}

                </div>

                <div className="analysis-card recommendation-card">

                  <span className="card-label">
                    RECOMMENDED ACTION
                  </span>

                  <div className="recommendation-list">
                    {selectedData.actions.map((action) => (
                      <span key={action}>✓ {action}</span>
                    ))}
                  </div>

                </div>

              </div>
            )}
          </section>

          <section className="summary-section">
            <div className="summary-card">
              <span className="card-label">SUMMARY</span>
              <p>
                {selectedData
                  ? selectedData.recommendation
                  : "Select a watershed to view its summary."}
              </p>
            </div>
          </section>

          <section className="visualization-section">
            <div className="section-heading compact">
              <div>
                <h2>Visualization for watershed development</h2>
              </div>

            </div>

            <div className="visual-grid">

              <div className="visual-card">

                <div className="visual-card-header">
                  <div>
                    <h3>2D Visualization</h3>
                  </div>
                </div>

                {selectedData ? (
                  <div className="visual-clickable">
                    <div className="visual-2d">
                      <img
                        src={watershed2dImages[selectedArea]}
                        alt={`${selectedArea} priority watershed 2D visualization`}
                      />
                    </div>
                    <button
                      className="visual-open-button"
                      onClick={open2dViewer}
                    >
                      View 2D Terrain
                    </button>
                  </div>
                ) : (
                  <div className="visual-placeholder">
                    Select a watershed to generate the development map.
                  </div>
                )}

              </div>

              <div className="visual-card">

                <div className="visual-card-header">
                  <div>
                    <h3>3D Visualization</h3>
                  </div>
                </div>

                {selectedData ? (
                  <div className="visual-clickable">
                    <div className="visual-3d">
                      <img
                        src={watershed3dImages[selectedArea]}
                        alt={`${selectedArea} priority watershed 3D visualization`}
                      />
                    </div>
                    <button
                      className="visual-open-button"
                      onClick={openTerrainViewer}
                    >
                      View 3D Terrain
                    </button>
                  </div>
                ) : (
                  <div className="visual-placeholder">
                    Select a watershed to preview its terrain model.
                  </div>
                )}

              </div>

            </div>

          </section>

        </main>
      </div>

      {showTerrain && selectedData && (
        <div
          className="terrain-overlay"
          onClick={() => setShowTerrain(false)}
        >
          <div
            className="terrain-modal terrain-modal-shell"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="terrain-close"
              onClick={() => setShowTerrain(false)}
            >
              ×
            </button>

            <div className="terrain-modal-header">
              <div>
                <h2>3D Watershed Terrain</h2>
              </div>
            </div>

            <div className="terrain-image-viewer">
              <img
                src={watershed3dImages[selectedArea]}
                alt={`${selectedArea} priority watershed 3D terrain`}
                style={{ transform: `scale(${terrainZoom})` }}
              />
              <div className="terrain-zoom-controls" aria-label="Image zoom controls">
                <button
                  type="button"
                  onClick={() => setTerrainZoom((zoom) => Math.max(1, zoom - 0.25))}
                  aria-label="Zoom out"
                  disabled={terrainZoom <= 1}
                >
                  −
                </button>
                <span>{Math.round(terrainZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setTerrainZoom((zoom) => Math.min(3, zoom + 0.25))}
                  aria-label="Zoom in"
                  disabled={terrainZoom >= 3}
                >
                  +
                </button>
              </div>
            </div>

            <div className="terrain-stats">
              <div>
                <span>Minimum Elevation</span>
                <b>{selectedData.elevationMin} m</b>
              </div>
              <div>
                <span>Maximum Elevation</span>
                <b>{selectedData.elevationMax} m</b>
              </div>
              <div>
                <span>Elevation Range</span>
                <b>
                  {selectedData.elevationMax -
                    selectedData.elevationMin}{" "}
                  m
                </b>
              </div>
              <div>
                <span>Average Slope</span>
                <b>{selectedData.slope}°</b>
              </div>
            </div>

          </div>
        </div>
      )}

      {show2dViewer && selectedData && (
        <div
          className="terrain-overlay"
          onClick={() => setShow2dViewer(false)}
        >
          <div
            className="terrain-modal terrain-modal-shell"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="terrain-close"
              onClick={() => setShow2dViewer(false)}
              aria-label="Close 2D map viewer"
            >
              ×
            </button>

            <div className="terrain-modal-header">
              <div>
                <h2>2D Watershed Map</h2>
              </div>
            </div>

            <div className="terrain-image-viewer">
              <img
                src={watershed2dImages[selectedArea]}
                alt={`${selectedArea} priority watershed 2D map`}
                style={{ transform: `scale(${mapZoom})` }}
              />
              <div className="terrain-zoom-controls" aria-label="Map zoom controls">
                <button
                  type="button"
                  onClick={() => setMapZoom((zoom) => Math.max(1, zoom - 0.25))}
                  aria-label="Zoom out"
                  disabled={mapZoom <= 1}
                >
                  −
                </button>
                <span>{Math.round(mapZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setMapZoom((zoom) => Math.min(3, zoom + 0.25))}
                  aria-label="Zoom in"
                  disabled={mapZoom >= 3}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMetric && selectedArea && (
        <MetricChartModal
          area={selectedArea}
          metric={activeMetric}
          mode={chartMode}
          onModeChange={setChartMode}
          onClose={() => setActiveMetric(null)}
        />
      )}

    </div>
  );
}

export default App;
