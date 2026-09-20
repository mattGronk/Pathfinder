"use client";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SuiteAssessment } from "@/lib/assessment-suite";
import { optionId, scoreAnswers } from "@/lib/assessment-scoring";
import { canTakeAssessment } from "@/lib/assessment-access";
import { saveSuiteResult } from "@/app/dashboard/actions";

const ResponseChart = dynamic(() => import("@/components/response-chart"), {loading: () => <div className="chart-loading">Loading response chart…</div>});
type Props = { tier: "free" | "start" | "full"; assessments: (SuiteAssessment & { totalQuestions: number })[]; initialId?: string };

export default function AssessmentSuiteClient({ tier, assessments, initialId }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(initialId ?? null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number,string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const active = assessments.find(a => a.id === activeId);
  const centre = tier === "free" ? "/assessments" : "/dashboard?view=assessments";

  function start(id: string) {
    setActiveId(id); setStep(0); setAnswers({}); setSaved(false); setSaveMessage("");
    window.scrollTo({top: 0, behavior: "smooth"});
  }
  function returnToCentre() {
    if (saving) return;
    if (tier === "free") { setActiveId(null); setStep(0); }
    else { router.push(centre); router.refresh(); }
  }
  async function saveResult() {
    if (!active || saving) return;
    setSaving(true); setSaveMessage("");
    try {
      const result = await saveSuiteResult({ id: active.id, answers: active.questions.map((_, i) => answers[i]) });
      setSaved(!result.error); setSaveMessage(result.error ?? result.message ?? "");
      if (!result.error) router.refresh();
    } catch { setSaveMessage("Your results are shown here, but saving failed. Please retry before leaving."); }
    finally { setSaving(false); }
  }
  async function next() {
    if (!active || !answers[step] || saving) return;
    setStep(step + 1);
    window.scrollTo({top: 0, behavior: "smooth"});
    if (step + 1 === active.questions.length && canTakeAssessment(tier, active.id)) await saveResult();
  }

  const question = active?.questions[step];
  const complete = !!active && step >= active.questions.length;
  const locked = !!active && !canTakeAssessment(tier, active.id);
  const scores = active && complete && !locked ? scoreAnswers(active, active.questions.map((_, i) => answers[i])) ?? [] : [];
  return <main className="suite-page">
    <header className="suite-nav"><Link href="/"><Image src="/pathfinder-logo.png" width={42} height={42} alt="Pathfinder SA logo"/><b>Pathfinder SA</b></Link>
      {active ? <button disabled={saving} onClick={returnToCentre}><ArrowLeft/>Assessment centre</button> : <Link href="/account">Account</Link>}
    </header>
    {!active ? <><section className="suite-intro"><p className="eyebrow">ASSESSMENT SAMPLES</p><h1>Get to know your next direction.</h1><p>Try a short sample. Hatchling includes the complete career and subject-choice assessments. Trailblazer includes all {assessments.length} assessments.</p><Link className="workspace-button" href="/dashboard?view=assessments">Open my assessment centre <ArrowRight/></Link></section>
      <div className="suite-grid">{assessments.map((a,i) => <article key={a.id}><span className="suite-number">{String(i+1).padStart(2,"0")}</span><h2>{a.title}</h2><p>{a.description}</p><small><Clock3/>{a.duration} · {a.totalQuestions} questions in the full assessment</small><Button variant="outline" onClick={() => start(a.id)}>Try {a.id === "career" ? "three sample questions" : "a sample question"}<ArrowRight/></Button></article>)}</div></> :
    complete && locked ? <section className="suite-lock"><p className="eyebrow">SAMPLE COMPLETE</p><h1>Continue your {active.title.toLowerCase()} assessment.</h1><p>The full assessment has {active.totalQuestions} questions and takes about {active.duration}. {active.id === "career" || active.id === "subjects" ? "Included in Hatchling and Trailblazer." : "Included in Trailblazer."}</p><div className="suite-actions"><Button asChild><Link href="/upgrade">Choose my package <ArrowRight/></Link></Button><Button variant="outline" onClick={returnToCentre}>Back to samples</Button></div></section> :
    complete ? <section className="suite-results"><p className="eyebrow">{saved ? "COMPLETED & SAVED" : "YOUR RESULTS"}</p><h1>{active.title} profile</h1><p>These responses are a starting point for reflection, not a diagnosis or prediction.</p><ResponseChart signals={scores} total={active.questions.length} label={active.title + " signals"}/>
      {active.id === "subjects" && <div className="subject-result"><h2>Subject groups to investigate</h2><p>Discuss your strongest themes alongside current marks, school subject availability and official programme requirements. This reflection does not measure ability or decide which subjects you must take.</p></div>}
      <p role="status" aria-live="polite">{saving ? "Saving your completed assessment…" : saveMessage}</p><div className="suite-actions"><Button disabled={saving} onClick={returnToCentre}>Back to assessment centre <ArrowRight/></Button>{!saved && <Button variant="outline" disabled={saving} onClick={() => startTransition(saveResult)}>{saving ? "Saving…" : "Retry saving"}</Button>}{saved && <Button asChild variant="outline"><Link href="/dashboard?view=reports">View my saved reports</Link></Button>}<Button disabled={saving} variant="outline" onClick={() => start(active.id)}><RotateCcw/>Retake</Button></div></section> :
    question && <section className="suite-question"><div className="question-meta"><span>{active.title}</span><span>{step + 1} / {active.totalQuestions}{locked ? " · sample" : ""}</span></div><Progress value={(step+1)/active.totalQuestions*100}/><p>{active.duration} for the full assessment. Choose one response closest to you.</p><h1>{question.prompt}</h1><div className="suite-options" role="group" aria-label="Answer choices">{question.options.map((option,i) => {
      const id = optionId(step,i); const selected = answers[step] === id;
      return <button className={selected ? "selected" : ""} aria-pressed={selected} key={id} onClick={() => setAnswers(previous => ({...previous,[step]:id}))}>{option.label}<Check aria-hidden="true"/></button>;
    })}</div><div className="suite-actions"><Button variant="outline" disabled={step===0 || saving} onClick={() => setStep(step-1)}><ArrowLeft/>Back</Button><Button disabled={!answers[step] || saving} onClick={() => startTransition(next)}>{step+1 === active.questions.length ? locked ? "Finish sample" : "Finish & see my results" : "Next"}<ArrowRight/></Button></div></section>}
  </main>;
}
