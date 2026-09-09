export type University = {
  id: string;
  name: string;
  province: string | null;
  location: string;
  format: string;
  strengths: string;
  costNote: string;
  feeExamples: { programme: string; amount: string }[];
  feeYear: string;
  feeSourceLabel: string;
  feesUrl: string;
  studyUrl: string;
};

// A small, source-linked starting catalogue. “Best fit” is a comparison prompt,
// not an admission prediction or institutional ranking.
export const universities: University[] = [
  {
    id: "uct", name: "University of Cape Town", province: "Western Cape", location: "Cape Town, Western Cape", format: "Campus based",
    strengths: "Broad undergraduate routes across science, commerce, engineering, humanities and health sciences.",
    costNote: "Indicative South African student tuition. UCT charges by course; the exact programme total can differ. Residence, meals, travel and books are extra.",
    feeExamples: [{ programme: "BCom", amount: "R62,340–R110,580" }, { programme: "LLB", amount: "R80,410" }, { programme: "MBChB", amount: "R113,510" }], feeYear: "2026", feeSourceLabel: "UCT 2026 Fees Handbook",
    feesUrl: "https://www.uct.ac.za/sites/default/files/media/documents/uct_ac_za/49/2026-fees-booklet.pdf",
    studyUrl: "https://uct.ac.za/students/prospective-students/undergraduate-applications",
  },
  {
    id: "wits", name: "University of the Witwatersrand", province: "Gauteng", location: "Johannesburg, Gauteng", format: "Campus based",
    strengths: "Undergraduate routes across commerce, engineering, health sciences, humanities and science.",
    costNote: "Representative annual tuition ranges compiled from the university’s 2026 schedule. Module choices change the total; living costs are excluded.",
    feeExamples: [{ programme: "BCom", amount: "R62,830–R85,260" }, { programme: "LLB", amount: "R47,930–R83,760" }, { programme: "BSc", amount: "R52,050–R80,750" }], feeYear: "2026", feeSourceLabel: "2026 university-fee comparison",
    feesUrl: "https://businesstech.co.za/news/finance/859648/how-much-it-costs-to-study-in-south-africa-in-2026/",
    studyUrl: "https://www.wits.ac.za/undergraduate/",
  },
  {
    id: "up", name: "University of Pretoria", province: "Gauteng", location: "Pretoria, Gauteng", format: "Campus based",
    strengths: "A wide programme range with faculty-specific undergraduate tuition guidance.",
    costNote: "Official estimated first-year tuition for South African students. Modules determine the final bill; residence and other living costs are extra.",
    feeExamples: [{ programme: "BCom Accounting Sciences", amount: "R74,000–R84,000" }, { programme: "LLB", amount: "R65,000–R75,000" }, { programme: "MBChB", amount: "R89,000–R98,000" }], feeYear: "2026", feeSourceLabel: "UP 2026 tuition estimates",
    feesUrl: "https://www.up.ac.za/student-fees/undergraduate-tuition-fees-faculty",
    studyUrl: "https://www.up.ac.za/programmes/programmes",
  },
  {
    id: "stellenbosch", name: "Stellenbosch University", province: "Western Cape", location: "Stellenbosch, Western Cape", format: "Campus based",
    strengths: "Undergraduate routes across commerce, law, science, engineering, humanities, education and health sciences.",
    costNote: "Representative 2026 annual estimates for South African students. Module choices can change the final amount; residence, books and living costs are excluded.",
    feeExamples: [{ programme: "BCom", amount: "about R59,856" }, { programme: "LLB", amount: "about R61,121" }, { programme: "BSc", amount: "about R72,647" }], feeYear: "2026", feeSourceLabel: "2026 university-fee comparison",
    feesUrl: "https://businesstech.co.za/news/finance/859648/how-much-it-costs-to-study-in-south-africa-in-2026/",
    studyUrl: "https://www.su.ac.za/en/apply",
  },
  {
    id: "uj", name: "University of Johannesburg", province: "Gauteng", location: "Johannesburg, Gauteng", format: "Campus based",
    strengths: "Broad undergraduate options across business, law, health sciences, engineering, design, humanities and science.",
    costNote: "Representative 2026 annual tuition ranges. Programme and module choices set the exact fee; residence and living costs are excluded.",
    feeExamples: [{ programme: "BCom", amount: "R53,730–R81,550" }, { programme: "LLB", amount: "R50,370–R57,850" }, { programme: "BSc", amount: "R52,140–R87,000" }], feeYear: "2026", feeSourceLabel: "2026 university-fee comparison",
    feesUrl: "https://businesstech.co.za/news/finance/859648/how-much-it-costs-to-study-in-south-africa-in-2026/",
    studyUrl: "https://www.uj.ac.za/admissions-aid/undergraduate/",
  },
  {
    id: "unisa", name: "University of South Africa", province: null, location: "Distance learning across South Africa", format: "Distance learning",
    strengths: "Flexible distance routes that may suit learners balancing work, location or family constraints.",
    costNote: "Unisa charges per module rather than one programme total. Use its official fee information for your exact module mix and include devices, data, books and examination travel.",
    feeExamples: [{ programme: "Tuition basis", amount: "charged per module" }], feeYear: "2026", feeSourceLabel: "Unisa official student fees",
    feesUrl: "https://www.unisa.ac.za/sites/corporate/default/Apply-for-admission/Student-fees-and-funding-your-studies",
    studyUrl: "https://www.unisa.ac.za/sites/corporate/default/Apply-for-admission/Undergraduate-qualifications",
  },
];

export const salarySources = {
  pnet: "https://www.pnet.co.za/e-recruiting/insights/",
  statsSa: "https://www.statssa.gov.za/?p=19676",
};

export function universityOrder(access: "local" | "online" | "flexible" | "unsure", homeProvince?: string) {
  if (access === "online") {
    const distanceOption = universities.find(university => university.id === "unisa");
    return distanceOption ? [distanceOption, ...universities.filter(university => university.id !== "unisa")] : universities;
  }
  if (access === "local" && homeProvince) {
    return [...universities].sort((a, b) => Number(b.province === homeProvince) - Number(a.province === homeProvince));
  }
  return universities;
}


