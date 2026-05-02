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
type AuthView = "login" | "register" | "reset";

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [mode, setMode] = useState<LoginMode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
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

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    clearFeedback();
  };

  const switchView = (nextView: AuthView) => {
    setAuthView(nextView);
    clearFeedback();
    if (nextView === "reset") {
      setResetPhone(identifier.trim());
    }
  };

  const handleSendCode = async () => {
    const phone = identifier.trim();

    if (!/^1\d{10}$/.test(phone)) {
      setError("请先填写 11 位手机号");
      return;
    }

    clearFeedback();
    setSendingCode(true);
    try {
      const result = await authService.sendCode({
        identifier: phone,
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

  const handleSendResetCode = async () => {
    const phone = resetPhone.trim();

    if (!/^1\d{10}$/.test(phone)) {
      setError("请先填写 11 位手机号");
      return;
    }

    clearFeedback();
    setSendingCode(true);
    try {
      const result = await authService.sendCode({
        identifier: phone,
        scene: "password_reset"
      });
      setResetCode(result.code ?? "");
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
    clearFeedback();
    const trimmedIdentifier = identifier.trim();

    if (!/^1\d{10}$/.test(trimmedIdentifier)) {
      setError("请填写 11 位手机号");
      return;
    }

    setSubmitting(true);
    try {
      const payload: LoginRequest = mode === "password"
        ? {
            identifier: trimmedIdentifier,
            password,
            channel: "H5"
          }
        : {
            identifier: trimmedIdentifier,
            channel: "H5",
            smsCode: smsCode.trim()
          };
      await login(payload);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    const phone = resetPhone.trim();
    if (!/^1\d{10}$/.test(phone)) {
      setError("请填写 11 位手机号");
      return;
    }
    if (!/^\d{6}$/.test(resetCode.trim())) {
      setError("请输入 6 位验证码");
      return;
    }
    if (!passwordPattern.test(resetPassword)) {
      setError("新密码至少 8 位，并同时包含字母和数字");
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword({
        phone,
        smsCode: resetCode.trim(),
        newPassword: resetPassword
      });
      setIdentifier(phone);
      setPassword("");
      setResetPassword("");
      setResetConfirmPassword("");
      setMode("password");
      setAuthView("login");
      setCountdown(0);
      setMessage("密码已重置，请使用新密码登录");
    } catch (err) {
      setError(err instanceof Error ? err.message : "密码重置失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting
    || !identifier.trim()
    || (mode === "password" ? !password.trim() : !smsCode.trim());
  const isResetDisabled = submitting
    || !resetPhone.trim()
    || !resetCode.trim()
    || !resetPassword.trim()
    || !resetConfirmPassword.trim();

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
              {authView === "reset" ? (
                <>
                  <div className={styles.titleBlock}>
                    <span className={styles.eyebrow}>找回密码</span>
                    <h2 className={styles.title}>用手机号重设访问口令。</h2>
                    <p className={styles.subtitle}>验证码校验通过后，新密码会立即生效。</p>
                  </div>

                  <form className={styles.form} onSubmit={handleResetSubmit}>
                    <div className={styles.field}>
                      <input
                        className={styles.input}
                        value={resetPhone}
                        onChange={(event) => setResetPhone(event.target.value)}
                        placeholder="手机号"
                        autoComplete="tel"
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <div className={styles.codeRow}>
                        <input
                          className={styles.input}
                          value={resetCode}
                          onChange={(event) => setResetCode(event.target.value)}
                          placeholder="验证码"
                          autoComplete="one-time-code"
                        />
                        <button
                          type="button"
                          className={styles.codeButton}
                          disabled={sendingCode || countdown > 0}
                          onClick={() => void handleSendResetCode()}
                        >
                          {countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
                        </button>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <input
                        className={styles.input}
                        type="password"
                        value={resetPassword}
                        onChange={(event) => setResetPassword(event.target.value)}
                        placeholder="新密码"
                        autoComplete="new-password"
                      />
                    </div>

                    <div className={styles.field}>
                      <input
                        className={styles.input}
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(event) => setResetConfirmPassword(event.target.value)}
                        placeholder="再次输入新密码"
                        autoComplete="new-password"
                      />
                    </div>

                    {error ? <div className={styles.error}>{error}</div> : null}
                    {message ? <div className={styles.success}>{message}</div> : null}

                    <button type="submit" className={styles.submitButton} disabled={isResetDisabled}>
                      {submitting ? "提交中..." : "重置密码"}
                    </button>
                  </form>

                  <div className={styles.secondaryActions}>
                    想起密码了？
                    <button type="button" onClick={() => switchView("login")}>
                      返回登录
                    </button>
                  </div>
                </>
              ) : (
                <>
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
                    ) : (
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
                    )}

                    <div className={styles.rowBetween}>
                      <label className={styles.checkboxRow}>
                        <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                        保持登录状态
                      </label>
                      <button type="button" className={styles.textButton} onClick={() => switchView("reset")}>
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
                    <button type="button" onClick={() => switchView("register")}>
                      立即入驻
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className={`${styles.modulePane} ${styles.registerPane}`}>
              <span className={styles.registerEyebrow}>入驻邻里</span>
              <h2>用手机号创建你的社区身份。</h2>
              <p>注册模块已预留滑动切换位，继续后进入完整入驻流程。</p>
              <button type="button" className={styles.submitButton} onClick={() => navigate("/register", { state: { from } })}>
                继续入驻
              </button>
              <button type="button" className={styles.backButton} onClick={() => switchView("login")}>
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
