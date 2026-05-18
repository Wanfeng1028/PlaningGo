import type { LucideIcon } from "lucide-react";

export type NavKey = "home" | "features" | "cases" | "design" | "developers" | "profile";

export type ModalKey =
  | "login"
  | "register"
  | "guest"
  | "contact"
  | "identity"
  | "location"
  | "reservation"
  | "ticket"
  | "payment"
  | "vote"
  | "privacy"
  | "apiKey";

export interface NavItem {
  key: NavKey;
  label: string;
}

export interface ModalContent {
  key: ModalKey;
  title: string;
  eyebrow: string;
  body: string;
  primary: string;
  secondary: string;
  bullets: string[];
}

export interface FlowItem {
  title: string;
  desc: string;
  source: string;
  mode: "page" | "modal" | "drawer" | "sheet" | "state";
  modal?: ModalKey;
}

export interface SectionBlock {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  icon: LucideIcon;
  items: FlowItem[];
}

export interface CaseCard {
  title: string;
  desc: string;
  tags: string[];
  metric: string;
}

export interface TimelineItem {
  time: string;
  title: string;
  desc: string;
  status: "done" | "active" | "pending";
}

export interface SessionUser {
  id: string;
  name: string;
  mode: "guest" | "registered";
  city: string;
}

// ── 个人中心类型 ──

export interface PersonaData {
  displayName: string;
  city: string;
  startPoint: string;
  secondaryStartPoints: string[];
  favoriteAreas: string[];
  defaultTimeWindow: string;
  transportMode: string;
  distanceLimitKm: number;
  walkingTolerance: string;
  queueTolerance: string;
  pace: string;
  indoorPreference: string;
  budgetMin: number;
  budgetMax: number;
  dietPreference: string[];
  avoidFoods: string[];
  healthGoal: string;
  dinnerTimePreference: string;
  activityTags: string[];
  avoidActivityTags: string[];
  riskPreference: string;
}

export interface CompanionProfile {
  id: string;
  type: string;
  name: string;
  relation: string;
  ageGroup: string;
  preferences: string[];
  avoid: string[];
  mobility: string;
  diet: string;
  notes: string;
  isDefault: boolean;
}

export interface MemoryInsight {
  id: string;
  category: string;
  title: string;
  detail: string;
  weight: number;
  source: string;
  updatedAt: string;
}

export interface AiInsight {
  id: string;
  text: string;
  confidence: number;
}

export interface PlanHistoryItem {
  id: string;
  title: string;
  summary: string;
  status: string;
  companions: string;
  city: string;
  budget: string;
  rating: number | null;
  favorite: boolean;
  tags: string[];
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  departureReminder: boolean;
  reservationReminder: boolean;
  shareFeedback: boolean;
  weatherAlert: boolean;
  planExpiry: boolean;
  emailEnabled: boolean;
  browserEnabled: boolean;
  calendarEnabled: boolean;
}

export interface PermissionSettings {
  locationEnabled: boolean;
  memoryEnabled: boolean;
  calendarEnabled: boolean;
  shareEnabled: boolean;
  developerEnabled: boolean;
}

export interface SessionInfo {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface WebhookInfo {
  id: string;
  url: string;
  event: string;
  enabled: boolean;
  lastDeliveryStatus: string;
}

export interface ToolLogItem {
  id: string;
  traceId: string;
  toolName: string;
  status: string;
  latencyMs: number;
  createdAt: string;
}

export interface ProfileStats {
  planCount: number;
  memoryCount: number;
  favoriteCount: number;
  unreadNotifications: number;
  personaCompleteness: number;
}

export interface ProfileBundle {
  user: {
    id: string;
    email: string;
    displayName: string;
    mode: string;
    role: string;
    createdAt: string;
  };
  profile: PersonaData;
  permissions: PermissionSettings;
  stats: ProfileStats;
}
