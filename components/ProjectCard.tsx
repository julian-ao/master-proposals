"use client"

import { useState } from "react"

interface Project {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  teacher: string
  status: string
  link: string
  programs: string[]
}

interface ProjectCardProps {
  project: Project
  getProgramName: (programId: string) => string
}

export function ProjectCard({ project, getProgramName }: ProjectCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  // Map program IDs to CSS classes
  const getLabelClass = (programId: string) => {
    switch (programId) {
      case "p2_6":
        return "label-programvaresystemer"
      case "p2_7":
        return "label-databaser"
      case "p2_9":
        return "label-kunstig-intelligens"
      case "p2_10":
        return "label-interaksjonsdesign"
      default:
        return ""
    }
  }

  return (
    <div className="oppgave">
      <h3>{project?.title}</h3>
      <p>{project?.shortDescription}</p>

      {/* Add study program labels */}
      <div className="study-program-labels">
        {project?.programs.map((programId: string) => (
          <span key={programId} className={`study-program-label ${getLabelClass(programId)}`}>
            {getProgramName(programId)}
          </span>
        ))}
      </div>

      {!showFullDescription ? (
        <p>
          [{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setShowFullDescription(true)
            }}
          >
            Vis hele beskrivelsen
          </a>{" "}
          ]
        </p>
      ) : (
        <div className="full-description">
          <p>{project?.fullDescription}</p>
          <p>
            [{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setShowFullDescription(false)
              }}
            >
              Skjul beskrivelse
            </a>{" "}
            ]
          </p>
        </div>
      )}

      <div className="status">
        <div>
          <strong>Veileder:</strong> {project?.teacher}
        </div>
        <div>
          <strong>Status:</strong> {project?.status}
        </div>
        <div>
          <a href={project?.link} target="_blank" rel="noopener noreferrer">
            Permalenke
          </a>
        </div>
      </div>
    </div>
  )
}

