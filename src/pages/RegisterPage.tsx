import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import type { RegisterRequest } from "@/types/auth";
import styles from "./RegisterPage.module.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const [phone, setPhone] = useState("");
  const [account, setAccount] = useState("");
  const [nickname, setNickname] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => () => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
    }
  }, []);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError("请先填写手机号");
      return;
    }

    setError(null);
    setMessage(null);
    setSendingCode(true);
    try {
      const result = await authService.sendCode({
        scene: "register",
        identifier: phone.trim()
      });
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
      const payload: RegisterRequest = {
        phone: phone.trim(),
        account: account.trim(),
        nickname: nickname.trim(),
        smsCode: smsCode.trim(),
        password
      };
      await register(payload);
      setMessage("注册成功，已自动登录");
      const from = (location.state as { from?: string } | undefined)?.from ?? "/";
      redirectTimerRef.current = window.setTimeout(() => {
        navigate(from, { replace: true });
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting
    || !phone.trim()
    || !account.trim()
    || !nickname.trim()
    || !smsCode.trim()
    || !password.trim()
    || !agreeTerms;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>加入邻知</h1>
          <p className={styles.subtitle}>创建你的社区知识名片，与更多邻里建立连接</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">手机号</label>
            <input
              id="phone"
              className={styles.input}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="请输入手机号"
              autoComplete="tel"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="account">账号</label>
            <input
              id="account"
              className={styles.input}
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              placeholder="4-32 位字母、数字或下划线"
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="nickname">昵称</label>
            <input
              id="nickname"
              className={styles.input}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="请输入昵称"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="smsCode">短信验证码</label>
            <div className={styles.codeRow}>
              <input
                id="smsCode"
                className={styles.input}
                value={smsCode}
                onChange={(event) => setSmsCode(event.target.value)}
                placeholder="请输入验证码"
                autoComplete="one-time-code"
              />
              <button
                type="button"
                className={styles.codeButton}
                disabled={sendingCode || countdown > 0}
                onClick={handleSendCode}
              >
                {countdown > 0 ? `${countdown}s` : "获取验证码"}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">密码</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位，包含字母和数字"
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.checkboxRow}>
              <input
                id="agreeTerms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(event) => setAgreeTerms(event.target.checked)}
              />
              <label className={styles.label} htmlFor="agreeTerms">
                我已阅读并同意
                <a href="#" onClick={(event) => event.preventDefault()}>《用户协议》</a>
                和
                <a href="#" onClick={(event) => event.preventDefault()}>《隐私政策》</a>
              </label>
            </div>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}
          {message ? <div className={styles.success}>{message}</div> : null}

          <div className={styles.actions}>
            <button type="submit" className={styles.submitButton} disabled={isDisabled}>
              {submitting ? "注册中..." : "立即注册"}
            </button>
            <div className={styles.switchLink}>
              已有账号？
              <button type="button" onClick={() => navigate("/login")}>返回登录</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
