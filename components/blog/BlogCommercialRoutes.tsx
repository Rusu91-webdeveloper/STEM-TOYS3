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
      eyebrow="Intentie comerciala"
      title="Continua din articol spre paginile care aduc comenzi"
      description="Articolele bune nu trebuie sa ramana izolate. Sectiunea aceasta impinge autoritate din continutul educational spre huburile comerciale si regionale care pot capta urmatorul pas al vizitatorului."
      links={links}
    />
  );
}
