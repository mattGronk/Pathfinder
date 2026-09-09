"use client";

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { dimensions, type Dimension } from "@/lib/assessment";

const chartConfig = {
  score: {
    label: "Interest signal",
    color: "#7b1e3a",
  },
} satisfies ChartConfig;

type InterestProfileChartProps = {
  scores: Record<Dimension, number | null>;
};

export default function InterestProfileChart({ scores }: InterestProfileChartProps) {
  const reduceMotion = useReducedMotion();
  const data = useMemo(
    () =>
      (Object.keys(dimensions) as Dimension[]).map((key) => ({
        dimension: dimensions[key],
        score: scores[key] ?? 0,
        known: scores[key] !== null,
      })),
    [scores],
  );

  return (
    <div className="interest-profile-visual">
      <div>
        <p className="interest-chart-kicker">YOUR CURRENT PATTERN</p>
        <h3>What seems to give you energy</h3>
        <p>
          The shape shows your answers across six interest areas. A shorter point can
          mean lower interest today or simply that there is not enough evidence yet.
        </p>
      </div>
      <ChartContainer
        config={chartConfig}
        className="interest-chart"
        initialDimension={{ width: 430, height: 320 }}
        role="img"
        aria-label="Radar chart showing the user's six interest signals on a scale from one to five"
      >
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid gridType="polygon" stroke="rgba(16, 38, 59, 0.16)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#526274", fontSize: 11, fontWeight: 650 }}
            tickLine={false}
          />
          <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="var(--color-score)"
            strokeWidth={2.5}
            fill="var(--color-score)"
            fillOpacity={0.18}
            dot={{ r: 4, fill: "#ffffff", stroke: "var(--color-score)", strokeWidth: 2 }}
            isAnimationActive={!reduceMotion}
            animationDuration={850}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  );
}


