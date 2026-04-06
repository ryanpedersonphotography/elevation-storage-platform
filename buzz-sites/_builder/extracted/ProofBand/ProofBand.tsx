import styles from "./ProofBand.module.css"

export interface ProofPoint {
  stat: string
  desc: string
}

export interface ProofBandProps {
  id?: string
  items: ProofPoint[]
  className?: string
}

export function ProofBand({ id, items, className }: ProofBandProps) {
  return (
    <section
      id={id}
      className={`${styles.proofBand}${className ? ` ${className}` : ""}`}
      data-reveal
    >
      <div className={styles.proofGrid} data-animate="fade-up">
        {items.map((point, i) => (
          <div key={point.stat} className={styles.proofItem}>
            <span className={styles.proofStat}>{point.stat}</span>
            <span className={styles.proofDesc}>{point.desc}</span>
            {i < items.length - 1 && (
              <span className={styles.proofDivider} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
