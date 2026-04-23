# ResuMaker

A simplified and user-friendly resume maker website built with React + TypeScript + Vite.

## Features

- Clean two-panel layout: controls on the left, live resume preview on the right
- Full profile controls for personal info, links, summary, skills, experience, projects, and education
- Add/remove controls for multiple experience, project, and education entries
- Resume Quality Score (ATS-inspired checklist with actionable feedback)
- Structured control groups: quality overview, builder toolkit, and section layout toggles
- AI Resume Evaluation with optional OpenAI-powered review and local fallback
- One-click summary generator based on your entered data
- Action-verb helper buttons for stronger experience bullets
- Section visibility toggles to tailor resume output per job application
- Local draft save/load with browser persistence
- Import/export resume data as JSON
- Copy resume as plain text for fast pasting into job portals
- Quick title preset chips for faster role targeting
- Accent color picker to personalize the resume
- Light and dark mode toggle with saved preference
- OpenAI API key and model inputs for live AI review, stored locally in your browser
- Premium liquid-glass visual style inspired by modern Apple UI aesthetics
- Print-friendly export flow using browser print to save as PDF
- Mobile-responsive UI

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in terminal (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Tech stack

- React 19
- TypeScript
- Vite
