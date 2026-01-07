'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div className="site-footer__section">
          <h3 className="site-footer__title">TCE Photos</h3>
          <p className="site-footer__desc">
            Découvrez ma collection de photos de transports en Île-de-France.
          </p>
        </div>

        <div className="site-footer__section">
          <h4 className="site-footer__subtitle">Navigation</h4>
          <ul className="site-footer__links">
            <li><Link href="/gallery">Galeries Photos</Link></li>
            <li><Link href="/court-metrage">Court-métrage</Link></li>
            <li><Link href="/asso">Mon asso</Link></li>
          </ul>
        </div>

        <div className="site-footer__section">
          <h4 className="site-footer__subtitle">Réseaux</h4>
          <ul className="site-footer__links">
            <li><a href="https://discord.gg/1078513042599444582" target="_blank" rel="noopener noreferrer">Discord</a></li>
            <li><a href="https://instagram.com/tc_essonnes" target="_blank" rel="noopener noreferrer">Instagram @tc_essonnes</a></li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {currentYear} — TCE Photos. Tous droits réservés.</p>
      </div>
    </footer>
  );
}

