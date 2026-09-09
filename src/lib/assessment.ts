import { z } from "zod";

export const dimensions = {
  analytical: "Investigating and analysing", practical: "Building and fixing", social: "Helping and teaching",
  creative: "Designing and creating", organised: "Planning and checking", enterprising: "Persuading and leading",
} as const;
export type Dimension = keyof typeof dimensions;
export const lifeStages = { school: "High school learner", student: "University / TVET student", working: "Working adult" } as const;
export type LifeStage = keyof typeof lifeStages;
export const questions: { id: string; dimension: Dimension; text: string }[] = [
  { id: "patterns", dimension: "analytical", text: "Finding patterns in numbers or information." },
  { id: "repair", dimension: "practical", text: "Working out how something works and fixing it." },
  { id: "explain", dimension: "social", text: "Helping someone understand a difficult idea." },
  { id: "design", dimension: "creative", text: "Creating a design, story or visual from a blank page." },
  { id: "plan", dimension: "organised", text: "Turning a messy task into a clear, workable plan." },
  { id: "persuade", dimension: "enterprising", text: "Presenting an idea and getting others interested." },
  { id: "investigate", dimension: "analytical", text: "Comparing evidence before deciding what is true." },
  { id: "make", dimension: "practical", text: "Making or testing something useful with tools or materials." },
  { id: "support", dimension: "social", text: "Listening carefully and helping someone move forward." },
  { id: "imagine", dimension: "creative", text: "Imagining several different ways to solve a problem." },
  { id: "detail", dimension: "organised", text: "Checking details and spotting errors that others miss." },
  { id: "lead", dimension: "enterprising", text: "Bringing people together to get an idea off the ground." },
];
export const ratingOptions = [
  { value: "1", label: "Not for me" }, { value: "2", label: "A little" }, { value: "3", label: "Somewhat" },
  { value: "4", label: "Quite a lot" }, { value: "5", label: "Very much" }, { value: "0", label: "Not sure / not tried yet" },
];
export const contextQuestions = [
  { id: "priority", title: "What matters most in your next step?", options: [
    { value: "stability", label: "Predictability and income stability" }, { value: "growth", label: "Learning and variety" },
    { value: "impact", label: "Helping people or communities" }, { value: "autonomy", label: "Independence and ownership" },
  ] },
  { id: "access", title: "Which opportunities can you realistically explore?", options: [
    { value: "local", label: "Near home, with manageable transport" }, { value: "online", label: "Online, if data and electricity allow" },
    { value: "flexible", label: "A mix; I can consider different locations" }, { value: "unsure", label: "I still need to work this out" },
  ] },
  { id: "funding", title: "How should cost shape your study shortlist?", options: [
    { value: "lowest", label: "Keep tuition, travel and living costs as low as possible" },
    { value: "funding", label: "Prioritise routes where I can investigate funding support" },
    { value: "value", label: "Compare total cost with programme fit and outcomes" },
    { value: "unsure", label: "I still need to understand what I can afford" },
  ] },
] as const;

const answerSchema = z.record(z.number().int().min(0).max(5)).refine(a => Object.keys(a).every(id => questions.some(q => q.id === id)));
const oldDraftSchema = z.object({
  version: z.literal(1), stage: z.enum(["school", "student", "working"]), answers: answerSchema,
  priority: z.enum(["stability", "growth", "impact", "autonomy"]).nullable(),
  access: z.enum(["local", "online", "flexible", "unsure"]).nullable(),
  ownership: z.enum(["employment", "experiment", "explore"]).nullable(),
  step: z.number().int().min(0).max(14), completed: z.boolean(),
});
export const draftSchema = z.object({
  version: z.literal(2), stage: z.enum(["school", "student", "working"]), answers: answerSchema,
  priority: z.enum(["stability", "growth", "impact", "autonomy"]).nullable(),
  access: z.enum(["local", "online", "flexible", "unsure"]).nullable(),
  funding: z.enum(["lowest", "funding", "value", "unsure"]).nullable(),
  step: z.number().int().min(0).max(14), completed: z.boolean(),
});
export type AssessmentDraft = z.infer<typeof draftSchema>;
export const STORAGE_KEY = "pathfinder-assessment-v1";
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export function emptyDraft(stage: LifeStage = "school"): AssessmentDraft {
  return { version: 2, stage, answers: {}, priority: null, access: null, funding: null, step: 0, completed: false };
}
export function isComplete(draft: AssessmentDraft) {
  return questions.every(q => draft.answers[q.id] !== undefined) && !!draft.priority && !!draft.access && !!draft.funding;
}
export function parseAssessmentDraft(input: unknown): AssessmentDraft {
  const current = draftSchema.safeParse(input);
  if (current.success) return current.data;
  const old = oldDraftSchema.parse(input);
  return {
    version: 2,
    stage: old.stage,
    answers: old.answers,
    priority: old.priority,
    access: old.access,
    funding: null,
    step: old.completed ? 14 : Math.min(old.step, 13),
    completed: false,
  };
}
export function restoreDraft(raw: string, now = Date.now()): AssessmentDraft | null {
  try {
    const saved = z.object({ savedAt: z.number().finite(), draft: z.unknown() }).parse(JSON.parse(raw));
    const draft = parseAssessmentDraft(saved.draft);
    if (saved.savedAt > now || now - saved.savedAt >= RETENTION_MS || (draft.completed && !isComplete(draft))) return null;
    return draft;
  } catch { return null; }
}

