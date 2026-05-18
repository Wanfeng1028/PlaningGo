import type {
  ProfileBundle,
  PersonaData,
  CompanionProfile,
  MemoryInsight,
  AiInsight,
  PlanHistoryItem,
  NotificationItem,
  NotificationPreferences,
  PermissionSettings,
  SessionInfo,
  ApiKeyInfo,
  WebhookInfo,
  ToolLogItem,
} from "../types";

export interface AgentPlanResponse {
  traceId: string;
  summary: string;
  selectedPlanId: string;
  nextActions: string[];
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: {
    id: string;
    name?: string;
    displayName?: string;
    email?: string;
    mode?: "guest" | "registered";
    role?: string;
  };
  profile?: {
    city: string;
    startPoint: string;
  };
  onboardingSteps?: string[];
  expiresInMinutes?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:3001";

// ── Token 管理 ──
let _authToken: string | null = localStorage.getItem("pg_token");

export function setAuthToken(token: string | null) {
  _authToken = token;
  if (token) localStorage.setItem("pg_token", token);
  else localStorage.removeItem("pg_token");
}

export function getAuthToken() {
  return _authToken;
}

export async function requestAgentPlan(prompt: string): Promise<AgentPlanResponse> {
  const response = await fetch(`${API_BASE}/api/agent/plan`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      companions: "family",
      budget: 420,
      startPoint: "浙大紫金港",
    }),
  });

  if (!response.ok) {
    throw new Error(`Agent API failed: ${response.status}`);
  }

  return response.json() as Promise<AgentPlanResponse>;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (_authToken) {
    headers.authorization = `Bearer ${_authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const msg =
      (body && typeof body === "object" && "message" in body && typeof (body as Record<string, unknown>).message === "string"
        ? (body as Record<string, unknown>).message
        : undefined) ??
      (body && typeof body === "object" && "error" in body && typeof (body as Record<string, unknown>).error === "object"
        ? ((body as Record<string, unknown>).error as Record<string, unknown>)?.message
        : undefined) ??
      `请求失败 (${response.status})`;

    if (import.meta.env.DEV) {
      console.warn(`[api] ${path} ${response.status}`, body);
    }

    throw new Error(typeof msg === "string" ? msg : `请求失败 (${response.status})`);
  }

  // 兼容 { ok, data } 包装格式和扁平格式
  if (body && typeof body === "object" && "ok" in body && "data" in body) {
    return (body as { data: T }).data;
  }

  return body as T;
}

// ── Auth ──

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  city: string;
  startPoint: string;
  companions: string;
  budgetMin: number;
  budgetMax: number;
}): Promise<AuthResponse> {
  return apiJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function enterAsGuest(input: { city: string; startPoint: string; companions: string }): Promise<AuthResponse> {
  return apiJson<AuthResponse>("/api/auth/guest", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  return apiJson("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ── Plans ──

export async function getPlans() {
  return apiJson<{ selectedPlanId: string; options: unknown[] }>("/api/plans/demo");
}

export async function selectPlan(planId: string) {
  return apiJson<{ selectedPlanId: string }>("/api/plans/select", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

export async function createReservation(input: { type: string; title: string; status?: string; price?: string; detail: string }) {
  return apiJson("/api/reservations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function advanceExecution() {
  return apiJson<{ traceId: string; steps: unknown[] }>("/api/execution/advance", { method: "POST" });
}

export async function updatePermission(key: string, allowed: boolean) {
  return apiJson<Record<string, boolean>>("/api/profile/demo/permissions", {
    method: "PATCH",
    body: JSON.stringify({ key, allowed }),
  });
}

export async function createShareRoom(input: { planId: string; title: string; members: Array<{ name: string; vote?: string; comment?: string }> }) {
  return apiJson("/api/share/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ── Profile: 人物画像 ──

export async function getProfileBundle(): Promise<ProfileBundle> {
  return apiJson<ProfileBundle>("/api/profile/me");
}

export async function updateProfile(input: { displayName?: string; city?: string; startPoint?: string }) {
  return apiJson("/api/profile/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getPersona(): Promise<PersonaData> {
  return apiJson<PersonaData>("/api/profile/me/persona");
}

export async function updatePersona(input: Partial<PersonaData>) {
  return apiJson("/api/profile/me/persona", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// ── Profile: 记忆与洞察 ──

export async function getMemories(): Promise<MemoryInsight[]> {
  return apiJson<MemoryInsight[]>("/api/memories");
}

export async function addMemory(input: { category: string; title: string; detail: string; weight: number }) {
  return apiJson("/api/memories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMemory(id: string, input: Partial<{ category: string; title: string; detail: string; weight: number }>) {
  return apiJson(`/api/memories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteMemory(id: string) {
  return apiJson(`/api/memories/${id}`, { method: "DELETE" });
}

export async function getInsights(): Promise<AiInsight[]> {
  return apiJson<AiInsight[]>("/api/profile/me/insights");
}

// ── Profile: 同行人 ──

export async function getCompanions(): Promise<CompanionProfile[]> {
  return apiJson<CompanionProfile[]>("/api/profile/me/companions");
}

export async function addCompanion(input: Omit<CompanionProfile, "id">) {
  return apiJson("/api/profile/me/companions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCompanion(id: string, input: Partial<CompanionProfile>) {
  return apiJson(`/api/profile/me/companions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteCompanion(id: string) {
  return apiJson(`/api/profile/me/companions/${id}`, { method: "DELETE" });
}

// ── Profile: 历史与评分 ──

export async function getPlanHistory(page = 1, pageSize = 20): Promise<{ items: PlanHistoryItem[]; total: number }> {
  return apiJson(`/api/profile/me/history?page=${page}&pageSize=${pageSize}`);
}

export async function ratePlan(id: string, rating: number, favorite?: boolean) {
  return apiJson(`/api/plans/${id}/rating`, {
    method: "POST",
    body: JSON.stringify({ rating, favorite }),
  });
}

// ── Profile: 通知中心 ──

export async function getNotifications(page = 1, pageSize = 20): Promise<{ items: NotificationItem[]; total: number; unread: number }> {
  return apiJson(`/api/notifications?page=${page}&pageSize=${pageSize}`);
}

export async function markNotificationRead(id: string) {
  return apiJson(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return apiJson("/api/notifications/read-all", { method: "POST" });
}

export async function deleteNotification(id: string) {
  return apiJson(`/api/notifications/${id}`, { method: "DELETE" });
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiJson<NotificationPreferences>("/api/notifications/preferences");
}

export async function updateNotificationPreferences(input: Partial<NotificationPreferences>) {
  return apiJson("/api/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// ── Profile: 隐私与安全 ──

export async function getPermissions(): Promise<PermissionSettings> {
  return apiJson<PermissionSettings>("/api/profile/me/permissions");
}

export async function updatePermissions(input: Partial<PermissionSettings>) {
  return apiJson("/api/profile/me/permissions", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getSessions(): Promise<SessionInfo[]> {
  const res = await apiJson<{ sessions: SessionInfo[] } | SessionInfo[]>("/api/auth/sessions");
  return Array.isArray(res) ? res : res.sessions ?? [];
}

export async function revokeSession(id: string) {
  return apiJson(`/api/auth/sessions/${id}`, { method: "DELETE" });
}

export async function clearMemory() {
  return apiJson("/api/privacy/memory", { method: "DELETE" });
}

export async function exportPrivacy() {
  return apiJson("/api/privacy/export", { method: "POST" });
}

export async function deleteAccount() {
  return apiJson("/api/privacy/account", { method: "DELETE" });
}

export async function updateAccount(input: { displayName?: string; city?: string; startPoint?: string }) {
  return apiJson("/api/account", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// ── Profile: 开发者模式 ──

export async function getDeveloperDashboard(): Promise<{
  metrics: Array<{ label: string; value: string }>;
  apiKeys: ApiKeyInfo[];
  webhooks: WebhookInfo[];
}> {
  return apiJson("/api/developer/dashboard");
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  return apiJson<ApiKeyInfo[]>("/api/developer/apikeys");
}

export async function createNewApiKey(name: string): Promise<{ key: string }> {
  return apiJson("/api/developer/apikeys", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(id: string) {
  return apiJson(`/api/developer/apikeys/${id}`, { method: "DELETE" });
}

export async function listWebhooks(): Promise<WebhookInfo[]> {
  return apiJson<WebhookInfo[]>("/api/developer/webhooks");
}

export async function createWebhook(input: { url: string; event: string }) {
  return apiJson("/api/developer/webhooks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateWebhook(id: string, input: Partial<{ url: string; event: string; enabled: boolean }>) {
  return apiJson(`/api/developer/webhooks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteWebhook(id: string) {
  return apiJson(`/api/developer/webhooks/${id}`, { method: "DELETE" });
}

export async function replayWebhook(id: string) {
  return apiJson(`/api/developer/webhooks/${id}/replay`, { method: "POST" });
}

export async function getWebhookDeliveries(id: string) {
  return apiJson(`/api/developer/webhooks/${id}/deliveries`);
}

export async function getToolLogs(page = 1, pageSize = 20): Promise<{ items: ToolLogItem[]; total: number }> {
  return apiJson(`/api/developer/logs?page=${page}&pageSize=${pageSize}`);
}
