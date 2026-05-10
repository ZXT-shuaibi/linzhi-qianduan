import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthExperience from "@/features/auth/AuthExperience";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { ApiError } from "@/services/apiClient";
import type { LoginRequest } from "@/types/auth";
import styles from "./AuthForm.module.css";

type LocationState = {
  from?: string;
};

type LoginMode = "password" | "code";
type AuthView = "login" | "register";

const isValidLoginIdentifier = (value: string) => /^1\d{10}$/.test(value);

const readErrorCode = (error: unknown) => {
  if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null || !("code" in error.data)) {
    return null;
  }
  return String((error.data as { code?: unknown }).code ?? "");
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [mode, setMode] = useState<LoginMode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const from = (location.state as LocationState | undefined)?.from ?? "/";

  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true });
    }
  }, [from, isLoading, navigate, user]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  };

  const handleSendCode = async () => {
    const loginIdentifier = identifier.trim();

    if (!isValidLoginIdentifier(loginIdentifier)) {
      setError("请先填写正确的手机号");
      return;
    }

    setError(null);
    setMessage(null);
    setSendingCode(true);
    try {
      const result = await authService.sendCode({
        identifier: loginIdentifier,
        scene: "login"
      });
      setSmsCode(result.code ?? "");
      setMessage(`验证码已发送，开发环境验证码为：${result.code}`);
      setCountdown(Math.max(1, result.expireSeconds ?? 60));
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const trimmedIdentifier = identifier.trim();
      const payload: LoginRequest = mode === "code"
        ? {
          identifier: trimmedIdentifier,
          smsCode: smsCode.trim(),
          channel: "H5"
        }
        : {
          identifier: trimmedIdentifier,
          password,
          channel: "H5"
        };
      await login(payload);
      navigate(from, { replace: true });
    } catch (err) {
      const code = readErrorCode(err);
      if (code === "AUTH_400_CAPTCHA_REQUIRED") {
        setMode("code");
        setError("当前手机号需要验证码确认，请获取验证码后登录");
      } else {
        if (code === "AUTH_400_INVALID_CAPTCHA") {
          setMode("code");
        }
        setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting
    || !identifier.trim()
    || (mode === "password" ? !password.trim() : !smsCode.trim());

  return (
    <AuthExperience>
      <section className={styles.card}>
        <div className={styles.securityBadge}>
          <span />
          SSL 安全加密连接
        </div>

        <div className={styles.moduleViewport}>
          <div className={`${styles.moduleSlider} ${authView === "register" ? styles.moduleSliderRegister : ""}`}>
            <div className={styles.modulePane}>
              <div className={styles.tabs} aria-label="登录方式">
                <button
                  type="button"
                  className={`${styles.tab} ${mode === "password" ? styles.tabActive : ""}`}
                  onClick={() => switchMode("password")}
                >
                  密码登录
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${mode === "code" ? styles.tabActive : ""}`}
                  onClick={() => switchMode("code")}
                >
                  验证码登录
                </button>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <input
                    className={styles.input}
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="手机号"
                    autoComplete="tel"
                  />
                </div>

                {mode === "password" ? (
                  <div className={styles.field}>
                    <input
                      className={styles.input}
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="密码"
                      autoComplete="current-password"
                    />
                  </div>
                ) : null}

                {mode === "code" ? (
                  <div className={styles.fieldGroup}>
                    <div className={styles.codeRow}>
                      <input
                        className={styles.input}
                        value={smsCode}
                        onChange={(event) => setSmsCode(event.target.value)}
                        placeholder="验证码"
                        autoComplete="one-time-code"
                      />
                      <button
                        type="button"
                        className={styles.codeButton}
                        disabled={sendingCode || countdown > 0}
                        onClick={() => void handleSendCode()}
                      >
                        {countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className={styles.rowBetween}>
                  <label className={styles.checkboxRow}>
                    <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                    保持登录状态
                  </label>
                  <button type="button" className={styles.textButton} onClick={() => switchMode(mode === "code" ? "password" : "code")}>
                    {mode === "code" ? "返回密码登录" : "验证码登录"}
                  </button>
                </div>

                {error ? <div className={styles.error}>{error}</div> : null}
                {message ? <div className={styles.success}>{message}</div> : null}

                <button type="submit" className={styles.submitButton} disabled={isDisabled}>
                  {submitting ? "开启中..." : "开启邻里之光"}
                </button>
              </form>

              <div className={styles.secondaryActions}>
                还没有加入邻里？
                <button type="button" onClick={() => setAuthView("register")}>
                  立即入驻
                </button>
              </div>
            </div>

            <div className={`${styles.modulePane} ${styles.registerPane}`}>
              <span className={styles.registerEyebrow}>入驻邻里</span>
              <h2>用手机号创建你的社区身份。</h2>
              <p>注册模块已预留滑动切换位，继续后进入完整入驻流程。</p>
              <button type="button" className={styles.submitButton} onClick={() => navigate("/register", { state: { from } })}>
                继续入驻
              </button>
              <button type="button" className={styles.backButton} onClick={() => setAuthView("login")}>
                返回登录
              </button>
            </div>
          </div>
        </div>
      </section>
    </AuthExperience>
  );
};

export default LoginPage;
