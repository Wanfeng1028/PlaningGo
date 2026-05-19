import { useState, useEffect, useCallback } from "react";
import { PageTransition } from "../components/PageTransition";
import { RevealGroup } from "../components/RevealGroup";
import { Button } from "../components/Button";
import {
  getDeveloperDashboard,
  getDeveloperApps,
  createDeveloperApp,
  deleteDeveloperApp,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getDeveloperUsage,
  getDeveloperRequestLogs,
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  replayWebhook,
  getWebhookDeliveries,
  rotateWebhookSecret,
  runDeveloperSandbox,
  getDeveloperSecurity,
} from "../lib/api";
import type {
  DeveloperApp,
  DeveloperApiKey,
  DeveloperDashboard,
  DeveloperUsage,
  DeveloperRequestLog,
  DeveloperWebhook,
  WebhookDelivery,
  DeveloperSecurity,
  ModalKey,
  SessionUser,
} from "../types";
import s from "./DevelopersPage.module.scss";

/* ─────────── props ─────────── */

interface DevelopersPageProps {
  onOpenModal: (key: ModalKey) => void;
  user: SessionUser | null;
}

/* ─────────── tab 配置 ─────────── */

type TabKey = "overview" | "apps" | "keys" | "usage" | "logs" | "webhooks" | "sandbox" | "docs" | "security";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "概览" },
  { key: "apps", label: "应用" },
  { key: "keys", label: "API Keys" },
  { key: "usage", label: "用量" },
  { key: "logs", label: "请求日志" },
  { key: "webhooks", label: "Webhooks" },
  { key: "sandbox", label: "沙盒" },
  { key: "docs", label: "文档" },
  { key: "security", label: "安全" },
];

const AVAILABLE_EVENTS = [
  "plan.created", "plan.completed", "plan.cancelled",
  "memory.created", "memory.updated",
  "companion.updated", "companion.milestone",
  "auth.login", "auth.logout",
];

/* ─────────── main component ─────────── */

