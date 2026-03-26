"use client";

import type { CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ALBERTA_GRID_G_CO2E_PER_KWH,
  C_TRAIN_G_CO2E_PER_PASSENGER_KM,
  ICE_G_CO2E_PER_KM,
  commutesPerYear,
  compareCarVsCTrain,
  type CarType,
  type TripLegs,
} from "@/lib/emissions";
import type { CommuteUrlState } from "@/lib/commute-url";
import { serializeCommuteSearchParams } from "@/lib/commute-url";
import {
  ROUGH_KG_CO2E_PER_OIL_BARREL,
  ROUGH_KG_CO2E_PER_TREE_YEAR,
  roughOilBarrelsEquivalent,
  roughTreeYearsEquivalent,
} from "@/lib/equivalents";
import { NW_TO_DOWNTOWN_PRESETS } from "@/lib/presets";

function formatKg(value: number): string {
  if (value < 0.01 && value > 0) return value.toExponential(1);
  return value.toFixed(2);
}

function formatRough(n: number): string {
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

function rangePct(value: number, min: number, max: number): string {
  if (max <= min) return "0%";
  const p = ((value - min) / (max - min)) * 100;
  return `${Math.min(100, Math.max(0, p))}%`;
}

function rangeStyle(value: number, min: number, max: number): CSSProperties {
  return { "--range-pct": rangePct(value, min, max) } as CSSProperties;
}

const CAR_OPTIONS: { id: CarType; label: string }[] = [
  { id: "compact", label: "Compact" },
  { id: "suv", label: "SUV" },
  { id: "truck", label: "Truck" },
  { id: "ev", label: "EV (AB grid)" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 dark:focus-visible:ring-offset-zinc-950";

const cardSurface =
  "commute-card-lift overflow-visible rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_12px_40px_-18px_rgba(15,23,42,0.1)] backdrop-blur-md sm:p-5 dark:border-zinc-800/90 dark:bg-zinc-900/55 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_16px_48px_-20px_rgba(0,0,0,0.55)]";

const sectionLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400";

const bodyMuted = "text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

const chipBase = `rounded-xl border text-center text-sm font-medium ${focusRing} motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.99]`;

const chipInactive =
  "border-zinc-200/95 bg-white text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:shadow dark:border-zinc-700/90 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/70";

const chipActive =
  "border-emerald-500/55 bg-emerald-50 text-emerald-950 shadow-md shadow-emerald-900/5 ring-1 ring-inset ring-emerald-500/30 dark:border-emerald-500/45 dark:bg-emerald-950/55 dark:text-emerald-50 dark:shadow-emerald-950/20 dark:ring-emerald-400/20";

type Props = {
  initial: CommuteUrlState;
};

export function CommuteCalculator({ initial }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [distanceKm, setDistanceKm] = useState(initial.km);
  const [tripLegs, setTripLegs] = useState<TripLegs>(initial.tripLegs);
  const [carType, setCarType] = useState<CarType>(initial.carType);
  const [evKwhPer100km, setEvKwhPer100km] = useState(initial.evKwhPer100km);
  const [carOccupants, setCarOccupants] = useState(initial.carOccupants);
  const [daysPerWeek, setDaysPerWeek] = useState(initial.daysPerWeek);
  const [weeksPerYear, setWeeksPerYear] = useState(initial.weeksPerYear);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );

  useEffect(() => {
    const q = serializeCommuteSearchParams({
      km: distanceKm,
      tripLegs,
      carType,
      evKwhPer100km,
      carOccupants,
      daysPerWeek,
      weeksPerYear,
    });
    router.replace(`${pathname}?${q}`, { scroll: false });
  }, [
    pathname,
    router,
    distanceKm,
    tripLegs,
    carType,
    evKwhPer100km,
    carOccupants,
    daysPerWeek,
    weeksPerYear,
  ]);

  const compareOptions = useMemo(
    () => ({
      carType,
      carOccupants,
      evKwhPer100km,
    }),
    [carType, carOccupants, evKwhPer100km]
  );

  const result = useMemo(
    () => compareCarVsCTrain(distanceKm, tripLegs, compareOptions),
    [distanceKm, tripLegs, compareOptions]
  );

  const tripsPerYear = commutesPerYear(daysPerWeek, weeksPerYear);
  const annualCarPersonKg = result.carPerPersonKgCo2e * tripsPerYear;
  const annualTrainKg = result.trainKgCo2e * tripsPerYear;
  const annualAvoidedKg = Math.max(0, annualCarPersonKg - annualTrainKg);
  const treeRough = roughTreeYearsEquivalent(annualAvoidedKg);
  const barrelRough = roughOilBarrelsEquivalent(annualAvoidedKg);

  const maxBar = Math.max(
    result.carPerPersonKgCo2e,
    result.trainKgCo2e,
    0.001
  );
  const carWidth = (result.carPerPersonKgCo2e / maxBar) * 100;
  const trainWidth = (result.trainKgCo2e / maxBar) * 100;

  const carLabel =
    carOccupants > 1
      ? `Car (${carOccupants} people, per person)`
      : carType === "ev"
        ? "EV (per person, AB grid)"
        : `Car (${CAR_OPTIONS.find((c) => c.id === carType)?.label ?? "ICE"}, per person)`;

  const copyShareUrl = useCallback(() => {
    const q = serializeCommuteSearchParams({
      km: distanceKm,
      tripLegs,
      carType,
      evKwhPer100km,
      carOccupants,
      daysPerWeek,
      weeksPerYear,
    });
    const url = `${window.location.origin}${pathname}?${q}`;
    void navigator.clipboard.writeText(url).then(
      () => {
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 2500);
      },
      () => {
        setCopyState("error");
        window.setTimeout(() => setCopyState("idle"), 4000);
      }
    );
  }, [
    pathname,
    distanceKm,
    tripLegs,
    carType,
    evKwhPer100km,
    carOccupants,
    daysPerWeek,
    weeksPerYear,
  ]);

  const resultsLiveSummary = useMemo(
    () =>
      `Trip comparison updated. Car about ${formatKg(result.carPerPersonKgCo2e)} kilograms carbon dioxide equivalent per person. C-Train about ${formatKg(result.trainKgCo2e)} kilograms. If you keep this commuting habit, annual avoided emissions about ${formatKg(annualAvoidedKg)} kilograms.`,
    [
      result.carPerPersonKgCo2e,
      result.trainKgCo2e,
      annualAvoidedKg,
    ]
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6 lg:gap-6 lg:py-6">
        <header className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="space-y-2 sm:space-y-2.5">
            <div className="commute-badge-ring">
              <div className="commute-badge inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300/95">
                Calgary commute
              </div>
            </div>
            <h1 className="commute-hero-title text-balance text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-3xl">
              Driving vs C-Train
            </h1>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-2.5 sm:max-w-none lg:max-w-md lg:items-end">
            <p
              className={`commute-hero-sub text-sm leading-snug lg:text-right ${bodyMuted}`}
            >
              NW Calgary → downtown · same-trip{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                CO₂e
              </span>
              . Left: inputs · right: results · URL encodes your scenario.
            </p>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={copyShareUrl}
                className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold ${chipInactive} ${focusRing}`}
              >
                Copy link
              </button>
              <span
                role="status"
                aria-live="polite"
                className="min-h-[1.25rem] text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                {copyState === "copied" && "Link copied to clipboard."}
                {copyState === "error" && "Could not copy — try the address bar."}
              </span>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 lg:grid lg:grid-cols-[minmax(min(100%,280px),1fr)_minmax(0,22rem)] lg:items-stretch lg:gap-6 xl:grid-cols-[minmax(min(100%,320px),1fr)_minmax(0,24rem)]">
          <section
            className={`commute-animate-in commute-delay-1 ${cardSurface} space-y-4 sm:space-y-5`}
          >
            <div>
              <p className={sectionLabel}>Quick presets · NW → downtown</p>
              <p className={`mt-1.5 ${bodyMuted} text-xs`}>
                One-way driving distance; fine-tune with the slider below.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4">
                {NW_TO_DOWNTOWN_PRESETS.map((preset, index) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      style={{
                        animationDelay: `${Math.min(index, 14) * 0.03}s`,
                      }}
                      onClick={() => {
                        setDistanceKm(preset.oneWayDistanceKm);
                        setActivePresetId(preset.id);
                      }}
                      className={`commute-animate-in flex min-h-[2.5rem] flex-col items-center justify-center rounded-xl px-2 py-2 ${chipBase} ${
                        isActive ? chipActive : chipInactive
                      }`}
                    >
                      <span className="text-[13px] font-semibold">
                        {preset.origin}
                      </span>
                      <span
                        className={`mt-0.5 text-[11px] font-normal ${
                          isActive
                            ? "text-emerald-800/90 dark:text-emerald-200/85"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        Downtown · {preset.oneWayDistanceKm} km
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <label
                      htmlFor="distance"
                      className="text-sm font-medium text-zinc-800 dark:text-zinc-100"
                    >
                      One-way distance
                    </label>
                    <span className="font-mono text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                      {distanceKm} km
                    </span>
                  </div>
                  <input
                    id="distance"
                    type="range"
                    min={8}
                    max={35}
                    step={1}
                    value={distanceKm}
                    style={rangeStyle(distanceKm, 8, 35)}
                    onChange={(e) => {
                      setDistanceKm(Number(e.target.value));
                      setActivePresetId(null);
                    }}
                    className={`range-premium ${focusRing} w-full rounded-full`}
                  />
                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                    Match your exact driving route.
                  </p>
                </div>

                <fieldset className="min-w-0">
                  <legend className={sectionLabel}>Trip</legend>
                  <div className="mt-3 flex gap-2">
                    {(
                      [
                        ["one-way", "One way"],
                        ["round-trip", "Round trip"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTripLegs(value)}
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${chipBase} ${
                          tripLegs === value ? chipActive : chipInactive
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="min-w-0 overflow-visible">
                  <legend className={sectionLabel}>Vehicle</legend>
                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
                    {CAR_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCarType(id)}
                        className={`min-w-0 w-full rounded-xl px-3 py-2.5 text-sm font-medium leading-snug ${chipBase} ${
                          carType === id ? chipActive : chipInactive
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {carType === "ev" && (
                    <div className="commute-animate-pop mt-4 space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-700/80 dark:bg-zinc-950/40">
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor="evKwh"
                          className="text-sm text-zinc-800 dark:text-zinc-100"
                        >
                          Efficiency (kWh / 100 km)
                        </label>
                        <span className="font-mono text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                          {evKwhPer100km}
                        </span>
                      </div>
                      <input
                        id="evKwh"
                        type="range"
                        min={12}
                        max={35}
                        step={1}
                        value={evKwhPer100km}
                        style={rangeStyle(evKwhPer100km, 12, 35)}
                        onChange={(e) =>
                          setEvKwhPer100km(Number(e.target.value))
                        }
                        className={`range-premium ${focusRing} w-full`}
                      />
                      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                        Tailpipe-free; grid intensity ~{" "}
                        {ALBERTA_GRID_G_CO2E_PER_KWH} g CO₂e/kWh (illustrative).
                      </p>
                    </div>
                  )}
                </fieldset>
              </div>

              <div className="space-y-4">
                <fieldset className="min-w-0">
                  <legend className={sectionLabel}>Carpool</legend>
                  <p className={`mt-1 text-xs ${bodyMuted}`}>
                    People in the vehicle; emissions split per person.
                  </p>
                  <div className="mt-3 flex gap-2">
                    {([1, 2, 3, 4] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCarOccupants(n)}
                        className={`min-h-11 min-w-0 flex-1 rounded-xl text-sm font-semibold ${chipBase} ${
                          carOccupants === n ? chipActive : chipInactive
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="min-w-0">
                  <legend className={sectionLabel}>Annual habit</legend>
                  <div className="mt-3 grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <label htmlFor="days" className="text-zinc-700 dark:text-zinc-300">
                          Days / week
                        </label>
                        <span className="font-mono text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
                          {daysPerWeek}
                        </span>
                      </div>
                      <input
                        id="days"
                        type="range"
                        min={1}
                        max={7}
                        step={1}
                        value={daysPerWeek}
                        style={rangeStyle(daysPerWeek, 1, 7)}
                        onChange={(e) =>
                          setDaysPerWeek(Number(e.target.value))
                        }
                        className={`range-premium ${focusRing} w-full`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <label htmlFor="weeks" className="text-zinc-700 dark:text-zinc-300">
                          Weeks / year
                        </label>
                        <span className="font-mono text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
                          {weeksPerYear}
                        </span>
                      </div>
                      <input
                        id="weeks"
                        type="range"
                        min={1}
                        max={52}
                        step={1}
                        value={weeksPerYear}
                        style={rangeStyle(weeksPerYear, 1, 52)}
                        onChange={(e) =>
                          setWeeksPerYear(Number(e.target.value))
                        }
                        className={`range-premium ${focusRing} w-full`}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                    {tripsPerYear} trips/year ({daysPerWeek}×{weeksPerYear}), same
                    trip type as above.
                  </p>
                </fieldset>
              </div>
            </div>
          </section>

          <aside
            className="flex min-h-0 flex-col lg:sticky lg:top-4 lg:self-start"
            aria-label="Emission comparison results"
          >
            <div
              className={`commute-animate-in commute-delay-2 commute-panel-accent ${cardSurface} flex flex-col gap-5 sm:gap-6`}
            >
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                {resultsLiveSummary}
              </div>
              <div>
                <p className={sectionLabel}>This trip</p>
                <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-500">
                  {result.totalKm} km driven or ridden
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <span className="text-sm font-medium leading-snug text-zinc-800 dark:text-zinc-100">
                        {carLabel}
                      </span>
                      <span className="font-mono text-base font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                        {formatKg(result.carPerPersonKgCo2e)}{" "}
                        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                          kg
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200/90 ring-1 ring-zinc-900/5 dark:bg-zinc-800 dark:ring-white/5">
                      <div
                        className="commute-bar-amber h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ width: `${carWidth}%` }}
                      />
                    </div>
                    {carOccupants > 1 && (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                        Whole vehicle this trip:{" "}
                        <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                          {formatKg(result.vehicleKgCo2e)} kg
                        </span>{" "}
                        CO₂e total
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        C-Train (per passenger)
                      </span>
                      <span className="font-mono text-base font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                        {formatKg(result.trainKgCo2e)}{" "}
                        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                          kg
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200/90 ring-1 ring-zinc-900/5 dark:bg-zinc-800 dark:ring-white/5">
                      <div
                        className="commute-bar-emerald h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ width: `${trainWidth}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="commute-shimmer-box mt-4 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-teal-50/40 p-3 dark:border-emerald-800/60 dark:from-emerald-950/50 dark:to-zinc-950/30">
                  <p className="relative z-10 text-sm leading-snug text-emerald-950 dark:text-emerald-100/95">
                    C-Train avoids about{" "}
                    <strong className="font-semibold tabular-nums">
                      {formatKg(result.savingsKgCo2e)} kg
                    </strong>{" "}
                    CO₂e per person vs your car scenario — roughly{" "}
                    <strong className="font-semibold">
                      {result.trainVsCarPercent.toFixed(0)}%
                    </strong>{" "}
                    lower for that share.
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-200/90 pt-5 dark:border-zinc-800/90">
                <p className={sectionLabel}>If you keep this habit · Year</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="commute-result-row-in flex items-baseline justify-between gap-4">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Car (per person)
                    </span>
                    <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatKg(annualCarPersonKg)} kg
                    </span>
                  </li>
                  <li className="commute-result-row-in flex items-baseline justify-between gap-4">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      C-Train
                    </span>
                    <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatKg(annualTrainKg)} kg
                    </span>
                  </li>
                  <li className="commute-result-row-in flex items-baseline justify-between gap-4 border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Avoided (switch to train)
                    </span>
                    <span className="commute-stat-emphasis font-mono text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatKg(annualAvoidedKg)} kg
                    </span>
                  </li>
                </ul>

                <details className="group mt-4 rounded-xl border border-dashed border-zinc-300/90 bg-zinc-50/80 text-xs leading-relaxed text-zinc-600 dark:border-zinc-600/80 dark:bg-zinc-950/40 dark:text-zinc-400">
                  <summary className="commute-details-summary cursor-pointer list-none p-3 [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-3 sm:gap-y-1">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        Rough equivalents (not offsets)
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-zinc-700 dark:text-zinc-300">
                        ~{formatRough(treeRough)} tree-yrs · ~{formatRough(barrelRough)} bbl
                      </span>
                      <span className="text-[11px] font-medium text-emerald-700/90 group-open:hidden dark:text-emerald-400/90">
                        How we calculate this →
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
                      Illustrative only — not offsets or certified credits.{" "}
                      <span className="group-open:hidden">Expand for full detail.</span>
                    </p>
                  </summary>
                  <div className="border-t border-zinc-200/80 px-3 pb-3 pt-2 dark:border-zinc-800/80">
                    <p className="text-[13px] leading-snug text-zinc-600 dark:text-zinc-400">
                      Your <strong className="font-medium text-zinc-700 dark:text-zinc-300">annual avoided CO₂e</strong>{" "}
                      (train vs car, above) is translated into two familiar scales —{" "}
                      <strong className="font-medium text-zinc-700 dark:text-zinc-300">
                        back-of-the-envelope comparisons
                      </strong>{" "}
                      for intuition, not accounting.
                    </p>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4">
                      <div>
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">
                          ~{formatRough(treeRough)} tree-years (~{" "}
                          {ROUGH_KG_CO2E_PER_TREE_YEAR} kg CO₂e / tree · yr)
                        </p>
                        <p className="mt-1.5 text-[13px] leading-snug">
                          We divide avoided annual kg by{" "}
                          <strong className="font-medium text-zinc-700 dark:text-zinc-300">
                            {ROUGH_KG_CO2E_PER_TREE_YEAR} kg CO₂e per tree-year
                          </strong>
                          — a rough uptake rate for one &quot;average&quot; tree per year (real forests vary). A{" "}
                          <strong className="font-medium text-zinc-700 dark:text-zinc-300">tree-year</strong> is a
                          bookkeeping unit (e.g. {formatRough(treeRough)} trees × 1 yr or 1 tree ×{" "}
                          {formatRough(treeRough)} yr) as a <em>math analogy</em> only — not planting or funding trees.
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">
                          ~{formatRough(barrelRough)} barrels oil equiv. (~{" "}
                          {ROUGH_KG_CO2E_PER_OIL_BARREL} kg / barrel)
                        </p>
                        <p className="mt-1.5 text-[13px] leading-snug">
                          We divide by{" "}
                          <strong className="font-medium text-zinc-700 dark:text-zinc-300">
                            ~{ROUGH_KG_CO2E_PER_OIL_BARREL} kg CO₂e per barrel
                          </strong>
                          — a round figure for CO₂e from combusting that oil&apos;s energy (exact values vary). It{" "}
                          <strong className="font-medium text-zinc-700 dark:text-zinc-300">
                            scales your savings to fossil-fuel energy
                          </strong>
                          , not literal barrels left in the ground.
                        </p>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </aside>
        </div>

        <footer className="commute-animate-fade commute-delay-4 shrink-0 border-t border-zinc-200/90 pt-3 dark:border-zinc-800/90">
          <div className="columns-1 gap-x-8 gap-y-1 text-[11px] leading-snug text-zinc-500 sm:columns-2 lg:columns-3 dark:text-zinc-500">
            <p className="mb-2 break-inside-avoid">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Assumptions.
              </span>{" "}
              ICE {ICE_G_CO2E_PER_KM.compact}/{ICE_G_CO2E_PER_KM.suv}/{ICE_G_CO2E_PER_KM.truck}{" "}
              g/km · EV {ALBERTA_GRID_G_CO2E_PER_KWH} g/kWh (AB) · C-Train{" "}
              {C_TRAIN_G_CO2E_PER_PASSENGER_KM} g/passenger-km.
            </p>
            <p className="mb-2 break-inside-avoid">
              Educational only — not certified inventory. Traffic, vehicle, load, and grid
              change outcomes.
            </p>
            <p className="mb-2 break-inside-avoid">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Presets</span>{" "}
              ≈ one-way km · <span className="font-semibold text-zinc-700 dark:text-zinc-300">URL</span>{" "}
              shares km, trip, car, pool, days, weeks, evKwh.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
