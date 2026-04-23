import { useMemo, useState } from 'react'
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

type ResumeData = {
  fullName: string
  title: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string
  accentColor: string
  experiences: Experience[]
  education: Education[]
}

const INITIAL_DATA: ResumeData = {
  fullName: 'Alex Morgan',
  title: 'Product Designer',
  email: 'alex.morgan@email.com',
  phone: '+1 (555) 123-7890',
  location: 'San Francisco, CA',
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
}

function App() {
  const [resume, setResume] = useState<ResumeData>(INITIAL_DATA)
  const [nextExperienceId, setNextExperienceId] = useState(3)
  const [nextEducationId, setNextEducationId] = useState(2)

  const parsedSkills = useMemo(
    () =>
      resume.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    [resume.skills],
  )

  const updateField = <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => {
    setResume((prev) => ({ ...prev, [field]: value }))
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

  const resetTemplate = () => {
    setResume(INITIAL_DATA)
    setNextExperienceId(3)
    setNextEducationId(2)
  }

  return (
    <div className="page-shell theme-liquid">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient ambient-three" aria-hidden="true" />

      <header className="topbar">
        <div className="header-copy">
          <p className="tag">ResuMaker</p>
          <h1>Build your resume in minutes</h1>
          <p className="subtitle">Liquid-glass design. Real-time live preview. Print-ready output.</p>
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
      </header>

      <main className="workspace">
        <section className="editor-panel">
          <h2>Simple Controls</h2>
          <p className="panel-meta">Update your details and watch the preview refresh instantly.</p>

          <div className="field-grid">
            <label>
              Full Name
              <input
                value={resume.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
              />
            </label>
            <label>
              Job Title
              <input value={resume.title} onChange={(e) => updateField('title', e.target.value)} />
            </label>
            <label>
              Email
              <input value={resume.email} onChange={(e) => updateField('email', e.target.value)} />
            </label>
            <label>
              Phone
              <input value={resume.phone} onChange={(e) => updateField('phone', e.target.value)} />
            </label>
            <label>
              Location
              <input
                value={resume.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </label>
            <label>
              Accent Color
              <input
                type="color"
                value={resume.accentColor}
                onChange={(e) => updateField('accentColor', e.target.value)}
              />
            </label>
          </div>

          <label>
            Professional Summary
            <textarea
              rows={4}
              value={resume.summary}
              onChange={(e) => updateField('summary', e.target.value)}
            />
          </label>

          <label>
            Skills (comma separated)
            <textarea
              rows={3}
              value={resume.skills}
              onChange={(e) => updateField('skills', e.target.value)}
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
                  onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                />
              </label>
              <label>
                Company
                <input
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                />
              </label>
              <label>
                Period
                <input
                  value={exp.period}
                  onChange={(e) => updateExperience(exp.id, 'period', e.target.value)}
                />
              </label>
              <label>
                Details
                <textarea
                  rows={3}
                  value={exp.details}
                  onChange={(e) => updateExperience(exp.id, 'details', e.target.value)}
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
                  onChange={(e) => updateEducation(item.id, 'degree', e.target.value)}
                />
              </label>
              <label>
                School
                <input
                  value={item.school}
                  onChange={(e) => updateEducation(item.id, 'school', e.target.value)}
                />
              </label>
              <label>
                Period
                <input
                  value={item.period}
                  onChange={(e) => updateEducation(item.id, 'period', e.target.value)}
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
            </header>

            <section>
              <h4>Summary</h4>
              <p>{resume.summary}</p>
            </section>

            <section>
              <h4>Experience</h4>
              {resume.experiences
                .filter((exp) => exp.role || exp.company || exp.period || exp.details)
                .map((exp) => (
                  <div className="resume-entry" key={exp.id}>
                    <div className="entry-head">
                      <strong>{exp.role || 'Role'}</strong>
                      <span>{exp.period || 'Period'}</span>
                    </div>
                    <p className="entry-sub">{exp.company || 'Company'}</p>
                    <p>{exp.details}</p>
                  </div>
                ))}
            </section>

            <section>
              <h4>Education</h4>
              {resume.education
                .filter((item) => item.degree || item.school || item.period)
                .map((item) => (
                  <div className="resume-entry" key={item.id}>
                    <div className="entry-head">
                      <strong>{item.degree || 'Degree'}</strong>
                      <span>{item.period || 'Period'}</span>
                    </div>
                    <p className="entry-sub">{item.school || 'School'}</p>
                  </div>
                ))}
            </section>

            <section>
              <h4>Skills</h4>
              <ul className="skills-list">
                {parsedSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </section>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
