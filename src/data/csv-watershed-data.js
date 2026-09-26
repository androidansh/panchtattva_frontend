import highYearwiseCsv from "./high-priority-yearwise 2008-2025.csv?raw";
import highQuarterlyCsv from "./high-priority-quarterly-2008-2025.csv?raw";
import mediumYearwiseCsv from "./medium-priority-yearwise-2008-2025.csv?raw";
import mediumQuarterlyCsv from "./medium-priority-quarterly-2008-2025.csv?raw";
import lowYearwiseCsv from "./pond-low-yearwise-2021-2025.csv?raw";
import lowQuarterlyCsv from "./pond-low-quarterly-2021-2025.csv?raw";
import khatangiLowYearwiseCsv from "./low-priority-yearwise-2010-2025.csv?raw";
import khatangiLowQuarterlyCsv from "./low-priority-quarterly-2010-2025.csv?raw";

function parseCsv(csv) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.split(",");
      return headers.reduce((row, header, index) => {
        row[header] = values[index]?.trim() ?? "";
        return row;
      }, {});
    });
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapYearwiseRows(csv) {
  return parseCsv(csv).map((row) => ({
    year: row.year,
    rainfall: number(row.annual_rainfall_mm),
    ndvi: number(row.ndvi),
    slope: number(row.slope_deg),
    elevation: number(row.elevation_m),
    soilLoss: number(row.estimated_soil_loss_t_ha_yr),
    area: null,
  }));
}

function mapQuarterlyRows(csv) {
  return parseCsv(csv).map((row) => ({
    year: row.year,
    period: row.quarter,
    rainfall: number(row.rainfall_mm),
    ndvi: number(row.ndvi),
    slope: number(row.slope_deg),
    area: null,
  }));
}

export const csvWatershedData = {
  high: {
    sourceFile: "high-priority-yearwise 2008-2025.csv",
    quarterlySourceFile: "high-priority-quarterly-2008-2025.csv",
    yearly: mapYearwiseRows(highYearwiseCsv),
    quarterly: mapQuarterlyRows(highQuarterlyCsv),
  },
  medium: {
    sourceFile: "medium-priority-yearwise-2008-2025.csv",
    quarterlySourceFile: "medium-priority-quarterly-2008-2025.csv",
    yearly: mapYearwiseRows(mediumYearwiseCsv),
    quarterly: mapQuarterlyRows(mediumQuarterlyCsv),
  },
  low: {
    sourceFile: "pond-low-yearwise-2021-2025.csv",
    quarterlySourceFile: "pond-low-quarterly-2021-2025.csv",
    yearly: mapYearwiseRows(lowYearwiseCsv),
    quarterly: mapQuarterlyRows(lowQuarterlyCsv),
  },
  lowKhatangi: {
    sourceFile: "low-priority-yearwise-2010-2025.csv",
    quarterlySourceFile: "low-priority-quarterly-2010-2025.csv",
    yearly: mapYearwiseRows(khatangiLowYearwiseCsv),
    quarterly: mapQuarterlyRows(khatangiLowQuarterlyCsv),
  },
};
