"use client";

import { useId, useMemo } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { responseChartData, type ResponseSignal } from "@/lib/chart-data";

export default function ResponseChart({ signals, total, label = "Your response pattern" }: {
  signals: ResponseSignal[]; total: number; label?: string;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const data = useMemo(() => responseChartData(signals, total), [signals, total]);
  if (!data.length) return <p className="path-chart-empty">No response pattern is available yet. Complete an assessment to see your signals.</p>;
  return <MotionConfig reducedMotion="user">
    <figure className="path-chart response-chart" aria-labelledby={`${id}-caption`}>
      <figcaption id={`${id}-caption`} className="response-chart-caption"><span>{label}</span><b>{total} responses</b></figcaption>
      <div className="response-chart-plot" aria-hidden="true">
        <BarChart data={data} xDataKey="rank" aspectRatio="auto" className="response-chart-canvas"
          margin={{ top: 20, right: 12, bottom: 34, left: 12 }} barGap={0.45}
          animationDuration={reduceMotion ? 0 : 650} enterTransition={{ type: "tween", duration: reduceMotion ? 0 : 0.65 }}>
          <Grid horizontal stroke="var(--chart-grid)" strokeDasharray="3 5" numTicksRows={4}/>
          <Bar dataKey="responses" fill="var(--maroon)" lineCap={5} animate={!reduceMotion} staggerDelay={reduceMotion ? 0 : 0.06}/>
          <BarXAxis showAllLabels/>
          <ChartTooltip showDatePill={false} showDots={false} showCrosshair={false} damping={reduceMotion ? 0 : 20}
            content={({ point }) => <div className="response-tooltip"><b>{String(point.label)}</b><span>{String(point.responses)} of {total} responses</span></div>}/>
        </BarChart>
      </div>
      <table className="response-chart-values">
        <caption className="sr-only">{label}: exact response counts</caption>
        <thead className="sr-only"><tr><th scope="col">Signal</th><th scope="col">Responses</th></tr></thead>
        <tbody>{data.map(item => <tr key={item.key}><th scope="row"><span aria-hidden="true" className="chart-rank">{item.rank}</span>{item.label}</th><td><b>{item.responses}</b><span> / {total}</span></td></tr>)}</tbody>
      </table>
      <p className="response-chart-note">Frequency in your answers, not an ability score or a career-match percentage.</p>
    </figure>
  </MotionConfig>;
}
