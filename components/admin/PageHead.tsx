import { ThemeToggle } from "./ThemeToggle";
import s from "./admin.module.css";

export function PageHead({
  kicker,
  title,
  actions,
}: {
  kicker: string;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className={s.pageHead}>
      <div>
        <p className={s.kicker}>{kicker}</p>
        <h1 className={s.title}>{title}</h1>
      </div>
      <div className={s.headActions}>
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
