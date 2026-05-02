import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthExperience from "@/features/auth/AuthExperience";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import type { RegisterRequest } from "@/types/auth";
import styles from "./AuthForm.module.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const redirectTimerRef = useRef<number | null>(null);

  const from = (location.state as { from?: string } | undefined)?.from ?? "/";

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => () => {
    if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
  }, []);

  const handleSendCode = async () => {
    if (!phone.trim()) { setError("请先填写手机号"); return; }
    setError(null);
    setMessage(null);
    setSendingCode(true);
    try {
      const result = await authService.sendCode({ scene: "register", identifier: phone.trim() });
      setSmsCode(result.code ?? "");
      setMessage(`验证码已发送，开发环境验证码为：${result.code}`);
      setCountdown(Math.max(1, result.expireSeconds ?? 60));
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const goNext = () => {
    setError(null);
    setMessage(null);
    if (!/^1\d{10}$/.test(phone.trim())) { setError("请输入正确的手机号"); return; }
    if (!/^\d{6}$/.test(smsCode.trim())) { setError("请输入 6 位验证码"); return; }
    setStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) { goNext(); return; }

    setError(null);
    setMessage(null);
    if (!nickname.trim()) {
      setError("请填写昵称");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      setError("访问口令至少 8 位，并同时包含字母和数字");
      return;
    }
    if (password !== confirmPassword) { setError("两次输入的访问口令不一致"); return; }

    setSubmitting(true);
    try {
      const payload: RegisterRequest = {
        phone: phone.trim(),
        nickname: nickname.trim(),
        smsCode: smsCode.trim(),
        password,
        confirmPassword
      };
      await register(payload);
      setMessage("入驻成功，正在进入邻里知光");
      redirectTimerRef.current = window.setTimeout(() => navigate(from, { replace: true }), 360);
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const stepOneDisabled = !phone.trim() || !smsCode.trim();
  const stepTwoDisabled = submitting || !nickname.trim() || !password.trim() || !confirmPassword.trim();

  return (
    <AuthExperience>
      <section className={styles.card}>
        <div className={styles.titleBlock}>
          <span className={styles.eyebrow}>邻里知光</span>
          <h1 className={styles.title}>入驻邻里</h1>
          <p className={styles.subtitle}>
            {step === 1 ? "只需两步，点亮你的社区身份" : "设置昵称和访问口令，完成你的邻里身份"}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="手机号"
                  autoComplete="tel"
                />
              </div>
              <div className={styles.codeRow}>
                <input
                  className={styles.input}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="验证码"
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  className={styles.codeButton}
                  disabled={sendingCode || countdown > 0}
                  onClick={() => void handleSendCode()}
                >
                  {countdown > 0 ? `${countdown}s` : "获取验证码"}
                </button>
              </div>
              <button type="submit" className={styles.submitButton} disabled={stepOneDisabled}>
                验证并下一步
              </button>
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>昵称</label>
                <input
                  className={styles.input}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你的邻里昵称"
                  autoComplete="nickname"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>设置访问口令</label>
                <input
                  className={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 8 位，包含字母和数字"
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>确认访问口令</label>
                <input
                  className={styles.input}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入访问口令"
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.stepRow}>
                <button type="button" className={styles.ghostButton} onClick={() => setStep(1)}>
                  上一步
                </button>
                <button type="submit" className={styles.submitButton} disabled={stepTwoDisabled}>
                  {submitting ? "确认中..." : "确认注册"}
                </button>
              </div>
            </>
          )}

          {error ? <div className={styles.error}>{error}</div> : null}
          {message ? <div className={styles.success}>{message}</div> : null}
        </form>

        <div className={styles.secondaryActions}>
          已有手机号？
          <button type="button" onClick={() => navigate("/login", { state: { from } })}>
            去登录
          </button>
        </div>
      </section>
    </AuthExperience>
  );
};

export default RegisterPage;
