"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, KeyRound, Loader2, Music4, Sparkles } from "lucide-react";
import { translateToJive } from "@/lib/jiveTranslator";

const TEST_SENTENCES = [
  "Hello friend, what is going on?",
  "The boss wants to know if you are working.",
  "Please give me a break, everything is fine.",
  "He got dressed up and left the house to see the musician."
];

const DEBOUNCE_MS = 700;

export default function Home() {
  const [englishText, setEnglishText] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [jiveText, setJiveText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!englishText.trim()) {
      requestIdRef.current += 1;
      setJiveText("");
      setIsTranslating(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsTranslating(true);

    const timer = setTimeout(async () => {
      const result = await translateToJive(englishText, githubToken);
      // Ignore this response if a newer request has since superseded it
      if (requestIdRef.current === requestId) {
        setJiveText(result);
        setIsTranslating(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [englishText, githubToken]);

  const handleCopy = async () => {
    if (!jiveText) return;
    try {
      await navigator.clipboard.writeText(jiveText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — leave the button in its idle state
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-8">
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-sm text-amber-400">
          <Music4 className="h-4 w-4" />
          Est. 1977 &mdash; Strictly Kopasetic
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Jive <span className="text-amber-400">Translator</span>
        </h1>
        <p className="mt-3 text-zinc-400">
          Lay down your square English and watch it come back smooth, cat.
          <br />
          <span className="text-sm text-zinc-500">
            Powered by an AI model via GitHub Models &mdash; bring your own token.
          </span>
        </p>
      </header>

      <section className="mx-auto mb-8 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <label htmlFor="github-token" className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-400">
          <KeyRound className="h-4 w-4 text-amber-400" />
          GitHub Personal Access Token
        </label>
        <input
          id="github-token"
          type="password"
          autoComplete="off"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          placeholder="Paste a token scoped only for GitHub Models"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Kept in memory only for this page load &mdash; never saved to disk, cookies, or
          browser storage, and cleared on refresh. Use a fine-grained token scoped to
          the minimum permissions GitHub Models requires, not a broad classic PAT. See{" "}
          <a
            href="https://docs.github.com/en/github-models/quickstart"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-amber-400"
          >
            GitHub&apos;s Models quickstart
          </a>{" "}
          for current setup steps.
        </p>
      </section>

      <section className="grid flex-1 gap-6 lg:grid-cols-2">
        {/* English input */}
        <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Standard English
            </h2>
            <span className="text-xs text-zinc-600">{englishText.length} chars</span>
          </div>
          <textarea
            value={englishText}
            onChange={(e) => setEnglishText(e.target.value)}
            placeholder="Type something square, like &quot;Hello friend, what is going on?&quot;"
            className="min-h-[16rem] flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-lg leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Jive output */}
        <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Jive Talk
              {isTranslating && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />}
            </h2>
            <button
              onClick={handleCopy}
              disabled={!jiveText}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                copied
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : jiveText
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    : "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
          <div className="min-h-[16rem] flex-1 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-lg leading-relaxed text-amber-400">
            {jiveText || (
              <span className="text-zinc-600">
                Your jive translation shows up here, ya dig?
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-400">
          <Sparkles className="h-4 w-4 text-amber-400" />
          Try a test sentence
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEST_SENTENCES.map((sentence) => (
            <button
              key={sentence}
              onClick={() => setEnglishText(sentence)}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-amber-500/50 hover:bg-zinc-900 hover:text-amber-400"
            >
              &ldquo;{sentence}&rdquo;
            </button>
          ))}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-zinc-600">
        Built with Next.js static export &mdash; served straight off GitHub Pages, solid!
      </footer>
    </main>
  );
}
