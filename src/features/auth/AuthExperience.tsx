import type { ReactNode } from "react";
import styles from "./AuthExperience.module.css";

type AuthExperienceProps = {
  children: ReactNode;
};

const activityColumns = [
  [
    {
      title: "楼下咖啡拼单",
      meta: "12 人刚刚加入",
      tone: "warm",
      badge: "☕",
      icon: "拼",
      layout: "cardCompact",
      stickerPlace: "stickerTopRight"
    },
    {
      title: "闲置书架转让",
      meta: "距离 180m",
      tone: "clay",
      badge: "闲",
      icon: "📚",
      layout: "cardOffset",
      stickerPlace: "stickerLowRight"
    },
    {
      title: "小区羽毛球局",
      meta: "今晚 19:30",
      tone: "mint",
      badge: "🏸",
      icon: "约",
      layout: "cardSplit",
      stickerPlace: "stickerMidRight"
    },
    {
      title: "物业缴费指南",
      meta: "热度上升",
      tone: "paper",
      badge: "物",
      icon: "🧾",
      layout: "cardOffset",
      stickerPlace: "stickerTopRight"
    },
    {
      title: "周末儿童绘本角",
      meta: "邻居推荐",
      tone: "warm",
      badge: "📖",
      icon: "周",
      layout: "cardSplit",
      stickerPlace: "stickerLowRight"
    },
    {
      title: "修伞师傅在线",
      meta: "5 条新回复",
      tone: "mint",
      badge: "☂️",
      icon: "帮",
      layout: "cardCompact",
      stickerPlace: "stickerMidRight"
    },
    {
      title: "阳台绿植交换",
      meta: "3 盆薄荷待领",
      tone: "mint",
      badge: "🌿",
      icon: "换",
      layout: "cardOffset",
      stickerPlace: "stickerTopRight"
    }
  ],
  [
    {
      title: "钥匙失物招领",
      meta: "东门保安处",
      tone: "paper",
      badge: "🔑",
      icon: "寻",
      layout: "cardSplit",
      stickerPlace: "stickerLowRight"
    },
    {
      title: "宠物散步搭子",
      meta: "晚饭后出发",
      tone: "warm",
      badge: "🐾",
      icon: "遛",
      layout: "cardCompact",
      stickerPlace: "stickerMidRight"
    },
    {
      title: "水果团购开车",
      meta: "还差 4 单成团",
      tone: "mint",
      badge: "🍊",
      icon: "团",
      layout: "cardOffset",
      stickerPlace: "stickerTopRight"
    },
    {
      title: "自习室空位提醒",
      meta: "二层靠窗",
      tone: "clay",
      badge: "💡",
      icon: "静",
      layout: "cardSplit",
      stickerPlace: "stickerLowRight"
    },
    {
      title: "充电桩可预约",
      meta: "B2 区 2 个空闲",
      tone: "paper",
      badge: "🔌",
      icon: "电",
      layout: "cardCompact",
      stickerPlace: "stickerTopRight"
    },
    {
      title: "快递顺手帮取",
      meta: "到 20:30 截止",
      tone: "warm",
      badge: "📦",
      icon: "取",
      layout: "cardOffset",
      stickerPlace: "stickerMidRight"
    },
    {
      title: "夜跑安全小队",
      meta: "沿河 3 公里",
      tone: "mint",
      badge: "🌙",
      icon: "跑",
      layout: "cardSplit",
      stickerPlace: "stickerLowRight"
    }
  ],
  [
    {
      title: "社区电影夜",
      meta: "周五 19:00",
      tone: "clay",
      badge: "🎬",
      icon: "映",
      layout: "cardOffset",
      stickerPlace: "stickerTopRight"
    },
    {
      title: "婴儿推车转让",
      meta: "九成新可看",
      tone: "paper",
      badge: "🧸",
      icon: "转",
      layout: "cardCompact",
      stickerPlace: "stickerMidRight"
    },
    {
      title: "橘猫临时寄养",
      meta: "周末两天",
      tone: "warm",
      badge: "🐱",
      icon: "喵",
      layout: "cardSplit",
      stickerPlace: "stickerLowRight"
    },
    {
      title: "周日社区市集",
      meta: "摊位报名中",
      tone: "mint",
      badge: "🧺",
      icon: "集",
      layout: "cardOffset",
      stickerPlace: "stickerTopRight"
    },
    {
      title: "工具箱借用",
      meta: "电钻已归还",
      tone: "clay",
      badge: "🔧",
      icon: "借",
      layout: "cardSplit",
      stickerPlace: "stickerMidRight"
    },
    {
      title: "停车位临停",
      meta: "今晚可用",
      tone: "paper",
      badge: "P",
      icon: "停",
      layout: "cardCompact",
      stickerPlace: "stickerLowRight"
    },
    {
      title: "晚餐多做一份",
      meta: "番茄牛腩",
      tone: "warm",
      badge: "🍲",
      icon: "饭",
      layout: "cardOffset",
      stickerPlace: "stickerTopRight"
    }
  ]
];

const neighborAvatars = ["neighborLavender", "neighborMint", "neighborAmber"] as const;

const AuthExperience = ({ children }: AuthExperienceProps) => (
  <div className={styles.screen}>
    <div className={styles.page}>
      <section className={styles.visualPanel} aria-label="邻里社区动态">
        <div className={styles.marqueeStage} aria-hidden="true">
          {activityColumns.map((cards, column) => (
            <div
              key={column}
              className={`${styles.marqueeColumn} ${column === 1 ? styles.marqueeDown : styles.marqueeUp}`}
            >
              {[...cards, ...cards].map((card, index) => (
                <div
                  key={`${card.title}-${column}-${index}`}
                  className={`${styles.floatCard} ${styles[card.tone]} ${styles[card.layout]}`}
                >
                  <span className={`${styles.cardSticker} ${styles[card.stickerPlace]}`} aria-hidden="true">
                    {card.icon}
                  </span>
                  <span className={styles.cardMark} aria-hidden="true">{card.badge}</span>
                  <span className={styles.cardText}>
                    <strong>{card.title}</strong>
                    <span>{card.meta}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.fadeTop} aria-hidden="true" />
        <div className={styles.fadeBottom} aria-hidden="true" />

        <div className={styles.glassPanel}>
          <div className={styles.brandScript}>邻里</div>
          <h2>
            连接你我，
            <br />
            点亮<span>社区生活。</span>
          </h2>
          <p>
            基于 LBS 地理位置的智能社区引擎。
            <br />
            让闲置交易、互助问答、邻里社交像呼吸一样自然，重塑你的城市归属感。
          </p>
          <div className={styles.panelFooter}>
            <div className={styles.neighborStack} aria-label="邻居头像">
              {neighborAvatars.map((item) => (
                <span key={item} className={`${styles.neighborAvatar} ${styles[item]}`} aria-hidden="true">
                  <span className={styles.avatarBackHair} />
                  <span className={styles.avatarHair} />
                  <span className={styles.avatarFace}>
                    <span className={styles.avatarEyes} />
                    <span className={styles.avatarMouth} />
                  </span>
                  <span className={styles.avatarBody} />
                  <span className={styles.avatarAccessory} />
                </span>
              ))}
            </div>
            <div className={styles.rating}>
              <strong>★★★★★</strong>
              <span>已有 <b>2,000+</b> 邻居入驻</span>
            </div>
          </div>
        </div>
      </section>

      <main className={styles.formPanel}>{children}</main>
    </div>
  </div>
);

export default AuthExperience;
