export interface Network {
  img: string;
  href: string;
  name: string;
  slug: string;
  folder?: string;
  h?: number;
}

const DEFAULT_LOGO_H = 85;

export const networks: Network[] = [
  {
    img: "/networks/reseau-tisse.png",
    href: "/gallery/network/tisse",
    name: "TISSE",
    slug: "tisse",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-transdev-coeur-essonne.png",
    href: "/gallery/network/transdev-coeur-essonne",
    name: "Transdev Cœur Essonne",
    slug: "transdev-coeur-essonne",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-transdev-senart.png",
    href: "/gallery/network/transdev-senart",
    name: "Transdev Sénart",
    slug: "transdev-senart",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-retrobus-essonne.png",
    href: "/gallery/network/retrobus-essonne",
    name: "Retrobus Essonne",
    slug: "retrobus-essonne",
    folder: "retrobus-essonne",
    h: 110,
  },
  {
    img: "/networks/reseau-rer.png",
    href: "/gallery/network/rer",
    name: "RER",
    slug: "rer",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-cars-soeur.png",
    href: "/gallery/network/cars-soeur",
    name: "Cars Soeur",
    slug: "cars-soeur",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-ratp.png",
    href: "/gallery/network/ratp",
    name: "RATP",
    slug: "ratp",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-kvyvs.png",
    href: "/gallery/network/kvyvs",
    name: "Keolis Val d'Yerres Val de Seine",
    slug: "kvyvs",
    folder: "kvyvs",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-ratpc_saclay.png",
    href: "/gallery/network/ratp_cap_saclay",
    name: "RATP Cap Saclay",
    slug: "ratp_cap_saclay",
    folder: "ratp_cap_saclay",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/nav_rerd.png",
    href: "/gallery/network/substitution_rerd",
    name: "Navettes de Substitution RER D",
    slug: "substitution_rerd",
    folder: "nav_rerd",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-t12.png",
    href: "/gallery/network/t12",
    name: "Tramway T12",
    slug: "t12",
    folder: "reseau-t12",
    h: DEFAULT_LOGO_H,
  },
  {
    img: "/networks/reseau-ksvm.png",
    href: "/gallery/network/ksvm",
    name: "Keolis Seine Val de Marne",
    slug: "ksvm",
    folder: "reseau-ksvm",
    h: DEFAULT_LOGO_H,
  },
];