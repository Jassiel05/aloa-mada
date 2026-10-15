export type Role = "candidate" | "recruiter" | "admin";
export type Plan = "simple" | "pro";
export type ModerationStatus = "draft" | "pending" | "approved" | "rejected";
export type Availability = "available" | "available_from" | "employed";
export type RateUnit = "hour" | "day" | "month" | "project" | "negotiable";

export interface Profile {
  id: string;
  role: Role;
  plan: Plan;
  plan_expires_at: string | null;
  status: ModerationStatus;
  rejection_reason: string | null;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  photo_path: string | null;
  headline: string | null;
  gender: "homme" | "femme" | null;
  photo_hidden: boolean;
  onboarded: boolean;
  created_at: string;
}

export interface CandidateDetails {
  profile_id: string;
  job_title: string | null;
  skills: string[];
  experience_years: number | null;
  languages: string[];
  contract_types: string[];
  rate_amount: number | null;
  rate_currency: "MGA" | "EUR";
  rate_unit: RateUnit;
  availability: Availability;
  available_from: string | null;
  work_modes: string[];
  bio: string | null;
  portfolio_url: string | null;
  notice_period: string | null;
  school: string | null;
  cv_path: string | null;
  cv_size: number | null;
  cv_updated_at: string | null;
}

export interface RecruiterDetails {
  profile_id: string;
  kind: "individual" | "company";
  company_name: string | null;
  sector: string | null;
  company_size: string | null;
  website: string | null;
  nif_stat: string | null;
  verified: boolean;
  looking_for: string | null;
}

export interface Contacts {
  profile_id: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
}

export interface Offer {
  id: string;
  recruiter_id: string;
  title: string;
  job_title: string | null;
  contract_type: string;
  rate_amount: number | null;
  rate_currency: "MGA" | "EUR";
  rate_unit: RateUnit;
  city: string | null;
  work_mode: string | null;
  start_date: string | null;
  description: string;
  status: "open" | "closed";
  expires_at: string;
  created_at: string;
}

export type ProfileWithDetails = Profile & {
  candidate_details: CandidateDetails | null;
  recruiter_details: RecruiterDetails | null;
};

export interface Viewer {
  id: string;
  email: string | null;
  profile: Profile;
  isPro: boolean;
  isAdmin: boolean;
  can: {
    apply: boolean;
    startConversation: boolean;
    publishOffer: boolean;
    seeContacts: boolean;
  };
}
