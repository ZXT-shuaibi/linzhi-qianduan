import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { todoApi } from "../services/todoApi";

type Mode = "login" | "register";
type LoginMethod = "password" | "sms";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("接口已预留，当前先完成可演示的前端走通。");

  const [loginForm, setLoginForm] = useState({
    phone: "13800138000",
    password: "123456",
    code: ""
  });
  const [registerForm, setRegisterForm] = useState({
    phone: "",
    code: "",
    password: "",
    confirmPassword: ""
  });

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await todoApi.login({
      phone: loginForm.phone,
      password: loginMethod === "password" ? loginForm.password : undefined,
      code: loginMethod === "sms" ? loginForm.code : undefined
    });
    setMessage(result.message);
    setSubmitting(false);
    if (result.ok) {
      window.sessionStorage.setItem("linzhi-auth", "demo");
      navigate("/discover");
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await todoApi.register(registerForm);
    setMessage(result.message);
    setSubmitting(false);
    if (result.ok) {
      setMode("login");
      setLoginMethod("password");
      setLoginForm((current) => ({ ...current, phone: registerForm.phone }));
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-a" />
      <div className="auth-orb auth-orb-b" />

      <section className="auth-card">
        <div className="auth-visual">
          <div className="auth-marquee auth-marquee-left">
            <div className="floating-tile tall">社区互助</div>
            <div className="floating-tile">旧物换新主</div>
            <div className="floating-tile">拼单搭子</div>
            <div className="floating-tile tall">生活情报局</div>
          </div>
          <div className="auth-marquee auth-marquee-right">
            <div className="floating-tile">楼下运动局</div>
            <div className="floating-tile tall">好店种草卡</div>
            <div className="floating-tile">今日热贴</div>
            <div className="floating-tile">邻里关注中</div>
          </div>
          <div className="auth-story">
            <p className="ink-logo">邻里</p>
            <h1>连接你我，点亮社区生活。</h1>
            <p>
              这版前端依据你给的原型文件拆成了 React 页面。认证先做成演示闭环，后续只需要把
              `TODO` 服务替换成真实接口。
            </p>
            <div className="trust-row">
              <span>2,000+ 邻居已入驻</span>
              <span>社区温度持续上涨</span>
            </div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-switch">
            <button
              type="button"
              className={mode === "login" ? "switch-pill switch-pill-active" : "switch-pill"}
              onClick={() => setMode("login")}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === "register" ? "switch-pill switch-pill-active" : "switch-pill"}
              onClick={() => setMode("register")}
            >
              注册
            </button>
          </div>

          {mode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="tab-row">
                <button
                  type="button"
                  className={loginMethod === "password" ? "mini-tab mini-tab-active" : "mini-tab"}
                  onClick={() => setLoginMethod("password")}
                >
                  密码登录
                </button>
                <button
                  type="button"
                  className={loginMethod === "sms" ? "mini-tab mini-tab-active" : "mini-tab"}
                  onClick={() => setLoginMethod("sms")}
                >
                  验证码登录
                </button>
              </div>

              <label className="field">
                <span>手机号</span>
                <input
                  value={loginForm.phone}
                  onChange={(event) => setLoginForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="输入手机号"
                />
              </label>

              {loginMethod === "password" ? (
                <label className="field">
                  <span>访问口令</span>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="输入访问口令"
                  />
                </label>
              ) : (
                <label className="field">
                  <span>短信验证码</span>
                  <input
                    value={loginForm.code}
                    onChange={(event) => setLoginForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="输入短信验证码"
                  />
                </label>
              )}

              <button type="submit" className="primary-button wide-button" disabled={submitting}>
                {submitting ? "验证中..." : "进入邻里知光"}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <label className="field">
                <span>手机号</span>
                <input
                  value={registerForm.phone}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="输入手机号"
                />
              </label>
              <label className="field">
                <span>验证码</span>
                <input
                  value={registerForm.code}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="输入验证码"
                />
              </label>
              <label className="field">
                <span>设置密码</span>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="设置访问口令"
                />
              </label>
              <label className="field">
                <span>确认密码</span>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  placeholder="再次输入访问口令"
                />
              </label>

              <button type="submit" className="primary-button wide-button" disabled={submitting}>
                {submitting ? "创建中..." : "完成注册"}
              </button>
            </form>
          )}

          <div className="todo-banner">
            <strong>TODO 接口提示</strong>
            <p>{message}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AuthPage;
