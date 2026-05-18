import type { ModalKey, SectionBlock } from "../types";
import { RevealGroup } from "../components/RevealGroup";
import { SectionHeader } from "../components/SectionHeader";
import styles from "./Pages.module.scss";

interface FlowPageProps {
  blocks: SectionBlock[];
  eyebrow: string;
  title: string;
  intro: string;
  onOpenModal: (key: ModalKey) => void;
}

const modeLabel = {
  page: "页面",
  modal: "弹窗",
  drawer: "抽屉",
  sheet: "底部弹层",
  state: "状态",
};

export function FlowPage({ blocks, eyebrow, title, intro, onOpenModal }: FlowPageProps) {
  return (
    <>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />
      {blocks.map((block) => {
        const Icon = block.icon;
        return (
          <section className={styles.section} key={block.id}>
            <SectionHeader eyebrow={block.eyebrow} title={block.title} intro={block.intro} />
            <RevealGroup className={styles.grid}>
              {block.items.map((item) => (
                <article
                  className={`${styles.card} ${item.modal ? styles.clickable : ""}`}
                  role={item.modal ? "button" : undefined}
                  tabIndex={item.modal ? 0 : undefined}
                  onClick={() => item.modal && onOpenModal(item.modal)}
                  onKeyDown={(event) => {
                    if (item.modal && (event.key === "Enter" || event.key === " ")) {
                      onOpenModal(item.modal);
                    }
                  }}
                  key={`${block.id}-${item.title}`}
                >
                  <span className={styles.mode}>{modeLabel[item.mode]}</span>
                  <span className={styles.cardIcon}>
                    <Icon size={22} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className={styles.source}>{item.source}</span>
                </article>
              ))}
            </RevealGroup>
          </section>
        );
      })}
    </>
  );
}
