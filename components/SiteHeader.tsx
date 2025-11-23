"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEditContext } from "@/contexts/EditContext";
import LoginModal from "./LoginModal";

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
  const { isEditMode, isAuthenticated, setIsEditMode, logout } = useEditContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const links = [
    { href: "/gallery",        label: "Galeries Photos" },
    { href: "/court-metrage",  label: "Mon court-métrage" },
    { href: "/asso",           label: "Mon asso de collection" },
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
          <button
            className="header-identify"
            title={isEditMode ? "Mode édition activé" : "Cliquez pour vous identifier"}
            onClick={() => {
              if (isAuthenticated) {
                setIsEditMode(!isEditMode);
              } else {
                setShowLoginModal(true);
              }
            }}
            aria-label="S'identifier pour mode édition"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 12px",
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isEditMode ? 1 : 0.7,
              transition: "opacity 0.2s ease",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: isEditMode ? "#4CAF50" : "#fff" }}
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </nav>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </header>
  );
}
