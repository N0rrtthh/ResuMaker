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
  primaryTextColor: string
  secondaryTextColor: string
  template: ResumeTemplate
  experiences: Experience[]
  education: Education[]
  projects: Project[]
}

type ResumeTemplate = 'classic' | 'editorial' | 'compact'

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
type AiProvider = 'local' | 'openai' | 'ollama'
type EditorPanelSection = 'evaluation' | 'toolkit' | 'layout' | 'content'
type EditorPanelCollapsedState = Record<EditorPanelSection, boolean>

type AiInsightImpact = 'high' | 'medium' | 'low'

type AiInsight = {
  id: string
  title: string
  impact: AiInsightImpact
  pass: boolean
  feedback: string
}

type AiEvaluation = {
  score: number
  summary: string
  insights: AiInsight[]
}

type TransitionCapableDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>
  }
}

const STORAGE_KEY = 'resumaker-draft-v3'
const COLOR_MODE_STORAGE_KEY = 'resumaker-color-mode-v1'
const AI_API_KEY_STORAGE_KEY = 'resumaker-openai-api-key-v1'
const AI_MODEL_STORAGE_KEY = 'resumaker-openai-model-v1'
const AI_PROVIDER_STORAGE_KEY = 'resumaker-ai-provider-v1'
const OLLAMA_URL_STORAGE_KEY = 'resumaker-ollama-url-v1'
const EDITOR_SECTIONS_STORAGE_KEY = 'resumaker-editor-sections-v1'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_OLLAMA_MODEL = 'llama3.2:3b'
const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

const ACTION_VERBS = ['Led', 'Improved', 'Designed', 'Delivered', 'Optimized', 'Built']

const TITLE_PRESETS = [
  'Product Designer',
  'Software Engineer',
  'Frontend Developer',
  'UI/UX Designer',
  'Data Analyst',
  'Project Manager',
]

const TEMPLATE_PRESETS: Array<{
  id: ResumeTemplate
  label: string
  description: string
}> = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Clean paper layout with balanced spacing and crisp sections.',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Strong heading presence with a left accent rail for personality.',
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Tighter spacing for dense resumes with more content per page.',
  },
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

