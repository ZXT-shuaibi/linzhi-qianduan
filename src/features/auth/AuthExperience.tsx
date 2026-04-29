import type { ReactNode } from "react";
import styles from "./AuthExperience.module.css";

type AuthExperienceProps = {
  children: ReactNode;
};

const activityCards = [
  { title: "楼下咖啡拼单", meta: "12 人刚刚加入", tone: "warm" },
  { title: "闲置书架转让", meta: "距离 180m", tone: "clay" },
  { title: "小区羽毛球局", meta: "今晚 19:30", tone: "mint" },
  { title: "物业缴费指南", meta: "热度上升", tone: "paper" },
  { title: "周末儿童绘本角", meta: "邻居推荐", tone: "warm" },
  { title: "修伞师傅在线", meta: "5 条新回复", tone: "mint" }
];

const avatars = ["邻", "光", "家"];

const AuthExperience = ({ children }: AuthExperienceProps) => (
  <div className={styles.page}>
    <section className={styles.visualPanel} aria-label="邻里社区动态">
      <div className={styles.marquee} aria-hidden="true">
        {[0, 1, 2].map((column) => (
          <div
            key={column}
            className={`${styles.marqueeColumn} ${column % 2 === 0 ? styles.marqueeUp : styles.marqueeDown}`}
          >
            {[...activityCards, ...activityCards].map((card, index) => (
              <div key={`${card.title}-${column}-${index}`} className={`${styles.floatCard} ${styles[card.tone]}`}>
                <span className={styles.cardMark}>{card.title.slice(0, 1)}</span>
                <strong>{card.title}</strong>
                <span>{card.meta}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.glassPanel}>
        <div className={styles.brandScript}>邻里</div>
        <h2>
          连接你我，
          <br />
          点亮<span>社区生活。</span>
        </h2>
        <p>基于 LBS 地理位置的智能社区引擎，让闲置交易、互助问答、邻里社交像呼吸一样自然。</p>
        <div className={styles.panelFooter}>
          <div className={styles.avatarStack}>
            {avatars.map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className={styles.rating}>
            <strong>★★★★★</strong>
            <span>已有 2,000+ 邻居入驻</span>
          </div>
        </div>
      </div>
    </section>

    <main className={styles.formPanel}>{children}</main>
  </div>
);

export default AuthExperience;
