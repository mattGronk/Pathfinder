"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronRight, GraduationCap, LockKeyhole, ShieldCheck, Sparkles, Target } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Reggie } from "@/components/reggie";
import type { CareerProfile, UniversityProfile } from "@/lib/catalogue";
import { UniversityLogo } from "@/components/university-logo";
import { AudienceCards } from "@/components/audience";
import { HomeCareerLibrary } from "@/components/home-career-library";

const PAYSTACK_URL = "/upgrade";

export default function PathfinderApp({ firstName, signedIn, premium = false, careers, universities }: { firstName: string; careers: CareerProfile[]; universities: UniversityProfile[]; initialLifeStage?: "school" | "student" | "working"; profileSaved: boolean; assessmentProgress: { answered: number; completed: boolean } | null; signedIn: boolean; premium?: boolean }) {
  const reduceMotion = useReducedMotion();
  const sampleUniversities = universities;
  return <main className="signal-site">
    <header className="signal-nav"><Link href="/" className="signal-logo"><Image src="/pathfinder-logo.png" width={44} height={44} alt="Pathfinder SA compass logo" priority /><span>Pathfinder <b>SA</b></span></Link><nav aria-label="Main navigation"><a href="#who-its-for">Who it’s for</a><a href="#careers">Careers</a><Link href="/assessments">Assessments</Link><a href="#universities">Universities</a><a href="#pricing">Pricing</a><Link href="/demo">Product demo</Link></nav><div><Link className="nav-text" href={signedIn ? "/dashboard" : "/account"}>{signedIn ? "Dashboard" : "Sign in"}</Link><Button asChild><Link href="/assessments">Find your path <ArrowRight /></Link></Button></div></header>

    <section className="signal-hero"><div><span className="signal-kicker"><Sparkles /> Career guidance built for South Africa</span><h1>Find the path that fits <em>your life.</em></h1><p>Take focused assessments, compare subject choices and explore realistic career and university routes—with clear reasons behind every recommendation.</p><div className="hero-actions"><Button asChild size="lg"><Link href={signedIn ? "/assessments" : "/account?next=/assessments"}>Start the free sample <ArrowRight /></Link></Button><Link className="demo-link" href="/demo">Explore the product demo <ChevronRight /></Link></div><div className="hero-proof"><span><Check /> No AI chat</span><span><Check /> South African pathways</span><span><Check /> Pay once</span></div></div><motion.div className="signal-preview" initial={reduceMotion ? false : {opacity:0,y:20}} animate={{opacity:1,y:0}}><div className="preview-top"><span>YOUR PATH SNAPSHOT</span><b>Sample</b></div><h2>Hello, {firstName}.</h2><p>Your strongest signals today</p>{[["Analytical thinking",91],["Practical problem solving",84],["People & communication",78]].map(([label,value]) => <div className="signal-bar" key={String(label)}><span>{label}</span><i><b style={{width:`${value}%`}} /></i><strong>{value}</strong></div>)}<Link href="/assessments">Take the full assessment <ArrowRight /></Link></motion.div><Reggie className="hero-reggie" size={150} message="Unsure is a perfectly good place to start." /></section>

    <section className="trust-strip"><span><Target /> 10 focused assessments</span><span><BookOpen /> Subject-choice guidance</span><span><GraduationCap /> 16 SA institutions</span><span><ShieldCheck /> Private, secure accounts</span></section>

    <AudienceCards />
    <HomeCareerLibrary careers={careers} premium={premium} />

    <section id="universities" className="signal-section porcelain-block"><div className="section-lead"><span>UNIVERSITY EXPLORER</span><h2>Compare routes, costs and strengths.</h2><p>{premium ? `Your Trailblazer access includes all ${16} institutions, programme strengths and official source links.` : "The public sample introduces four institutions. Trailblazer opens the complete searchable comparison with programme notes and official source links."}</p></div><div className="university-sample">{sampleUniversities.map(uni=><article key={uni.id}><UniversityLogo university={uni} /><div><small>{uni.type} · {uni.location}</small><h3>{uni.name}</h3><p>{uni.focus}</p>{premium&&<p className="uni-depth"><b>Fees:</b> {uni.fees} · <a href={uni.url} target="_blank" rel="noreferrer">Official website</a></p>}</div></article>)}</div>{!premium&&<div className="locked-library"><LockKeyhole /><div><b>Unlock all {16} institution profiles.</b><p>Compare university and university-of-technology routes, fees and official programme links.</p></div><a href={PAYSTACK_URL}>Get Trailblazer <ArrowRight /></a></div>}</section>

    <section id="pricing" className="signal-section pricing-new"><div className="section-lead"><span>ONCE-OFF PRICING</span><h2>Choose how far Reggie guides you.</h2><p>Two clear Pathfinder packages with no subscription and no AI chat.</p></div><div className="price-cards"><article><Reggie variant="hatchling" size={150}/><p>HATCHLING</p><h3>R249 <small>once-off</small></h3><ul><li><Check /> Career direction + subject choice</li><li><Check /> Three explained matches</li><li><Check /> Subject and study shortlist</li><li><Check /> Saved results and audience reports</li><li><Check /> Three editable CV templates</li></ul><Button asChild variant="outline"><Link href="/upgrade?tier=start">Choose Hatchling</Link></Button></article><article className="price-featured"><span>BEST VALUE</span><Reggie variant="trailblazer" size={145}/><p>TRAILBLAZER</p><h3>R699 <small>once-off</small></h3><ul><li><Check /> All 10 assessments · 30 questions each</li><li><Check /> Complete career library and deep profiles</li><li><Check /> Complete university comparison</li><li><Check /> Leadership, EQ and learning insights</li><li><Check /> Student, parent and school reports</li><li><Check /> Three editable CV templates</li></ul><Button asChild><a href={PAYSTACK_URL}>Become a Trailblazer <ArrowRight /></a></Button></article></div></section>

    <section className="signal-cta"><div><span>YOUR NEXT STEP</span><h2>Give your next step 12–15 minutes.</h2><p>Use the public sample first. Pay only when the deeper pathway is useful to you.</p></div><Button asChild size="lg"><Link href="/assessments">Explore assessments <ArrowRight /></Link></Button></section>
    <footer className="signal-footer"><Link href="/" className="signal-logo"><Image src="/pathfinder-logo.png" width={42} height={42} alt="Pathfinder SA compass logo" /><span>Pathfinder <b>SA</b></span></Link><p>Career guidance for South Africa. Guidance, not guarantees.</p><nav><Link href="/privacy">Privacy</Link><Link href="/terms">Terms & conditions</Link><a href="mailto:pathfinderzar@gmail.com">pathfinderzar@gmail.com</a></nav></footer>
  </main>;
}
