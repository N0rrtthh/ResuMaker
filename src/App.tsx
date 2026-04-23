import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import './App.css'

type Experience = {
  id: number
  role: string
  company: string
  period: string
  details: string
}

type Education = {
  id: number
  degree: string
  school: string
  period: string
}

type Project = {
  id: number
  name: string
  tech: string
  period: string
  link: string
  details: string
}

type ResumeData = {
  fullName: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  summary: string
  skills: string
  accentColor: string
  experiences: Experience[]
  education: Education[]
  projects: Project[]
}

type SectionVisibility = {
  summary: boolean
  experience: boolean
  projects: boolean
  education: boolean
  skills: boolean
}

type AtsCheck = {
  label: string
  pass: boolean
}

type ColorMode = 'light' | 'dark'

const STORAGE_KEY = 'resumaker-draft-v3'
const COLOR_MODE_STORAGE_KEY = 'resumaker-color-mode-v1'

const ACTION_VERBS = ['Led', 'Improved', 'Designed', 'Delivered', 'Optimized', 'Built']

const TITLE_PRESETS = [
  'Product Designer',
  'Software Engineer',
  'Frontend Developer',
  'UI/UX Designer',
  'Data Analyst',
  'Project Manager',
]

const SECTION_LABELS: Record<keyof SectionVisibility, string> = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
}

const INITIAL_SECTION_VISIBILITY: SectionVisibility = {
  summary: true,
  experience: true,
  projects: true,
  education: true,
  skills: true,
}

const INITIAL_DATA: ResumeData = {
  fullName: 'Alex Morgan',
  title: 'Product Designer',
  email: 'alex.morgan@email.com',
  phone: '+1 (555) 123-7890',
  location: 'San Francisco, CA',
  website: 'alexmorgan.design',
  linkedin: 'linkedin.com/in/alexmorgan',
  summary:
    'User-focused designer with 5+ years of experience building accessible web products. I turn complex flows into simple interfaces that users enjoy.',
  skills: 'UI Design, UX Research, Figma, Prototyping, Design Systems, Accessibility, React',
  accentColor: '#3b82f6',
  experiences: [
    {
      id: 1,
      role: 'Senior Product Designer',
      company: 'Northstar Labs',
      period: '2022 - Present',
      details:
        'Led redesign of onboarding, improving activation by 31%. Collaborated with PM and engineering to ship a reusable design system.',
    },
    {
      id: 2,
      role: 'UX Designer',
      company: 'Pixel Foundry',
      period: '2019 - 2022',
      details:
        'Built responsive flows for B2B dashboards and ran usability sessions that reduced support tickets by 24%.',
    },
  ],
  education: [
    {
      id: 1,
      degree: 'B.S. in Human-Computer Interaction',
      school: 'University of Washington',
      period: '2015 - 2019',
    },
  ],
  projects: [
    {
      id: 1,
      name: 'Portfolio Redesign',
      tech: 'React, TypeScript, Figma',
      period: '2025',
      link: 'alexmorgan.design/work',
      details: 'Designed and launched a portfolio refresh that increased recruiter replies by 40%.',
    },
  ],
}

const nextId = <T extends { id: number }>(items: T[]) =>
  items.reduce((max, item) => Math.max(max, item.id), 0) + 1

const normalizeResumeData = (input: Partial<ResumeData>): ResumeData => ({
  ...INITIAL_DATA,
  ...input,
  experiences: input.experiences ?? INITIAL_DATA.experiences,
  education: input.education ?? INITIAL_DATA.education,
  projects: input.projects ?? INITIAL_DATA.projects,
})

const applyImportedPayload = (
  payload: unknown,
): { resume: ResumeData; sectionVisibility?: Partial<SectionVisibility> } | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const data = payload as Record<string, unknown>
  const candidateResume =
    data.resume && typeof data.resume === 'object'
      ? (data.resume as Partial<ResumeData>)
      : (data as Partial<ResumeData>)

  const candidateVisibility =
    data.sectionVisibility && typeof data.sectionVisibility === 'object'
      ? (data.sectionVisibility as Partial<SectionVisibility>)
      : undefined

  return {
    resume: normalizeResumeData(candidateResume),
    sectionVisibility: candidateVisibility,
  }
}

