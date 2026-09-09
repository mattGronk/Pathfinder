"use client";

import { useMemo, useState } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { RingChart } from "@/components/charts/ring-chart";
import { Ring } from "@/components/charts/ring";

export default function ProgressRings({ completed, total, tasks }: { completed: number; total: number; tasks: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const enterTransition = useMemo(() => ({ type: "tween" as const, duration: reduceMotion ? 0 : 0.7 }), [reduceMotion]);
  const data = useMemo(() => [
    { label: "Assessments", value: completed, maxValue: total, color: "var(--maroon)" },
    { label: "Next steps", value: tasks, maxValue: 4, color: "var(--navy)" },
  ], [completed, total, tasks]);
  const current = data[hovered ?? 0];
  return <MotionConfig reducedMotion="user"><section className="path-chart progress-summary" aria-label="Your progress">
    <div className="progress-rings-visual" aria-hidden="true">
      <RingChart size={184} data={data} baseInnerRadius={52} strokeWidth={10} ringGap={7}
        startAngle={0} endAngle={Math.PI * 2} hoveredIndex={hovered} onHoverChange={setHovered}
        enterStaggerScale={reduceMotion ? 0 : 0.65} enterTransition={enterTransition}>
        {data.map((item, index) => <Ring key={item.label} index={index} animate={!reduceMotion} showGlow={false}/>)}
      </RingChart>
      <div className="progress-rings-center"><b>{current.value}<small>/{current.maxValue}</small></b><span>{current.label}</span></div>
    </div>
    <div className="progress-summary-copy"><p className="eyebrow">YOUR MOMENTUM</p><h2>Small steps. A clearer direction.</h2>
      <div className="progress-ring-legend">{data.map((item, index) => <button type="button" key={item.label}
        onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onClick={() => setHovered(index)}
        aria-label={`${item.label}: ${item.value} of ${item.maxValue} completed`}>
        <i style={{ background: item.color }}/><span>{item.label}</span><b>{item.value}<small> / {item.maxValue}</small></b>
      </button>)}</div>
    </div>
    <div className="progress-report-stat"><b>{completed ? 3 : 0}</b><span>Report formats ready</span><small>For you, your parent and your school</small></div>
  </section></MotionConfig>;
}
