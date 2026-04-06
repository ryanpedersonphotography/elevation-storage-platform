import { PageSection } from "@/system/recipes/PageSection"
import { Image } from "@/system/atoms/Image"
import styles from "./SettingSection.module.css"

export interface SettingSectionProps {
  id?: string
  eyebrow: string
  title: string
  body: string
  features: string[]
  image: string
  imageAlt?: string
  className?: string
}

export function SettingSection({
  id,
  eyebrow,
  title,
  body,
  features,
  image,
  imageAlt,
  className,
}: SettingSectionProps) {
  return (
    <PageSection
      id={id}
      layout="split"
      bg="base"
      gridWeight="wide-narrow"
      divider="seam"
      dividerFrom="base"
      className={`${styles.settingSection}${className ? ` ${className}` : ""}`}
    >
      <PageSection.Content>
        <p className={styles.settingEyebrow}>{eyebrow}</p>
        <h2 className={styles.settingTitle}>{title}</h2>
        <p className={styles.settingBody}>{body}</p>
        <ul className={styles.settingList}>
          {features.map((f) => (
            <li key={f} className={styles.settingItem}>
              <svg
                className={styles.settingCheck}
                width="20"
                height="20"
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
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </PageSection.Content>
      <PageSection.Media className={styles.settingImage}>
        <div className={styles.settingJewelFrame}>
          <div className={styles.settingGlassPlate}>
            <Image
              src={image}
              alt={imageAlt ?? title}
              fill
              fit="cover"
              size="card"
              surface="none"
              shadow="none"
              radius="none"
            />
          </div>
        </div>
      </PageSection.Media>
    </PageSection>
  )
}
