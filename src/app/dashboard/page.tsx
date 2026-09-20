import {requirePaidWorkspace} from "@/lib/workspace-server";
import {careerCatalogue, universityCatalogue} from "@/lib/catalogue";
import {assessmentSuite} from "@/lib/assessment-suite";
import {subjectChoiceOptional} from "@/lib/assessment-access";
import Dashboard from "./workspace-client";
export const metadata={title:"My dashboard | Pathfinder SA",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){const [state,params]=await Promise.all([requirePaidWorkspace(),searchParams]);const view=["overview","assessments","careers","universities","reports","cv"].includes(params.view??"")?params.view as "overview"|"assessments"|"careers"|"universities"|"reports"|"cv":"overview";return <Dashboard key={view} initialView={view} optionalSubjects={subjectChoiceOptional(state.profile)} needsProfile={!state.profile?.birthYear} name={state.profile?.displayName??state.user.email?.split("@")[0]??"there"} tier={state.tier as "start"|"full"} results={state.results} cv={state.cv} tasks={state.tasks} careers={state.tier==="full"?careerCatalogue:careerCatalogue.slice(0,3)} universities={state.tier==="full"?universityCatalogue:universityCatalogue.slice(0,4)} assessments={assessmentSuite.map(({id,title,description,duration,questions})=>({id,title,description,duration,totalQuestions:questions.length}))}/>;}
