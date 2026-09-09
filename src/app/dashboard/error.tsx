"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="upgrade-page"><h1>Your workspace couldn’t load.</h1><p>Your saved work has not been changed. Please try again.</p><button className="workspace-button" onClick={reset}>Try again</button></main>}
