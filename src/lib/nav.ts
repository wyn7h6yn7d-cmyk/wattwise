export type NavItem = {
  href: string;
  label: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/borsihind", label: "Börsihind" },
  { href: "/kalkulaatorid/paikesejaam", label: "PV" },
  { href: "/kalkulaatorid/peak-shaving", label: "Peak shaving" },
  { href: "/kalkulaatorid/toostus", label: "Tööstus" },
];

export const PUBLIC_CALCULATOR_TABS: NavItem[] = [
  { href: "/kalkulaatorid/paikesejaam", label: "PV" },
  { href: "/kalkulaatorid/peak-shaving", label: "Peak shaving" },
  { href: "/kalkulaatorid/toostus", label: "Tööstus" },
];

export const HEADER_CTA = {
  href: "/kalkulaatorid",
  label: "Tööriistad",
} as const;

export const PUBLIC_TOOLS = [
  {
    title: "Börsihind",
    description: "Vaata Eesti elektri börsihinda, odavaimaid tunde ja päeva kokkuvõtet.",
    href: "/borsihind",
    icon: "BH",
  },
  {
    title: "PV",
    description: "Hinda päikesejaama tootlust, omatarvet ja tasuvust sisestatud andmete põhjal.",
    href: "/kalkulaatorid/paikesejaam",
    icon: "PV",
  },
  {
    title: "Peak shaving",
    description: "Hinda tipukoormuse lõikamist, aku piiranguid ja võimsustasu säästu.",
    href: "/kalkulaatorid/peak-shaving",
    icon: "PS",
  },
  {
    title: "Tööstus",
    description: "Tööstusettevõtte päikesejaama ja akusalvestuse analüüs, sh võimsustasu mõju.",
    href: "/kalkulaatorid/toostus",
    icon: "TÖ",
  },
] as const;
