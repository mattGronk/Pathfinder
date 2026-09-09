import { readWorkspace } from "@/lib/workspace-server";
import { assessmentSuite } from "@/lib/assessment-suite";
import AssessmentSuiteClient from "./assessment-suite-client";
export const metadata={title:"Assessment centre | Pathfinder SA"};
export const dynamic="force-dynamic";
export default async function AssessmentsPage(){
 const state=await readWorkspace(); const tier=state?.tier??"free";
 const assessments=assessmentSuite.map(a=>({...a,totalQuestions:a.questions.length,questions:(tier==="full"||(tier==="start"&&a.id==="career"))?a.questions:a.questions.slice(0,a.id==="career"?3:1)}));
 return <AssessmentSuiteClient tier={tier} assessments={assessments}/>;
}
