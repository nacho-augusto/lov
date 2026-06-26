import Link from "next/link";
import { club } from "@/content/club";

/**
 * The club's real logo. Two pre-processed variants (transparent background):
 * - logo-light.png (white ink + orange sun) for dark surfaces
 * - logo-mark.png  (black ink + orange sun) for light surfaces
 */
export function Logo({
  tone = "light",
  href = "/",
  className = "h-7 w-auto",
}: {
  tone?: "light" | "dark";
  href?: string | null;
  className?: string;
}) {
  const src = tone === "light" ? "/logo/logo-light.png" : "/logo/logo-mark.png";
  // a soft shadow keeps the white logo legible over bright hero backgrounds
  const shadow =
    tone === "light" ? "drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)]" : "";

  const img = (
    // Plain <img>: a logo must render instantly and reliably, with no on-the-fly
    // image optimization step (which can lag or fail in dev / on slow machines).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={club.name}
      width={640}
      height={195}
      className={`${className} ${shadow}`}
    />
  );

  if (!href) return img;

  return (
    <Link
      href={href}
      aria-label={`${club.name} — inicio`}
      className="inline-flex items-center"
    >
      {img}
    </Link>
  );
}
