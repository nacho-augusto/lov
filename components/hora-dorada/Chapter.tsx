import { InView } from "./InView";
import styles from "./hd.module.css";

/** Chapter card: an outlined Roman numeral, an italic-accented title and a mono slug line. */
export function Chapter({
  numeral,
  slug,
  title,
  accent,
  titleId,
  children,
}: {
  numeral: string;
  slug: string;
  title: string;
  accent: string;
  titleId: string;
  children?: React.ReactNode;
}) {
  return (
    <InView className={styles.chapter}>
      <p className={`${styles.serif} ${styles.numeral}`} aria-hidden>
        {numeral}
      </p>
      <div>
        <p className={`${styles.mono} ${styles.gold}`}>{slug}</p>
        <h2 id={titleId} className={`${styles.serif} ${styles.chapterTitle} mt-4`}>
          {title} <em>{accent}</em>
        </h2>
        {children && <div className={`${styles.lead} mt-6 max-w-2xl`}>{children}</div>}
      </div>
    </InView>
  );
}
