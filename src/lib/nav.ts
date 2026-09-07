export type NavItem = {
  href: string;
  label: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Avaleht" },
  { href: "/borsihind", label: "Börsihind" },
  { href: "/kalkulaatorid/paikesejaam", label: "PV kalkulaator" },
  { href: "/kalkulaatorid/toostus", label: "Tööstus" },
  { href: "/projekt", label: "Projekt" },
  { href: "/kontakt", label: "Kontakt" },
];

export const PUBLIC_CALCULATOR_TABS: NavItem[] = [
  { href: "/kalkulaatorid/paikesejaam", label: "PV kalkulaator" },
  { href: "/kalkulaatorid/toostus", label: "Tööstus: PV + aku" },
];

export const HEADER_CTA = {
  href: "/kalkulaatorid/paikesejaam",
  label: "Ava PV kalkulaator",
} as const;

export const PUBLIC_TOOLS = [
  {
    title: "Börsihind",
    description: "Vaata Eesti elektri börsihinda, odavaimaid tunde ja päeva kokkuvõtet.",
    href: "/borsihind",
    icon: "BH",
  },
  {
    title: "PV kalkulaator",
    description: "Hinda päikesejaama tootlust, omatarvet ja tasuvust sisestatud andmete põhjal.",
    href: "/kalkulaatorid/paikesejaam",
    icon: "PV",
  },
  {
    title: "Tööstus: PV + aku",
    description: "Tööstusettevõtte päikesejaama ja akusalvestuse analüüs, sh võimsustasu mõju.",
    href: "/kalkulaatorid/toostus",
    icon: "TÖ",
  },
] as const;