const normalizeUrl = (value: string) => {
  if (!value.trim()) {
    return ''
  }
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

let cachedInitialDraft: {
  resume: ResumeData
  sectionVisibility: SectionVisibility
} | null = null

const readInitialDraft = (): {
  resume: ResumeData
  sectionVisibility: SectionVisibility
} => {
  if (cachedInitialDraft) {
    return cachedInitialDraft
  }

  if (typeof window === 'undefined') {
    cachedInitialDraft = {
      resume: INITIAL_DATA,
      sectionVisibility: INITIAL_SECTION_VISIBILITY,
    }
    return cachedInitialDraft
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      cachedInitialDraft = {
        resume: INITIAL_DATA,
        sectionVisibility: INITIAL_SECTION_VISIBILITY,
      }
      return cachedInitialDraft
    }

    const imported = applyImportedPayload(JSON.parse(saved) as unknown)
    if (!imported) {
      cachedInitialDraft = {
        resume: INITIAL_DATA,
        sectionVisibility: INITIAL_SECTION_VISIBILITY,
      }
      return cachedInitialDraft
    }

    cachedInitialDraft = {
      resume: imported.resume,
      sectionVisibility: {
        ...INITIAL_SECTION_VISIBILITY,
        ...(imported.sectionVisibility ?? {}),
      },
    }
    return cachedInitialDraft
  } catch {
    cachedInitialDraft = {
      resume: INITIAL_DATA,
      sectionVisibility: INITIAL_SECTION_VISIBILITY,
    }
    return cachedInitialDraft
  }
}

