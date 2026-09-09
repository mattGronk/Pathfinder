"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, RotateCcw, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  assess, questions, ratingOptions, contextQuestions, dimensions, emptyDraft, restoreDraft, draftSchema,
  lifeStages, STORAGE_KEY, stageActions, priorityActions, accessActions, fundingActions, careers,
  type AssessmentDraft, type LifeStage,
} from "@/lib/assessment";
import { salarySources, universityOrder } from "@/lib/pathways";
import { clearAssessmentDraft, saveAssessmentDraft } from "./actions";

const InterestProfileChart = dynamic(() => import("@/components/interest-profile-chart"), {
  loading: () => <div className="interest-chart-loading" aria-hidden="true"><span /></div>,
});

export default function Assessment({ initialDraft, hasCloudDraft, storageProblem, homeProvince }: { initialDraft: AssessmentDraft; hasCloudDraft: boolean; storageProblem: string; homeProvince?: string }) {
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState(initialDraft);
  const [ready, setReady] = useState(hasCloudDraft || !!storageProblem);
  const [saving, setSaving] = useState(false);
  const [storageMessage, setStorageMessage] = useState(storageProblem || (hasCloudDraft ? "Your saved progress is ready." : "Your progress will save privately as you answer."));
  const heading = useRef<HTMLHeadingElement>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const latestOperation = useRef(0);

  useEffect(() => {
    if (hasCloudDraft || storageProblem) return;
    const migration = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const deviceDraft = raw ? restoreDraft(raw) : null;
        if (deviceDraft) {
          setDraft(deviceDraft);
          setStorageMessage("Moving your earlier device draft into private cloud saving…");
          persist(deviceDraft, true);
        } else if (raw) {
          localStorage.removeItem(STORAGE_KEY);
          setStorageMessage("An expired device draft was cleared. Your new answers will save privately.");
        }
      } catch { /* Cloud saving remains available when browser storage is blocked. */ }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(migration);
  // This one-time migration deliberately uses the initial cloud state only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: AssessmentDraft, removeDeviceCopy = false) {
    const operation = ++latestOperation.current;
    setSaving(true);
    saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
      const result = await saveAssessmentDraft(next);
      if (removeDeviceCopy && !result.error) {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* The cloud copy is already authoritative. */ }
      }
      if (operation === latestOperation.current) {
        setSaving(false);
        setStorageMessage(result.error ?? result.message ?? "Your progress is saved privately.");
      }
    });
  }
  function update(change: Partial<AssessmentDraft>) {
    const next = draftSchema.parse({ ...draft, ...change });
    setDraft(next);
    persist(next);
  }
  function move(step: number, completed = false) {
    update({ step, completed });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function clear() {
    const next = emptyDraft(draft.stage);
    setDraft(next);
    const operation = ++latestOperation.current;
    setSaving(true);
    saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
      const result = await clearAssessmentDraft();
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore unavailable browser storage. */ }
      if (operation === latestOperation.current) {
        setSaving(false);
        setStorageMessage(result.error ?? result.message ?? "Your saved answers have been cleared.");
      }
    });
    requestAnimationFrame(() => heading.current?.focus());
  }

  const result = assess(draft);
  const question = questions[draft.step];
  const context = draft.step >= questions.length ? contextQuestions[draft.step - questions.length] : null;
  const current = question ? draft.answers[question.id]?.toString() : context ? draft[context.id] ?? "" : "";
  const answered = Object.keys(draft.answers).length + Number(!!draft.priority) + Number(!!draft.access) + Number(!!draft.funding);
  const options = context ? context.options : ratingOptions;

  return <main className="explore-page">
    <header className="explore-nav"><Link href="/" className="explore-brand"><Compass aria-hidden="true" /> Pathfinder SA</Link><Link href="/privacy">Privacy & your answers</Link></header>
    <div className="explore-heading"><p className="eyebrow">YOUR INTERESTS. YOUR NEXT EXPERIMENT.</p><h1>Find a direction worth exploring.</h1><p>15 questions. No right answers. A starting point for real conversations and small experiments.</p></div>
    <div className="explore-layout">
      <aside className="explore-guide">
        <label htmlFor="assessment-stage">Your life stage</label>
        <NativeSelect id="assessment-stage" value={draft.stage} disabled={!ready} onChange={e => update({ stage: e.target.value as LifeStage })}>
          {Object.entries(lifeStages).map(([value, label]) => <NativeSelectOption value={value} key={value}>{label}</NativeSelectOption>)}
        </NativeSelect>
        <p>Your next steps adapt to this. Your stage does not rule out any career.</p>
        <details className="device-choice"><summary><ShieldCheck aria-hidden="true" /> Your private saved progress</summary><div className="device-options"><p>Your activity ratings and practical choices are saved to Pathfinder SA and linked to your password account.</p>
          <p>No name, marks, salary or financial documents are requested here. Your answers are used only for the explained interest ranking and are not used to train a model.</p>
          <p role="status" className="storage-message">{saving ? "Saving your latest progress…" : storageMessage}</p>
        </div></details>
        <Button variant="outline" disabled={!ready || saving} onClick={clear}><RotateCcw /> Clear saved answers & start again</Button>
        <Link href="/" className="explore-back"><ArrowLeft aria-hidden="true" /> Back to dashboard</Link>
      </aside>

      <div className="explore-workspace" aria-busy={!ready}>
        <AnimatePresence mode="wait" initial={false}>
        {!ready ? <motion.section key="loading" className="explore-panel" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}><h2>Preparing your assessment…</h2></motion.section> : !draft.completed ? <motion.section key={`question-${draft.step}`} className="explore-panel" initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -14 }} transition={{ duration: 0.24 }}>
          <div className="assessment-step"><span>{context ? "PRACTICAL CHOICES" : "WHAT GIVES YOU ENERGY?"}</span><span>Question {draft.step + 1} of 15</span></div>
          <Progress value={answered / 15 * 100} aria-label={`${answered} of 15 questions answered`} />
          <p className="explore-prompt">{context ? "Choose what fits your situation today." : "How much would you enjoy this activity? Think about school, study, hobbies or work."}</p>
          <h2 ref={heading} tabIndex={-1} id="current-question">{context ? context.title : question.text}</h2>
          <RadioGroup aria-labelledby="current-question" value={current ?? ""} onValueChange={value => {
            if (context) update({ [context.id]: value });
            else update({ answers: { ...draft.answers, [question.id]: Number(value) } });
          }} className="explore-options">
            {options.map(option => <label key={option.value} className={current === option.value ? "chosen" : ""}><RadioGroupItem value={option.value} /><span>{option.label}</span></label>)}
          </RadioGroup>
          {!context && <p className="field-hint">Not tried it? Choose “Not sure”. That is treated as missing evidence, not a lack of interest.</p>}
          <div className="explore-actions"><Button variant="outline" disabled={draft.step === 0} onClick={() => move(draft.step - 1)}><ArrowLeft /> Back</Button><Button disabled={current === undefined || current === ""} onClick={() => draft.step === 14 ? move(14, true) : move(draft.step + 1)}>{draft.step === 14 ? "Explore my results" : "Next"}<ArrowRight /></Button></div>
          <p className="field-hint">Interest is not ability. You do not need experience or confidence to be curious.</p>
        </motion.section> : <motion.div key="results" className="assessment-results-stack" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
          <section className="explore-panel result-intro"><p className="eyebrow">A SHORTLIST, NOT A VERDICT</p><h2 ref={heading} tabIndex={-1}>Career directions, with study routes attached.</h2><p>You rated {result.rated} of 12 activities. Your practical choices shape the qualification and university research below, not the interest ranking.</p><p className="result-caution">This is an original exploratory exercise, not a validated psychological or aptitude test. It cannot predict success, admission, job availability or future earnings.</p><Button variant="outline" onClick={() => move(0)}>Review or change answers</Button></section>
          <section className="explore-panel"><h2>Your interest signals</h2><div className="interest-profile-grid"><InterestProfileChart scores={result.scores} /><div className="interest-signals">{Object.entries(result.scores).map(([key, value]) => <div key={key}><span>{dimensions[key as keyof typeof dimensions]}</span><b>{value === null ? "Not enough evidence" : value >= 4 ? "Stronger interest" : value >= 3 ? "Some interest" : "Less interest today"}</b></div>)}</div></div><p className="field-hint">Each signal averages up to two rated activities. “Not sure” answers are excluded. Interests can change with experience.</p></section>
          <section aria-label="Career ideas" className="career-ideas">
            {result.matches.length === 0 ? <div className="explore-panel"><h2>{result.enough ? "No strong direction yet. That is useful to know." : "A little more exploration will help."}</h2><p>{result.enough ? "The limited catalogue does not show a strong signal from your current answers. We will not invent a top match. Try an unfamiliar activity, discuss what you enjoyed, and return to these questions." : "We need at least six rated activities across three interest areas, plus the practical choices. You can review your answers, or try some new activities first."}</p></div> : <>
              <div className="results-section-heading"><h2>Directions to investigate</h2><p>From a growing catalogue of {careers.length} roles. Other careers may fit just as well.</p>{result.tied && <p className="result-caution">These suggestions are closely matched. Their order is not a meaningful difference.</p>}</div>
              {result.matches.map(({ career, reasons, coverage }) => <article className="explore-panel career-idea" key={career.id}><p className="eyebrow">{career.field}</p><h3>{career.title}</h3><p>{career.work}</p><div className="career-reason"><b>Why it appeared</b><p>Your interest in {reasons.map(key => dimensions[key].toLowerCase()).join(" and ")} contributed to this suggestion.{coverage < 1 ? " Some relevant interests are still unknown." : ""}</p></div><div className="pathway-details"><div className="qualification-card"><h4>Qualification routes to compare</h4><ul>{career.qualifications.map(item => <li key={item}>{item}</li>)}</ul></div><div className="earning-card"><h4>South African earning evidence</h4><p>{career.earning.text}</p><a href={career.earning.sourceUrl} target="_blank" rel="noreferrer">{career.earning.sourceLabel} · {career.earning.asOf}</a></div><div className="hours-card"><h4>Typical working hours</h4><p>{career.hours.text}</p><a href={career.hours.sourceUrl} target="_blank" rel="noreferrer">{career.hours.sourceLabel} · {career.hours.asOf}</a></div></div><details><summary>Try this path before committing <ArrowRight aria-hidden="true" /></summary><h4>One small experiment</h4><p>{career.tryIt}</p><h4>A reality check</h4><p>{career.check}</p><h4>Your next step</h4><p>{stageActions[draft.stage]}</p></details></article>)}
            </>}
          </section>
          <section className="explore-panel"><p className="eyebrow">MAKE IT PRACTICAL</p><h2>Work with your circumstances.</h2><h3>Your priority</h3><p>{draft.priority && priorityActions[draft.priority]}</p><h3>Access and location</h3><p>{draft.access && accessActions[draft.access]}</p><h3>Study cost and funding</h3><p>{draft.funding && fundingActions[draft.funding]}</p></section>
          <section className="explore-panel university-results"><p className="eyebrow">SOUTH AFRICAN UNIVERSITY COMPARISON</p><h2>Compare institutions around your needs.</h2><p>This is not a national ranking or admission prediction. The order uses your access choice{homeProvince ? ` and ${homeProvince} profile preference` : ""}. Fees below are selected 2026 tuition examples for South African students—not full quotations. Your subjects, marks, exact modules, residence and living budget must drive the final shortlist.</p><div className="university-grid">{draft.access && universityOrder(draft.access, homeProvince).map((university, index) => <article key={university.id}><span>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span><h3>{university.name}</h3><p>{university.location} · {university.format}</p><p>{university.strengths}</p><div className="fee-examples"><b>Tuition examples · {university.feeYear}</b><dl>{university.feeExamples.map(fee => <div key={fee.programme}><dt>{fee.programme}</dt><dd>{fee.amount}</dd></div>)}</dl></div><p className="cost-note">{university.costNote}</p><div className="source-links"><a href={university.studyUrl} target="_blank" rel="noreferrer">Explore programmes</a><a href={university.feesUrl} target="_blank" rel="noreferrer">{university.feeSourceLabel}</a></div></article>)}</div></section>
          <section className="explore-panel method-panel"><details><summary>How these suggestions are calculated</summary><p>The 12 activities cover six interest areas, two activities per area. We average your 1–5 ratings within each area and exclude “Not sure”. Each role has manually chosen weights that sum to one. Higher interest in its weighted areas raises its position; unknown areas add no positive evidence.</p><p>We show up to three roles with at least 60% weighted coverage and a 40% internal interest signal. These are product rules, not validated cut-offs. No fit percentages or probabilities are shown. Closely matched suggestions should be explored equally.</p><ul>{result.matches.map(({ career }) => <li key={career.id}><b>{career.title}:</b> {Object.entries(career.weights).map(([key, weight]) => `${dimensions[key as keyof typeof dimensions]} ${Math.round(weight * 100)}%`).join(", ")}</li>)}</ul><p>Life stage, location, study cost preferences and priorities do not change the career ranking. Grades, ability, admission and affordability are not assessed yet.</p></details><h3>Check the South African pathway</h3><p>Use the <a href="https://ncap.careerhelp.org.za/" target="_blank" rel="noreferrer">DHET National Career Advice Portal</a> and <a href="https://www.careerhelp.org.za/" target="_blank" rel="noreferrer">Khetha Career Development Services</a>. For earnings context, Stats SA reported average monthly earnings of R29,997 in the formal non-agricultural sector in February 2026; that is a broad economy benchmark, not a graduate or role-specific salary. <a href={salarySources.statsSa} target="_blank" rel="noreferrer">Read the June 2026 release</a>.</p></section>
        </motion.div>}
        </AnimatePresence>
      </div>
    </div>
  </main>;
}

