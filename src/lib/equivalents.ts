export const ROUGH_KG_CO2E_PER_TREE_YEAR = 22;

export const ROUGH_KG_CO2E_PER_OIL_BARREL = 430;

export function roughTreeYearsEquivalent(annualKgCo2e: number): number {
  if (annualKgCo2e <= 0) return 0;
  return annualKgCo2e / ROUGH_KG_CO2E_PER_TREE_YEAR;
}

export function roughOilBarrelsEquivalent(annualKgCo2e: number): number {
  if (annualKgCo2e <= 0) return 0;
  return annualKgCo2e / ROUGH_KG_CO2E_PER_OIL_BARREL;
}
