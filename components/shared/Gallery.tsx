"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { GalleryImage } from "@/content/gallery";
import { marquee } from "@/content/copy";

/**
 * Theme-aware gallery. Renders real photos when available; otherwise falls back to
 * branded placeholder tiles so the section never looks broken while assets load.
 */
export function Gallery({
  images,
  tone = "light",
  layout = "grid",
}: {
  images: GalleryImage[];
  tone?: "light" | "dark";
  layout?: "grid" | "marquee";
}) {
  const hasImages = images.length > 0;

  if (!hasImages) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {marquee.slice(0, 8).map((phrase, i) => (
          <div
            key={i}
            className={`relative flex aspect-[4/5] items-end overflow-hidden rounded-xl p-4 ${
              i % 3 === 0
                ? "bg-gradient-to-br from-orange/80 to-amber-deep"
                : tone === "light"
                  ? "bg-gradient-to-br from-charcoal to-fog"
                  : "bg-gradient-to-br from-stone to-sage"
            }`}
          >
            <span
              className={`font-display text-sm uppercase leading-tight ${
                i % 3 === 0 ? "text-ink" : "text-snow"
              }`}
            >
              {phrase}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (layout === "marquee") {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none]">
        {images.map((img, i) => (
          <div
            key={img.src}
            className="relative aspect-[3/4] w-64 shrink-0 overflow-hidden rounded-xl"
          >
            <Image
              src={`/${img.src.replace(/^\//, "")}`}
              alt={img.alt}
              fill
              sizes="256px"
              className="object-cover"
              priority={i < 2}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
      {images.map((img, i) => (
        <motion.figure
          key={img.src}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: (i % 4) * 0.05 }}
          className="group relative break-inside-avoid overflow-hidden rounded-xl"
        >
          <Image
            src={`/${img.src.replace(/^\//, "")}`}
            alt={img.alt}
            width={600}
            height={img.tall ? 800 : 450}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <figcaption className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-ink/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-xs text-snow">{img.alt}</span>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