export default function DevelopersPage({ onOpenModal, user }: DevelopersPageProps) {
  const isGuest = user?.mode === "guest";
  const isLoggedIn = user?.mode === "registered";

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // data
  const [dashboard, setDashboard] = useState<DeveloperDashboard | null>(null);
  const [apps, setApps] = useState<DeveloperApp[]>([]);
  const [apiKeys, setApiKeys] = useState<DeveloperApiKey[]>([]);
  const [usage, setUsage] = useState<DeveloperUsage | null>(null);
  const [logs, setLogs] = useState<DeveloperRequestLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [webhooks, setWebhooks] = useState<DeveloperWebhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [security, setSecurity] = useState<DeveloperSecurity | null>(null);

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<DeveloperWebhook | null>(null);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [logFilter, setLogFilter] = useState({ status: "", path: "" });
  const [usageRange, setUsageRange] = useState("7d");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [deliveryWebhookId, setDeliveryWebhookId] = useState<string | null>(null);

  // sandbox state
  const [sandboxEndpoint, setSandboxEndpoint] = useState("/api/agent/plan");
  const [sandboxMethod, setSandboxMethod] = useState("POST");
  const [sandboxBody, setSandboxBody] = useState('{\n  "prompt": "帮我规划明天的团建活动"\n}');
  const [sandboxResult, setSandboxResult] = useState<{ traceId: string; statusCode: number; latencyMs: number; body: unknown } | null>(null);

  // form state
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["plans:read", "plans:write"]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [newAppName, setNewAppName] = useState("");
  const [newAppDesc, setNewAppDesc] = useState("");
  const [newAppEnv, setNewAppEnv] = useState("sandbox");

  const flash = useCallback((msg: string, type: "success" | "error" = "success") => {
    if (type === "success") { setSuccessMsg(msg); setError(null); }
    else { setError(msg); setSuccessMsg(null); }
    setTimeout(() => { setSuccessMsg(null); setError(null); }, 4000);
  }, []);

  /* ─────────── data loading ─────────── */

  const loadDashboard = useCallback(async () => {
    try { setDashboard(await getDeveloperDashboard()); } catch { /* silent */ }
  }, []);

  const loadApps = useCallback(async () => {
    try { setApps(await getDeveloperApps()); } catch { /* silent */ }
  }, []);

  const loadApiKeys = useCallback(async () => {
    try { setApiKeys(await getApiKeys()); } catch { /* silent */ }
  }, []);

  const loadUsage = useCallback(async () => {
    try { setUsage(await getDeveloperUsage(usageRange)); } catch { /* silent */ }
  }, [usageRange]);

  const loadLogs = useCallback(async () => {
    try {
      const res = await getDeveloperRequestLogs({ page: logsPage, pageSize: 20, ...logFilter });
      setLogs(res.items);
      setLogsTotal(res.total);
    } catch { /* silent */ }
  }, [logsPage, logFilter]);

  const loadWebhooks = useCallback(async () => {
    try { setWebhooks(await getWebhooks()); } catch { /* silent */ }
  }, []);

  const loadSecurity = useCallback(async () => {
    try { setSecurity(await getDeveloperSecurity()); } catch { /* silent */ }
  }, []);

  // load on tab change
  useEffect(() => {
    if (!isLoggedIn) return;
    setError(null);
    setSuccessMsg(null);
    if (activeTab === "overview") loadDashboard();
    else if (activeTab === "apps") loadApps();
    else if (activeTab === "keys") loadApiKeys();
    else if (activeTab === "usage") loadUsage();
    else if (activeTab === "logs") loadLogs();
    else if (activeTab === "webhooks") loadWebhooks();
    else if (activeTab === "security") loadSecurity();
  }, [activeTab, isLoggedIn, loadDashboard, loadApps, loadApiKeys, loadUsage, loadLogs, loadWebhooks, loadSecurity]);

  // load deliveries when webhook selected
  useEffect(() => {
    if (deliveryWebhookId) {
      getWebhookDeliveries(deliveryWebhookId).then(setDeliveries).catch(() => setDeliveries([]));
    }
  }, [deliveryWebhookId]);

  /* ─────────── actions ─────────── */

  const handleCreateApp = async () => {
    if (!newAppName.trim()) return;
    setLoading(true);
    try {
      await createDeveloperApp({ name: newAppName.trim(), description: newAppDesc.trim(), environment: newAppEnv });
      flash("应用创建成功");
      setShowCreateApp(false);
      setNewAppName(""); setNewAppDesc(""); setNewAppEnv("sandbox");
      await loadApps();
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "创建失败", "error"); }
    finally { setLoading(false); }
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm("确认删除此应用？关联的 API Key 和 Webhook 将被清除。")) return;
    setLoading(true);
    try { await deleteDeveloperApp(id); flash("应用已删除"); await loadApps(); }
    catch (e: unknown) { flash(e instanceof Error ? e.message : "删除失败", "error"); }
    finally { setLoading(false); }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);
    try {
      const res = await createApiKey({ name: newKeyName.trim(), scopes: newKeyScopes });
      setCreatedKey(res.key ?? null);
      flash("API Key 创建成功");
      setNewKeyName(""); setNewKeyScopes(["plans:read", "plans:write"]);
      await loadApiKeys();
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "创建失败", "error"); }
    finally { setLoading(false); }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("确认吊销此 Key？此操作不可逆。")) return;
    setLoading(true);
    try { await revokeApiKey(id); flash("Key 已吊销"); await loadApiKeys(); }
    catch (e: unknown) { flash(e instanceof Error ? e.message : "吊销失败", "error"); }
    finally { setLoading(false); }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim() || newWebhookEvents.length === 0) return;
    setLoading(true);
    try {
      await createWebhook({ url: newWebhookUrl.trim(), events: newWebhookEvents });
      flash("Webhook 创建成功");
      setShowCreateWebhook(false);
      setNewWebhookUrl(""); setNewWebhookEvents([]);
      await loadWebhooks();
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "创建失败", "error"); }
    finally { setLoading(false); }
  };

  const handleUpdateWebhook = async () => {
    if (!editingWebhook) return;
    setLoading(true);
    try {
      await updateWebhook(editingWebhook.id, { url: newWebhookUrl.trim(), events: newWebhookEvents });
      flash("Webhook 已更新");
      setEditingWebhook(null);
      setNewWebhookUrl(""); setNewWebhookEvents([]);
      await loadWebhooks();
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "更新失败", "error"); }
    finally { setLoading(false); }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("确认删除此 Webhook？")) return;
    setLoading(true);
    try { await deleteWebhook(id); flash("Webhook 已删除"); setDeliveryWebhookId(null); await loadWebhooks(); }
    catch (e: unknown) { flash(e instanceof Error ? e.message : "删除失败", "error"); }
    finally { setLoading(false); }
  };

  const handleTestWebhook = async (id: string) => {
    setLoading(true);
    try { await testWebhook(id); flash("测试事件已发送"); }
    catch (e: unknown) { flash(e instanceof Error ? e.message : "发送失败", "error"); }
    finally { setLoading(false); }
  };

  const handleReplayWebhook = async (id: string) => {
    setLoading(true);
    try { await replayWebhook(id); flash("已重新投递"); }
    catch (e: unknown) { flash(e instanceof Error ? e.message : "重放失败", "error"); }
    finally { setLoading(false); }
  };

  const handleRotateSecret = async (id: string) => {
    if (!confirm("确认轮换密钥？旧密钥将立即失效。")) return;
    setLoading(true);
    try { await rotateWebhookSecret(id); flash("密钥已轮换"); await loadWebhooks(); }
    catch (e: unknown) { flash(e instanceof Error ? e.message : "轮换失败", "error"); }
    finally { setLoading(false); }
  };

  const handleRunSandbox = async () => {
    setLoading(true);
    setSandboxResult(null);
    try {
      let body: Record<string, unknown> | undefined;
      if (sandboxBody.trim()) {
        try { body = JSON.parse(sandboxBody); } catch { flash("JSON 格式错误", "error"); setLoading(false); return; }
      }
      const res = await runDeveloperSandbox({ endpoint: sandboxEndpoint, method: sandboxMethod, body });
      setSandboxResult(res);
    } catch (e: unknown) { flash(e instanceof Error ? e.message : "执行失败", "error"); }
    finally { setLoading(false); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => flash("已复制"));
  };

  /* ─────────── permission gate ─────────── */

  if (!isLoggedIn) {
    return (
      <PageTransition pageKey="developers-auth">
        <div className={s.developersPage}>
          <div className={s.gate}>
            <h3>需要登录</h3>
            <p>请先登录以访问开发者中心。</p>
            <Button onClick={() => onOpenModal("login")}>登录 / 注册</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isGuest) {
    return (
      <PageTransition pageKey="developers-guest">
        <div className={s.developersPage}>
          <div className={s.gate}>
            <h3>需要正式账户</h3>
            <p>游客模式下无法使用开发者中心，请先注册正式账户。</p>
            <Button onClick={() => onOpenModal("register")}>注册账户</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  /* ─────────── helper ─────────── */

  const statusBadge = (status: string) => {
    const cls = status === "active" ? s.active : status === "revoked" ? s.revoked : status === "expired" ? s.expired : s.disabled;
    return <span className={`${s.badge} ${cls}`}>{status}</span>;
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

  /* ─────────── render ─────────── */

  return (
    <PageTransition pageKey="developers">
      <div className={s.developersPage}>
        {/* Hero */}
        <section className={s.hero}>
          <RevealGroup>
            <div className={s.eyebrow}>Developer Console</div>
            <h1>开发者中心</h1>
            <p className={s.subtitle}>
              管理你的应用、API Key 实时监控调用数据。
            </p>
          </RevealGroup>
        </section>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          {/* flash messages */}
          {successMsg && <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(76,175,80,0.1)", color: "#2e7d32", fontSize: 13, marginBottom: 16 }}>{successMsg}</div>}
          {error && <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(244,67,54,0.1)", color: "#c62828", fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {/* Tab Nav */}
          <nav className={s.tabNav}>
            {TABS.map((t) => (
              <button key={t.key} className={`${s.tabBtn} ${activeTab === t.key ? s.active : ""}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </nav>

          {/* ═══════ Overview ═══════ */}
          {activeTab === "overview" && (
            <RevealGroup>
              {dashboard && (
                <div className={s.statsGrid}>
                  <div className={s.statCard}>
                    <div className={s.statLabel}>今日调用</div>
                    <div className={s.statValue}>{dashboard.summary.todayCalls}</div>
                  </div>
                  <div className={s.statCard}>
                    <div className={s.statLabel}>平均延迟</div>
                    <div className={s.statValue}>{dashboard.summary.averageLatencyMs}<span className={s.statUnit}>ms</span></div>
                  </div>
                  <div className={s.statCard}>
                    <div className={s.statLabel}>成功率</div>
                    <div className={s.statValue}>{dashboard.summary.successRate.toFixed(1)}<span className={s.statUnit}>%</span></div>
                  </div>
                  <div className={s.statCard}>
                    <div className={s.statLabel}>Webhook 成功率</div>
                    <div className={s.statValue}>{dashboard.summary.webhookSuccessRate.toFixed(1)}<span className={s.statUnit}>%</span></div>
                  </div>
                  <div className={s.statCard}>
                    <div className={s.statLabel}>本月剩余配额</div>
                    <div className={s.statValue}>{dashboard.summary.remainingQuota}</div>
                  </div>
                  <div className={s.statCard}>
                    <div className={s.statLabel}>P95 延迟</div>
                    <div className={s.statValue}>{dashboard.summary.p95LatencyMs}<span className={s.statUnit}>ms</span></div>
                  </div>
                </div>
              )}

              <div className={s.quickCards}>
                <div className={s.quickCard} onClick={() => setActiveTab("keys")}>
                  <div className={s.qcTitle}>API Keys</div>
                  <div className={s.qcDesc}>管理接口凭证，{dashboard?.summary.activeKeys ?? 0} 个活跃</div>
                </div>
                <div className={s.quickCard} onClick={() => setActiveTab("webhooks")}>
                  <div className={s.qcTitle}>Webhooks</div>
                  <div className={s.qcDesc}>事件推送，{dashboard?.summary.activeWebhooks ?? 0} 个活跃</div>
                </div>
                <div className={s.quickCard} onClick={() => setActiveTab("logs")}>
                  <div className={s.qcTitle}>请求日志</div>
                  <div className={s.qcDesc}>查看调用明细和错误详情</div>
                </div>
                <div className={s.quickCard} onClick={() => setActiveTab("sandbox")}>
                  <div className={s.qcTitle}>沙盒调试</div>
                  <div className={s.qcDesc}>在线调用真实 API 验证接口</div>
                </div>
              </div>

              {dashboard?.lastSuccess && (
                <div className={s.section}>
                  <div className={s.sectionHeader}><h3>最近一次成功</h3></div>
                  <div className={s.card}>
                    <span className={`${s.statusCode} ${s.s2xx}`}>{dashboard.lastSuccess.statusCode}</span>
                    {" "}{dashboard.lastSuccess.path}
                    <span className={s.pipeSep}>{dashboard.lastSuccess.latencyMs}ms</span>
                    <span className={s.pipeSep}>{fmtDate(dashboard.lastSuccess.createdAt)}</span>
                  </div>
                </div>
              )}
              {dashboard?.lastError && (
                <div className={s.section}>
                  <div className={s.sectionHeader}><h3>最近一次错误</h3></div>
                  <div className={s.card}>
                    <span className={`${s.statusCode} ${s.s5xx}`}>{dashboard.lastError.statusCode}</span>
                    {" "}{dashboard.lastError.path}
                    {dashboard.lastError.errorCode && <span className={s.pipeSep}>{dashboard.lastError.errorCode}</span>}
                    <span className={s.pipeSep}>{dashboard.lastError.latencyMs}ms</span>
                    <span className={s.pipeSep}>{fmtDate(dashboard.lastError.createdAt)}</span>
                  </div>
                </div>
              )}
            </RevealGroup>
          )}

          {/* ═══════ Apps ═══════ */}
          {activeTab === "apps" && (
            <RevealGroup>
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <h3>应用管理</h3>
                  <Button onClick={() => setShowCreateApp(true)}>创建应用</Button>
                </div>

                {showCreateApp && (
                  <div className={s.card} style={{ marginBottom: 16 }}>
                    <div className={s.formGroup}>
                      <label>应用名称</label>
                      <input value={newAppName} onChange={(e) => setNewAppName(e.target.value)} placeholder="我的应用" />
                    </div>
                    <div className={s.formGroup}>
                      <label>描述</label>
                      <input value={newAppDesc} onChange={(e) => setNewAppDesc(e.target.value)} placeholder="应用描述（可选）" />
                    </div>
                    <div className={s.formGroup}>
                      <label>环境</label>
                      <select value={newAppEnv} onChange={(e) => setNewAppEnv(e.target.value)}>
                        <option value="sandbox">Sandbox</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button onClick={handleCreateApp} disabled={loading}>{loading ? "创建中…" : "确认创建"}</Button>
                      <Button variant="ghost" onClick={() => setShowCreateApp(false)}>取消</Button>
                    </div>
                  </div>
                )}

                {apps.length === 0 && !showCreateApp ? (
                  <div className={s.emptyState}>
                    <div className={s.emptyIcon}>📦</div>
                    <h4>还没有应用</h4>
                    <p>创建一个应用来管理你的 API 集成。</p>
                    <Button onClick={() => setShowCreateApp(true)}>创建应用</Button>
                  </div>
                ) : (
                  <div className={s.cardGrid}>
                    {apps.map((app) => (
                      <div key={app.id} className={s.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <strong style={{ fontSize: 15 }}>{app.name}</strong>
                          <span className={`${s.badge} ${app.environment === "production" ? s.info : s.active}`}>{app.environment}</span>
                        </div>
                        {app.description && <p style={{ fontSize: 13, color: "#7a7067", margin: "0 0 12px" }}>{app.description}</p>}
                        <div style={{ fontSize: 12, color: "#8a8078", marginBottom: 12 }}>
                          创建于 {fmtDate(app.createdAt)}
                          {app.callbackDomain && <span className={s.pipeSep}>回调域: {app.callbackDomain}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button size="small" variant="ghost" onClick={() => handleDeleteApp(app.id)}>删除</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </RevealGroup>
          )}

          {/* ═══════ API Keys ═══════ */}
          {activeTab === "keys" && (
            <RevealGroup>
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <h3>接口凭证</h3>
                  <Button onClick={() => { setShowCreateKey(true); setCreatedKey(null); }}>创建 Key</Button>
                </div>

                {createdKey && (
                  <div className={s.card} style={{ marginBottom: 16, background: "rgba(255,204,51,0.08)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#5a5248" }}>⚠️ 请立即复制保存，关闭后无法再次查看</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "#1e1e2e", color: "#cdd6f4", fontSize: 13, wordBreak: "break-all" }}>{createdKey}</code>
                      <Button size="small" onClick={() => handleCopy(createdKey)}>复制</Button>
                    </div>
                  </div>
                )}

                {showCreateKey && !createdKey && (
                  <div className={s.card} style={{ marginBottom: 16 }}>
                    <div className={s.formGroup}>
                      <label>Key 名称</label>
                      <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="例如：生产环境 Key" />
                    </div>
                    <div className={s.formGroup}>
                      <label>权限范围</label>
                      <div className={s.checkboxGroup}>
                        {["plans:read", "plans:write", "memories:read", "memories:write", "companions:read"].map((scope) => (
                          <label key={scope}>
                            <input type="checkbox" checked={newKeyScopes.includes(scope)} onChange={(e) => {
                              setNewKeyScopes(e.target.checked ? [...newKeyScopes, scope] : newKeyScopes.filter((sc) => sc !== scope));
                            }} />
                            {scope}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button onClick={handleCreateKey} disabled={loading}>{loading ? "创建中…" : "确认创建"}</Button>
                      <Button variant="ghost" onClick={() => setShowCreateKey(false)}>取消</Button>
                    </div>
                  </div>
                )}

                {apiKeys.length === 0 && !showCreateKey ? (
                  <div className={s.emptyState}>
                    <div className={s.emptyIcon}>🔑</div>
                    <h4>还没有 API Key</h4>
                    <p>创建 Key 以通过 API 访问你的数据。</p>
                    <Button onClick={() => setShowCreateKey(true)}>创建 Key</Button>
                  </div>
                ) : (
                  <div className={s.cardGrid}>
                    {apiKeys.map((k) => (
                      <div key={k.id} className={s.apiKeyCard}>
                        <div className={s.keyHeader}>
                          <span className={s.keyName}>{k.name}</span>
                          {statusBadge(k.status)}
                        </div>
                        <div className={s.keyPrefix}>{k.prefix}…</div>
                        <div className={s.keyMeta}>
                          <span>环境: {k.environment}</span>
                          <span>创建: {fmtDate(k.createdAt)}</span>
                          {k.lastUsedAt && <span>最后使用: {fmtDate(k.lastUsedAt)}</span>}
                        </div>
                        {k.scopes.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                            {k.scopes.map((sc) => <span key={sc} className={`${s.badge} ${s.info}`}>{sc}</span>)}
                          </div>
                        )}
                        <div className={s.keyActions}>
                          {k.status === "active" && (
                            <Button size="small" variant="ghost" onClick={() => handleRevokeKey(k.id)}>吊销</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </RevealGroup>
          )}

          {/* ═══════ Usage ═══════ */}
          {activeTab === "usage" && (
            <RevealGroup>
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <h3>用量统计</h3>
                  <select value={usageRange} onChange={(e) => setUsageRange(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 13 }}>
                    <option value="7d">最近 7 天</option>
                    <option value="30d">最近 30 天</option>
                    <option value="90d">最近 90 天</option>
                  </select>
                </div>

                {usage && (
                  <>
                    <div className={s.statsGrid}>
                      <div className={s.statCard}>
                        <div className={s.statLabel}>今日调用</div>
                        <div className={s.statValue}>{usage.todayCalls}</div>
                      </div>
                      <div className={s.statCard}>
                        <div className={s.statLabel}>本月调用</div>
                        <div className={s.statValue}>{usage.monthCalls}</div>
                      </div>
                      <div className={s.statCard}>
                        <div className={s.statLabel}>平均延迟</div>
                        <div className={s.statValue}>{usage.averageLatencyMs}<span className={s.statUnit}>ms</span></div>
                      </div>
                      <div className={s.statCard}>
                        <div className={s.statLabel}>成功率</div>
                        <div className={s.statValue}>{usage.successRate.toFixed(1)}<span className={s.statUnit}>%</span></div>
                      </div>
                    </div>

                    {usage.breakdown.length > 0 && (
                      <div className={s.section}>
                        <div className={s.sectionHeader}><h4>端点分布</h4></div>
                        <div className={s.card}>
                          <table className={s.logTable}>
                            <thead><tr><th>端点</th><th>调用次数</th></tr></thead>
                            <tbody>
                              {usage.breakdown.map((b) => (
                                <tr key={b.path}><td>{b.path}</td><td>{b.count}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {usage.daily.length > 0 && (
                      <div className={s.section}>
                        <div className={s.sectionHeader}><h4>每日趋势</h4></div>
                        <div className={s.card}>
                          <table className={s.logTable}>
                            <thead><tr><th>日期</th><th>调用</th><th>错误</th><th>平均延迟</th><th>P95</th></tr></thead>
                            <tbody>
                              {usage.daily.map((d) => (
                                <tr key={d.id}>
                                  <td>{d.date}</td>
                                  <td>{d.calls}</td>
                                  <td>{d.errors}</td>
                                  <td>{d.avgLatencyMs}ms</td>
                                  <td>{d.p95LatencyMs}ms</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </RevealGroup>
          )}

          {/* ═══════ Logs ═══════ */}
          {activeTab === "logs" && (
            <RevealGroup>
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <h3>请求日志</h3>
                  <span style={{ fontSize: 13, color: "#8a8078" }}>共 {logsTotal} 条</span>
                </div>

                <div className={s.toolbar}>
                  <select value={logFilter.status} onChange={(e) => { setLogFilter({ ...logFilter, status: e.target.value }); setLogsPage(1); }}>
                    <option value="">全部状态</option>
                    <option value="2xx">2xx 成功</option>
                    <option value="4xx">4xx 客户端错误</option>
                    <option value="5xx">5xx 服务端错误</option>
                  </select>
                  <input placeholder="路径过滤…" value={logFilter.path} onChange={(e) => { setLogFilter({ ...logFilter, path: e.target.value }); setLogsPage(1); }} />
                </div>

                {logs.length === 0 ? (
                  <div className={s.emptyState}>
                    <div className={s.emptyIcon}>📋</div>
                    <h4>暂无请求记录</h4>
                    <p>当你开始调用 API 后，请求日志会出现在这里。</p>
                  </div>
                ) : (
                  <div className={s.card}>
                    <table className={s.logTable}>
                      <thead>
                        <tr><th>方法</th><th>路径</th><th>状态</th><th>延迟</th><th>Key</th><th>时间</th><th>TraceId</th></tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => {
                          const sCode = log.statusCode;
                          const sCls = sCode >= 500 ? s.s5xx : sCode >= 400 ? s.s4xx : s.s2xx;
                          return (
                            <>
                              <tr key={log.id} style={{ cursor: "pointer" }} onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                                <td><strong>{log.method}</strong></td>
                                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{log.path}</td>
                                <td><span className={`${s.statusCode} ${sCls}`}>{log.statusCode}</span></td>
                                <td>{log.latencyMs}ms</td>
                                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{log.apiKeyPrefix}</td>
                                <td style={{ fontSize: 12 }}>{fmtDate(log.createdAt)}</td>
                                <td style={{ fontFamily: "monospace", fontSize: 11, color: "#8a8078" }}>{log.traceId.slice(0, 8)}</td>
                              </tr>
                              {expandedLog === log.id && (
                                <tr key={`${log.id}-detail`}>
                                  <td colSpan={7} style={{ padding: "12px 16px", background: "rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontSize: 12, color: "#5a5248" }}>
                                      {log.errorCode && <div>错误码: <strong>{log.errorCode}</strong></div>}
                                      {log.requestPreview && (
                                        <div style={{ marginTop: 8 }}>
                                          <strong>请求预览:</strong>
                                          <pre style={{ background: "#1e1e2e", color: "#cdd6f4", padding: 10, borderRadius: 8, fontSize: 12, overflow: "auto", maxHeight: 200, marginTop: 4 }}>{JSON.stringify(log.requestPreview, null, 2)}</pre>
                                        </div>
                                      )}
                                      {log.responsePreview && (
                                        <div style={{ marginTop: 8 }}>
                                          <strong>响应预览:</strong>
                                          <pre style={{ background: "#1e1e2e", color: "#cdd6f4", padding: 10, borderRadius: 8, fontSize: 12, overflow: "auto", maxHeight: 200, marginTop: 4 }}>{JSON.stringify(log.responsePreview, null, 2)}</pre>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>

                    {logsTotal > 20 && (
                      <div className={s.pagination}>
                        <button disabled={logsPage <= 1} onClick={() => setLogsPage(logsPage - 1)}>上一页</button>
                        <span className={s.currentPage} style={{ padding: "6px 14px", fontSize: 13 }}>{logsPage}</span>
                        <button disabled={logsPage * 20 >= logsTotal} onClick={() => setLogsPage(logsPage + 1)}>下一页</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </RevealGroup>
          )}

          {/* ═══════ Webhooks ═══════ */}
          {activeTab === "webhooks" && (
            <RevealGroup>
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <h3>Webhook 管理</h3>
                  <Button onClick={() => { setShowCreateWebhook(true); setEditingWebhook(null); setNewWebhookUrl(""); setNewWebhookEvents([]); }}>创建 Webhook</Button>
                </div>

                {(showCreateWebhook || editingWebhook) && (
                  <div className={s.card} style={{ marginBottom: 16 }}>
                    <div className={s.formGroup}>
                      <label>回调 URL</label>
                      <input value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" />
                    </div>
                    <div className={s.formGroup}>
                      <label>订阅事件</label>
                      <div className={s.checkboxGroup}>
                        {AVAILABLE_EVENTS.map((ev) => (
                          <label key={ev}>
                            <input type="checkbox" checked={newWebhookEvents.includes(ev)} onChange={(e) => {
                              setNewWebhookEvents(e.target.checked ? [...newWebhookEvents, ev] : newWebhookEvents.filter((x) => x !== ev));
                            }} />
                            {ev}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button onClick={editingWebhook ? handleUpdateWebhook : handleCreateWebhook} disabled={loading}>
                        {loading ? "保存中…" : editingWebhook ? "更新" : "创建"}
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowCreateWebhook(false); setEditingWebhook(null); }}>取消</Button>
                    </div>
                  </div>
                )}

                {webhooks.length === 0 && !showCreateWebhook ? (
                  <div className={s.emptyState}>
                    <div className={s.emptyIcon}>🔗</div>
                    <h4>还没有 Webhook</h4>
                    <p>创建 Webhook 以接收事件推送通知。</p>
                    <Button onClick={() => setShowCreateWebhook(true)}>创建 Webhook</Button>
                  </div>
                ) : (
                  <div className={s.cardGrid}>
                    {webhooks.map((wh) => (
                      <div key={wh.id} className={s.webhookCard}>
                        <div className={s.whHeader}>
                          <span className={s.whUrl}>{wh.url}</span>
                          {statusBadge(wh.enabled ? "active" : "disabled")}
                        </div>
                        <div className={s.whEvents}>
                          {wh.events.map((ev) => <span key={ev} className={`${s.badge} ${s.info}`}>{ev}</span>)}
                        </div>
                        <div className={s.whMeta}>
                          <span>创建: {fmtDate(wh.createdAt)}</span>
                        </div>
                        <div className={s.whActions}>
                          <Button size="small" variant="ghost" onClick={() => {
                            setEditingWebhook(wh);
                            setShowCreateWebhook(false);
                            setNewWebhookUrl(wh.url);
                            setNewWebhookEvents(wh.events);
                          }}>编辑</Button>
                          <Button size="small" variant="ghost" onClick={() => handleTestWebhook(wh.id)}>测试</Button>
                          <Button size="small" variant="ghost" onClick={() => handleReplayWebhook(wh.id)}>重放</Button>
                          <Button size="small" variant="ghost" onClick={() => handleRotateSecret(wh.id)}>轮换密钥</Button>
                          <Button size="small" variant="ghost" onClick={() => setDeliveryWebhookId(deliveryWebhookId === wh.id ? null : wh.id)}>
                            {deliveryWebhookId === wh.id ? "隐藏投递" : "投递记录"}
                          </Button>
                          <Button size="small" variant="ghost" onClick={() => handleDeleteWebhook(wh.id)}>删除</Button>
                        </div>

                        {deliveryWebhookId === wh.id && deliveries.length > 0 && (
                          <div style={{ marginTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#5a5248", marginBottom: 8 }}>最近投递</div>
                            {deliveries.slice(0, 5).map((d) => (
                              <div key={d.id} style={{ fontSize: 12, color: "#7a7067", padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                                <span className={`${s.badge} ${d.status === "success" ? s.active : s.revoked}`}>{d.status}</span>
                                {" "}{d.event}
                                {d.responseStatus && <span className={s.pipeSep}>HTTP {d.responseStatus}</span>}
                                {d.latencyMs != null && <span className={s.pipeSep}>{d.latencyMs}ms</span>}
                                {d.errorMessage && <span className={s.pipeSep} style={{ color: "#c62828" }}>{d.errorMessage}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </RevealGroup>
          )}

          {/* ═══════ Sandbox ═══════ */}
          {activeTab === "sandbox" && (
            <RevealGroup>
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <h3>API 沙盒</h3>
                  <p>使用真实认证调用后端接口进行测试</p>
                </div>

                <div className={s.sandbox}>
                  <div className={s.sandboxEditor}>
                    <div className={s.sandboxPane}>
                      <label>请求</label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <select value={sandboxMethod} onChange={(e) => setSandboxMethod(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 13 }}>
                          <option>GET</option><option>POST</option><option>PATCH</option><option>DELETE</option>
                        </select>
                        <input value={sandboxEndpoint} onChange={(e) => setSandboxEndpoint(e.target.value)} placeholder="/api/endpoint" style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 13 }} />
                      </div>
                      <textarea value={sandboxBody} onChange={(e) => setSandboxBody(e.target.value)} placeholder='{"key": "value"}' />
                    </div>
                    <div className={s.sandboxPane}>
                      <label>响应</label>
                      <div className={s.sandboxResult}>
                        {sandboxResult ? (
                          <>
                            <pre>{JSON.stringify(sandboxResult.body, null, 2)}</pre>
                            <div className={s.sandboxMeta}>
                              <span>状态: <strong>{sandboxResult.statusCode}</strong></span>
                              <span>延迟: {sandboxResult.latencyMs}ms</span>
                              <span>TraceId: {sandboxResult.traceId.slice(0, 8)}</span>
                            </div>
                          </>
                        ) : (
                          <pre style={{ color: "#8a8078" }}>点击"发送请求"查看响应…</pre>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleRunSandbox} disabled={loading}>{loading ? "执行中…" : "发送请求"}</Button>
                </div>
              </div>
            </RevealGroup>
          )}

          {/* ═══════ Docs ═══════ */}
          {activeTab === "docs" && (
            <RevealGroup>
              <div className={s.section}>
                <div className={s.sectionHeader}>
                  <h3>接入文档</h3>
                  <p>快速了解如何集成周末有谱 API</p>
                </div>

                <div className={s.docsGrid}>
                  <div className={s.docCard}><h4>快速开始</h4><p>获取 API Key，发送第一个请求，5 分钟完成接入。</p></div>
                  <div className={s.docCard}><h4>认证方式</h4><p>在请求头中携带 Authorization: Bearer sk_xxxx 进行身份验证。</p></div>
                  <div className={s.docCard}><h4>API 端点</h4><p>计划管理、记忆查询、伴侣互动等核心接口的完整参考。</p></div>
                  <div className={s.docCard}><h4>Webhook 事件</h4><p>订阅事件推送，实时接收计划变更、记忆更新等通知。</p></div>
                  <div className={s.docCard}><h4>错误处理</h4><p>错误码对照表、重试策略和最佳实践。</p></div>
                  <div className={s.docCard}><h4>SDK 与示例</h4><p>Node.js、Python SDK 和常见场景的代码示例。</p></div>
                </div>

                <div className={s.section} style={{ marginTop: 32 }}>
                  <div className={s.sectionHeader}><h4>快速示例</h4></div>
                  <div className={s.codeBlock}>
                    <Button size="small" variant="ghost" className={s.copyBtn} onClick={() => handleCopy(`curl -X POST https://api.planninggo.dev/api/agent/plan \\
  -H "Authorization: Bearer sk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "帮我规划周末活动"}'`)}>复制</Button>
                    <pre>{`curl -X POST https://api.planninggo.dev/api/agent/plan \\
  -H "Authorization: Bearer sk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "帮我规划周末活动"}'`}</pre>
                  </div>
                </div>
              </div>
            </RevealGroup>
          )}

          {/* ═══════ Security ═══════ */}
          {activeTab === "security" && (
            <RevealGroup>
              <div className={s.section}>
                <div className={s.sectionHeader}><h3>安全中心</h3></div>

                {security && (
                  <>
                    <div className={s.statsGrid}>
                      <div className={s.statCard}><div className={s.statLabel}>活跃 Key</div><div className={s.statValue}>{security.activeKeys}</div></div>
                      <div className={s.statCard}><div className={s.statLabel}>总 Key 数</div><div className={s.statValue}>{security.totalKeys}</div></div>
                      <div className={s.statCard}><div className={s.statLabel}>活跃 Webhook</div><div className={s.statValue}>{security.activeWebhooks}</div></div>
                      <div className={s.statCard}><div className={s.statLabel}>总 Webhook</div><div className={s.statValue}>{security.totalWebhooks}</div></div>
                    </div>

                    <div className={s.securitySection}>
                      <h4>最近操作审计</h4>
                      {security.recentAudits.length === 0 ? (
                        <p style={{ fontSize: 13, color: "#8a8078" }}>暂无审计记录</p>
                      ) : (
                        security.recentAudits.map((a, i) => (
                          <div key={i} className={s.auditRow}>
                            <span className={s.auditAction}>{a.action} — {a.resourceType}</span>
                            <span className={s.auditTime}>{fmtDate(a.createdAt)} · {a.traceId.slice(0, 8)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className={s.securitySection}>
                      <h4>IP 白名单</h4>
                      {security.ipAllowlistEnabled ? (
                        <div>
                          {security.ipAllowlist?.length ? (
                            security.ipAllowlist.map((ip) => <span key={ip} className={`${s.badge} ${s.info}`} style={{ marginRight: 6 }}>{ip}</span>)
                          ) : (
                            <p style={{ fontSize: 13, color: "#8a8078" }}>已启用但未配置 IP</p>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: "#8a8078" }}>未启用。如需开启请联系管理员。</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </RevealGroup>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
