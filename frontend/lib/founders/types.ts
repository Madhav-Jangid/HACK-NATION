export type FounderCandidate = {
  title: string;
  url: string;
  snippet: string | null;
  source_channel: string;
};

export type ResearchJob = {
  id: string;
  founder_id: string;
  triggered_by: "inbound" | "outbound";
  status: "queued" | "running" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string;
};

export type FounderMemory = {
  id: string;
  founder_id: string;
  category:
    | "education"
    | "experience"
    | "project"
    | "open_source"
    | "award"
    | "company"
    | "research"
    | "patent"
    | "funding"
    | "social"
    | "team"
    | "registration"
    | "other";
  payload: { title?: string; snippet?: string | null };
  source_url: string | null;
  source_type: string | null;
  confidence: number | null;
  collected_at: string;
  created_at: string;
};

export type FounderScore = {
  id: string;
  founder_id: string;
  score: number;
  confidence: "low" | "medium" | "high";
  is_cold_start_derived: boolean;
  rationale: string[];
  computed_at: string;
  created_at: string;
};

export type ResearchLog = {
  id: string;
  research_job_id: string;
  step: string;
  message: string | null;
  level: "info" | "warn" | "error";
  created_at: string;
};

export type CommitteeRun = {
  id: string;
  founder_id: string;
  status: "queued" | "running" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string;
};

export type CommitteeLog = {
  id: string;
  committee_run_id: string;
  step: string;
  message: string | null;
  level: "info" | "warn" | "error";
  created_at: string;
};

export type CommitteeAgentId =
  | "technical"
  | "founder"
  | "market"
  | "risk"
  | "devils_advocate"
  | "managing_partner";

// A single claim paired with the exact source it traces back to -- the
// brief's Agentic Traceability stretch goal ("cite the exact data point that
// drove it"), applied per-claim instead of a loose per-agent citations list.
export type Claim = { claim: string; source_url: string | null };

export type CommitteeAgentOutput = {
  id: string;
  committee_run_id: string;
  agent: CommitteeAgentId;
  summary: string;
  output: {
    strengths?: Claim[];
    concerns?: Claim[];
    recommendation?: "invest" | "pass" | "more_info_needed";
    key_strengths?: Claim[];
    key_risks?: Claim[];
    reasoning?: string;
    portfolio_fit?: "diversifying" | "concentrated" | "no_data";
    portfolio_notes?: string;
  };
  confidence: number | null;
  created_at: string;
};

export type OpportunityAxis = "founder" | "market" | "idea_vs_market";

export type OpportunityScore = {
  id: string;
  founder_id: string;
  committee_run_id: string | null;
  axis: OpportunityAxis;
  score: number;
  confidence: "low" | "medium" | "high";
  rationale: string[];
  computed_at: string;
  created_at: string;
};

export type InvestmentMemo = {
  id: string;
  founder_id: string;
  committee_run_id: string | null;
  content: string;
  generated_at: string;
  created_at: string;
};

export type Founder = {
  id: string;
  name: string;
  company_name: string | null;
  company_website: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  source: "inbound" | "outbound";
  source_channel: string | null;
  status: string;
  is_cold_start: boolean;
  // Multi-tenant isolation: the investor who sourced/tracks this founder.
  user_id: string;
  // Persona card image -- currently only populated from a GitHub avatar
  // (LinkedIn/Twitter don't expose one without their own API access).
  avatar_url: string | null;
  // Portfolio check (brief's Investment Decision "adversarial & portfolio
  // check" gate) -- set when an investor marks a founder as actually invested.
  sector: string | null;
  stage: string | null;
  geography: string | null;
  check_amount: number | null;
  invested_at: string | null;
  created_at: string;
  updated_at: string;
};
