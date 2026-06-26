// Single source of truth for club identity.
// Grounded in verified research (Instagram @cdlaotravertiente + FADMES registry).
// Fields marked TODO are placeholders for the club to confirm before publishing.

export const club = {
  name: "C.D. La Otra Vertiente",
  shortName: "La Otra Vertiente",
  legalType: "Club Deportivo",
  discipline: "Trail running y montaña",
  // Location
  town: "Rincón de la Victoria",
  province: "Málaga",
  region: "Axarquía · Costa del Sol",
  // Federation (verified: FADMES Andalusian mountain federation)
  federation: "FADMES",
  federationNumber: "020788",
  // Community voice
  memberTerm: "vertinianos",
  memberTermSingular: "vertiniano",
  tagline: "La otra vertiente empieza donde acaba el asfalto.",
  // Contact — TODO: replace with the club's real address before publishing
  contactEmail: "info@laotravertiente.es",
  // Socials
  instagram: "https://www.instagram.com/cdlaotravertiente/",
  instagramHandle: "@cdlaotravertiente",
  // Strava / others: add real URLs when available
  strava: null as string | null,
} as const;

// Real, verifiable headline figures (no fabricated membership counts).
export const stats = [
  { value: "2.069", unit: "m", label: "Techo de Málaga · La Maroma" },
  { value: "+100", unit: "", label: "Cumbres coronadas" },
  { value: "167", unit: "km", label: "OMD by UTMB · finishers" },
  { value: "+8.727", unit: "m", label: "Desnivel de la OMD" },
] as const;

export type Stat = (typeof stats)[number];
