export interface BusBrand {
  slug: string;
  name: string;
  logo: string;
}

export interface BusModel {
  slug: string;
  name: string;
  logo: string;
}

export const busBrands: BusBrand[] = [
  {
    slug: "iveco",
    name: "Iveco",
    logo: "/logos/brand-iveco.svg",
  },
];

export const busModels: BusModel[] = [
  {
    slug: "crossway",
    name: "Crossway",
    logo: "/logos/model-crossway.svg",
  },
];

export function getBusBrandBySlug(slug: string) {
  return busBrands.find(b => b.slug === slug);
}

export function getBusModelBySlug(slug: string) {
  return busModels.find(m => m.slug === slug);
}
