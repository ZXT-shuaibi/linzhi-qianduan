import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./LearningPage.module.css";

const learningEmptyState = {
  title: "还没有已购内容",
  description: "去首页或市集看看有没有你感兴趣的内容吧。",
  actionLabel: "前往首页"
};

const LearningPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout
      header={(
        <MainHeader
          headline="我的学习"
          subtitle="记录每一次学习进度，保持持续成长"
          rightSlot={<AuthStatus />}
        />
      )}
    >
      <div className={styles.emptyCard}>
        <div className={styles.icon}>📘</div>
        <div className={styles.title}>{learningEmptyState.title}</div>
        <div className={styles.description}>{learningEmptyState.description}</div>
        <button type="button" className="ghost-button" onClick={() => navigate("/")}>
          {learningEmptyState.actionLabel}
        </button>
      </div>
    </AppLayout>
  );
};

export default LearningPage;
