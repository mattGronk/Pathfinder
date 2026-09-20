"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CareerProfile } from "@/lib/catalogue";

const PAGE_SIZE = 9;

export function HomeCareerLibrary({ careers, premium }: { careers: CareerProfile[]; premium: boolean }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleCareers = careers.slice(0, visibleCount);
  const hasMore = visibleCareers.length < careers.length;

  return (
    <section id="careers" className="signal-section">
      <div className="section-lead">
        <span>CAREER LIBRARY</span>
        <h2>Explore a career that interests you.</h2>
        <p>Open the library to browse {premium ? "your complete collection" : "a public sample"}, nine careers at a time.</p>
      </div>
      <details className="home-career-dropdown">
        <summary onClick={() => setVisibleCount(PAGE_SIZE)}>
          <span>Browse careers <span className="home-career-count">{careers.length} {premium ? "careers" : "sample careers"}</span></span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="home-career-content">
          <div id="homepage-career-list" className="signal-card-grid">
            {visibleCareers.map((career, index) => (
              <article className="signal-career" key={career.id}>
                <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
                <p>{career.field}</p>
                <h3>{career.title}</h3>
                <p>{career.summary}</p>
                <dl>
                  <div><dt>Indicative SA range</dt><dd>{career.salary}</dd></div>
                  <div><dt>Demand</dt><dd>{career.demand}</dd></div>
                </dl>
                <div className="tag-row">{career.subjects.slice(0, premium ? career.subjects.length : 2).map(subject => <span key={subject}>{subject}</span>)}</div>
                {premium && (
                  <details className="career-depth">
                    <summary>View full profile</summary>
                    <h4>Qualification routes</h4><p>{career.qualifications.join(" · ")}</p>
                    <h4>Core skills</h4><p>{career.skills.join(" · ")}</p>
                    <h4>Typical day</h4><p>{career.day}</p>
                    <h4>Example employers</h4><p>{career.employers.join(" · ")}</p>
                    <h4>Outlook</h4><p>{career.outlook}</p>
                    {career.sourceUrl && <a href={career.sourceUrl} target="_blank" rel="noreferrer">Occupational duties: O*NET (US reference)</a>}
                  </details>
                )}
              </article>
            ))}
          </div>
          <div className="home-career-pagination">
            <p role="status" aria-live="polite">Showing {visibleCareers.length} of {careers.length} careers</p>
            {hasMore && <Button type="button" aria-controls="homepage-career-list" onClick={() => setVisibleCount(count => Math.min(count + PAGE_SIZE, careers.length))}>Load more <ChevronDown aria-hidden="true" /></Button>}
          </div>
          {!premium && (
            <div className="locked-library">
              <LockKeyhole aria-hidden="true" />
              <div><b>Explore the complete career library with Trailblazer.</b><p>Unlock qualification routes, skills, employers and deeper career profiles.</p></div>
              <a href="/upgrade">Unlock Trailblazer for R699 <ArrowRight aria-hidden="true" /></a>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
