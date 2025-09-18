import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { generateSTEMEducationFAQSchema } from "@/lib/seo/advanced-schema";

export const metadata: Metadata = createMetadata({
  title: "Ghid Complet Educație STEM pentru Copii în România 2025 | TechTots",
  description: "Ghidul definitiv pentru educația STEM în România: curriculum național, jucării certificate, metode de învățare și resurse pentru părinți și educatori. Aliniat cu standardele MECTS.",
  keywords: [
    // Primary Romanian keywords
    "educație STEM România",
    "curriculum STEM românesc",
    "jucării educaționale STEM România", 
    "ghid părinți STEM",
    "competențe cheie STEM România",
    "Ministerul Educației STEM",
    "curriculum național STEM",
    "dezvoltare abilități STEM copii",
    
    // Long-tail educational keywords
    "cum să aleg jucării STEM pentru copil",
    "beneficii educație STEM copii români",
    "integrarea STEM în educația românească",
    "activități STEM acasă România",
    "certificare MECTS jucării educaționale",
    "robotică educațională România copii",
    "experimente științifice copii România",
    "matematică distractivă copii români",
    
    // Professional/educator keywords
    "resurse educatori STEM România",
    "planuri lecție STEM România", 
    "evaluare competențe STEM",
    "proiecte STEM curriculum românesc",
    "formarea profesorilor STEM România",
    
    // Parent-focused keywords
    "părinți educație STEM",
    "ajutorul părinților STEM",
    "educație STEM acasă",
    "dezvoltarea copilului STEM",
    "investiție educațională STEM",
    
    // English keywords for broader reach
    "STEM education Romania",
    "Romanian curriculum STEM",
    "STEM toys Romania certified",
    "educational toys Romania",
    "STEM learning Romania"
  ],
  ogImage: "/images/ghid-stem-romania-social.jpg",
  pathWithoutLocale: "/ghid-educatie-stem-romania",
  translations: {
    ro: {
      title: "Ghid Complet Educație STEM pentru Copii în România 2025 | TechTots",
      description: "Ghidul definitiv pentru educația STEM în România: curriculum național, jucării certificate, metode de învățare și resurse pentru părinți și educatori.",
    },
    en: {
      title: "Complete STEM Education Guide for Children in Romania 2025 | TechTots", 
      description: "The definitive guide to STEM education in Romania: national curriculum, certified toys, learning methods and resources for parents and educators.",
    }
  },
  structuredData: [
    generateSTEMEducationFAQSchema(),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Ghid Complet Educație STEM pentru Copii în România 2025",
      description: "Ghidul definitiv pentru educația STEM în România",
      author: {
        "@type": "Organization",
        name: "TechTots România",
        url: "https://www.techtots.ro"
      },
      publisher: {
        "@type": "Organization", 
        name: "TechTots",
        logo: {
          "@type": "ImageObject",
          url: "https://www.techtots.ro/logo.png"
        }
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      inLanguage: "ro",
      about: [
        {
          "@type": "Thing",
          name: "Educație STEM România",
          sameAs: "https://en.wikipedia.org/wiki/Science,_technology,_engineering,_and_mathematics"
        },
        {
          "@type": "Thing",
          name: "Curriculum Național Românesc",
          description: "Sistemul educațional oficial din România"
        }
      ],
      mentions: [
        {
          "@type": "Organization",
          name: "Ministerul Educației și Cercetării din România",
          sameAs: "https://www.edu.ro"
        }
      ]
    }
  ]
});
