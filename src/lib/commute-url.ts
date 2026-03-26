import type { CarType, TripLegs } from "./emissions";
import {
  DEFAULT_EV_KWH_PER_100KM,
  DEFAULT_ONE_WAY_DISTANCE_KM,
} from "./emissions";

export type CommuteUrlState = {
  km: number;
  tripLegs: TripLegs;
  carType: CarType;
  evKwhPer100km: number;
  carOccupants: number;
  daysPerWeek: number;
  weeksPerYear: number;
};

export const DEFAULT_COMMUTE_STATE: CommuteUrlState = {
  km: DEFAULT_ONE_WAY_DISTANCE_KM,
  tripLegs: "round-trip",
  carType: "compact",
  evKwhPer100km: DEFAULT_EV_KWH_PER_100KM,
  carOccupants: 1,
  daysPerWeek: 5,
  weeksPerYear: 48,
};

const TRIP_DECODE: Record<string, TripLegs> = {
  ow: "one-way",
  rt: "round-trip",
};

const CAR_TYPES: CarType[] = ["compact", "suv", "truck", "ev"];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function parseCommuteSearchParams(
  searchParams: URLSearchParams
): Partial<CommuteUrlState> {
  const out: Partial<CommuteUrlState> = {};

  const km = searchParams.get("km");
  if (km !== null) {
    const v = Number.parseInt(km, 10);
    if (!Number.isNaN(v)) out.km = clamp(v, 8, 35);
  }

  const trip = searchParams.get("trip");
  if (trip !== null && trip in TRIP_DECODE) {
    out.tripLegs = TRIP_DECODE[trip];
  }

  const car = searchParams.get("car");
  if (car !== null && CAR_TYPES.includes(car as CarType)) {
    out.carType = car as CarType;
  }

  const evKwh = searchParams.get("evKwh");
  if (evKwh !== null) {
    const v = Number.parseFloat(evKwh);
    if (!Number.isNaN(v)) out.evKwhPer100km = clamp(v, 12, 35);
  }

  const pool = searchParams.get("pool");
  if (pool !== null) {
    const v = Number.parseInt(pool, 10);
    if (!Number.isNaN(v)) out.carOccupants = clamp(v, 1, 4);
  }

  const days = searchParams.get("days");
  if (days !== null) {
    const v = Number.parseInt(days, 10);
    if (!Number.isNaN(v)) out.daysPerWeek = clamp(v, 1, 7);
  }

  const weeks = searchParams.get("weeks");
  if (weeks !== null) {
    const v = Number.parseInt(weeks, 10);
    if (!Number.isNaN(v)) out.weeksPerYear = clamp(v, 1, 52);
  }

  return out;
}

export function mergeInitialCommuteState(sp: URLSearchParams): CommuteUrlState {
  const partial = parseCommuteSearchParams(sp);
  return { ...DEFAULT_COMMUTE_STATE, ...partial };
}

export function serializeCommuteSearchParams(state: CommuteUrlState): string {
  const p = new URLSearchParams();
  const tripEnc: Record<TripLegs, string> = {
    "one-way": "ow",
    "round-trip": "rt",
  };
  p.set("km", String(state.km));
  p.set("trip", tripEnc[state.tripLegs]);
  p.set("car", state.carType);
  if (state.carType === "ev") {
    p.set("evKwh", String(state.evKwhPer100km));
  }
  p.set("pool", String(state.carOccupants));
  p.set("days", String(state.daysPerWeek));
  p.set("weeks", String(state.weeksPerYear));
  return p.toString();
}
