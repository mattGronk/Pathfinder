"use client";
import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { provinces, type CareerProfile, type FormResult } from "@/lib/profile";
import { eraseProfile, saveProfile } from "./actions";

const schoolSubjects = ["Mathematics","Mathematical Literacy","Physical Sciences","Life Sciences","Accounting","Business Studies","English","Afrikaans","isiZulu","isiXhosa","Geography","History","Computer Applications Technology","Information Technology","Visual Arts","Design","Life Orientation","Economics"];

export default function ProfileForm({ profile, enabled }: { profile: CareerProfile | null; enabled: boolean }) {
  const [stage, setStage] = useState<CareerProfile["lifeStage"]>(profile?.lifeStage ?? "school");
  const [state, action, pending] = useActionState<FormResult, FormData>(saveProfile, {});
  const [eraseState, eraseAction, erasing] = useActionState<FormResult, FormData>(eraseProfile, {});
  const [previewed, setPreviewed] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(profile?.lifeStage === "school" ? profile.subjects.split(",").map(item => item.trim()).filter(Boolean) : []);
  const school = profile?.lifeStage === "school" ? profile : null;
  const student = profile?.lifeStage === "student" ? profile : null;
  const working = profile?.lifeStage === "working" ? profile : null;
  return <>
    {enabled && <p className="preview-notice">Private profile · These details are saved to Pathfinder SA and linked to your password account. They are used only to personalise your pathway.</p>}
    <form className="profile-form" action={enabled ? action : undefined} onSubmit={(event) => {
      event.preventDefault();
      if (!enabled) { setPreviewed(true); return; }
      const submitted = new FormData(event.currentTarget);
      // Dispatch explicitly so an unsuccessful action does not reset unsaved fields.
      startTransition(() => action(submitted));
    }}>
      <fieldset disabled={pending || erasing}><legend>1. Your starting point</legend>
        <RadioGroup name="lifeStage" value={stage} onValueChange={(value) => { setStage(value as CareerProfile["lifeStage"]); setPreviewed(false); }} className="profile-stages">
          {([ ["school", "High school learner"], ["student", "University / TVET student"], ["working", "Working professional"] ] as const).map(([value, label]) => <label key={value}><RadioGroupItem value={value} />{label}</label>)}
        </RadioGroup>
        <label>What should we call you?<Input name="displayName" required maxLength={60} autoComplete="given-name" defaultValue={profile?.displayName} placeholder={enabled ? "First name or nickname" : "Example: Sam"} /></label>
        <div className="profile-columns"><label>Province<NativeSelect name="province" defaultValue={profile?.province ?? "Prefer not to say"}>{provinces.map((province) => <NativeSelectOption key={province} value={province}>{province}</NativeSelectOption>)}</NativeSelect></label>
          <label>Location flexibility<NativeSelect name="mobility" defaultValue={profile?.mobility ?? "unsure"}><NativeSelectOption value="local">Stay near home</NativeSelectOption><NativeSelectOption value="relocate">Open to relocating</NativeSelectOption><NativeSelectOption value="remote">Interested in remote work</NativeSelectOption><NativeSelectOption value="unsure">Still deciding</NativeSelectOption></NativeSelect></label></div>
      </fieldset>
      <fieldset key={stage} disabled={pending || erasing}><legend>2. {stage === "school" ? "Your school journey" : stage === "student" ? "Your studies and experience" : "Your working life"}</legend>
        {stage === "school" && <><label>Grade<NativeSelect name="grade" defaultValue={school?.grade ?? "9"}>{["7", "8", "9", "10", "11", "12"].map((grade) => <NativeSelectOption key={grade} value={grade}>Grade {grade}</NativeSelectOption>)}</NativeSelect></label><div className="subject-field"><span>Which subjects are you taking?</span><small>Choose all that apply. Learners below Grade 10 can select current subjects, then use the Subject Choice Intensive assessment.</small><input type="hidden" name="subjects" value={selectedSubjects.join(", ")} /><div className="subject-selector">{schoolSubjects.map(subject=><button type="button" className={selectedSubjects.includes(subject)?"selected":""} aria-pressed={selectedSubjects.includes(subject)} key={subject} onClick={()=>setSelectedSubjects(current=>current.includes(subject)?current.filter(item=>item!==subject):[...current,subject])}>{subject}{selectedSubjects.includes(subject)&&<span aria-hidden="true">✓</span>}</button>)}</div>{selectedSubjects.length===0&&<p className="field-hint">Select at least one subject before saving.</p>}</div><label>Approximate marks or strengths (optional)<Textarea name="marks" maxLength={500} defaultValue={school?.marks} placeholder="No report card or identifying school details needed." /></label></>}
        {stage === "student" && <><label>Institution<Input name="institution" required minLength={2} maxLength={120} defaultValue={student?.institution} /></label><label>Degree, diploma or certificate<Input name="qualification" required minLength={2} maxLength={120} defaultValue={student?.qualification} /></label><label>Year of study<Input name="year" required maxLength={40} defaultValue={student?.year} placeholder="For example: second year" /></label><label>Projects, internships or work experience (optional)<Textarea name="experience" maxLength={500} defaultValue={student?.experience} /></label></>}
        {stage === "working" && <><label>Current or most recent role<Input name="role" required minLength={2} maxLength={120} defaultValue={working?.role} /></label><label>Years of work experience<Input name="yearsExperience" type="number" required min={0} max={70} step={1} defaultValue={working?.yearsExperience} /></label><label>What gives you energy at work? (optional)<Textarea name="enjoy" maxLength={500} defaultValue={working?.enjoy} /></label><label>What would you like to change? (optional)<Textarea name="change" maxLength={500} defaultValue={working?.change} /></label><p className="field-hint">No salary, employer name or financial documents needed at this stage.</p></>}
      </fieldset>
      <fieldset disabled={pending || erasing}><legend>3. What would make this useful?</legend><label>Your main career question<Textarea name="goal" required minLength={5} maxLength={500} defaultValue={profile?.goal} placeholder="For example: How can I combine my interest in business with technology?" /></label>
        <label className="check-label"><Checkbox name="consent" required /><span>{enabled ? "I agree to save these details in my private career profile. " : "I understand this is an unsaved preview. "}<Link href="/privacy">Read the privacy notice.</Link></span></label>
      </fieldset>
      <div aria-live="polite">{state.error && <p role="alert" className="form-error">{state.error}</p>}{state.message && <p className="form-success">{state.message}</p>}{previewed && <p className="form-success">Preview complete. This is where your profile will be saved once accounts are connected. Nothing has been saved.</p>}</div>
      <Button type={enabled ? "submit" : "button"} onClick={enabled ? undefined : (event) => { if (event.currentTarget.form?.reportValidity()) setPreviewed(true); }} disabled={pending || erasing}>{pending ? "Saving…" : enabled ? "Save my profile" : "Finish preview"}</Button>
      <p className="field-hint">Your life stage personalises practical next steps. Profile details do not silently change the interest ranking.</p>
    </form>
    {enabled && <form action={eraseAction} className="profile-form erase-form"><h2>Your data, your choice.</h2><p>Erase the saved career details above. This does not delete your sign-in account.</p><label className="check-label"><Checkbox name="confirmErase" required /> Erase my saved career profile</label><Button type="submit" variant="outline" disabled={pending || erasing}>{erasing ? "Erasing…" : "Erase profile"}</Button><div aria-live="polite">{eraseState.error && <p className="form-error" role="alert">{eraseState.error}</p>}{eraseState.message && <p className="form-success">{eraseState.message}</p>}</div></form>}
  </>;
}
