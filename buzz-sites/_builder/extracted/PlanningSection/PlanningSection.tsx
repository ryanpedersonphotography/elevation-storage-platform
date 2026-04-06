import styles from "./PlanningSection.module.css"

export interface PlanningSectionProps {
  eyebrow: string
  title: string
  body: string
  items: string[]
  className?: string
}

/**
 * PlanningSection — "The Utilitarian Fold"
 *
 * Layout relationship: This section uses `margin-top: calc(-1 * var(--space-12))`
 * to overlap the preceding EmotionalBanner, creating a layered pull-up effect.
 * It also has `border-radius` on top corners to visually separate from the banner.
 * When composing pages, place this immediately after EmotionalBanner to preserve
 * the overlapping lookbook rhythm.
 */
export function PlanningSection({
  eyebrow,
  title,
  body,
  items,
  className,
}: PlanningSectionProps) {
  return (
    <section
      className={`${styles.planningSection}${className ? ` ${className}` : ""}`}
      data-reveal
    >
      <div className={styles.planningInner}>
        <div className={styles.planningHeader}>
          <p className={styles.planningEyebrow}>{eyebrow}</p>
          <h2 className={styles.planningTitle}>{title}</h2>
          <p className={styles.planningBody}>{body}</p>
        </div>
        <ul className={styles.planningGrid} data-animate="fade-up">
          {items.map((item) => (
            <li key={item} className={styles.planningItem}>
              <svg
                className={styles.planningCheck}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