export type Career = {
  id: string; title: string; field: string; weights: Partial<Record<Dimension, number>>;
  work: string; tryIt: string; check: string; qualifications: string[];
  earning: { text: string; sourceLabel: string; sourceUrl: string; asOf: string };
  hours: { text: string; sourceLabel: string; sourceUrl: string; asOf: string };
};
// Editorial hypotheses for a small exploration catalogue, not validated occupational profiles.
export const careers: Career[] = [
  { id: "data", title: "Data analyst", field: "Information and problem solving", weights: { analytical: 0.6, organised: 0.3, creative: 0.1 }, work: "Clean information, look for patterns and explain what a dataset can and cannot tell you.", tryIt: "Use a small public dataset or a fictional spreadsheet to answer one question, then explain your finding in a chart.", check: "Try working through missing or inconsistent data, not only making the final chart.", qualifications: ["BSc in Data Science, Statistics or Computer Science", "BCom in Information Systems or Analytics", "Relevant diploma plus a strong project portfolio"], earning: { text: "R30,000–R35,000 per month was the national advertised range for Data Analyst roles in Pnet’s 2026 guide.", sourceLabel: "Pnet 2026 Salary Guide reporting", sourceUrl: "https://mybroadband.co.za/news/business/628106-average-salaries-for-20-tech-jobs-in-south-africa.html", asOf: "February 2026" }, hours: { text: "Many office roles use a 40–45 hour week. South Africa’s ordinary-hours ceiling is 45 hours for employees covered by the BCEA; employer and deadline patterns vary.", sourceLabel: "Basic Conditions of Employment Act", sourceUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/a75-97.pdf", asOf: "accessed September 2026" } },
  { id: "software", title: "Software developer", field: "Technology and building", weights: { analytical: 0.4, practical: 0.4, creative: 0.2 }, work: "Build, test and improve software that solves a specific problem.", tryIt: "Make a tiny calculator or quiz and ask a friend to find a way to break it.", check: "Notice whether debugging and repeated testing interest you as much as making something new.", qualifications: ["BSc in Computer Science or Information Technology", "BEng in Software or Computer Engineering", "Diploma in ICT with a practical portfolio"], earning: { text: "R30,000–R45,000 per month was the national advertised range for Full Stack Developer roles in Pnet’s 2026 guide; this is a nearby benchmark, not a promise for every developer role.", sourceLabel: "Pnet 2026 Salary Guide reporting", sourceUrl: "https://mybroadband.co.za/news/business/628106-average-salaries-for-20-tech-jobs-in-south-africa.html", asOf: "February 2026" }, hours: { text: "Many office roles use a 40–45 hour week. South Africa’s ordinary-hours ceiling is 45 hours for employees covered by the BCEA; on-call and release schedules vary.", sourceLabel: "Basic Conditions of Employment Act", sourceUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/a75-97.pdf", asOf: "accessed September 2026" } },
  { id: "design", title: "Digital product designer", field: "Design and user experience", weights: { creative: 0.6, social: 0.3, analytical: 0.1 }, work: "Explore how people use a service, sketch alternatives and test whether designs make it easier.", tryIt: "Sketch a clearer school timetable or booking form and ask someone to use it without instructions.", check: "Test your willingness to revise an idea after feedback, not just your enjoyment of drawing.", qualifications: ["BA or diploma in Interaction, Communication or Digital Design", "Multimedia or UX-focused technology qualification", "Portfolio-led route with structured design training"], earning: { text: "A reliable role-specific figure is not yet included. Compare current advertised ranges by title, province and experience before planning around income.", sourceLabel: "Pnet salary research", sourceUrl: "https://www.pnet.co.za/e-recruiting/insights/", asOf: "2026" }, hours: { text: "Many office roles use a 40–45 hour week. Project deadlines and employer practices can change the actual schedule.", sourceLabel: "Basic Conditions of Employment Act", sourceUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/a75-97.pdf", asOf: "accessed September 2026" } },
  { id: "teaching", title: "Teacher", field: "Education and people", weights: { social: 0.6, organised: 0.3, creative: 0.1 }, work: "Prepare lessons, explain ideas and help learners practise and assess their understanding.", tryIt: "With permission, explain a topic to a peer and ask them to show what they understood.", check: "Explore classroom realities and current qualification and registration requirements before committing.", qualifications: ["Bachelor of Education (BEd)", "Relevant bachelor’s degree followed by an approved teaching qualification", "Subject and phase choices aligned with current professional requirements"], earning: { text: "A verified teacher-specific range is not yet included. Public and independent-school pay structures differ, as do entry and experienced levels.", sourceLabel: "Statistics SA earnings context", sourceUrl: "https://www.statssa.gov.za/?p=19676", asOf: "June 2026" }, hours: { text: "Timetabled school hours do not include every lesson plan, assessment and school activity. Ask practising teachers about term-time workload before deciding.", sourceLabel: "Career workload needs local verification", sourceUrl: "https://ncap.careerhelp.org.za/", asOf: "2026" } },
  { id: "electrical", title: "Electrician", field: "Skilled trades and practical systems", weights: { practical: 0.6, analytical: 0.3, organised: 0.1 }, work: "Work with electrical systems, diagnose faults and follow safety and technical procedures.", tryIt: "Arrange an informational conversation with a qualified electrician or accredited training provider. Do not attempt electrical work yourself.", check: "Confirm accredited training, workplace experience and trade requirements directly with the relevant provider.", qualifications: ["Accredited TVET electrical programme", "Workplace learning or apprenticeship", "Required trade test and occupational registration steps"], earning: { text: "A verified electrician-specific range is not yet included. Employment type, trade status and experience can materially change earnings.", sourceLabel: "Pnet salary research", sourceUrl: "https://www.pnet.co.za/e-recruiting/insights/", asOf: "2026" }, hours: { text: "Schedules depend on construction, maintenance and call-out work. The BCEA sets a 45-hour ordinary-hours ceiling for covered employees, before agreed overtime.", sourceLabel: "Basic Conditions of Employment Act", sourceUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/a75-97.pdf", asOf: "accessed September 2026" } },
  { id: "projects", title: "Project coordinator", field: "Planning and teamwork", weights: { organised: 0.4, enterprising: 0.4, social: 0.2 }, work: "Track tasks, communicate changes and help a team deliver work within agreed constraints.", tryIt: "Plan a small school, study or community activity with tasks, dates and a realistic fallback plan.", check: "Notice how you respond when priorities change or others miss a deadline.", qualifications: ["Diploma or degree in Project Management", "BCom, BAdmin or field-specific degree with project modules", "Entry role plus recognised project training"], earning: { text: "A verified general coordinator range is not yet included. Sector and project scale matter, so compare the exact job title rather than a management benchmark.", sourceLabel: "Pnet salary research", sourceUrl: "https://www.pnet.co.za/e-recruiting/insights/", asOf: "2026" }, hours: { text: "Many office roles use a 40–45 hour week, with delivery deadlines sometimes extending it. Employer practice matters.", sourceLabel: "Basic Conditions of Employment Act", sourceUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/a75-97.pdf", asOf: "accessed September 2026" } },
  { id: "investment-banking", title: "Investment banking analyst", field: "Finance and transactions", weights: { analytical: 0.5, enterprising: 0.3, organised: 0.2 }, work: "Analyse companies, build financial models and prepare transaction materials under tight deadlines.", tryIt: "Choose a listed company and write a one-page view of its business, risks and simple valuation assumptions.", check: "Test whether you enjoy precise, repeated financial analysis under deadline pressure—not only markets or deal headlines.", qualifications: ["BCom in Finance, Investment Management or Accounting", "BSc in Finance, Mathematics, Statistics or Economics", "Strong internships, modelling skills and commercial awareness"], earning: { text: "PayScale reported R489,000 average base pay in South African investment banking; investment analyst entries showed R397,000–R797,000 a year. Bonuses can materially change total pay.", sourceLabel: "PayScale South Africa", sourceUrl: "https://www.payscale.com/research/ZA/Industry=Investment_Banking/Salary", asOf: "14 July 2026" }, hours: { text: "Analysts commonly report roughly 70–80 hours a week in global investment-banking guidance. This is not South Africa-specific and varies sharply by team and live deals.", sourceLabel: "Mergers & Inquisitions workload guide", sourceUrl: "https://mergersandinquisitions.com/investment-banking-hours/", asOf: "2026" } },
  { id: "accountant", title: "Accountant", field: "Finance and reliable records", weights: { organised: 0.5, analytical: 0.4, practical: 0.1 }, work: "Prepare and review financial information, investigate differences and help organisations meet reporting obligations.", tryIt: "Use fictional transactions to reconcile a simple cashbook, prepare a basic income statement and explain any differences.", check: "Compare financial accounting, management accounting, audit and tax work; the daily tasks and professional routes differ.", qualifications: ["BCom in Accounting or Accounting Sciences", "Diploma in Accountancy or Financial Accounting", "Accredited postgraduate and professional route where the target designation requires it"], earning: { text: "Financial and project accountant vacancies advertised R30,000–R40,000 per month nationally in Pnet’s 2026 salary guide.", sourceLabel: "Pnet 2026 Salary Guide reporting", sourceUrl: "https://businesstech.co.za/news/business/850070/what-people-earn-across-114-jobs-in-south-africa-in-2026-with-some-earning-r125000-a-month/", asOf: "February 2026" }, hours: { text: "A practical baseline is 40–45 hours a week; year-end, audit and tax deadlines can run longer. The BCEA ordinary-hours ceiling is 45 hours for covered employees.", sourceLabel: "Basic Conditions of Employment Act", sourceUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/a75-97.pdf", asOf: "accessed September 2026" } },
  { id: "doctor", title: "Medical doctor", field: "Medicine and patient care", weights: { social: 0.45, analytical: 0.4, organised: 0.15 }, work: "Assess patients, make clinical decisions, coordinate care and communicate clearly in high-stakes situations.", tryIt: "Arrange an approved hospital, clinic or health-science observation opportunity and speak to doctors at different career stages.", check: "Investigate training length, selection requirements, emotional load, shift work and compulsory service—not only the subject content.", qualifications: ["Accredited MBChB degree", "Internship and community service requirements", "HPCSA registration and later specialist training where relevant"], earning: { text: "Indeed reported an average physician salary of R86,367 per month, with R67,980–R109,727 shown from 11 salary observations. Treat the small sample cautiously.", sourceLabel: "Indeed South Africa", sourceUrl: "https://za.indeed.com/career/physician/salaries", asOf: "6 August 2026" }, hours: { text: "Public-service doctors generally have a 40-hour normal week; commuted-overtime categories can add 4–20+ hours, making roughly 44–60+ hours possible depending on post and roster.", sourceLabel: "South African parliamentary health response", sourceUrl: "https://pmg.org.za/committee-question/36827/", asOf: "2026" } },
  { id: "law", title: "Lawyer / associate attorney", field: "Law, argument and client service", weights: { analytical: 0.35, enterprising: 0.35, organised: 0.2, social: 0.1 }, work: "Research law, advise clients, draft documents and build careful arguments around facts and rules.", tryIt: "Read a public court judgment, summarise the issue and reasoning in plain language, then test your summary against the judgment.", check: "Compare litigation, commercial, public-interest and in-house work; workload and daily activities vary more than the title suggests.", qualifications: ["LLB from a recognised institution", "Practical vocational training and articles or approved equivalent", "Admission examinations and professional admission requirements"], earning: { text: "PayScale reported R373,634 average annual pay for associate attorneys, with base salaries from R179,000–R679,000 and total pay from R182,000–R766,000.", sourceLabel: "PayScale South Africa", sourceUrl: "https://www.payscale.com/research/ZA/Job=Associate_Attorney/Salary", asOf: "2026" }, hours: { text: "International law-firm data suggests about 42–54 hours in small and medium firms and around 66 in large firms. This is a comparison point, not a South African guarantee.", sourceLabel: "Clio legal working-hours guide", sourceUrl: "https://www.clio.com/uk/blog/solicitor-working-hours/", asOf: "12 March 2025" } },
  { id: "marketing", title: "Marketing manager", field: "Marketing, communication and growth", weights: { enterprising: 0.5, creative: 0.3, social: 0.2 }, work: "Understand an audience, shape a proposition, coordinate campaigns and use evidence to improve results.", tryIt: "Create two versions of a campaign for different audiences and define one honest measure of whether each worked.", check: "Explore customer research, budgets, analytics and ethical communication as well as the creative side.", qualifications: ["BCom in Marketing Management", "Diploma in Marketing or Digital Marketing", "Communication or business degree with research and analytics modules"], earning: { text: "Marketing manager vacancies advertised R35,000–R68,163 per month nationally in Pnet’s 2026 salary guide; marketing specialists were R27,500–R36,500.", sourceLabel: "Pnet 2026 Salary Guide reporting", sourceUrl: "https://businesstech.co.za/news/business/850070/what-people-earn-across-114-jobs-in-south-africa-in-2026-with-some-earning-r125000-a-month/", asOf: "February 2026" }, hours: { text: "A practical baseline is 40–45 hours a week; launches and events can add evenings. The BCEA ordinary-hours ceiling is 45 hours for covered employees.", sourceLabel: "Basic Conditions of Employment Act", sourceUrl: "https://www.gov.za/sites/default/files/gcis_document/201409/a75-97.pdf", asOf: "accessed September 2026" } },
];

export function assess(draft: AssessmentDraft) {
  const scores = Object.fromEntries((Object.keys(dimensions) as Dimension[]).map(dimension => {
    const ratings = questions.filter(q => q.dimension === dimension).map(q => draft.answers[q.id]).filter(v => v !== undefined && v > 0);
    return [dimension, ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null];
  })) as Record<Dimension, number | null>;
  const rated = questions.filter(q => (draft.answers[q.id] ?? 0) > 0).length;
  const enough = isComplete(draft) && rated >= 6 && Object.values(scores).filter(v => v !== null).length >= 3;
  const ranked = careers.map(career => {
    const entries = Object.entries(career.weights) as [Dimension, number][];
    const coverage = entries.reduce((sum, [key, weight]) => sum + (scores[key] === null ? 0 : weight), 0);
    // Missing interests contribute no positive evidence. Do not inflate sparsely rated roles.
    const score = entries.reduce((sum, [key, weight]) => sum + (scores[key] === null ? 0 : ((scores[key]! - 1) / 4) * weight), 0);
    const reasons = entries.filter(([key]) => (scores[key] ?? 0) >= 3).sort(([a, aw], [b, bw]) => (scores[b]! - 1) * bw - (scores[a]! - 1) * aw).map(([key]) => key);
    return { career, score, coverage, reasons };
  }).sort((a, b) => b.score - a.score || a.career.id.localeCompare(b.career.id));
  const matches = enough ? ranked.filter(m => m.score >= 0.4 && m.coverage >= 0.6).slice(0, 3) : [];
  const tied = matches.length > 1 && Math.abs(matches[0].score - matches[matches.length - 1].score) < 0.05;
  return { scores, rated, enough, matches, tied };
}

export const stageActions: Record<LifeStage, string> = {
  school: "Discuss the experiment with a teacher or career adviser. Check subject choices and current entry requirements before changing your school subjects.",
  student: "Turn the experiment into a small portfolio example. Ask your institution about relevant modules, workplace learning and entry-level routes.",
  working: "Compare this activity with work you already do. Investigate transferable skills and training costs before making a career move.",
};
export const priorityActions = {
  stability: "Ask about the predictability of training costs, hours and income. No role here guarantees stable work.",
  growth: "Compare opportunities for practice, feedback and learning, not just job titles.",
  impact: "Ask who benefits from the work and which daily tasks create that benefit.",
  autonomy: "Compare how much choice the work offers over methods, specialisation, schedule and progression.",
};
export const accessActions = {
  local: "Start with nearby providers and people. Include travel time and transport costs when comparing options.",
  online: "Check device access, data costs and electricity needs. An online learning option is not a promise of remote employment.",
  flexible: "Compare local and other locations, including housing and travel costs, before deciding.",
  unsure: "Map your transport, device and study-time options first. It is fine to keep more than one route open.",
};
export const fundingActions = {
  lowest: "Compare total annual cost, not tuition alone: include transport or residence, meals, books, devices and data.",
  funding: "Check current NSFAS, bursary and institution-specific rules directly. Funding eligibility and admission are separate decisions.",
  value: "Compare programme content, accreditation, support, completion realities and total cost before deciding what offers value for you.",
  unsure: "Build a simple annual budget and request official programme quotations before ruling institutions in or out.",
};


