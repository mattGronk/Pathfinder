"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="admin-panel"><h2>We could not load this page.</h2><p role="alert">Check your connection and try again. No account information is shown while access cannot be verified.</p><button className="admin-button" onClick={reset}>Try again</button></section>; }
