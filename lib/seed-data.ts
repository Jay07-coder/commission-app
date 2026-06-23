/** Default roster + source rules, extracted from the Top Agent Realty workbook. */
import type { Agent, Source } from "./commission";

type TeamRow = [name: string, base: number, zillow: number | null, office: string];

const TEAM: TeamRow[] = [
  ["Auday Putrus", 65, 50, "Lakeside"], ["Jon Kassab", 65, 50, "Troy"],
  ["Alex Atleski", 60, 50, "Austin"], ["Rita Tohme", 65, 25, "Lakeside"],
  ["Zachary Harrison", 60, 50, "Troy"], ["Ian Billock", 60, 50, "Troy"],
  ["Laith Yousif", 75, 50, "Troy"], ["Michael Giang", 50, 50, "Troy"],
  ["Nameer Jamil", 50, 50, "Troy"], ["Matthew Kallabat", 60, 50, "Troy"],
  ["Raymond Karoumy", 60, 50, "Troy"], ["Eddie Babbie", 50, 50, "Troy"],
  ["Brittany Graustein", 50, 50, "Troy"], ["Logan Gunter", 50, 50, "Troy"],
  ["Christine Beniamin", 50, 50, "Troy"], ["Eva Slewa", 50, 50, "Troy"],
  ["Mark Bonnay", 50, 50, "Troy"], ["Christian Sanger", 50, 50, "Troy"],
  ["Thaier Fandakly", 50, 50, "Troy"], ["Lina Fandakly", 50, 50, "Troy"],
  ["Rany Kachi", 50, 50, "Troy"], ["Ornela Ivezaj", 70, null, "Troy"],
  ["Juliette Mochol", 70, null, "Troy"], ["Fidae Jamoua", 70, null, "Troy"],
];

const INDEPENDENT = [
  "Brett Ullmann", "Taylor Denha", "Brooklyn Barber", "Julius Hallac", "Jason Floare",
  "Jesse Hallac", "Frank Van Maele", "Seville Kas-Mikha", "Rami Jabro", "Fadi Salem",
  "David Putros", "Michael Gasso", "Anthony Jarbo",
];

export const DEFAULT_AGENTS: Agent[] = [
  ...TEAM.map(([name, baseSplit, zillowSplit, office]) => ({
    name, tier: "team" as const, baseSplit, zillowSplit, office, email: "", cap: 0, capPaid: 0,
  })),
  ...INDEPENDENT.map((name) => ({
    name, tier: "independent" as const, baseSplit: 100, zillowSplit: 100, office: "Troy",
    email: "", cap: 0, capPaid: 0,
  })),
  { name: "Charles Tamou", tier: "owner" as const, baseSplit: 0, zillowSplit: 0, office: "Troy", email: "", cap: 0, capPaid: 0 },
].sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_SOURCES: Source[] = [
  { name: "Zillow", category: "company" },
  { name: "Zillow - Direct", category: "company" },
  { name: "Zillow - RTT", category: "company" },
  { name: "Zillow Seller", category: "company" },
  { name: "Homelight", category: "company" },
  { name: "Fast Expert", category: "company" },
  { name: "OpCity", category: "company" },
  { name: "Mojo", category: "company" },
  { name: "Google", category: "company" },
  { name: "Sign Call", category: "company" },
  { name: "SOI (sphere of influence)", category: "self" },
  { name: "Past Client", category: "self" },
  { name: "Client Referral", category: "self" },
  { name: "Personal", category: "self" },
  { name: "Lease", category: "self" },
  { name: "Referral (paid out)", category: "referral" },
  { name: "Referral - Lender", category: "referral" },
];