const INITIAL_EDITOR_SECTIONS: EditorPanelCollapsedState = {
  evaluation: false,
  toolkit: false,
  layout: false,
  content: false,
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
  primaryTextColor: '#1f2937',
  secondaryTextColor: '#4b5563',
  template: 'classic',
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

const readStoredValue = (key: string, fallback = '') => {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

const clampNumber = (value: unknown, fallback: number, minimum: number, maximum: number) => {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN

  if (!Number.isFinite(numericValue)) {
    return fallback
  }

  return Math.min(maximum, Math.max(minimum, numericValue))
}

const buildHeuristicAiEvaluation = (
  resume: ResumeData,
  filledExperiences: Experience[],
  filledProjects: Project[],
  parsedSkills: string[],
): AiEvaluation => {
  const summaryLength = resume.summary.trim().length
  const summaryQuality = summaryLength >= 90 && summaryLength <= 340
  const hasValidEmail = /^\S+@\S+\.\S+$/.test(resume.email.trim())
  const contactQuality = Boolean(
    resume.fullName.trim() &&
      resume.title.trim() &&
      hasValidEmail &&
      resume.phone.trim() &&
      resume.location.trim(),
  )

  const measurableExperienceCoverage = filledExperiences.length
    ? filledExperiences.filter((exp) => /\d/.test(exp.details)).length / filledExperiences.length
    : 0

  const actionVerbCoverage = filledExperiences.length
    ? filledExperiences.filter((exp) =>
        ACTION_VERBS.some((verb) => exp.details.trim().toLowerCase().startsWith(verb.toLowerCase())),
      ).length / filledExperiences.length
    : 0

  const projectProof = filledProjects.some(
    (project) =>
      project.name.trim().length > 0 &&
      project.tech.trim().length > 0 &&
      project.details.trim().length >= 50,
  )

  const titleKeywords = resume.title
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4)

  const searchableContent = [
    resume.summary,
    ...filledExperiences.map((exp) => `${exp.role} ${exp.details}`),
    ...filledProjects.map((project) => `${project.name} ${project.tech} ${project.details}`),
  ]
    .join(' ')
    .toLowerCase()

  const titleAlignment =
    titleKeywords.length === 0 ||
    titleKeywords.filter((keyword) => searchableContent.includes(keyword)).length /
      titleKeywords.length >=
      0.5

  const insights: AiInsight[] = [
    {
      id: 'contact',
      title: 'Contact and headline clarity',
      impact: 'high',
      pass: contactQuality,
      feedback: contactQuality
        ? 'Header looks professional and easy for recruiters to scan.'
        : 'Add a clear headline plus valid email, phone, and location in the contact section.',
    },
    {
      id: 'summary',
      title: 'Summary quality',
      impact: 'high',
      pass: summaryQuality,
      feedback: summaryQuality
        ? 'Summary length and density are in a strong range for hiring screens.'
        : 'Aim for a summary between 90 and 340 characters with a clear value statement.',
    },
    {
      id: 'impact',
      title: 'Quantified impact in experience',
      impact: 'high',
      pass: filledExperiences.length > 0 && measurableExperienceCoverage >= 0.6,
      feedback:
        filledExperiences.length > 0 && measurableExperienceCoverage >= 0.6
          ? 'Most experience entries include metrics, which boosts credibility.'
          : 'Add numbers or outcomes (%, $, time saved) to more experience entries.',
    },
    {
      id: 'verbs',
      title: 'Action-oriented writing',
      impact: 'medium',
      pass: filledExperiences.length > 0 && actionVerbCoverage >= 0.5,
      feedback:
        filledExperiences.length > 0 && actionVerbCoverage >= 0.5
          ? 'Strong use of action verbs across your work history.'
          : 'Start more bullets with action verbs like Led, Built, Improved, or Designed.',
    },
    {
      id: 'skills',
      title: 'Skill coverage',
      impact: 'medium',
      pass: parsedSkills.length >= 6,
      feedback:
        parsedSkills.length >= 6
          ? 'Skill section has enough depth for most ATS parsing.'
          : 'Add at least 6 relevant skills aligned to your target role.',
    },
    {
      id: 'projects',
      title: 'Project proof of work',
      impact: 'medium',
      pass: projectProof || filledExperiences.length >= 2,
      feedback:
        projectProof || filledExperiences.length >= 2
          ? 'Portfolio evidence is present through projects or strong experience history.'
          : 'Add one project with stack, scope, and measurable outcome to strengthen your profile.',
    },
    {
      id: 'alignment',
      title: 'Role keyword alignment',
      impact: 'low',
      pass: titleAlignment,
      feedback: titleAlignment
        ? 'Your resume language aligns with your target title keywords.'
        : 'Reuse important title keywords naturally in summary, experience, and project details.',
    },
    {
      id: 'links',
      title: 'Professional links',
      impact: 'low',
      pass: Boolean(resume.website.trim() || resume.linkedin.trim()),
      feedback:
        resume.website.trim() || resume.linkedin.trim()
          ? 'Professional links are present for quick verification.'
          : 'Add LinkedIn or a portfolio link to improve trust and visibility.',
    },
  ]

  const weightMap: Record<AiInsightImpact, number> = {
    high: 4,
    medium: 3,
    low: 2,
  }

  const maxScore = insights.reduce((total, insight) => total + weightMap[insight.impact], 0)
  const earnedScore = insights.reduce(
    (total, insight) => total + (insight.pass ? weightMap[insight.impact] : 0),
    0,
  )
  const score = Math.round((earnedScore / maxScore) * 100)

  let summary = 'Your resume is progressing well. Keep refining impact and role alignment.'
  if (score >= 88) {
    summary = 'Excellent profile quality. Your resume is highly competitive for recruiter review.'
  } else if (score >= 72) {
    summary = 'Good baseline. A few targeted improvements can raise interview conversion.'
  } else if (score >= 55) {
    summary = 'Moderate quality. Improve impact metrics and section depth for stronger ATS performance.'
  } else {
    summary = 'Early draft quality. Focus on core sections, measurable outcomes, and contact completeness.'
  }

  return {
    score,
    summary,
    insights,
  }
}

const normalizeAiEvaluation = (candidate: unknown, fallback: AiEvaluation): AiEvaluation => {
  if (!candidate || typeof candidate !== 'object') {
    return fallback
  }

  const data = candidate as Record<string, unknown>
  const rawInsights = Array.isArray(data.insights) ? data.insights : []

  const normalizedInsights = fallback.insights.map((template) => {
    const candidateInsight = rawInsights.find((item) => {
      if (!item || typeof item !== 'object') {
        return false
      }

      return (item as Record<string, unknown>).id === template.id
    }) as Record<string, unknown> | undefined

    if (!candidateInsight) {
      return template
    }

    const impact =
      candidateInsight.impact === 'high' ||
      candidateInsight.impact === 'medium' ||
      candidateInsight.impact === 'low'
        ? (candidateInsight.impact as AiInsightImpact)
        : template.impact
    const pass = typeof candidateInsight.pass === 'boolean' ? candidateInsight.pass : template.pass
    const title =
      typeof candidateInsight.title === 'string' && candidateInsight.title.trim()
        ? candidateInsight.title.trim()
        : template.title
    const feedback =
      typeof candidateInsight.feedback === 'string' && candidateInsight.feedback.trim()
        ? candidateInsight.feedback.trim()
        : template.feedback

    return {
      id: template.id,
      title,
      impact,
      pass,
      feedback,
    }
  })

  return {
    score: clampNumber(data.score, fallback.score, 0, 100),
    summary:
      typeof data.summary === 'string' && data.summary.trim()
        ? data.summary.trim()
        : fallback.summary,
    insights: normalizedInsights,
  }
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
  const [editorSections, setEditorSections] = useState<EditorPanelCollapsedState>(() => {
    if (typeof window === 'undefined') {
      return INITIAL_EDITOR_SECTIONS
    }

    try {
      const saved = localStorage.getItem(EDITOR_SECTIONS_STORAGE_KEY)
      if (!saved) {
        return INITIAL_EDITOR_SECTIONS
      }

      return { ...INITIAL_EDITOR_SECTIONS, ...(JSON.parse(saved) as Partial<EditorPanelCollapsedState>) }
    } catch {
      return INITIAL_EDITOR_SECTIONS
    }
  })
  const [colorMode, setColorMode] = useState<ColorMode>(() => readInitialColorMode())
  const [aiProvider, setAiProvider] = useState<AiProvider>(() => {
    if (typeof window === 'undefined') {
      return 'local'
    }

    const saved = localStorage.getItem(AI_PROVIDER_STORAGE_KEY)
    return saved === 'openai' || saved === 'ollama' ? saved : 'local'
  })
  const [aiApiKey, setAiApiKey] = useState(() => readStoredValue(AI_API_KEY_STORAGE_KEY))
  const [aiModel, setAiModel] = useState(() =>
    readStoredValue(AI_MODEL_STORAGE_KEY, DEFAULT_OPENAI_MODEL),
  )
  const [ollamaUrl, setOllamaUrl] = useState(() =>
    readStoredValue(OLLAMA_URL_STORAGE_KEY, DEFAULT_OLLAMA_URL),
  )
  const [aiReviewOverride, setAiReviewOverride] = useState<{
    fingerprint: string
    evaluation: AiEvaluation
  } | null>(null)
  const [aiReviewLoading, setAiReviewLoading] = useState(false)
  const [aiReviewMessage, setAiReviewMessage] = useState(
    'Local evaluation is active until you run an OpenAI review.',
  )
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
  const resumeFingerprint = useMemo(() => JSON.stringify(resume), [resume])

  const heuristicAiEvaluation = useMemo(
    () => buildHeuristicAiEvaluation(resume, filledExperiences, filledProjects, parsedSkills),
    [filledExperiences, filledProjects, parsedSkills, resume],
  )

  const activeAiReview =
    aiReviewOverride && aiReviewOverride.fingerprint === resumeFingerprint
      ? aiReviewOverride.evaluation
      : null

  const aiEvaluation = activeAiReview ?? heuristicAiEvaluation

  const aiScoreClass =
    aiEvaluation.score >= 85 ? 'score-high' : aiEvaluation.score >= 65 ? 'score-mid' : 'score-low'

  const flashStatus = (message: string) => {
    setStatusMessage(message)
  }

  const toggleEditorSection = (section: EditorPanelSection) => {
    setEditorSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const switchColorMode = (mode: ColorMode) => {
    if (mode === colorMode) {
      return
    }

    const applyMode = () => setColorMode(mode)
    const transitionDocument = document as TransitionCapableDocument

    try {
      const transition = transitionDocument.startViewTransition?.(() => {
        applyMode()
      })
      if (transition) {
        return
      }
    } catch {
      // Some browsers expose the API but fail in restricted contexts.
    }

    applyMode()
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
    try {
      localStorage.setItem(AI_PROVIDER_STORAGE_KEY, aiProvider)
    } catch {
      // Ignore storage errors to keep editing flow uninterrupted.
    }
  }, [aiProvider])

  useEffect(() => {
    try {
      localStorage.setItem(OLLAMA_URL_STORAGE_KEY, ollamaUrl)
    } catch {
      // Ignore storage errors to keep editing flow uninterrupted.
    }
  }, [ollamaUrl])

  useEffect(() => {
    try {
      localStorage.setItem(EDITOR_SECTIONS_STORAGE_KEY, JSON.stringify(editorSections))
    } catch {
      // Ignore storage errors to keep editing flow uninterrupted.
    }
  }, [editorSections])

  useEffect(() => {
    try {
      localStorage.setItem(AI_API_KEY_STORAGE_KEY, aiApiKey)
    } catch {
      // Ignore storage errors to keep editing flow uninterrupted.
    }
  }, [aiApiKey])

  useEffect(() => {
    try {
      localStorage.setItem(AI_MODEL_STORAGE_KEY, aiModel)
    } catch {
      // Ignore storage errors to keep editing flow uninterrupted.
    }
  }, [aiModel])

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

  const runAiReview = async () => {
    const reviewPayload = {
      resume,
      atsScore,
      atsChecks,
      heuristicAiEvaluation,
    }

    if (aiProvider === 'local') {
      setAiReviewOverride(null)
      setAiReviewMessage('Free local evaluation is active. No API key needed.')
      flashStatus('Using free local evaluation mode.')
      return
    }

    if (aiProvider === 'ollama') {
      const ollamaEndpoint = ollamaUrl.trim() || DEFAULT_OLLAMA_URL
      const model = aiModel.trim() || DEFAULT_OLLAMA_MODEL

      setAiReviewLoading(true)
      setAiReviewMessage(`Running Ollama review with ${model}...`)

      try {
        const response = await fetch(`${ollamaEndpoint.replace(/\/$/, '')}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert resume reviewer. Return only JSON with score, summary, and insights. Keep the eight insight ids in this exact order: contact, summary, impact, verbs, skills, projects, alignment, links. Each insight must include id, title, impact, pass, and feedback. Be strict, concrete, and concise.',
              },
              {
                role: 'user',
                content: `Review this resume and score it from 0 to 100. Use the supplied data and think like a senior recruiter, ATS system, and hiring manager at once.\n\n${JSON.stringify(reviewPayload, null, 2)}`,
              },
            ],
            format: 'json',
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || `Ollama request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as {
          message?: { content?: string | null }
        }

        const content = payload.message?.content
        if (!content) {
          throw new Error('Ollama returned an empty response.')
        }

        const parsed = JSON.parse(content) as unknown
        const normalized = normalizeAiEvaluation(parsed, heuristicAiEvaluation)

        setAiReviewOverride({
          fingerprint: resumeFingerprint,
          evaluation: normalized,
        })
        setAiReviewMessage(`Ollama review finished with ${model}.`)
        flashStatus('Ollama resume review completed.')
      } catch (error) {
        console.error(error)
        setAiReviewOverride(null)
        setAiReviewMessage('Ollama review failed. Showing the local evaluation instead.')
        flashStatus('Ollama review failed. The local evaluation is still shown.')
      } finally {
        setAiReviewLoading(false)
      }
      return
    }

    const apiKey = aiApiKey.trim()
    const model = aiModel.trim() || DEFAULT_OPENAI_MODEL

    if (!apiKey) {
      setAiReviewOverride(null)
      setAiReviewMessage('No API key detected. Showing the local evaluation instead.')
      flashStatus('Add an OpenAI API key to run the live AI review.')
      return
    }

    setAiReviewLoading(true)
    setAiReviewMessage(`Running OpenAI review with ${model}...`)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are an expert resume reviewer. Return only JSON with score, summary, and insights. Keep the eight insight ids in this exact order: contact, summary, impact, verbs, skills, projects, alignment, links. Each insight must include id, title, impact, pass, and feedback. Be strict, concrete, and concise.',
            },
            {
              role: 'user',
              content: `Review this resume and score it from 0 to 100. Use the supplied data and think like a senior recruiter, ATS system, and hiring manager at once.\n\n${JSON.stringify(reviewPayload, null, 2)}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `OpenAI request failed with status ${response.status}`)
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>
      }

      const content = payload.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('OpenAI returned an empty response.')
      }

      const parsed = JSON.parse(content) as unknown
      const normalized = normalizeAiEvaluation(parsed, heuristicAiEvaluation)

      setAiReviewOverride({
        fingerprint: resumeFingerprint,
        evaluation: normalized,
      })
      setAiReviewMessage(`OpenAI review finished with ${model}.`)
      flashStatus('OpenAI resume review completed.')
    } catch (error) {
      console.error(error)
      setAiReviewOverride(null)
      setAiReviewMessage('OpenAI review failed. Showing the local evaluation instead.')
      flashStatus('OpenAI review failed. The local evaluation is still shown.')
    } finally {
      setAiReviewLoading(false)
    }
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

  const selectTemplate = (template: ResumeTemplate) => {
    setResume((prev) => ({
      ...prev,
      template,
    }))
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

  const createAtsFriendlyResume = () => {
    const lines: string[] = []

    lines.push(resume.fullName || 'Your Name')
    lines.push(resume.title || 'Professional Title')
    lines.push(resume.email.trim())
    lines.push(resume.phone.trim())
    lines.push(resume.location.trim())

    if (resume.website.trim()) {
      lines.push(resume.website.trim())
    }

    if (resume.linkedin.trim()) {
      lines.push(resume.linkedin.trim())
    }

    lines.push('')

    if (sectionVisibility.summary && resume.summary.trim()) {
      lines.push('SUMMARY')
      lines.push(resume.summary.trim())
      lines.push('')
    }

    if (sectionVisibility.skills && parsedSkills.length) {
      lines.push('SKILLS')
      lines.push(parsedSkills.join(', '))
      lines.push('')
    }

    if (sectionVisibility.experience && filledExperiences.length) {
      lines.push('EXPERIENCE')
      filledExperiences.forEach((exp) => {
        lines.push(`${exp.role || 'Role'} - ${exp.company || 'Company'} (${exp.period || 'Period'})`)
        if (exp.details.trim()) {
          exp.details
            .split(/[\r\n]+/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
              lines.push(`- ${line}`)
            })
        }
        lines.push('')
      })
    }

    if (sectionVisibility.projects && filledProjects.length) {
      lines.push('PROJECTS')
      filledProjects.forEach((project) => {
        lines.push(`${project.name || 'Project'} (${project.period || 'Period'})`)
        if (project.tech.trim()) {
          lines.push(`Tech: ${project.tech.trim()}`)
        }
        if (project.link.trim()) {
          lines.push(`Link: ${normalizeUrl(project.link.trim())}`)
        }
        if (project.details.trim()) {
          project.details
            .split(/[\r\n]+/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
              lines.push(`- ${line}`)
            })
        }
        lines.push('')
      })
    }

    if (sectionVisibility.education && filledEducation.length) {
      lines.push('EDUCATION')
      filledEducation.forEach((item) => {
        lines.push(`${item.degree || 'Degree'} - ${item.school || 'School'} (${item.period || 'Period'})`)
      })
      lines.push('')
    }

    return lines
      .map((line) => line.replace(/\s+/g, ' ').trimEnd())
      .filter((line, index, array) => !(line === '' && array[index - 1] === ''))
      .join('\n')
      .trim()
  }

  const copyPlainText = async () => {
    try {
      await navigator.clipboard.writeText(createPlainTextResume())
      flashStatus('Plain-text resume copied to clipboard.')
    } catch {
      flashStatus('Could not copy automatically. Try again in a secure browser context.')
    }
  }

  const copyAtsResume = async () => {
    try {
      await navigator.clipboard.writeText(createAtsFriendlyResume())
      flashStatus('ATS-friendly resume copied to clipboard.')
    } catch {
      flashStatus('Could not copy ATS resume automatically. Try again in a secure browser context.')
    }
  }

  const downloadAtsResume = () => {
    const blob = new Blob([createAtsFriendlyResume()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(resume.fullName || 'resume').replace(/\s+/g, '-').toLowerCase()}-ats.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    flashStatus('ATS-friendly text resume downloaded.')
  }

  const printResume = () => {
    const originalTitle = document.title
    const nextTitle = (resume.fullName || '').trim() || 'Resume'

    const restoreTitle = () => {
      document.title = originalTitle
    }

    document.title = nextTitle
    window.addEventListener('afterprint', restoreTitle, { once: true })
    window.print()
  }

  return (
    <div className={`page-shell theme-liquid mode-${colorMode}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient ambient-three" aria-hidden="true" />

      <header className="topbar">
        <div className="header-copy">
          <h1>Build a professional resume faster</h1>
          <p className="subtitle">
            Smart editing controls with a true paper preview so what you see is what prints.
          </p>
        </div>
        <div className="topbar-actions">
          <div className="mode-switch" role="group" aria-label="Color mode" data-mode={colorMode}>
            <button
              type="button"
              className={`mode-btn ${colorMode === 'light' ? 'active' : ''}`}
              onClick={() => switchColorMode('light')}
              aria-pressed={colorMode === 'light'}
            >
              Light
            </button>
            <button
              type="button"
              className={`mode-btn ${colorMode === 'dark' ? 'active' : ''}`}
              onClick={() => switchColorMode('dark')}
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
            <button type="button" className="primary-btn" onClick={printResume}>
              Print / Save PDF
            </button>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="editor-panel">
          <div className="editor-panel-intro">
            <h2>Resume Control Center</h2>
            <p className="panel-meta">
              Every tool is now separated by purpose: evaluation, builder toolkit, layout, and content.
            </p>
          </div>

          <section className={`control-section section-evaluation ${editorSections.evaluation ? 'collapsed' : ''}`}>
            <div className="section-heading">
              <button
                type="button"
                className="section-toggle"
                onClick={() => toggleEditorSection('evaluation')}
                aria-expanded={!editorSections.evaluation}
              >
                <span className="section-toggle-copy">
                  <p className="section-kicker">Section 01</p>
                  <h3>Evaluation Lab</h3>
                  <p>Quality scoring and AI review are isolated here for cleaner workflow.</p>
                </span>
                <span className="section-toggle-icon" aria-hidden="true">
                  {editorSections.evaluation ? '▸' : '▾'}
                </span>
              </button>
            </div>

            <div className="section-body evaluation-grid">
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

              <article className="ai-card">
                <div className="ai-head">
                  <h3>AI Resume Evaluation</h3>
                  <span className={`score-pill ${aiScoreClass}`}>{aiEvaluation.score}%</span>
                </div>
                <p className="ai-summary">{aiEvaluation.summary}</p>
                <div className="ai-meta-row">
                  <span className="ai-source-pill">
                    {activeAiReview ? 'OpenAI Live Review' : 'Free Local Mode'}
                  </span>
                  <span className="ai-status-text">
                    {activeAiReview
                      ? aiReviewMessage
                      : 'No API key needed. Free local evaluator is active right now.'}
                  </span>
                </div>
                <div className="ai-controls">
                  <label>
                    AI Provider
                    <select
                      value={aiProvider}
                      onChange={(event) => setAiProvider(event.target.value as AiProvider)}
                    >
                      <option value="local">Free Local Mode</option>
                      <option value="ollama">Ollama Local Server</option>
                      <option value="openai">OpenAI API</option>
                    </select>
                  </label>
                  <label>
                    OpenAI API Key (optional)
                    <input
                      type="password"
                      value={aiApiKey}
                      onChange={(event) => setAiApiKey(event.target.value)}
                      placeholder="Leave blank to keep free local mode"
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Model
                    <input
                      value={aiModel}
                      onChange={(event) => setAiModel(event.target.value)}
                      placeholder={DEFAULT_OPENAI_MODEL}
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Ollama URL
                    <input
                      value={ollamaUrl}
                      onChange={(event) => setOllamaUrl(event.target.value)}
                      placeholder={DEFAULT_OLLAMA_URL}
                      autoComplete="off"
                    />
                  </label>
                  <button
                    type="button"
                    className="primary-btn ai-run-btn"
                    onClick={runAiReview}
                    disabled={aiReviewLoading}
                  >
                    {aiReviewLoading
                      ? 'Reviewing...'
                      : aiProvider === 'openai' && aiApiKey.trim()
                        ? 'Run Live OpenAI Review'
                        : aiProvider === 'ollama'
                          ? 'Run Ollama Review'
                          : 'Use Free Local Review'}
                  </button>
                </div>
                <p className="ai-helper">
                  Free mode is built-in and private in your browser. Ollama can run locally without an API key.
                </p>
                <details className="api-help">
                  <summary>How to get an OpenAI key (and free credits if available)</summary>
                  <ol>
                    <li>Create an account at platform.openai.com and open your dashboard.</li>
                    <li>Go to Billing and check whether your account has trial credits.</li>
                    <li>Open API keys, create a new secret key, and paste it here.</li>
                  </ol>
                  <p>
                    Trial credits are not guaranteed for every account. If none are available, keep using
                    the free local mode or run Ollama locally with a downloaded model.
                  </p>
                </details>
                <ul className="ai-list">
                  {aiEvaluation.insights.map((insight) => (
                    <li
                      key={insight.id}
                      className={`ai-item ${insight.pass ? 'ai-pass' : 'ai-fail'}`}
                    >
                      <div className="ai-item-head">
                        <span className={`impact-pill impact-${insight.impact}`}>{insight.impact}</span>
                        <strong>{insight.title}</strong>
                        <span className="ai-result">{insight.pass ? 'Strong' : 'Improve'}</span>
                      </div>
                      <p>{insight.feedback}</p>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className={`control-section section-toolkit ${editorSections.toolkit ? 'collapsed' : ''}`}>
            <div className="section-heading">
              <button
                type="button"
                className="section-toggle"
                onClick={() => toggleEditorSection('toolkit')}
                aria-expanded={!editorSections.toolkit}
              >
                <span className="section-toggle-copy">
                  <p className="section-kicker">Section 02</p>
                  <h3>Builder Toolkit</h3>
                  <p>Productivity actions are grouped separately from scoring and editing.</p>
                </span>
                <span className="section-toggle-icon" aria-hidden="true">
                  {editorSections.toolkit ? '▸' : '▾'}
                </span>
              </button>
            </div>

            <article className="toolkit-card toolkit-shell section-body">
              <div className="toolkit-groups" role="group" aria-label="Builder toolkit groups">
                <div className="tool-group">
                  <p className="tool-group-title">Writing</p>
                  <div className="tools-row">
                    <button type="button" className="tool-btn" onClick={generateSummary}>
                      Generate Summary
                    </button>
                    <button type="button" className="tool-btn" onClick={copyAtsResume}>
                      Copy ATS Resume
                    </button>
                    <button type="button" className="tool-btn" onClick={downloadAtsResume}>
                      Download ATS TXT
                    </button>
                    <button type="button" className="tool-btn" onClick={copyPlainText}>
                      Copy Plain Text
                    </button>
                  </div>
                </div>

                <div className="tool-group">
                  <p className="tool-group-title">Draft Storage</p>
                  <div className="tools-row">
                    <button type="button" className="tool-btn" onClick={saveDraft}>
                      Save Draft
                    </button>
                    <button type="button" className="tool-btn" onClick={loadDraft}>
                      Load Draft
                    </button>
                  </div>
                </div>

                <div className="tool-group">
                  <p className="tool-group-title">Data Transfer</p>
                  <div className="tools-row">
                    <button type="button" className="tool-btn" onClick={exportJson}>
                      Export JSON
                    </button>
                    <button type="button" className="tool-btn" onClick={triggerImport}>
                      Import JSON
                    </button>
                  </div>
                </div>
              </div>

              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden-file"
                onChange={handleImportJson}
              />

              {statusMessage ? (
                <p className="status-note">{statusMessage}</p>
              ) : (
                <p className="status-note subtle">Autosave is enabled for this browser. Use ATS TXT export for a parser-friendly version.</p>
              )}
            </article>
          </section>

          <section className={`control-section section-layout ${editorSections.layout ? 'collapsed' : ''}`}>
            <div className="section-heading">
              <button
                type="button"
                className="section-toggle"
                onClick={() => toggleEditorSection('layout')}
                aria-expanded={!editorSections.layout}
              >
                <span className="section-toggle-copy">
                  <p className="section-kicker">Section 03</p>
                  <h3>Section Layout</h3>
                  <p>Toggle visibility per application and keep only role-relevant sections.</p>
                </span>
                <span className="section-toggle-icon" aria-hidden="true">
                  {editorSections.layout ? '▸' : '▾'}
                </span>
              </button>
            </div>

            <article className="visibility-card section-body">
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
          </section>

          <section className={`control-section section-content ${editorSections.content ? 'collapsed' : ''}`}>
            <div className="section-heading">
              <button
                type="button"
                className="section-toggle"
                onClick={() => toggleEditorSection('content')}
                aria-expanded={!editorSections.content}
              >
                <span className="section-toggle-copy">
                  <p className="section-kicker">Section 04</p>
                  <h3>Resume Content Builder</h3>
                  <p>Profile details and resume sections are grouped into focused edit blocks.</p>
                </span>
                <span className="section-toggle-icon" aria-hidden="true">
                  {editorSections.content ? '▸' : '▾'}
                </span>
              </button>
            </div>

            <div className="section-body">
            <article className="form-block">
              <h4>Template Style</h4>
              <div className="template-grid" role="radiogroup" aria-label="Resume template style">
                {TEMPLATE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`template-card ${resume.template === preset.id ? 'active' : ''}`}
                    onClick={() => selectTemplate(preset.id)}
                    aria-pressed={resume.template === preset.id}
                  >
                    <span className="template-card-label">{preset.label}</span>
                    <span className="template-card-copy">{preset.description}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="form-block">
              <h4>Profile Basics</h4>
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
                  Primary Text Color
                  <input
                    type="color"
                    value={resume.primaryTextColor}
                    onChange={(event) => updateField('primaryTextColor', event.target.value)}
                  />
                </label>
                <label>
                  Secondary Text Color
                  <input
                    type="color"
                    value={resume.secondaryTextColor}
                    onChange={(event) => updateField('secondaryTextColor', event.target.value)}
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
            </article>

            <article className="form-block">
              <h4>Target Title</h4>
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
            </article>

            <article className="form-block">
              <h4>Professional Story</h4>
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
            </article>

            <article className="form-block">
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
            </article>

            <article className="form-block">
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
            </article>

            <article className="form-block">
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
            </article>
            </div>
          </section>
        </section>

        <section className="preview-panel">
          <h2>Live Preview</h2>
          <p className="panel-meta">Print-ready layout optimized for PDF export.</p>

          <article
            className={`resume template-${resume.template}`}
            style={{
              ['--accent' as string]: resume.accentColor,
              ['--resume-text-primary' as string]: resume.primaryTextColor,
              ['--resume-text-secondary' as string]: resume.secondaryTextColor,
            }}
          >
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
