import type { Metadata } from "next";
import SmoothScroll from "@/components/shared/SmoothScroll";
import { ClaroFooter } from "@/components/claro/ClaroFooter";
import { ClaroGallery } from "@/components/claro/ClaroGallery";
import { ClaroHero } from "@/components/claro/ClaroHero";
import { ClaroIntro } from "@/components/claro/ClaroIntro";
import { ClaroJoin } from "@/components/claro/ClaroJoin";
import { ClaroNav } from "@/components/claro/ClaroNav";
import { ClaroPeaks } from "@/components/claro/ClaroPeaks";
import { ClaroSeason } from "@/components/claro/ClaroSeason";
import { ClaroSponsors } from "@/components/claro/ClaroSponsors";
import styles from "@/components/claro/claro.module.css";

export const metadata: Metadata = {
  title: "Claro",
  description:
    "Versión clara de la web de C.D. La Otra Vertiente: un vertiniano en la cresta mientras el mar de nubes fluye al hacer scroll.",
};

export default function ClaroPage() {
  return (
    <SmoothScroll>
      <div id="top" className={styles.root}>
        <ClaroNav />
        <main>
          <ClaroHero />
          <ClaroIntro />
          <ClaroSeason />
          <ClaroPeaks />
          <ClaroGallery />
          <ClaroJoin />
          <ClaroSponsors />
        </main>
        <ClaroFooter />
      </div>
    </SmoothScroll>
  );
}
