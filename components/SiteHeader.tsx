"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEditContext } from "@/contexts/EditContext";

type Props = {
  bg?: string;
  height?: number;
  logoHeight?: number;
  bgPos?: string; // ex: "50% 40%" (x% y%)
};

export default function SiteHeader({
  bg = "/brand/hero-bg.jpg",
  height = 140,
  logoHeight = 96,
  bgPos, // si absent, on prendra la variable CSS --header-bg-pos ou 50% 50%
}: Props) {
  const pathname = usePathname();
  const { isEditMode } = useEditContext();
  const links = [
    { href: "/gallery",        label: "Galeries Photos" },
  ];

  return (
    <header
      className="site-header"
      style={{
        height,
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        // priorité à la prop; sinon variable CSS; sinon center
        backgroundPosition: bgPos ?? "var(--header-bg-pos, 50% 50%)",
      }}
    >
      <div className="site-header__overlay" />
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo" aria-label="Accueil">
          <img
            src="/brand/logo-wordmark.png"
            alt="TCE Photos"
            style={{ height: logoHeight, width: "auto" }}
          />
        </Link>

        <nav className="header-nav" aria-label="Navigation principale">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-btn${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
