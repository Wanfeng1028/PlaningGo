import { RevealGroup } from "../components/RevealGroup";
import { Button } from "../components/Button";
import type { ModalKey, NavKey } from "../types";
import styles from "./Pages.module.scss";

/* ── props ────────────────────────────────────────────────────────── */

interface FlowPageProps {
  onOpenModal: (key: ModalKey) => void;
  onNavigate: (key: NavKey) => void;
}

/* ── 设计原则 Bento 数据 ──────────────────────────────────────────── */

const PRINCIPLES = [
  {
    id: "conclusion",
    title: "先给结论",
    desc: "先看到能执行的路线，再决定要不要看细节。",
    example: "首选方案 · 可信度 · 关键标签",
    size: "large" as const,
  },
  {
    id: "explain",
    title: "解释理由",
    desc: "推荐不是黑箱，每条都说明为什么。",
    example: "少排队 · 距离合适 · 餐厅可订",
    size: "medium" as const,
  },
  {
    id: "confirm",
    title: "动作可确认",
    desc: "重要动作都要用户确认，不会偷偷发生。",
    example: "预约 · 分享 · 日历",
    size: "medium" as const,
  },
  {
    id: "backup",
    title: "变化有备选",
    desc: "下雨、晚出发、排队变长时，界面直接给替代方案。",
    example: "雨天 · 晚出发 · 排队变长",
    size: "wide" as const,
  },
];

/* ── 视觉语言数据 ──────────────────────────────────────────────────── */

const VISUAL_TOKENS = [
  { id: "cream", label: "奶油白", desc: "降低焦虑", swatch: "#f7f1e7" },
  { id: "yellow", label: "黄色", desc: "提示下一步", swatch: "#ffcc33" },
  { id: "black", label: "黑色", desc: "承载确认", swatch: "#111213" },
  { id: "glass", label: "玻璃卡", desc: "分层信息", swatch: "glass" },
  { id: "radius", label: "圆角", desc: "弱化工具感", swatch: "radius" },
  { id: "pill", label: "标签", desc: "快速判断", swatch: "pill" },
];

/* ── 状态系统数据 ──────────────────────────────────────────────────── */

const STATE_TOKENS = [
  { name: "可执行", next: "保存并分享", color: "green" },
  { name: "待确认", next: "确认预约", color: "yellow" },
  { name: "朋友投票中", next: "等待结果", color: "blue" },
  { name: "排队风险高", next: "查看替代", color: "orange" },
  { name: "雨天可切换", next: "查看室内备选", color: "blue" },
  { name: "已保存", next: "分享给家人", color: "green" },
  { name: "可重试", next: "重试或换方案", color: "red" },
];

/* ── 页面一致性数据 ───────────────────────────────────────────────── */

const PAGE_FRAGMENTS = [
  { id: "home", title: "首页", desc: "一句话开始", icon: "💬" },
  { id: "features", title: "功能页", desc: "生成方案", icon: "⚡" },
  { id: "cases", title: "场景页", desc: "理解生活", icon: "🎯" },
  { id: "profile", title: "个人中心", desc: "画像与记忆", icon: "👤" },
];

/* ── 界面剖面层级 ─────────────────────────────────────────────────── */

const CARD_LAYERS = [
  { layer: "1", label: "用户意图", desc: "一句话需求", color: "#ffcc33" },
  { layer: "2", label: "推荐理由", desc: "为什么适合你", color: "#27ae60" },
  { layer: "3", label: "时间线", desc: "路线和节点", color: "#2196f3" },
  { layer: "4", label: "可执行动作", desc: "预约 · 分享 · 日历", color: "#111213" },
];

/* ── component ────────────────────────────────────────────────────── */

