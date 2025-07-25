"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  Icon,
  NavigationIcons,
  EcommerceIcons,
  UserIcons,
  ContentIcons,
  StatusIcons,
  CommunicationIcons,
} from "@/components/ui/icon-system";
import { Separator } from "@/components/ui/separator";

const sitemapLinks = [
  { href: "/", label: "Acasă", icon: NavigationIcons.Menu },
  { href: "/products", label: "Produse", icon: EcommerceIcons.Cart },
  {
    href: "/categories",
    label: "Categorii STEM",
    icon: EcommerceIcons.Package,
  },
  {
    href: "/blog",
    label: "Blog & Cărți educaționale",
    icon: ContentIcons.DigitalBook,
  },
  { href: "/about", label: "Despre noi", icon: StatusIcons.Info },
  { href: "/contact", label: "Contact", icon: CommunicationIcons.Email },
  {
    href: "/returns",
    label: "Politica de Returnare",
    icon: StatusIcons.Warning,
  },
  { href: "/warranty", label: "Garanție", icon: StatusIcons.Success },
  { href: "/account", label: "Contul meu", icon: UserIcons.User },
  {
    href: "/account/orders",
    label: "Comenzile mele",
    icon: EcommerceIcons.Bag,
  },
  {
    href: "/account/wishlist",
    label: "Favorite",
    icon: EcommerceIcons.Wishlist,
  },
  { href: "/account/addresses", label: "Adrese", icon: UserIcons.UserPlus },
  { href: "/terms", label: "Termeni și Condiții", icon: StatusIcons.Info },
  {
    href: "/privacy",
    label: "Politica de Confidențialitate",
    icon: StatusIcons.Info,
  },
  { href: "/gdpr", label: "Conformitate GDPR", icon: StatusIcons.Info },
];

export default function SitemapPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Section */}
      <div className="relative h-[220px] sm:h-[280px] md:h-[320px] w-full mb-8">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Hartă Site"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 to-indigo-600/60 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Hartă Site
          </h1>
          <p className="mt-2 text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto">
            Navigați rapid către orice secțiune a platformei TechTots.
          </p>
        </div>
      </div>

      <Container>
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Icon
                icon={NavigationIcons.Menu}
                variant="info"
                size="lg"
                decorative
              />
              Hartă Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-indigo prose-lg max-w-none">
              <ul className="space-y-3">
                {sitemapLinks.map(link => (
                  <li key={link.href} className="flex items-center gap-3">
                    <Icon
                      icon={link.icon}
                      variant="primary"
                      size="md"
                      decorative
                    />
                    <Link
                      href={link.href}
                      className="text-indigo-700 font-medium hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* CTA */}
            <Separator className="my-8" />
            <div className="flex flex-col items-center gap-2 mt-6">
              <Icon
                icon={StatusIcons.Help}
                variant="primary"
                size="lg"
                decorative
              />
              <p className="text-lg font-medium text-center">
                Nu găsiți ce căutați? Aveți nevoie de ajutor?
              </p>
              <Button asChild size="lg" className="mt-2">
                <Link href="/contact">Contactați Suportul TechTots</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
