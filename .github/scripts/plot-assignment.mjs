// Deterministic plot assignment system
// Replaces AI-based assignment with rule-based zoning logic

import fs from 'fs/promises';

// Zone definitions matching js/buildings.js PLOTS array
export const ZONES = {
  'town-square': {
    name: 'Town Square',
    plots: [1, 2, 3, 4],
    reserved: true,
    description: 'RESERVED — Open civic space around Town Hall. No buildings allowed.',
  },
  'main-west': {
    name: 'Main Street West',
    plots: [5, 6, 7, 8, 9],
    preferredTypes: ['shop', 'restaurant'],
    description: 'Western commercial strip. High foot-traffic retail.',
  },
  'main-east': {
    name: 'Main Street East',
    plots: [10, 11, 12, 13, 14],
    preferredTypes: ['entertainment', 'restaurant', 'shop'],
    description: 'Eastern commercial & entertainment district.',
  },
  'north-residential': {
    name: 'North Residential',
    plots: [15, 16, 17, 18, 19],
    preferredTypes: ['house', 'nature', 'other'],
    description: 'Quiet tree-lined lane. Houses and quiet retreats.',
  },
  'south-residential': {
    name: 'South Residential',
    plots: [20, 21, 22, 23, 24],
    preferredTypes: ['house', 'nature', 'public', 'other'],
    description: 'Winding southern lane with village feel.',
  },
  'outskirts': {
    name: 'Village Outskirts',
    plots: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    preferredTypes: ['other', 'nature', 'public'],
    description: 'Scattered structures on town edges. Room for large or unique buildings.',
  },
};

// Type priority scoring (higher = more important to place well)
const TYPE_PRIORITY = {
  shop: 5,
  restaurant: 5,
  entertainment: 4,
  public: 3,
  house: 2,
  nature: 2,
  other: 1,
};

// Load current buildings from town.json
export async function loadTownData() {
  try {
    const data = await fs.readFile('town.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Get occupied plots
export function getOccupiedPlots(townData) {
  return new Set(townData.map(b => b.plot));
}

// Get available plots in a zone
export function getAvailablePlotsInZone(zone, occupied) {
  return zone.plots.filter(p => !occupied.has(p));
}

// Score a plot for a building type
function scorePlot(plot, buildingType, zone, occupied) {
  let score = 0;

  // Zone preference match
  if (zone.preferredTypes && zone.preferredTypes.includes(buildingType)) {
    score += 100;
  }

  // Prefer earlier plots in preferred zones
  const plotIndex = zone.plots.indexOf(plot);
  score += (zone.plots.length - plotIndex) * 5;

  // Bonus for public buildings in outskirts (more space)
  if (buildingType === 'public' && zone.name === 'Village Outskirts') {
    score += 20;
  }

  // Bonus for large plot numbers in outskirts (plot 40 is biggest)
  if (zone.name === 'Village Outskirts' && plot >= 35) {
    score += 10;
  }

  return score;
}

// Assign plot deterministically based on building type
export async function assignPlot(buildingType, buildingName = '', buildingDesc = '') {
  const townData = await loadTownData();
  const occupied = getOccupiedPlots(townData);

  // Filter out reserved zones
  const availableZones = Object.entries(ZONES).filter(([key, zone]) => !zone.reserved);

  // Score all available plots
  const candidates = [];

  for (const [zoneKey, zone] of availableZones) {
    const availablePlots = getAvailablePlotsInZone(zone, occupied);

    for (const plot of availablePlots) {
      const score = scorePlot(plot, buildingType, zone, occupied);
      candidates.push({ plot, zone: zone.name, score });
    }
  }

  if (candidates.length === 0) {
    throw new Error('No available plots');
  }

  // Sort by score (highest first), then by plot number (lowest first) for determinism
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.plot - b.plot;
  });

  const chosen = candidates[0];

  // Log assignment reasoning
  const reasoning = {
    plot: chosen.plot,
    zone: chosen.zone,
    buildingName,
    buildingType,
    score: chosen.score,
    timestamp: new Date().toISOString(),
  };

  // Append to planning history
  try {
    let history = [];
    try {
      const data = await fs.readFile('town-planning.json', 'utf-8');
      history = JSON.parse(data);
    } catch {}

    history.push(reasoning);
    await fs.writeFile('town-planning.json', JSON.stringify(history, null, 2));
  } catch (error) {
    console.warn('Could not update planning history:', error.message);
  }

  return {
    plot: chosen.plot,
    zone: chosen.zone,
    reasoning: `Assigned to ${chosen.zone} (plot ${chosen.plot}) — best fit for ${buildingType} building`,
  };
}

// Get zone statistics
export async function getZoneStats() {
  const townData = await loadTownData();
  const occupied = getOccupiedPlots(townData);

  const stats = {};
  for (const [key, zone] of Object.entries(ZONES)) {
    const occupiedCount = zone.plots.filter(p => occupied.has(p)).length;
    stats[key] = {
      name: zone.name,
      total: zone.plots.length,
      occupied: occupiedCount,
      available: zone.plots.length - occupiedCount,
      reserved: zone.reserved || false,
    };
  }

  return stats;
}

// Validate plot assignment (check for conflicts)
export async function validatePlotAssignment(plot, username) {
  const townData = await loadTownData();

  // Check reserved plots
  if (plot >= 1 && plot <= 4) {
    return { valid: false, reason: 'Plots 1-4 are reserved (Town Square)' };
  }

  // Check if plot already occupied
  const existing = townData.find(b => b.plot === plot);
  if (existing) {
    return { valid: false, reason: `Plot ${plot} is already occupied by ${existing.name}` };
  }

  // Check if user already has a building
  const userBuilding = townData.find(b => b.contributor.username === username);
  if (userBuilding) {
    return { valid: false, reason: `User already has a building: ${userBuilding.name} (plot ${userBuilding.plot})` };
  }

  // Check plot exists (0-40)
  if (plot < 0 || plot > 40) {
    return { valid: false, reason: `Plot ${plot} is out of range (0-40)` };
  }

  return { valid: true };
}
