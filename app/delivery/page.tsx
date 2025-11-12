import { Metadata } from "next";

import { DeliveryCTA } from "./components/DeliveryCTA";
import { DeliveryCommitments } from "./components/DeliveryCommitments";
import { DeliveryFAQ } from "./components/DeliveryFAQ";
import { DeliveryHero } from "./components/DeliveryHero";
import { DeliveryRegional } from "./components/DeliveryRegional";
import { DeliveryTimeline } from "./components/DeliveryTimeline";
import { commitments, faqs, logisticsPillars, timeline } from "./data";

export const metadata: Metadata = {
  title: "Livrare TechTots | Maximum 7 zile lucrătoare",
  description:
    "Află cum livrăm rapid în toată România: proces digitalizat, parteneri premium și garanție de maximum 7 zile lucrătoare. Verifică timpii de livrare pentru regiunea ta.",
  keywords: [
    "livrare techtots",
    "livrare 7 zile lucrătoare",
    "transport jucării STEM",
    "curierat 2025 românia",
    "fan courier sameday gls",
  ],
  alternates: {
    canonical: "https://www.techtots.ro/delivery",
  },
  openGraph: {
    title: "Livrare TechTots • Garantat în maximum 7 zile lucrătoare",
    description:
      "Proces de livrare premium pentru jucării STEM cu monitorizare în timp real și livrare garantată în maximum 7 zile lucrătoare oriunde în România.",
    url: "https://www.techtots.ro/delivery",
    type: "website",
    locale: "ro_RO",
  },
};

export default function DeliveryPage() {
  const updatedAt = new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DeliveryHero updatedAt={updatedAt} />
      <DeliveryCommitments commitments={commitments} />
      <DeliveryTimeline timeline={timeline} />
      <DeliveryRegional logisticsPillars={logisticsPillars} />
      <DeliveryFAQ faqs={faqs} />
      <DeliveryCTA />
    </div>
  );
}
