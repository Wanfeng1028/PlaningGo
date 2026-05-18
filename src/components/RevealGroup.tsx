import { Children, isValidElement, type ReactNode } from "react";
import styles from "./RevealGroup.module.scss";

interface RevealGroupProps {
  children: ReactNode;
  /** 外层 wrapper 的类名（通常传原来的 grid class） */
  className?: string;
  /** 每个 reveal item 的额外类名 */
  itemClassName?: string;
  /** 相邻卡片延迟间隔，默认 70ms */
  delayStep?: number;
  /** 首张卡片延迟，默认 80ms */
  initialDelay?: number;
}

export function RevealGroup({
  children,
  className,
  itemClassName,
  delayStep = 70,
  initialDelay = 80,
}: RevealGroupProps) {
  const step = `${delayStep}ms`;
  const initial = `${initialDelay}ms`;

  return (
    <div className={`${styles.revealGroup}${className ? ` ${className}` : ""}`}>
      {Children.map(children, (child, index) => {
        const key =
          isValidElement(child) && child.key != null ? child.key : index;

        return (
          <div
            key={key}
            className={`${styles.revealItem}${itemClassName ? ` ${itemClassName}` : ""}`}
            style={{
              "--reveal-index": index,
              "--reveal-delay-step": step,
              "--reveal-initial-delay": initial,
            } as React.CSSProperties}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
