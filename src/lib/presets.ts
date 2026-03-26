export type CommutePreset = {
  id: string;
  origin: string;
  oneWayDistanceKm: number;
};

export const NW_TO_DOWNTOWN_PRESETS: CommutePreset[] = [
  { id: "brentwood", origin: "Brentwood", oneWayDistanceKm: 11 },
  { id: "varsity", origin: "Varsity", oneWayDistanceKm: 12 },
  { id: "dalhousie", origin: "Dalhousie", oneWayDistanceKm: 13 },
  { id: "silver-springs", origin: "Silver Springs", oneWayDistanceKm: 14 },
  { id: "crowfoot", origin: "Crowfoot", oneWayDistanceKm: 15 },
  { id: "arbour-lake", origin: "Arbour Lake", oneWayDistanceKm: 16 },
  { id: "hawkwood", origin: "Hawkwood", oneWayDistanceKm: 16 },
  { id: "ranchlands", origin: "Ranchlands", oneWayDistanceKm: 17 },
  { id: "edgemont", origin: "Edgemont", oneWayDistanceKm: 17 },
  { id: "panorama-hills", origin: "Panorama Hills", oneWayDistanceKm: 17 },
  { id: "citadel", origin: "Citadel", oneWayDistanceKm: 18 },
  { id: "hamptons", origin: "Hamptons", oneWayDistanceKm: 20 },
  { id: "tuscany", origin: "Tuscany", oneWayDistanceKm: 21 },
  { id: "royal-oak", origin: "Royal Oak", oneWayDistanceKm: 24 },
];
