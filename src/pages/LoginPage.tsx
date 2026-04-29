import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthExperience from "@/features/auth/AuthExperience";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import type { LoginRequest } from "@/types/auth";
import styles from "./AuthForm.module.css";

type LocationState = {
  from?: string;
};

type LoginMode = "password" | "code";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuth();
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

  const handleSendCode = async () => {
    if (!identifier.trim()) {
      setError("请先填写手机号或账号");
      return;
    }

    setError(null);
    setMessage(null);
    setSendingCode(true);
    try {
      const result = await authService.sendCode({
        identifier: identifier.trim(),
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
      const payload: LoginRequest = {
        identifier: identifier.trim(),
        password,
        channel: "H5",
        captchaCode: mode === "code" ? smsCode.trim() : undefined
      };
      await login(payload);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting
    || !identifier.trim()
    || !password.trim()
    || (mode === "code" && !smsCode.trim());

  return (
    <AuthExperience>
      <section className={styles.card}>
        <div className={styles.tabs} aria-label="登录方式">
          <button
            type="button"
            className={`${styles.tab} ${mode === "password" ? styles.tabActive : ""}`}
            onClick={() => setMode("password")}
          >
            密码登录
          </button>
          <button
            type="button"
            className={`${styles.tab} ${mode === "code" ? styles.tabActive : ""}`}
            onClick={() => setMode("code")}
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
              placeholder="手机号或账号"
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="访问口令"
              autoComplete="current-password"
            />
          </div>

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
              <p className={styles.inlineHelp}>当前后端真实接口将验证码作为安全校验，仍需要同时提交访问口令。</p>
            </div>
          ) : null}

          <div className={styles.rowBetween}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              保持登录状态
            </label>
            <button type="button" className={styles.textButton} onClick={() => setMode("code")}>
              忘记了？
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
          <button type="button" onClick={() => navigate("/register", { state: { from } })}>
            立即入驻
          </button>
        </div>
      </section>
    </AuthExperience>
  );
};

export default LoginPage;
