/**
 * Aegis AI – TypeScript Type Definitions
 *
 * Centralized type system for the entire frontend application.
 */

// ── User Types ──────────────────────────────────────────────────

export type UserRole =
  | 'patient'
  | 'doctor'
  | 'ambulance_driver'
  | 'hospital_admin'
  | 'government_admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  bio?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// ── Auth Types ──────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ── Patient Types ───────────────────────────────────────────────

export interface Patient {
  id: string;
  user_id: string;
  blood_group?: string;
  date_of_birth?: string;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  insurance_provider?: string;
  insurance_id?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location_lat?: number;
  location_lng?: number;
  created_at: string;
  updated_at: string;
}

// ── Hospital Types ──────────────────────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  registration_number?: string;
  hospital_type: string;
  description?: string;
  established_year?: number;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  total_beds: number;
  available_beds: number;
  icu_beds: number;
  icu_available: number;
  ventilators: number;
  ventilators_available: number;
  has_emergency: boolean;
  has_ambulance: boolean;
  has_pharmacy: boolean;
  has_lab: boolean;
  has_blood_bank: boolean;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_active: boolean;
  image_url?: string;
  distance_km?: number;
  created_at: string;
  updated_at: string;
}

// ── Emergency Types ─────────────────────────────────────────────

export type EmergencyType =
  | 'cardiac'
  | 'trauma'
  | 'stroke'
  | 'breathing'
  | 'accident'
  | 'burn'
  | 'poisoning'
  | 'pregnancy'
  | 'mental_health'
  | 'other';

export type EmergencyStatus =
  | 'requested'
  | 'acknowledged'
  | 'dispatched'
  | 'en_route'
  | 'arrived'
  | 'in_treatment'
  | 'transporting'
  | 'at_hospital'
  | 'resolved'
  | 'cancelled';

export interface EmergencyRequest {
  id: string;
  patient_id: string;
  ambulance_id?: string;
  hospital_id?: string;
  emergency_type: EmergencyType;
  severity: number;
  description?: string;
  symptoms?: string;
  status: EmergencyStatus;
  location_lat: number;
  location_lng: number;
  location_address?: string;
  requested_at: string;
  dispatched_at?: string;
  arrived_at?: string;
  resolved_at?: string;
  ai_severity_score?: number;
  estimated_arrival_minutes?: number;
  created_at: string;
  updated_at: string;
}

// ── Notification Types ──────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'emergency' | 'info' | 'warning' | 'success' | 'system';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// ── API Response Types ──────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

// ── Dashboard Stats ─────────────────────────────────────────────

export interface DashboardStats {
  total_hospitals?: number;
  total_available_beds?: number;
  total_icu_available?: number;
  total_patients?: number;
  total_ambulances?: number;
  available_ambulances?: number;
  active_emergencies?: number;
  emergencies_today?: number;
  total_users?: number;
  severity_breakdown?: { severity: number; count: number }[];
  recent_emergencies?: {
    id: string;
    type: string;
    severity: number;
    status: string;
    requested_at: string;
  }[];
  total_emergencies?: number;
  active_emergency?: {
    id: string;
    status: string;
    severity: number;
  } | null;
  nearby_hospitals?: number;
}
