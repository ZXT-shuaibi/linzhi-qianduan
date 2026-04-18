import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const navItems = [
  { to: "/discover", label: "发现", icon: "◐" },
  { to: "/market", label: "集市", icon: "△" },
  { to: "/create", label: "发布", icon: "✦" },
  { to: "/profile", label: "我的", icon: "◎" }
];

function AppShell({ title, subtitle, children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    window.sessionStorage.removeItem("linzhi-auth");
    navigate("/auth");
  };

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand-mark">邻</div>
        <div className="brand-copy">
          <strong>邻里知光</strong>
          <span>社区气氛先跑起来</span>
        </div>
        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "side-link side-link-active" : "side-link")}
            >
              <span className="side-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-panel">
          <p>接口状态</p>
          <strong>TODO</strong>
          <span>当前页面统一读取本地 mock 数据。</span>
        </div>
      </aside>

      <div className="page-frame">
        <header className="topbar">
          <div>
            <p className="topbar-kicker">{location.pathname.replace("/", "") || "auth"}</p>
            <h1>{title}</h1>
            <p className="topbar-subtitle">{subtitle}</p>
          </div>
          <div className="topbar-actions">
            <div className="status-pill">
              <span className="status-dot" />
              原型驱动
            </div>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              返回登录
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
