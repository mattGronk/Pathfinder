// Explicit allowlists keep unexpected legacy metadata out of the admin response.
const onboardingFields = {
  name: "Name", fullName: "Name", displayName: "Preferred name", lifeStage: "Life stage",
  school: "School", grade: "Grade", subjects: "Subjects", marks: "Marks",
  institution: "Institution", degree: "Degree", qualification: "Qualification", yearOfStudy: "Year of study",
  hasInternshipExperience: "Internship experience", preferredCities: "Preferred cities", province: "Province",
  role: "Current role", yearsExperience: "Years of experience", goals: "Goals",
};
const assessmentFields = {
  energizing_activities: "Energising activities", lose_track_of_time: "Absorbing activities",
  problem_solving_instinct: "Problem-solving approach", team_vs_independent: "Team / independent preference",
  structure_vs_flexibility: "Structure / flexibility", stability_vs_upside: "Stability / upside",
  job_priorities: "Job priorities", worst_tradeoff: "Least acceptable trade-off",
  earning_pressure: "Earning priorities", variable_income_comfort: "Variable income comfort",
};
function readable(value: unknown): string | null {
  if (typeof value === "string") return value.slice(0, 2000);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.slice(0, 30).map(v => typeof v === "string" || typeof v === "number" ? String(v).slice(0, 200) : "").filter(Boolean).join(", ");
  return null;
}
export default function LegacyProfile({ data, assessment = false }: { data: unknown; assessment?: boolean }) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const fields = assessment ? assessmentFields : onboardingFields;
  const entries = Object.entries(fields).map(([key, label]) => [label, readable((data as Record<string, unknown>)[key])] as const).filter(([, value]) => value);
  if (!entries.length) return null;
  return <details className="admin-result" open={!assessment}><summary>{assessment ? "Earlier assessment responses" : "Earlier onboarding information"}</summary><dl className="admin-details">{entries.map(([label, value]) => <div className="admin-detail-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details>;
}
