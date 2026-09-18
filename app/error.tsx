'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="legal"><h1>Something didn’t load.</h1><p>Your next bite can wait a moment. Please try again.</p><button className="primary" onClick={reset}>Try again</button><a href="/">Back to discovery</a></main>; }
