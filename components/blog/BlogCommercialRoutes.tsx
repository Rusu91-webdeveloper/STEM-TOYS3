import InternalLinkCards from "@/components/seo/InternalLinkCards";
import {
  getBlogCommercialRoutes,
  getRegionalStemLinks,
} from "@/lib/seo/regional-search";

type BlogCommercialRoutesProps = {
  stemCategory?: string | null;
};

export default function BlogCommercialRoutes({
  stemCategory,
}: BlogCommercialRoutesProps) {
  const links = [
    ...getBlogCommercialRoutes(stemCategory).slice(0, 4),
    ...getRegionalStemLinks(2),
  ];

  return (
    <InternalLinkCards
      eyebrow="Explorează în continuare"
      title="Continua din articol spre paginile care aduc comenzi"
      description="Descoperă jucăriile și ghidurile potrivite pentru etapa în care se află copilul tău."
      links={links}
    />
  );
}
