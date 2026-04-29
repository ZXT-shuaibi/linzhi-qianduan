import { FormEvent, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import AuthStatus from "@/features/auth/AuthStatus";
import { CreateIcon, ProfileIcon, SearchIcon, SparkIcon } from "@/components/icons/Icon";
import styles from "./CommunityTopNav.module.css";

type CommunityTopNavProps = {
  locationLabel?: string;
};

const navItems = [
  { to: "/", label: "首页" },
  { to: "/discover", label: "发现" },
  { to: "/market", label: "市集" },
  { to: "/search", label: "AI 搜索" }
] as const;

const CommunityTopNav = ({ locationLabel = "上海社区" }: CommunityTopNavProps) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };

  return (
    <header className={styles.navbar}>
      <Link to="/" className={styles.brand} aria-label="邻里知光首页">
        <span className={styles.brandMark}>
          <SparkIcon width={22} height={22} stroke="none" fill="currentColor" />
        </span>
        <span>
          <strong>邻里知光</strong>
          <small>{locationLabel}</small>
        </span>
      </Link>

      <form className={styles.searchBox} onSubmit={handleSearch}>
        <SearchIcon width={18} height={18} strokeWidth={1.8} />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="问问附近课程、手作、市集活动"
          aria-label="搜索社区内容"
        />
        <button type="submit">探索</button>
      </form>

      <nav className={styles.links} aria-label="社区导航">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.actions}>
        <Link to="/profile" className={styles.profileButton}>
          <ProfileIcon width={18} height={18} strokeWidth={1.8} />
          我的主页
        </Link>
        <Link to="/create" className={styles.createButton}>
          <CreateIcon width={18} height={18} strokeWidth={1.8} />
          创作 / 发布
        </Link>
        <AuthStatus />
      </div>
    </header>
  );
};

export default CommunityTopNav;