export function FlowPage({ onOpenModal, onNavigate }: FlowPageProps) {
  return (
    <>
      {/* ═══════ Hero — 设计理念发布页 ═══════ */}
      <section className={styles.flowHero}>
        <div className={styles.flowHeroContent}>
          <RevealGroup>
            <span className={styles.heroEyebrow}>设计亮点</span>
            <h1 className={styles.heroTitle}>
              复杂计划，也能一眼看懂
            </h1>
            <p className={styles.heroSubtitle}>
              把地点、路线、预算、天气和动作状态，整理成能判断、能确认、能改变的界面。
            </p>
            <div className={styles.heroActions}>
              <Button onClick={() => onOpenModal("guest")}>开始体验</Button>
              <Button variant="ghost" onClick={() => onNavigate("cases")}>
                查看场景案例
              </Button>
            </div>
          </RevealGroup>
        </div>

        {/* Hero 右侧：界面剖面卡 */}
        <div className={styles.flowHeroPreview}>
          <div className={styles.breakdownPanel}>
            <div className={styles.breakdownPanelTitle}>方案卡片 · 四层拆解</div>
            <div className={styles.breakdownLayers}>
              {CARD_LAYERS.map((l) => (
                <div key={l.layer} className={styles.breakdownLayer}>
                  <span className={styles.breakdownLayerNum} style={{ background: l.color }}>{l.layer}</span>
                  <span className={styles.breakdownLayerLabel}>{l.label}</span>
                  <span className={styles.breakdownLayerDesc}>{l.desc}</span>
                </div>
              ))}
            </div>
            <div className={styles.breakdownNote}>
              每一层都可独立理解，合在一起就是一张完整方案。
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 设计原则 Bento Grid ═══════ */}
      <section className={styles.flowSection}>
        <div className={styles.sectionIntro}>
          <span className={styles.sectionEyebrow}>设计原则</span>
          <h2 className={styles.sectionTitle}>四个原则，让 AI 计划变得可信</h2>
        </div>

        <RevealGroup className={styles.bentoGrid}>
          {PRINCIPLES.map((p) => (
            <div
              key={p.id}
              className={`${styles.bentoCard} ${styles[`bento${p.size}`]}`}
            >
              <h3 className={styles.bentoTitle}>{p.title}</h3>
              <p className={styles.bentoDesc}>{p.desc}</p>
              <div className={styles.bentoExample}>
                <span className={styles.bentoExampleLabel}>示例</span>
                <span className={styles.bentoExampleText}>{p.example}</span>
              </div>
            </div>
          ))}
        </RevealGroup>
      </section>

      {/* ═══════ 视觉语言标本墙 ═══════ */}
      <section className={styles.flowSection}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>温和，但不含糊</h2>
        </div>

        <RevealGroup className={styles.specimenGrid}>
          {VISUAL_TOKENS.map((t) => (
            <div key={t.id} className={styles.specimenCard}>
              {t.swatch === "glass" ? (
                <div className={styles.specimenSwatchGlass} />
              ) : t.swatch === "radius" ? (
                <div className={styles.specimenSwatchRadius} />
              ) : t.swatch === "pill" ? (
                <div className={styles.specimenSwatchPill}>
                  <span className={styles.caseTag}>可预约</span>
                </div>
              ) : (
                <div className={styles.specimenSwatch} style={{ background: t.swatch }} />
              )}
              <span className={styles.specimenLabel}>{t.label}</span>
              <span className={styles.specimenDesc}>{t.desc}</span>
            </div>
          ))}
        </RevealGroup>
      </section>

      {/* ═══════ 状态系统 ═══════ */}
      <section className={styles.flowSection}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>状态不只是颜色，而是下一步</h2>
        </div>

        <RevealGroup className={styles.stateTrack}>
          {STATE_TOKENS.map((st) => (
            <div key={st.name} className={styles.stateCapsule}>
              <span className={`${styles.stateDot} ${styles[`stateDot${st.color}`]}`} />
              <span className={styles.stateCapsuleName}>{st.name}</span>
              <span className={styles.stateCapsuleArrow}>→</span>
              <span className={styles.stateCapsuleNext}>{st.next}</span>
            </div>
          ))}
        </RevealGroup>
      </section>

      {/* ═══════ 页面一致性 ═══════ */}
      <section className={styles.flowSection}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>从首页到个人中心，都说同一种语言</h2>
        </div>

        <RevealGroup className={styles.pageFragmentsGrid}>
          {PAGE_FRAGMENTS.map((pg) => (
            <div key={pg.id} className={styles.pageFragmentCard}>
              <span className={styles.pageFragmentIcon}>{pg.icon}</span>
              <h4 className={styles.pageFragmentTitle}>{pg.title}</h4>
              <span className={styles.pageFragmentDesc}>{pg.desc}</span>
            </div>
          ))}
        </RevealGroup>

        <div className={styles.consistencyBar}>
          <RevealGroup className={styles.consistencyBarList}>
            <span className={styles.consistencyBarItem}>相同卡片层级</span>
            <span className={styles.consistencyBarItem}>相同按钮规则</span>
            <span className={styles.consistencyBarItem}>相同标签语言</span>
            <span className={styles.consistencyBarItem}>相同玻璃质感</span>
            <span className={styles.consistencyBarItem}>相同安全确认</span>
          </RevealGroup>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className={styles.flowCta}>
        <RevealGroup>
          <h2 className={styles.ctaTitle}>好的设计，是让用户放心交给它</h2>
          <p className={styles.ctaSubtitle}>
            清楚、可信、可执行，这是 PlanningGo 的设计目标。
          </p>
          <div className={styles.ctaActions}>
            <Button onClick={() => onOpenModal("guest")}>开始体验</Button>
            <Button variant="ghost" onClick={() => onNavigate("cases")}>
              查看场景案例
            </Button>
          </div>
        </RevealGroup>
      </section>
    </>
  );
}
