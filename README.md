# Jive Translator

A static Next.js app that translates standard English into period-inspired Jive with Gemini.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL, paste a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey), and enter text to translate.

The key is held only in the page's React state and sent directly to the Gemini API. It is not stored in cookies, browser storage, or the repository. Restrict the key to the Gemini API and do not commit it.

## Deploy

Pushes to `main` are built as a static export and deployed by the included GitHub Pages workflow.
