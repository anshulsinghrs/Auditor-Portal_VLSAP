import { AuditRecord } from "../types";

/**
 * Mathematically rigorous Krippendorff's Alpha implementation for rater reliability.
 * Supports missing values (natively) and nominal/ordinal differences.
 */
export interface AlphaResult {
  alpha: number;
  observedDisagreement: number;
  expectedDisagreement: number;
  bootstrapCI: [number, number]; // [2.5th percentile, 97.5th percentile]
  unknownRate: number;
  sampleSize: number;
  raterCount: number;
}

export function calculateKrippendorffAlpha(
  audits: AuditRecord[],
  variableId: string,
  raters: string[],
  imageIds: string[],
  mode: "Cold Read" | "Warm Read" | "Validation",
  metric: "nominal" | "ordinal" = "nominal"
): AlphaResult {
  // 1. Build the coincidence/reliability matrix
  // Rows: Images (Units)
  // Columns: Raters (Observers)
  // Values: Answers (Categories)
  
  // Filter audits for this variable and mode
  const filteredAudits = audits.filter(
    (a) => a.variableId === variableId && a.mode === mode && raters.includes(a.auditorId)
  );

  const numUnits = imageIds.length;
  const numRaters = raters.length;

  if (filteredAudits.length === 0 || numUnits === 0 || numRaters <= 1) {
    return {
      alpha: 0,
      observedDisagreement: 0,
      expectedDisagreement: 0,
      bootstrapCI: [0, 0],
      unknownRate: 0,
      sampleSize: 0,
      raterCount: numRaters
    };
  }

  // Create grid
  const grid: (string | null)[][] = Array(numUnits)
    .fill(null)
    .map(() => Array(numRaters).fill(null));

  let unknownCount = 0;
  let totalRatingCells = 0;

  imageIds.forEach((imgId, uIdx) => {
    raters.forEach((rater, rIdx) => {
      const match = filteredAudits.find((a) => a.imageId === imgId && a.auditorId === rater);
      if (match) {
        totalRatingCells++;
        if (match.value === "Unknown" || match.value === "N/A" || match.value === "") {
          unknownCount++;
          grid[uIdx][rIdx] = null; // Treat Unknown or N/A as missing in the reliability matrix
        } else {
          // Normalize some values for ordinal comparisons (strip out texts like "1 (Very Poor)" to "1")
          let cleanVal = match.value;
          if (cleanVal.includes("(")) {
            cleanVal = cleanVal.split(" ")[0];
          }
          grid[uIdx][rIdx] = cleanVal;
        }
      }
    });
  });

  const unknownRate = totalRatingCells > 0 ? unknownCount / totalRatingCells : 0;

  // List of all unique distinct categorical values in the grid (excluding null)
  const categories = Array.from(
    new Set(
      grid.flatMap((row) => row).filter((val): val is string => val !== null)
    )
  ).sort();

  if (categories.length <= 1) {
    // If all raters agree 100% on the exact same category, or there is only 1 category, Alpha is 1.0 (or 0 if empty)
    const validRatingsCount = grid.flatMap((row) => row).filter((v) => v !== null).length;
    return {
      alpha: validRatingsCount > 0 ? 1.0 : 0.0,
      observedDisagreement: 0,
      expectedDisagreement: 0,
      bootstrapCI: [1.0, 1.0],
      unknownRate,
      sampleSize: validRatingsCount,
      raterCount: numRaters
    };
  }

  // Compute Alpha for the full dataset
  const { alpha, obsDis, expDis, sampleSize } = computeAlphaCore(grid, categories, metric);

  // Run Bootstrapping to get 95% Confidence Intervals (500 resamples)
  const bootstrapAlphas: number[] = [];
  const B = 200; // 200 is fast, stable, and highly accurate for the preview engine without lag

  for (let b = 0; b < B; b++) {
    // Resample units with replacement
    const resampledGrid: (string | null)[][] = [];
    for (let i = 0; i < numUnits; i++) {
      const randIdx = Math.floor(Math.random() * numUnits);
      resampledGrid.push([...grid[randIdx]]);
    }
    const bRes = computeAlphaCore(resampledGrid, categories, metric);
    if (!isNaN(bRes.alpha)) {
      bootstrapAlphas.push(bRes.alpha);
    }
  }

  bootstrapAlphas.sort((a, b) => a - b);
  const lowerIdx = Math.floor(bootstrapAlphas.length * 0.025);
  const upperIdx = Math.floor(bootstrapAlphas.length * 0.975);
  
  const lowerCI = bootstrapAlphas.length > 0 ? bootstrapAlphas[lowerIdx] : alpha;
  const upperCI = bootstrapAlphas.length > 0 ? bootstrapAlphas[upperIdx] : alpha;

  return {
    alpha: isNaN(alpha) ? 0 : alpha,
    observedDisagreement: obsDis,
    expectedDisagreement: expDis,
    bootstrapCI: [lowerCI || 0, upperCI || 0],
    unknownRate,
    sampleSize,
    raterCount: numRaters
  };
}

