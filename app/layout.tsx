// app/layout.tsx
import "../styles/globals.css";
import "../styles/brand.css";
import "../styles/gallery.css";
import "../styles/footer.css";
import "../styles/fonts.css";
import Footer from "../components/Footer";
import MainShell from "../components/MainShell";
import ThemeClient from "../components/ThemeClient";
import SiteHeader from "../components/SiteHeader";
import { EditProvider } from "../contexts/EditContext";

import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300","400","500","600","700"],
});

const HEADER_H = 115; // header un peu moins haut

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={poppins.className}>
      <body style={{ ["--header-h" as any]: `${HEADER_H}px` }}>
        <EditProvider>
          <ThemeClient>
            <SiteHeader
              bg="/brand/hero-bg.jpg"
              height={HEADER_H}
              logoHeight={100}
              bgPos="56% 80%"    // <<< ancré en bas-gauche, halo réduit
            />
            <main
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: "8px 24px 24px",
                display: "flow-root",
                flex: 1,
                width: "100%",
              }}
            >
              <MainShell>{children}</MainShell>
            </main>
            <Footer />
          </ThemeClient>
        </EditProvider>
      </body>
    </html>
  );
}
