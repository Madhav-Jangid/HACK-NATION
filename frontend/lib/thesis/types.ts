export type InvestmentThesis = {
  sectors: string[];
  stage: string[];
  geography: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  ownership_target: number | null;
  risk_appetite: string | null;
  preferred_founder_type: string | null;
  minimum_traction: string | null;
  excluded_industries: string[];
};

export const emptyThesis: InvestmentThesis = {
  sectors: [],
  stage: [],
  geography: [],
  check_size_min: null,
  check_size_max: null,
  ownership_target: null,
  risk_appetite: null,
  preferred_founder_type: null,
  minimum_traction: null,
  excluded_industries: [],
};
