export interface RunningCostBreakdown {
  fuel_type: 'EV' | 'Petrol' | 'Diesel' | 'PHEV' | 'Hybrid';
  annual_mileage: number;
  efficiency_label: string;
  estimated_annual_fuel_energy: number;
  estimated_annual_road_tax: number;
  estimated_annual_servicing: number;
  estimated_annual_insurance: number;
  estimated_total_annual_running: number;
  estimated_monthly_running: number;
  estimated_monthly_tco: number; // Finance monthly payment + Monthly running cost
}

export interface AIRunningCostAnalysis {
  is_c40_cheaper_to_run: boolean;
  confidence_level: 'High Confidence' | 'Medium Confidence' | 'Low Confidence';
  confidence_score_percent: number;
  my_car_monthly_running: number;
  quote_monthly_running: number;
  monthly_running_savings: number;
  net_monthly_tco_difference: number;
  charging_assumption: string;
  key_factors: string[];
  explanation_text: string;
}

export interface FinanceComparisonObject {
  car_name: string;
  advance: number;
  term_months: number;
  monthly_payment: number;
  balloon: number;
  apr: number;
  flat_rate?: number;
  annual_mileage: number;
  negative_equity: number;
  bonus_discount: number;
  total_interest: number;
  net_upfront_deficit: number;
  dead_money: number;
  verdict: string;
  // Voluntary Termination (Section 99 / 100 Consumer Credit Act 1974)
  customer_deposit?: number;
  total_amount_payable?: number;
  vt_threshold_amount?: number;
  vt_month?: number;
  // Optional UI helper tags
  id?: string;
  isMyCar?: boolean;
  reg_number?: string;
  engine_size?: string;
  fuel_type?: string;
  color?: string;
  transmission?: string;
  estimated_trade_value?: number;
  trade_in_offer?: number;
  loan_settlement?: number;
  is_negative_equity_rolled?: boolean;
  base_advance?: number;
  // Running cost estimates
  running_cost_breakdown?: RunningCostBreakdown;
}

export interface VehicleRegLookupResult {
  reg_number: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  fuel_type: string;
  transmission: string;
  engine_size: string;
  color: string;
  estimated_value: number;
  estimated_original_msrp: number;
  full_car_name: string;
  verified_source?: string;
}

export interface QuotePreset {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  text: string;
}
