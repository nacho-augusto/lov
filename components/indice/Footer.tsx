import Link from "next/link";
import { club, season } from "@/content";
import { Arrow } from "./Arrow";
import { IndexLink } from "./IndexLink";

/** A single quiet line: imprint, federation, the way down, and the way back. */
export function Footer() {
  return (
    <footer className="ix-wrap ix-foot">
      <div className="ix-grid ix-foot__row">
        <p className="ix-foot__a">
          © {season.year} {club.name}
        </p>
        <p className="ix-foot__b">
          {club.federation} nº {club.federationNumber}
        </p>
        <p className="ix-foot__c">
          <IndexLink target="portada" className="ix-foot__link">
            Volver al nivel del mar
          </IndexLink>
        </p>
        <Link href="/" className="ix-foot__back">
          <Arrow dir="left" />
          <span>Todas las versiones</span>
        </Link>
      </div>
    </footer>
  );
}