const readInitialColorMode = (): ColorMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [resume, setResume] = useState<ResumeData>(() => readInitialDraft().resume)
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(
    () => readInitialDraft().sectionVisibility,
  )
  const [colorMode, setColorMode] = useState<ColorMode>(() => readInitialColorMode())
  const [nextExperienceId, setNextExperienceId] = useState(() =>
    nextId(readInitialDraft().resume.experiences),
  )
  const [nextEducationId, setNextEducationId] = useState(() =>
    nextId(readInitialDraft().resume.education),
  )
  const [nextProjectId, setNextProjectId] = useState(() =>
    nextId(readInitialDraft().resume.projects),
  )
  const [statusMessage, setStatusMessage] = useState('')

  const importInputRef = useRef<HTMLInputElement>(null)

  const parsedSkills = useMemo(
    () =>
      resume.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    [resume.skills],
  )

  const filledExperiences = useMemo(
    () =>
      resume.experiences.filter((exp) => exp.role || exp.company || exp.period || exp.details),
    [resume.experiences],
  )

  const filledEducation = useMemo(
    () => resume.education.filter((item) => item.degree || item.school || item.period),
    [resume.education],
  )

  const filledProjects = useMemo(
    () => resume.projects.filter((project) => project.name || project.tech || project.details),
    [resume.projects],
  )

  const atsChecks = useMemo<AtsCheck[]>(() => {
    const hasImpactNumbers = filledExperiences.some((exp) => /\d/.test(exp.details))

    return [
      {
        label: 'Has full name and job title',
        pass: Boolean(resume.fullName.trim() && resume.title.trim()),
      },
      {
        label: 'Contact details complete',
        pass: Boolean(
          resume.email.trim() && resume.phone.trim() && resume.location.trim(),
        ),
      },
      {
        label: 'Summary is detailed',
        pass: resume.summary.trim().length >= 80,
      },
      {
        label: 'At least 5 skills listed',
        pass: parsedSkills.length >= 5,
      },
      {
        label: 'Includes experience section',
        pass: filledExperiences.length >= 1,
      },
      {
        label: 'Experience includes measurable impact',
        pass: hasImpactNumbers,
      },
      {
        label: 'Includes projects or portfolio links',
        pass:
          filledProjects.length >= 1 ||
          Boolean(resume.website.trim() || resume.linkedin.trim()),
      },
      {
        label: 'Includes education section',
        pass: filledEducation.length >= 1,
      },
    ]
  }, [filledEducation.length, filledExperiences, filledProjects.length, parsedSkills.length, resume])

  const atsScore = useMemo(() => {
    const passingChecks = atsChecks.filter((check) => check.pass).length
    return Math.round((passingChecks / atsChecks.length) * 100)
  }, [atsChecks])

  const scoreClass = atsScore >= 85 ? 'score-high' : atsScore >= 65 ? 'score-mid' : 'score-low'

  const flashStatus = (message: string) => {
    setStatusMessage(message)
  }

  const syncIds = (data: ResumeData) => {
    setNextExperienceId(nextId(data.experiences))
    setNextEducationId(nextId(data.education))
    setNextProjectId(nextId(data.projects))
  }

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          resume,
          sectionVisibility,
        }),
      )
    } catch {
      // If storage fails (quota/private mode), app keeps working without autosave.
    }
  }, [resume, sectionVisibility])

  useEffect(() => {
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode)
    } catch {
      // Ignore storage errors to keep editing flow uninterrupted.
    }
  }, [colorMode])

  useEffect(() => {
    if (!statusMessage) {
      return
    }

    const timer = setTimeout(() => {
      setStatusMessage('')
    }, 2800)

    return () => clearTimeout(timer)
  }, [statusMessage])

  const updateField = <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => {
    setResume((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSection = (section: keyof SectionVisibility) => {
    setSectionVisibility((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const updateExperience = (id: number, field: keyof Experience, value: string) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    }))
  }

  const addExperience = () => {
    setResume((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        { id: nextExperienceId, role: '', company: '', period: '', details: '' },
      ],
    }))
    setNextExperienceId((id) => id + 1)
  }

  const removeExperience = (id: number) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }))
  }

  const applyActionVerb = (id: number, verb: string) => {
    setResume((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) => {
        if (exp.id !== id) {
          return exp
        }

        if (!exp.details.trim()) {
          return { ...exp, details: `${verb} [describe the achievement and add numbers]` }
        }

        if (exp.details.toLowerCase().startsWith(verb.toLowerCase())) {
          return exp
        }

        return { ...exp, details: `${verb} ${exp.details}` }
      }),
    }))
    flashStatus(`Added a ${verb} starter to this experience entry.`)
  }

  const updateEducation = (id: number, field: keyof Education, value: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [...prev.education, { id: nextEducationId, degree: '', school: '', period: '' }],
    }))
    setNextEducationId((id) => id + 1)
  }

  const removeEducation = (id: number) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((item) => item.id !== id),
    }))
  }

  const updateProject = (id: number, field: keyof Project, value: string) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === id ? { ...project, [field]: value } : project,
      ),
    }))
  }

  const addProject = () => {
    setResume((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { id: nextProjectId, name: '', tech: '', period: '', link: '', details: '' },
      ],
    }))
    setNextProjectId((id) => id + 1)
  }

  const removeProject = (id: number) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.filter((project) => project.id !== id),
    }))
  }

  const resetTemplate = () => {
    setResume(INITIAL_DATA)
    setSectionVisibility(INITIAL_SECTION_VISIBILITY)
    setNextExperienceId(3)
    setNextEducationId(2)
    setNextProjectId(2)
    flashStatus('Template reset. You can start fresh now.')
  }

  const generateSummary = () => {
    const topSkills = parsedSkills.slice(0, 4).join(', ')
    const recentExperience = filledExperiences[0]
    const projectsCount = filledProjects.length

    const generated = [
      `${resume.title || 'Professional'} focused on delivering measurable outcomes through user-centered execution and strong collaboration.`,
      topSkills
        ? `Core strengths include ${topSkills}.`
        : 'Comfortable working across design, communication, and delivery workflows.',
      recentExperience
        ? `Most recently worked as ${recentExperience.role || 'a specialist'} at ${recentExperience.company || 'a growth team'}, where key initiatives improved product performance and user experience.`
        : 'Built practical solutions across multiple projects with a quality-first approach.',
      projectsCount
        ? `Completed ${projectsCount} recent project${projectsCount > 1 ? 's' : ''} with clear business impact.`
        : 'Consistently translates business goals into clear, actionable deliverables.',
    ].join(' ')

    updateField('summary', generated)
    flashStatus('Summary generated from your profile data.')
  }

  const saveDraft = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          resume,
          sectionVisibility,
        }),
      )
      flashStatus('Draft saved locally in your browser.')
    } catch {
      flashStatus('Saving draft failed. Browser storage might be unavailable.')
    }
  }

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        flashStatus('No saved draft found in this browser.')
        return
      }

      const parsed = JSON.parse(saved) as unknown
      const imported = applyImportedPayload(parsed)
      if (!imported) {
        flashStatus('Saved draft format is invalid.')
        return
      }

      setResume(imported.resume)
      setSectionVisibility({
        ...INITIAL_SECTION_VISIBILITY,
        ...(imported.sectionVisibility ?? {}),
      })
      syncIds(imported.resume)
      flashStatus('Saved draft loaded successfully.')
    } catch {
      flashStatus('Could not load saved draft.')
    }
  }

  const exportJson = () => {
    const payload = {
      resume,
      sectionVisibility,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(resume.fullName || 'resume').replace(/\s+/g, '-').toLowerCase()}-data.json`
    anchor.click()
    URL.revokeObjectURL(url)

    flashStatus('Resume data exported as JSON.')
  }

  const triggerImport = () => {
    importInputRef.current?.click()
  }

  const handleImportJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      const imported = applyImportedPayload(parsed)
      if (!imported) {
        flashStatus('Import failed: invalid JSON structure.')
        return
      }

      setResume(imported.resume)
      setSectionVisibility({
        ...INITIAL_SECTION_VISIBILITY,
        ...(imported.sectionVisibility ?? {}),
      })
      syncIds(imported.resume)
      flashStatus('Resume data imported successfully.')
    } catch {
      flashStatus('Import failed. Please select a valid JSON file.')
    }
  }

  const createPlainTextResume = () => {
    const lines: string[] = []

    lines.push(resume.fullName || 'Your Name')
    lines.push(resume.title || 'Professional Title')
    lines.push(
      [resume.email, resume.phone, resume.location]
        .filter((item) => item.trim())
        .join(' | '),
    )

    if (resume.website.trim()) {
      lines.push(`Website: ${resume.website.trim()}`)
    }

    if (resume.linkedin.trim()) {
      lines.push(`LinkedIn: ${resume.linkedin.trim()}`)
    }

    lines.push('')

    if (sectionVisibility.summary) {
      lines.push('SUMMARY')
      lines.push(resume.summary.trim())
      lines.push('')
    }

    if (sectionVisibility.experience && filledExperiences.length) {
      lines.push('EXPERIENCE')
      filledExperiences.forEach((exp) => {
        lines.push(`${exp.role} - ${exp.company} (${exp.period})`)
        lines.push(exp.details)
        lines.push('')
      })
    }

    if (sectionVisibility.projects && filledProjects.length) {
      lines.push('PROJECTS')
      filledProjects.forEach((project) => {
        lines.push(`${project.name} (${project.period})`)
        lines.push(`Tech: ${project.tech}`)
        if (project.link.trim()) {
          lines.push(`Link: ${project.link}`)
        }
        lines.push(project.details)
        lines.push('')
      })
    }

    if (sectionVisibility.education && filledEducation.length) {
      lines.push('EDUCATION')
      filledEducation.forEach((item) => {
        lines.push(`${item.degree} - ${item.school} (${item.period})`)
      })
      lines.push('')
    }

    if (sectionVisibility.skills && parsedSkills.length) {
      lines.push('SKILLS')
      lines.push(parsedSkills.join(', '))
    }

    return lines.filter(Boolean).join('\n')
  }

  const copyPlainText = async () => {
    try {
      await navigator.clipboard.writeText(createPlainTextResume())
      flashStatus('Plain-text resume copied to clipboard.')
    } catch {
      flashStatus('Could not copy automatically. Try again in a secure browser context.')
    }
  }

  return (
    <div className={`page-shell theme-liquid mode-${colorMode}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient ambient-three" aria-hidden="true" />

      <header className="topbar">
        <div className="header-copy">
          <p className="tag">ResuMaker</p>
          <h1>Build your resume in minutes</h1>
          <p className="subtitle">
            Structured controls, better tooling, and real-time preview in a premium liquid-glass UI.
          </p>
        </div>
        <div className="topbar-actions">
          <div className="mode-switch" role="group" aria-label="Color mode">
            <button
              type="button"
              className={`mode-btn ${colorMode === 'light' ? 'active' : ''}`}
              onClick={() => setColorMode('light')}
              aria-pressed={colorMode === 'light'}
            >
              Light
            </button>
            <button
              type="button"
              className={`mode-btn ${colorMode === 'dark' ? 'active' : ''}`}
              onClick={() => setColorMode('dark')}
              aria-pressed={colorMode === 'dark'}
            >
              Dark
            </button>
          </div>

          <div className="header-actions" role="group" aria-label="Resume actions">
            <p className="sync-pill">Live Preview Active</p>
            <button type="button" className="secondary-btn" onClick={resetTemplate}>
              Reset Template
            </button>
            <button type="button" className="primary-btn" onClick={() => window.print()}>
              Print / Save PDF
            </button>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="editor-panel">
          <h2>Simple Controls</h2>
          <p className="panel-meta">Update your details and watch the preview refresh instantly.</p>

          <div className="overview-grid">
            <article className="ats-card">
              <div className="ats-head">
                <h3>Resume Quality Score</h3>
                <span className={`score-pill ${scoreClass}`}>{atsScore}%</span>
              </div>
              <ul className="ats-list">
                {atsChecks.map((check) => (
                  <li key={check.label}>
                    <span>{check.label}</span>
                    <strong className={check.pass ? 'check-pass' : 'check-fail'}>
                      {check.pass ? 'Good' : 'Needs Work'}
                    </strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className="toolkit-card">
              <h3>Builder Toolkit</h3>
              <p>Quick actions to generate, save, import, and export your resume content.</p>

              <div className="tools-row" role="group" aria-label="Productivity tools">
                <button type="button" className="tool-btn" onClick={generateSummary}>
                  Generate Summary
                </button>
                <button type="button" className="tool-btn" onClick={saveDraft}>
                  Save Draft
                </button>
                <button type="button" className="tool-btn" onClick={loadDraft}>
                  Load Draft
                </button>
                <button type="button" className="tool-btn" onClick={exportJson}>
                  Export JSON
                </button>
                <button type="button" className="tool-btn" onClick={triggerImport}>
                  Import JSON
                </button>
                <button type="button" className="tool-btn" onClick={copyPlainText}>
                  Copy Plain Text
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden-file"
                  onChange={handleImportJson}
                />
              </div>

              {statusMessage ? (
                <p className="status-note">{statusMessage}</p>
              ) : (
                <p className="status-note subtle">Autosave is enabled for this browser.</p>
              )}
            </article>
          </div>

          <article className="visibility-card">
            <h3>Section Layout</h3>
            <p>Toggle sections on or off based on the job you are applying for.</p>
            <div className="visibility-grid">
              {(Object.keys(SECTION_LABELS) as Array<keyof SectionVisibility>).map((section) => (
                <label className="visibility-chip" key={section}>
                  <input
                    type="checkbox"
                    checked={sectionVisibility[section]}
                    onChange={() => toggleSection(section)}
                  />
                  {SECTION_LABELS[section]}
                </label>
              ))}
            </div>
          </article>

          <div className="field-grid">
            <label>
              Full Name
              <input
                value={resume.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
              />
            </label>
            <label>
              Job Title
              <input
                value={resume.title}
                onChange={(event) => updateField('title', event.target.value)}
              />
            </label>
            <label>
              Email
              <input
                value={resume.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </label>
            <label>
              Phone
              <input
                value={resume.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </label>
            <label>
              Location
              <input
                value={resume.location}
                onChange={(event) => updateField('location', event.target.value)}
              />
            </label>
            <label>
              Accent Color
              <input
                type="color"
                value={resume.accentColor}
                onChange={(event) => updateField('accentColor', event.target.value)}
              />
            </label>
            <label>
              Portfolio Website
              <input
                value={resume.website}
                onChange={(event) => updateField('website', event.target.value)}
                placeholder="yourportfolio.com"
              />
            </label>
            <label>
              LinkedIn
              <input
                value={resume.linkedin}
                onChange={(event) => updateField('linkedin', event.target.value)}
                placeholder="linkedin.com/in/yourname"
              />
            </label>
          </div>

          <div className="title-presets">
            <p>Quick Title Buttons</p>
            <div className="title-preset-row">
              {TITLE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={`title-chip ${resume.title === preset ? 'active' : ''}`}
                  onClick={() => updateField('title', preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <label>
            Professional Summary
            <textarea
              rows={4}
              value={resume.summary}
              onChange={(event) => updateField('summary', event.target.value)}
            />
          </label>

          <label>
            Skills (comma separated)
            <textarea
              rows={3}
              value={resume.skills}
              onChange={(event) => updateField('skills', event.target.value)}
            />
          </label>

          <div className="section-head">
            <h3>Experience</h3>
            <button type="button" className="mini-btn" onClick={addExperience}>
              + Add
            </button>
          </div>

          {resume.experiences.map((exp) => (
            <article className="card" key={exp.id}>
              <div className="card-head">
                <strong>Entry {exp.id}</strong>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => removeExperience(exp.id)}
                  disabled={resume.experiences.length === 1}
                >
                  Remove
                </button>
              </div>
              <label>
                Role
                <input
                  value={exp.role}
                  onChange={(event) => updateExperience(exp.id, 'role', event.target.value)}
                />
              </label>
              <label>
                Company
                <input
                  value={exp.company}
                  onChange={(event) => updateExperience(exp.id, 'company', event.target.value)}
                />
              </label>
              <label>
                Period
                <input
                  value={exp.period}
                  onChange={(event) => updateExperience(exp.id, 'period', event.target.value)}
                />
              </label>
              <label>
                Details
                <textarea
                  rows={3}
                  value={exp.details}
                  onChange={(event) => updateExperience(exp.id, 'details', event.target.value)}
                />
              </label>
              <div className="verb-row">
                {ACTION_VERBS.map((verb) => (
                  <button
                    type="button"
                    key={`${exp.id}-${verb}`}
                    className="verb-btn"
                    onClick={() => applyActionVerb(exp.id, verb)}
                  >
                    {verb}
                  </button>
                ))}
              </div>
            </article>
          ))}

          <div className="section-head">
            <h3>Projects</h3>
            <button type="button" className="mini-btn" onClick={addProject}>
              + Add
            </button>
          </div>

          {resume.projects.map((project) => (
            <article className="card" key={project.id}>
              <div className="card-head">
                <strong>Entry {project.id}</strong>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => removeProject(project.id)}
                  disabled={resume.projects.length === 1}
                >
                  Remove
                </button>
              </div>
              <label>
                Project Name
                <input
                  value={project.name}
                  onChange={(event) => updateProject(project.id, 'name', event.target.value)}
                />
              </label>
              <label>
                Tech Stack
                <input
                  value={project.tech}
                  onChange={(event) => updateProject(project.id, 'tech', event.target.value)}
                />
              </label>
              <label>
                Period
                <input
                  value={project.period}
                  onChange={(event) => updateProject(project.id, 'period', event.target.value)}
                />
              </label>
              <label>
                Link
                <input
                  value={project.link}
                  onChange={(event) => updateProject(project.id, 'link', event.target.value)}
                  placeholder="project-link.com"
                />
              </label>
              <label>
                Details
                <textarea
                  rows={3}
                  value={project.details}
                  onChange={(event) => updateProject(project.id, 'details', event.target.value)}
                />
              </label>
            </article>
          ))}

          <div className="section-head">
            <h3>Education</h3>
            <button type="button" className="mini-btn" onClick={addEducation}>
              + Add
            </button>
          </div>

          {resume.education.map((item) => (
            <article className="card" key={item.id}>
              <div className="card-head">
                <strong>Entry {item.id}</strong>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => removeEducation(item.id)}
                  disabled={resume.education.length === 1}
                >
                  Remove
                </button>
              </div>
              <label>
                Degree
                <input
                  value={item.degree}
                  onChange={(event) => updateEducation(item.id, 'degree', event.target.value)}
                />
              </label>
              <label>
                School
                <input
                  value={item.school}
                  onChange={(event) => updateEducation(item.id, 'school', event.target.value)}
                />
              </label>
              <label>
                Period
                <input
                  value={item.period}
                  onChange={(event) => updateEducation(item.id, 'period', event.target.value)}
                />
              </label>
            </article>
          ))}
        </section>

        <section className="preview-panel">
          <h2>Live Preview</h2>
          <p className="panel-meta">Print-ready layout optimized for PDF export.</p>

          <article className="resume" style={{ ['--accent' as string]: resume.accentColor }}>
            <header className="resume-header">
              <h3>{resume.fullName || 'Your Name'}</h3>
              <p className="resume-title">{resume.title || 'Your Professional Title'}</p>
              <p className="resume-meta">
                {[resume.email, resume.phone, resume.location].filter(Boolean).join(' | ')}
              </p>

              <div className="resume-links">
                {resume.website.trim() ? (
                  <a href={normalizeUrl(resume.website)} target="_blank" rel="noreferrer">
                    Website
                  </a>
                ) : null}
                {resume.linkedin.trim() ? (
                  <a href={normalizeUrl(resume.linkedin)} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </header>

            {sectionVisibility.summary ? (
              <section>
                <h4>Summary</h4>
                <p>{resume.summary || 'Add your professional summary in the left panel.'}</p>
              </section>
            ) : null}

            {sectionVisibility.experience ? (
              <section>
                <h4>Experience</h4>
                {filledExperiences.length ? (
                  filledExperiences.map((exp) => (
                    <div className="resume-entry" key={exp.id}>
                      <div className="entry-head">
                        <strong>{exp.role || 'Role'}</strong>
                        <span>{exp.period || 'Period'}</span>
                      </div>
                      <p className="entry-sub">{exp.company || 'Company'}</p>
                      <p>{exp.details || 'Add impact-focused details for this role.'}</p>
                    </div>
                  ))
                ) : (
                  <p className="preview-empty">Add at least one experience entry.</p>
                )}
              </section>
            ) : null}

            {sectionVisibility.projects ? (
              <section>
                <h4>Projects</h4>
                {filledProjects.length ? (
                  filledProjects.map((project) => (
                    <div className="resume-entry" key={project.id}>
                      <div className="entry-head">
                        <strong>{project.name || 'Project name'}</strong>
                        <span>{project.period || 'Period'}</span>
                      </div>
                      <p className="entry-sub">{project.tech || 'Tech stack'}</p>
                      {project.link.trim() ? (
                        <p className="project-link">
                          <a href={normalizeUrl(project.link)} target="_blank" rel="noreferrer">
                            {project.link}
                          </a>
                        </p>
                      ) : null}
                      <p>{project.details || 'Describe the result and your contribution.'}</p>
                    </div>
                  ))
                ) : (
                  <p className="preview-empty">Add at least one project to strengthen your resume.</p>
                )}
              </section>
            ) : null}

            {sectionVisibility.education ? (
              <section>
                <h4>Education</h4>
                {filledEducation.length ? (
                  filledEducation.map((item) => (
                    <div className="resume-entry" key={item.id}>
                      <div className="entry-head">
                        <strong>{item.degree || 'Degree'}</strong>
                        <span>{item.period || 'Period'}</span>
                      </div>
                      <p className="entry-sub">{item.school || 'School'}</p>
                    </div>
                  ))
                ) : (
                  <p className="preview-empty">Add your education details.</p>
                )}
              </section>
            ) : null}

            {sectionVisibility.skills ? (
              <section>
                <h4>Skills</h4>
                {parsedSkills.length ? (
                  <ul className="skills-list">
                    {parsedSkills.map((skill, index) => (
                      <li key={`${skill}-${index}`}>{skill}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="preview-empty">Add skills separated by commas.</p>
                )}
              </section>
            ) : null}
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
