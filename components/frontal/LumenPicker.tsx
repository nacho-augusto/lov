"use client";

import { LUMEN_MODES, type Lumens } from "./data";
import { useHeadlamp } from "./HeadlampContext";
import styles from "./picker.module.css";

/**
 * Headlamp power selector. Native radios (arrow keys work) styled as a segmented
 * switch. Changing it changes every beam on the page.
 */
export function LumenPicker({
  name,
  legend = "Potencia del frontal",
  showNames = false,
  className,
}: {
  name: string;
  legend?: string;
  showNames?: boolean;
  className?: string;
}) {
  const { lumens, setLumens } = useHeadlamp();

  return (
    <fieldset className={`${styles.picker} ${className ?? ""}`} data-names={showNames ? "1" : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {LUMEN_MODES.map((m) => (
          <label key={m.lm} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={m.lm}
              checked={lumens === m.lm}
              onChange={() => setLumens(m.lm as Lumens)}
            />
            <span className={styles.face}>
              <span className={styles.lm}>{m.lm}</span>
              {showNames && <span className={styles.modeName}>{m.name}</span>}
            </span>
          </label>
        ))}
        <span className={styles.unit} aria-hidden="true">
          lm
        </span>
      </div>
    </fieldset>
  );
}
