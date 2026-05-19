import { useState } from "react";
import { RevealGroup } from "../components/RevealGroup";
import { Button } from "../components/Button";
import type { ModalKey, NavKey } from "../types";
import styles from "./Pages.module.scss";

/* ── props ────────────────────────────────────────────────────────── */

interface CasesPageProps {
  onOpenModal: (key: ModalKey) => void;
  onNavigate: (key: NavKey) => void;
}

/* ── 场景数据 ─────────────────────────────────────────────────────── */

interface CaseTimelineStep {
  time: string;
  label: string;
  status: string;
}

interface CaseBackup {
  condition: string;
  action: string;
}

interface CaseData {
  key: string;
  shortTitle: string;
  title: string;
  pain: string;
  description: string;
  tags: string[];
  metric: string;
  metricLabel: string;
  input: string;
  constraints: string[];
  timeline: CaseTimelineStep[];
  backups: CaseBackup[];
  tone: string;
}

const CASES: CaseData[] = [
  {
    key: "family",
    shortTitle: "家庭半日",
    title: "周六家庭轻松半日行",
    pain: "带孩子出门，路线不能太赶",
    description: "孩子不累，晚餐好坐，路线不绕。",
    tags: ["亲子", "少走路", "可预约"],
    metric: "4.5h",
    metricLabel: "轻松半日",
    input: "周六下午带孩子出去玩，别太累",
    constraints: ["两大一小", "家附近", "人均 200", "少排队"],
    timeline: [
      { time: "14:00", label: "咖啡集合", status: "距离合适" },
      { time: "15:10", label: "展览 · 亲子活动", status: "可预约" },
      { time: "17:30", label: "晚餐", status: "已确认" },
      { time: "19:30", label: "回家", status: "地铁 25min" },
    ],
    backups: [
      { condition: "下雨", action: "切室内乐园" },
      { condition: "排队", action: "换餐厅" },
      { condition: "晚出发", action: "压缩路线" },
    ],
    tone: "warm",
  },
  {
    key: "friends",
    shortTitle: "朋友聚会",
    title: "朋友边走边聊散步局",
    pain: "四个人想见面，不想只在商场干坐",
    description: "边走边聊，不在商场里干坐。",
    tags: ["朋友", "聊天", "散步"],
    metric: "3.8h",
    metricLabel: "聚会时长",
    input: "四个朋友周末见面，想走走聊聊",
    constraints: ["市中心", "人均 150", "步行友好", "能聊天"],
    timeline: [
      { time: "14:30", label: "咖啡馆集合", status: "步行 3min" },
      { time: "15:30", label: "展览 · 街区散步", status: "步行 800m" },
      { time: "17:30", label: "晚餐", status: "4 人桌可订" },
      { time: "19:00", label: "散步收尾", status: "地铁口附近" },
    ],
    backups: [
      { condition: "下雨", action: "逛商场 + 室内展" },
      { condition: "人多", action: "换安静街区" },
    ],
    tone: "social",
  },
  {
    key: "couple",
    shortTitle: "情侣晚餐",
    title: "情侣安静晚餐散步线",
    pain: "想避开吵闹，找更安静的安排",
    description: "避开吵闹，把晚餐和散步接上。",
    tags: ["情侣", "安静", "晚餐"],
    metric: "¥360",
    metricLabel: "人均预算",
    input: "和对象吃顿安静的晚餐，顺便走走",
    constraints: ["氛围好", "不太远", "可预约", "安静"],
    timeline: [
      { time: "17:00", label: "江边散步", status: "步行 1km" },
      { time: "18:00", label: "安静餐厅", status: "窗边位可订" },
      { time: "19:30", label: "甜品 · 咖啡", status: "步行 5min" },
      { time: "20:30", label: "回家", status: "打车 15min" },
    ],
    backups: [
      { condition: "餐厅满", action: "换同风格备选" },
      { condition: "下雨", action: "室内甜品 + 影院" },
    ],
    tone: "romantic",
  },
  {
    key: "rainy",
    shortTitle: "雨天室内",
    title: "下雨也不用重排计划",
    pain: "天气突变，不想从头再来",
    description: "下雨也不用重排，直接切室内。",
    tags: ["雨天", "室内", "备选"],
    metric: "92%",
    metricLabel: "切换成功率",
    input: "原计划有户外，但下雨了",
    constraints: ["全部室内", "交通方便", "不无聊"],
    timeline: [
      { time: "14:00", label: "室内咖啡馆", status: "地铁直达" },
      { time: "15:00", label: "室内展览 · 手作", status: "有空位" },
      { time: "17:00", label: "商场内餐厅", status: "不排队" },
      { time: "18:30", label: "回家", status: "地铁 20min" },
    ],
    backups: [
      { condition: "展览满", action: "换书店 · 影院" },
      { condition: "餐厅排", action: "换楼层餐厅" },
    ],
    tone: "calm",
  },
  {
    key: "late",
    shortTitle: "晚出发",
    title: "临时晚出发也能安排",
    pain: "出门晚了，不想放弃整个计划",
    description: "压缩行程，保留最重要的一站。",
    tags: ["改期", "晚出发", "不慌"],
    metric: "30min",
    metricLabel: "自动压缩",
    input: "原定 14 点出发，现在 17 点才出门",
    constraints: ["只保留核心", "晚餐为主", "少移动"],
    timeline: [
      { time: "17:00", label: "直接出发", status: "跳过咖啡" },
      { time: "17:20", label: "散步 · 拍照", status: "步行 600m" },
      { time: "18:00", label: "晚餐", status: "已确认" },
      { time: "19:30", label: "回家", status: "地铁 20min" },
    ],
    backups: [
      { condition: "更晚", action: "只保留晚餐" },
      { condition: "餐厅满", action: "换不需要预约的" },
    ],
    tone: "flex",
  },
  {
    key: "queue",
    shortTitle: "排队绕开",
    title: "热门店排太久就换方案",
    pain: "热门时段不想硬等",
    description: "热门店排太久，就换顺序或换餐厅。",
    tags: ["排队", "调整", "备选"],
    metric: "45min",
    metricLabel: "少等时间",
    input: "想去的餐厅排号太长",
    constraints: ["不硬等", "附近替代", "口味相近"],
    timeline: [
      { time: "11:30", label: "先去展览", status: "不用排队" },
      { time: "13:00", label: "换餐厅午餐", status: "口味相近" },
      { time: "14:30", label: "咖啡 · 休息", status: "步行 4min" },
      { time: "15:30", label: "回家", status: "地铁 18min" },
    ],
    backups: [
      { condition: "换的也排", action: "再换或错峰" },
      { condition: "坚持原店", action: "调整顺序先去别处" },
    ],
    tone: "practical",
  },
];