// Distance metrics for Krippendorff's Alpha
function getDistance(v1: string, v2: string, metric: "nominal" | "ordinal"): number {
  if (v1 === v2) return 0;
  if (metric === "nominal") return 1;

  // Ordinal distance based on parsing numbers
  const n1 = parseFloat(v1);
  const n2 = parseFloat(v2);
  if (!isNaN(n1) && !isNaN(n2)) {
    return Math.abs(n1 - n2);
  }
  
  // Levels fallback (e.g. "Level 1", "Level 2")
  const l1 = v1.match(/\d+/);
  const l2 = v2.match(/\d+/);
  if (l1 && l2) {
    return Math.abs(parseInt(l1[0]) - parseInt(l2[0]));
  }

  return 1; // Default back to nominal if non-numeric
}

function computeAlphaCore(
  grid: (string | null)[][],
  categories: string[],
  metric: "nominal" | "ordinal"
) {
  let n = 0; // Total valid ratings pairs
  const coincidences: Record<string, Record<string, number>> = {};
  
  // Initialize coincidence dictionary
  categories.forEach((c1) => {
    coincidences[c1] = {};
    categories.forEach((c2) => {
      coincidences[c1][c2] = 0;
    });
  });

  // Calculate coincidence counts
  grid.forEach((row) => {
    const validRatings = row.filter((v): v is string => v !== null);
    const m = validRatings.length;
    if (m <= 1) return; // Need at least two rater readings for a unit to compute disagreements

    for (let i = 0; i < m; i++) {
      const v1 = validRatings[i];
      for (let j = 0; j < m; j++) {
        if (i === j) continue;
        const v2 = validRatings[j];
        coincidences[v1][v2] += 1 / (m - 1);
      }
    }
    n += m;
  });

  // Total coincidences count
  let totalCoincidences = 0;
  categories.forEach((c1) => {
    categories.forEach((c2) => {
      totalCoincidences += coincidences[c1][c2];
    });
  });

  if (totalCoincidences === 0) {
    return { alpha: NaN, obsDis: 0, expDis: 0, sampleSize: 0 };
  }

  // Calculate marginal frequencies (sum of rows)
  const marginals: Record<string, number> = {};
  categories.forEach((c) => {
    marginals[c] = 0;
    categories.forEach((other) => {
      marginals[c] += coincidences[c][other];
    });
  });

  // Observed Disagreement (D_o)
  let obsDis = 0;
  categories.forEach((c1) => {
    categories.forEach((c2) => {
      const d = getDistance(c1, c2, metric);
      obsDis += coincidences[c1][c2] * d;
    });
  });
  obsDis = obsDis / totalCoincidences;

  // Expected Disagreement (D_e)
  let expDis = 0;
  categories.forEach((c1) => {
    const n1 = marginals[c1];
    categories.forEach((c2) => {
      const n2 = marginals[c2];
      const d = getDistance(c1, c2, metric);
      expDis += n1 * n2 * d;
    });
  });
  expDis = expDis / (totalCoincidences * (totalCoincidences - 1));

  const alpha = expDis === 0 ? 1.0 : 1 - (obsDis / expDis);

  return { alpha, obsDis, expDis, sampleSize: totalCoincidences };
}
