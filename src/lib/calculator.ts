import type { CalculatorInput, ComparisonResult } from "@/types/calculator";
import { calculateSolarComparison } from "./calculators/solar";

export function calculateComparison(input: CalculatorInput): ComparisonResult {
  return calculateSolarComparison(input);
}
