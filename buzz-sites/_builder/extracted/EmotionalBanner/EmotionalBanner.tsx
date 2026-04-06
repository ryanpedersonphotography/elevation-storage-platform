import { Image } from "@/system/atoms/Image"
import styles from "./EmotionalBanner.module.css"

export interface EmotionalBannerProps {
  title: string
  subline: string
  image: string
  imageAlt?: string
  className?: string
}

export function EmotionalBanner({
  title,
  subline,
  image,
  imageAlt,
  className,
}: EmotionalBannerProps) {
  return (
    <section
      className={`${styles.emotionalBanner}${className ? ` ${className}` : ""}`}
      data-reveal
    >
      <div className={styles.bannerImageWrap}>
        <Image
          src={image}
          alt={imageAlt ?? ""}
          fill
          fit="cover"
          size="hero"
          surface="none"
          shadow="none"
          radius="none"
        />
        <div className={styles.bannerOverlay} />
        <div className={styles.bannerContent}>
          <div className={styles.bannerVellum} data-animate="fade-up">
            <h2 className={styles.bannerTitle}>{title}</h2>
            <p className={styles.bannerSubline}>{subline}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
