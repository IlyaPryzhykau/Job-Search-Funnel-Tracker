export type StageId =
  | "applied"
  | "hr_response"
  | "screening"
  | "tech"
  | "homework"
  | "final"
  | "offer"
  | "rejected";

export type Stage = {
  id: StageId;
  title: string;
};

export type Application = {
  id: number;
  company: string;
  role: string;
  location: string;
  salary: string;
  notes: string;
  stage: StageId;
  appliedAt: string;
  lastTouch: string;
  priority: "low" | "medium" | "high";
  source: string;
};

export type Language = "ru" | "en";

export type ApiStage = {
  id: number;
  name: string;
  order_index: number;
  is_terminal: boolean;
};

export type ApiUser = {
  id: number;
  email: string;
  name: string | null;
  provider: string | null;
  provider_sub: string | null;
};

export type ApiJob = {
  id: number;
  user_id: number;
  stage_id: number;
  company: string;
  position: string;
  source: string | null;
  salary: string | null;
  stack: string | null;
  notes: string | null;
  priority: string | null;
  applied_at: string | null;
  hr_response_at: string | null;
  screening_at: string | null;
  tech_interview_at: string | null;
  homework_at: string | null;
  final_at: string | null;
  offer_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiStageCount = {
  stage_id: number;
  stage_name: string;
  count: number;
};

export type ApiConversion = {
  from_stage_id: number;
  from_stage_name: string;
  to_stage_id: number;
  to_stage_name: string;
  conversion_rate: number | null;
};

export type ApiMetrics = {
  stage_counts: ApiStageCount[];
  stage_progress: ApiStageCount[];
  conversions: ApiConversion[];
  avg_hr_response_days: number | null;
};
