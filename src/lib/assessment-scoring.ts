import type { SuiteAssessment } from "./assessment-suite";

export function optionId(questionIndex: number, optionIndex: number) {
  return `q${questionIndex + 1}-o${optionIndex + 1}`;
}

export function scoreAnswers(assessment: SuiteAssessment, answers: string[]) {
  if (answers.length !== assessment.questions.length) return null;
  const selected = answers.map((answer, i) => assessment.questions[i].options.find((_, j) => optionId(i, j) === answer));
  if (selected.some(option => !option)) return null;
  return Object.entries(assessment.signals).map(([key, label]) => ({key, label, count: selected.filter(option => option?.signal === key).length})).sort((a,b) => b.count-a.count);
}