/* ── 对比数据 ──────────────────────────────────────────────────────── */

const COMPARE_ITEMS = [
  { normal: "地点分散，路线自己拼", pg: "一句话输入，条件合并" },
  { normal: "天气另看，预算另算", pg: "路线成型，一目了然" },
  { normal: "推荐去哪但不说为什么", pg: "每个推荐附理由" },
  { normal: "下雨了一切重来", pg: "变化有备选，不重来" },
  { normal: "朋友意见不统一", pg: "分享链接，直接投票" },
];

/* ── component ────────────────────────────────────────────────────── */

export function CasesPage({ onOpenModal, onNavigate }: CasesPageProps) {
  const [activeCase, setActiveCase] = useState<string>("family");
  const active = CASES.find((c) => c.key === activeCase) ?? CASES[0];

  return (
    <>
      {/* ═══════ Hero — 生活方式大舞台 ═══════ */}
      <section className={styles.casesHero}>
        <div className={styles.casesHeroContent}>
          <RevealGroup>
            <span className={styles.heroEyebrow}>场景案例</span>
            <h1 className={styles.heroTitle}>
              把周末从纠结变成安排
            </h1>
            <p className={styles.heroSubtitle}>
              家庭、朋友、情侣、雨天和临时变化，都能被整理成一条能执行的路线。
            </p>
            <div className={styles.heroActions}>
              <Button onClick={() => onNavigate("features")}>开始规划</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const el = document.getElementById("case-detail");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                看完整案例
              </Button>
            </div>
          </RevealGroup>
        </div>

        {/* Hero 右侧：周末剧本卡 */}
        <div className={styles.casesHeroPreview}>
          <div className={styles.scriptCard}>
            <div className={styles.scriptCardTop}>
              <span className={styles.scriptDate}>周六 14:00 · 北京</span>
              <span className={`${styles.previewPanelBadge} ${styles.badgeGreen}`}>可执行</span>
            </div>

            <h3 className={styles.scriptTitle}>{active.title}</h3>

            <div className={styles.scriptRoute}>
              {active.timeline.map((step, i) => (
                <div key={i} className={styles.scriptStop}>
                  <span className={styles.scriptStopDot} />
                  <span className={styles.scriptStopTime}>{step.time}</span>
                  <span className={styles.scriptStopLabel}>{step.label}</span>
                  <span className={styles.scriptStopStatus}>{step.status}</span>
                </div>
              ))}
            </div>

            <div className={styles.scriptMeta}>
              <span className={styles.scriptMetric}>{active.metric}</span>
              <span className={styles.scriptMetricLabel}>{active.metricLabel}</span>
              <span className={styles.scriptDivider} />
              {active.tags.map((t) => (
                <span key={t} className={styles.caseTag}>{t}</span>
              ))}
            </div>

            <div className={styles.scriptBackups}>
              {active.backups.map((b, i) => (
                <span key={i} className={styles.scriptBackup}>
                  {b.condition} → {b.action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 场景选择 — 左侧菜单 + 右侧详情 ═══════ */}
      <section id="case-detail" className={styles.casesSection}>
        <div className={styles.sectionIntro}>
          <span className={styles.sectionEyebrow}>真实周末场景</span>
          <h2 className={styles.sectionTitle}>选一个场景，看它怎么安排</h2>
        </div>

        <div className={styles.caseShowcase}>
          {/* 左侧场景菜单 */}
          <nav className={styles.caseMenu}>
            {CASES.map((c) => (
              <button
                key={c.key}
                className={`${styles.caseMenuItem} ${activeCase === c.key ? styles.caseMenuItemActive : ""}`}
                onClick={() => setActiveCase(c.key)}
                type="button"
              >
                <span className={styles.caseMenuTitle}>{c.shortTitle}</span>
                <span className={styles.caseMenuMetric}>{c.metric}</span>
              </button>
            ))}
          </nav>

          {/* 右侧详情 */}
          <div className={styles.caseDetail}>
            <div className={styles.caseDetailHeader}>
              <h3 className={styles.caseDetailTitle}>{active.title}</h3>
              <p className={styles.caseDetailPain}>{active.pain}</p>
            </div>

            <div className={styles.caseDetailInput}>
              <span className={styles.caseDetailInputLabel}>输入</span>
              <span className={styles.caseDetailInputText}>「{active.input}」</span>
            </div>

            <div className={styles.caseDetailConstraints}>
              {active.constraints.map((c, i) => (
                <span key={i} className={styles.caseTag}>{c}</span>
              ))}
            </div>

            <div className={styles.caseDetailTimeline}>
              {active.timeline.map((step, i) => (
                <div key={i} className={styles.caseDetailStep}>
                  <span className={styles.caseDetailStepTime}>{step.time}</span>
                  <span className={styles.caseDetailStepLine} />
                  <span className={styles.caseDetailStepLabel}>{step.label}</span>
                  <span className={styles.caseDetailStepStatus}>{step.status}</span>
                </div>
              ))}
            </div>

            <div className={styles.caseDetailBackups}>
              <span className={styles.caseDetailBackupsTitle}>备选方案</span>
              <div className={styles.caseDetailBackupList}>
                {active.backups.map((b, i) => (
                  <div key={i} className={styles.caseDetailBackupItem}>
                    <span className={styles.caseDetailBackupCondition}>{b.condition}</span>
                    <span className={styles.caseDetailBackupArrow}>→</span>
                    <span className={styles.caseDetailBackupAction}>{b.action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.caseDetailFooter}>
              <span className={styles.caseDetailMetric}>{active.metric}</span>
              <span className={styles.caseDetailMetricLabel}>{active.metricLabel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 完整案例 — 发布会 Demo ═══════ */}
      <section className={styles.casesSection}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>一条路线，替你处理所有小麻烦</h2>
        </div>

        <div className={styles.demoPanel}>
          <div className={styles.demoPanelLeft}>
            <div className={styles.demoInputBox}>
              <span className={styles.demoInputLabel}>用户输入</span>
              <strong className={styles.demoInputText}>「周六下午带孩子出门，别太累，人均 200 左右。」</strong>
            </div>

            <div className={styles.demoSteps}>
              {CASES[0].timeline.map((step, i) => (
                <div key={i} className={styles.demoStep}>
                  <span className={styles.demoStepTime}>{step.time}</span>
                  <span className={styles.demoStepLabel}>{step.label}</span>
                  <span className={styles.demoStepStatus}>{step.status}</span>
                </div>
              ))}
            </div>

            <div className={styles.demoFooter}>
              <span className={styles.demoMetric}>人均 ¥200</span>
              <span className={styles.demoMetric}>4.5 小时</span>
              <span className={styles.demoMetric}>3 个备选</span>
            </div>
          </div>

          <div className={styles.demoPanelRight}>
            <div className={styles.demoBackupCard}>
              <h4 className={styles.demoBackupTitle}>变化兜底</h4>
              {CASES[0].backups.map((b, i) => (
                <div key={i} className={styles.demoBackupItem}>
                  <span className={styles.demoBackupCondition}>{b.condition}</span>
                  <span className={styles.demoBackupArrow}>→</span>
                  <span className={styles.demoBackupAction}>{b.action}</span>
                </div>
              ))}
            </div>

            <div className={styles.demoStatusCard}>
              <span className={`${styles.previewPanelBadge} ${styles.badgeGreen}`}>已生成</span>
              <span className={`${styles.previewPanelBadge} ${styles.badgeYellow}`}>可预约</span>
              <span className={`${styles.previewPanelBadge} ${styles.badgeBlue}`}>雨天可切换</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 对比 ═══════ */}
      <section className={styles.casesSection}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>不是更多选择，而是更少纠结</h2>
        </div>

        <div className={styles.compareGrid}>
          <div className={styles.compareCard}>
            <h3 className={styles.compareCardTitle}>自己查</h3>
            <ul className={styles.compareList}>
              {COMPARE_ITEMS.map((item, i) => (
                <li key={i} className={styles.compareItemNormal}>
                  <span className={styles.compareIcon}>○</span>
                  <span>{item.normal}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.compareCard}>
            <h3 className={styles.compareCardTitle}>PlanningGo</h3>
            <ul className={styles.compareList}>
              {COMPARE_ITEMS.map((item, i) => (
                <li key={i} className={styles.compareItemPg}>
                  <span className={styles.compareIcon}>✓</span>
                  <span>{item.pg}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className={styles.casesCta}>
        <RevealGroup>
          <h2 className={styles.ctaTitle}>今天不用再把十几个页面来回切</h2>
          <p className={styles.ctaSubtitle}>
            一句话输入，多方案生成，临时变化自动调整。
          </p>
          <div className={styles.ctaActions}>
            <Button onClick={() => onOpenModal("guest")}>游客体验</Button>
            <Button variant="ghost" onClick={() => onNavigate("design")}>
              查看设计亮点
            </Button>
          </div>
        </RevealGroup>
      </section>
    </>
  );
}
