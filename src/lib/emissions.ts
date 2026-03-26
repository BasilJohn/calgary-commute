/**
 * Emission factors for MVP comparison (CO₂e — carbon dioxide equivalent).
 */

export const C_TRAIN_G_CO2E_PER_PASSENGER_KM = 52;

export const DEFAULT_ONE_WAY_DISTANCE_KM = 20;

export const ICE_G_CO2E_PER_KM = {
  compact: 140,
  suv: 210,
  truck: 280,
} as const;

export const ALBERTA_GRID_G_CO2E_PER_KWH = 420;

export const DEFAULT_EV_KWH_PER_100KM = 19;

export type CarType = keyof typeof ICE_G_CO2E_PER_KM | "ev";

export type TripLegs = "one-way" | "round-trip";

export type CompareOptions = {
  carType: CarType;
  carOccupants: number;
  evKwhPer100km: number;
};

export type EmissionComparison = {
  distanceOneWayKm: number;
  tripLegs: TripLegs;
  totalKm: number;
  carType: CarType;
  carOccupants: number;
  evKwhPer100km: number | null;
  vehicleKgCo2e: number;
  carPerPersonKgCo2e: number;
  trainKgCo2e: number;
  savingsKgCo2e: number;
  trainVsCarPercent: number;
  carGCo2ePerVehicleKm: number;
};

export function totalTripKm(
  distanceOneWayKm: number,
  tripLegs: TripLegs
): number {
  const legs = tripLegs === "round-trip" ? 2 : 1;
  return Math.max(0, distanceOneWayKm) * legs;
}

export function carGCo2ePerVehicleKm(options: CompareOptions): number {
  if (options.carType === "ev") {
    const kwhPerKm = options.evKwhPer100km / 100;
    return kwhPerKm * ALBERTA_GRID_G_CO2E_PER_KWH;
  }
  return ICE_G_CO2E_PER_KM[options.carType];
}

export function compareCarVsCTrain(
  distanceOneWayKm: number,
  tripLegs: TripLegs,
  options: CompareOptions
): EmissionComparison {
  const totalKm = totalTripKm(distanceOneWayKm, tripLegs);
  const carGPerKm = carGCo2ePerVehicleKm(options);
  const vehicleG = totalKm * carGPerKm;
  const occupants = Math.min(4, Math.max(1, Math.round(options.carOccupants)));
  const vehicleKgCo2e = vehicleG / 1000;
  const carPerPersonKgCo2e = vehicleKgCo2e / occupants;
  const trainG = totalKm * C_TRAIN_G_CO2E_PER_PASSENGER_KM;
  const trainKgCo2e = trainG / 1000;
  const savingsKgCo2e = Math.max(0, carPerPersonKgCo2e - trainKgCo2e);
  const trainVsCarPercent =
    carPerPersonKgCo2e > 0
      ? (1 - trainKgCo2e / carPerPersonKgCo2e) * 100
      : 0;

  return {
    distanceOneWayKm,
    tripLegs,
    totalKm,
    carType: options.carType,
    carOccupants: occupants,
    evKwhPer100km: options.carType === "ev" ? options.evKwhPer100km : null,
    vehicleKgCo2e,
    carPerPersonKgCo2e,
    trainKgCo2e,
    savingsKgCo2e,
    trainVsCarPercent,
    carGCo2ePerVehicleKm: carGPerKm,
  };
}

export function commutesPerYear(
  daysPerWeek: number,
  weeksPerYear: number
): number {
  const d = Math.min(7, Math.max(1, Math.round(daysPerWeek)));
  const w = Math.min(52, Math.max(1, Math.round(weeksPerYear)));
  return d * w;
}
