import { useState, type FormEvent } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { Button } from "./Button";
import { enterAsGuest, login, register } from "../lib/api";
import type { ModalKey, SessionUser } from "../types";
import styles from "./AuthModal.module.scss";

type AuthMode = Extract<ModalKey, "login" | "register" | "guest">;

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
  onSuccess: (user: SessionUser, token?: string) => void;
  onSwitchMode?: (mode: AuthMode) => void;
}

const GUEST_DEFAULTS = {
  city: "北京",
  startPoint: "家附近",
  companions: "family",
  budgetMin: 200,
  budgetMax: 300,
};

export function AuthModal({ mode, onClose, onSuccess, onSwitchMode }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleNotice, setGoogleNotice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = (): boolean => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("请输入正确的邮箱地址。");
      return false;
    }
    if (form.password.length < 6) {
      setError("密码至少需要 6 位。");
      return false;
    }
    if (mode === "register" && form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致。");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode !== "guest" && !validate()) return;
    setLoading(true);
    setError("");

    try {
      let result;
      if (mode === "login") {
        // 演示账号前端本地校验，不依赖后端
        if (form.email === "xiaoming@example.com" && form.password === "weekend123") {
          onSuccess({
            id: "demo_xiaoming",
            name: "小明",
            mode: "registered",
            city: GUEST_DEFAULTS.city,
          });
          onClose();
          return;
        }
        result = await login(form.email, form.password);
      } else if (mode === "guest") {
        result = await enterAsGuest(GUEST_DEFAULTS);
      } else {
        const emailPrefix = form.email.split("@")[0] || "周末用户";
        result = await register({
          name: emailPrefix,
          email: form.email,
          password: form.password,
          ...GUEST_DEFAULTS,
        });
      }

      onSuccess({
        id: result.user.id,
        name: result.user.name ?? result.user.displayName ?? result.user.email?.split("@")[0] ?? "用户",
        mode: result.user.mode ?? (mode === "guest" ? "guest" : "registered"),
        city: result.profile?.city ?? GUEST_DEFAULTS.city,
      }, result.accessToken ?? result.token);
      onClose();
    } catch {
      if (mode === "guest") {
        onSuccess({ id: "local_guest", name: "游客", mode: "guest", city: GUEST_DEFAULTS.city });
        onClose();
        return;
      }
      setError(
        mode === "login"
          ? "登录失败，请检查邮箱或密码。"
          : "注册失败，请稍后重试或换一个邮箱。",
      );
    } finally {
      setLoading(false);
    }
  };

  const switchTo = (target: AuthMode) => {
    setError("");
    if (onSwitchMode) {
      onSwitchMode(target);
    }
  };

  const profileItems = [
    { label: "默认城市", value: "北京" },
    { label: "起点偏好", value: "家附近" },
    { label: "距离偏好", value: "5 km 内" },
    { label: "预算偏好", value: "人均 200 – 300" },
    { label: "路线偏好", value: "少排队、轻松" },
  ];

  const title = mode === "login" ? "欢迎回来" : mode === "register" ? "创建账号" : "游客体验";
  const subtitle =
    mode === "login"
      ? "登录后继续你的周末计划和偏好记忆。"
      : mode === "register"
        ? "用邮箱保存你的偏好，之后可以在个人中心继续完善。"
        : "无需注册即可体验完整规划流程，关闭后不会长期保存记忆。";

  const content = (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      {mode === "guest" ? (
        <>
          <div className={styles.guestSummary}>
            <p className={styles.guestSummaryLabel}>默认画像摘要</p>
            <div className={styles.guestPills}>
              {profileItems.map((item) => (
                <span className={styles.guestPill} key={item.label}>
                  <em>{item.label}</em>
                  <strong>{item.value}</strong>
                </span>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "进入中…" : "以游客身份开始"}
          </Button>
        </>
      ) : (
        <>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="auth-email">邮箱</label>
            <input
              className={styles.input}
              id="auth-email"
              type="email"
              inputMode="email"
              placeholder="xiaoming@example.com"
              autoComplete="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value.trim())}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="auth-password">密码</label>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                title={showPassword ? "隐藏密码" : "显示密码"}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === "register" ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="auth-confirm">确认密码</label>
              <div className={styles.inputWrap}>
                <input
                  className={styles.input}
                  id="auth-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="再输入一次密码"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => update("confirmPassword", event.target.value)}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                  title={showConfirmPassword ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ) : null}

          {error ? <div className={styles.error} role="alert">{error}</div> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "处理中…" : mode === "login" ? "登录并继续" : "创建账号"}
          </Button>

          <button
            type="button"
            className={styles.googleButton}
            onClick={() => setGoogleNotice(true)}
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {mode === "login" ? "使用 Google 登录" : "使用 Google 注册"}
          </button>
        </>
      )}
    </form>
  );

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.authCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className={styles.authClose} type="button" aria-label="关闭弹窗" onClick={onClose}>
          <X size={18} />
        </button>

        <span className={styles.modePill}>
          {mode === "login" ? "登录" : mode === "register" ? "注册" : "游客"}
        </span>

        <div className={styles.authHeader}>
          <h2 className={styles.authTitle} id="auth-title">{title}</h2>
          <p className={styles.authSubtitle}>{subtitle}</p>
        </div>

        {content}

        {mode !== "guest" ? (
          <>
            <div className={styles.divider}><span /></div>
            <button
              type="button"
              className={styles.switchLine}
              onClick={() => switchTo("guest")}
            >
              游客访问
            </button>
          </>
        ) : null}

        <p className={styles.switchLine}>
          {mode === "login" ? (
            <>
              还没有账号？
              <button type="button" className={styles.textButton} onClick={() => switchTo("register")}>
                免费注册
              </button>
            </>
          ) : mode === "register" ? (
            <>
              已有账号？
              <button type="button" className={styles.textButton} onClick={() => switchTo("login")}>
                去登录
              </button>
            </>
          ) : (
            <>
              想保存偏好？
              <button type="button" className={styles.textButton} onClick={() => switchTo("register")}>
                免费注册
              </button>
            </>
          )}
        </p>

        {mode === "login" ? (
          <p className={styles.hint}>试用账号：xiaoming@example.com / weekend123</p>
        ) : null}

        {googleNotice ? (
          <div className={styles.noticeLayer} role="presentation" onMouseDown={() => setGoogleNotice(false)}>
            <div className={styles.noticeCard} onMouseDown={(event) => event.stopPropagation()}>
              <h3>暂未接入</h3>
              <p>Google 登录功能正在准备中，请先使用邮箱登录或注册。</p>
              <Button size="small" onClick={() => setGoogleNotice(false)}>知道了</Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
