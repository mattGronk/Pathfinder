import { redirect } from "next/navigation";
import { readWorkspace } from "@/lib/workspace-server";
import { assessmentSuite } from "@/lib/assessment-suite";
import { canTakeAssessment } from "@/lib/assessment-access";
import AssessmentSuiteClient from "./assessment-suite-client";
export const metadata = { title: "Assessment centre | Pathfinder SA" };
export const dynamic = "force-dynamic";
export default async function AssessmentsPage({searchParams}: {searchParams: Promise<{quiz?: string}>}) {
  const [state, params] = await Promise.all([readWorkspace(), searchParams]);
  const tier = state?.tier ?? "free";
  const active = assessmentSuite.find(a => a.id === params.quiz);
  if (tier !== "free" && !active) redirect("/dashboard?view=assessments");
  const assessments = (active ? [active] : assessmentSuite).map(a => ({...a, totalQuestions: a.questions.length,
    questions: canTakeAssessment(tier,a.id) ? a.questions : a.questions.slice(0,a.id === "career" ? 3 : 1)}));
  return <AssessmentSuiteClient key={active?.id ?? "samples"} tier={tier} assessments={assessments} initialId={active?.id}/>;
}
