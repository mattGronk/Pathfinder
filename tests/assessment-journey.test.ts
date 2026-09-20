import assert from "node:assert/strict";
import { test } from "node:test";
import { assessmentSuite } from "../src/lib/assessment-suite";
import { optionId, scoreAnswers } from "../src/lib/assessment-scoring";
import { canTakeAssessment, assessmentProgress, subjectChoiceOptional } from "../src/lib/assessment-access";
import { profileFromForm, profileSchema } from "../src/lib/profile";
import { accountInput } from "../src/lib/account-input";
import { careerCatalogue } from "../src/lib/catalogue";

test("every assessment has 30 distinct prompts and valid independently identified choices", () => {
  assert.equal(assessmentSuite.length,10);
  for (const assessment of assessmentSuite) {
    assert.equal(assessment.questions.length,30,assessment.id);
    assert.equal(new Set(assessment.questions.map(q=>q.prompt)).size,30,assessment.id);
    assert.match(assessment.duration,/12–15/);
    for (const [i,q] of assessment.questions.entries()) {
      assert.ok(q.options.length>=4);
      assert.equal(new Set(q.options.map(o=>o.label)).size,q.options.length);
      q.options.forEach((o,j)=>{assert.ok(assessment.signals[o.signal]);assert.equal(typeof optionId(i,j),"string");});
    }
  }
});
test("question 3 people-focused choices are distinct but score the same category", () => {
  const career = assessmentSuite[0];
  const answers=career.questions.map((_,i)=>optionId(i,0));
  const first=optionId(2,1),second=optionId(2,5);
  assert.notEqual(first,second);
  assert.equal(career.questions[2].options[1].label,"You explain things really clearly");
  answers[2]=first;const firstScore=scoreAnswers(career,answers);
  answers[2]=second;assert.deepEqual(scoreAnswers(career,answers),firstScore);
  answers[2]="social";assert.equal(scoreAnswers(career,answers),null);
  answers[2]=optionId(20,1);assert.equal(scoreAnswers(career,answers),null);
  assert.equal(scoreAnswers(career,answers.slice(1)),null);
});
test("Hatchling includes subjects and Grade 11 does not need subject choice for completion", () => {
  assert.equal(canTakeAssessment("start","subjects"),true);
  assert.equal(canTakeAssessment("free","subjects"),false);
  assert.equal(canTakeAssessment("start","eq"),false);
  assert.equal(subjectChoiceOptional({lifeStage:"school",grade:"11"}),true);
  assert.equal(subjectChoiceOptional({lifeStage:"school",grade:"9"}),false);
  const legacy={id:"career",total:16,completedAt:"2026-09-01T12:00:00Z",answers:[],scores:[]};
  assert.deepEqual(assessmentProgress(assessmentSuite,[legacy],"start",true),{completed:1,total:1});
  assert.deepEqual(assessmentProgress(assessmentSuite,[legacy],"start",false),{completed:1,total:2});
  assert.deepEqual(assessmentProgress(assessmentSuite,[legacy],"full",true),{completed:1,total:9});
});
function schoolForm() {
  const f=new FormData();Object.entries({displayName:"Test learner",lifeStage:"school",grade:"11",subjects:"Mathematics",marks:"",province:"Gauteng",mobility:"unsure",goal:"Explore careers",consent:"on",birthYear:String(new Date().getFullYear()-17)}).forEach(([k,v])=>f.set(k,v));return f;
}
test("birth year, grade and guardian consent are validated on the server", () => {
  const f=schoolForm();assert.equal(profileFromForm(f).success,false);
  f.set("guardianConsent","on");f.set("guardianName","Test Parent");f.set("guardianRelationship","parent");
  const result=profileFromForm(f);assert.equal(result.success,true);
  if(result.success){assert.equal(result.data.birthYear,new Date().getFullYear()-17);assert.equal(result.data.guardianConsent?.version,"2026-09-18");}
  f.set("grade","");assert.equal(profileFromForm(f).success,false);f.set("grade","11");
  f.delete("birthYear");assert.equal(profileFromForm(f).success,false);
  // Existing saved profiles remain readable until the next edit.
  f.delete("guardianConsent");const old=Object.fromEntries(f);assert.equal(profileSchema.safeParse({...old,consent:true}).success,true);
});
test("year-only age boundary does not assume an 18th birthday has happened", () => {
  const f=schoolForm();f.set("birthYear",String(new Date().getFullYear()-18));
  assert.equal(profileFromForm(f).success,false);
  f.set("already18","on");assert.equal(profileFromForm(f).success,true);
});
test("learner signup requires the adult's specific guardian consent", () => {
  const input={mode:"signup",email:"parent@example.com",password:"a-test-password-123",adult:"on",privacy:"on",accountFor:"learner"};
  assert.equal(accountInput.safeParse(input).success,false);
  assert.equal(accountInput.safeParse({...input,guardianName:"Test Parent",guardianRelationship:"parent",guardianConsent:"on"}).success,true);
  assert.equal(accountInput.safeParse({...input,accountFor:"self"}).success,true);
});
test("56 unique careers include source-linked trades and creative roles", () => {
  assert.equal(careerCatalogue.length,56);
  assert.equal(new Set(careerCatalogue.map(c=>c.id)).size,56);
  assert.ok(careerCatalogue.find(c=>c.id==="welder")?.sourceUrl);
  assert.ok(careerCatalogue.find(c=>c.id==="animator")?.sourceUrl);
});
