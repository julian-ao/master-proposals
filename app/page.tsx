"use client"

import { useState, useEffect, useCallback } from "react"
import { ProjectCard } from "../components/ProjectCard"
import { StudyProgramFilter } from "../components/StudyProgramFilter"
import { SortAndFilterControls } from "../components/SortAndFilterControls"
import { LoadingSkeleton } from "../components/LoadingSkeleton"
import { ErrorMessage } from "../components/ErrorMessage"
import { IProject, STUDY_PROGRAMS } from "../lib/constants"
import { SupervisorFilter } from "../components/SupervisorFilter"
import { ProjectTypeFilter } from "../components/ProjectTypeFilter"

const DEFAULT_SELECTED_PROGRAMS = STUDY_PROGRAMS.reduce((acc, program) => {
  acc[program.id] = true
  return acc
}, {} as Record<string, boolean>)

export default function ProjectBrowser() {
  const [selectedPrograms, setSelectedPrograms] = useState(DEFAULT_SELECTED_PROGRAMS)
  const [projects, setProjects] = useState<IProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<"union" | "intersection">("union")
  const [searchQuery, setSearchQuery] = useState("")
  const [projectTypeFilter, setProjectTypeFilter] = useState<'all' | 'single' | 'duo'>('all')

  const [selectedSupervisors, setSelectedSupervisors] = useState<Record<string, boolean>>({})
  const [availableSupervisors, setAvailableSupervisors] = useState<string[]>([])
  const [excludedSupervisors, setExcludedSupervisors] = useState<Record<string, boolean>>({})

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const programPromises = Object.entries(selectedPrograms)
        .filter(([_, isSelected]) => isSelected)
        .map(async ([programId]) => {
          const response = await fetch(`/api/idi?${programId}=1`)
          if (!response.ok) throw new Error(`Failed to fetch ${programId}`)
          return { programId, html: await response.text() }
        })

      const programResults = await Promise.all(programPromises)
      const allProjects: IProject[] = []
      const supervisors = new Set<string>()

      programResults.forEach(({ programId, html }) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, "text/html")
        const projectElements = doc.querySelectorAll(".oppgave")

        projectElements.forEach((element) => {
          const title = element.querySelector("h3")?.textContent?.trim() || "Untitled Project"
          const description = element.querySelector("p")?.textContent?.trim() || ""
          const teacher = element.querySelector(".status a")?.textContent?.trim() || "Unknown"
          supervisors.add(teacher)
          const status = element.querySelector(".status i")?.textContent?.trim() || "Unknown"
          const link = element.querySelector('.status a[href^="oppgaveforslag"]')?.getAttribute("href") || "#"

          let shownDesc = ""
          let hiddenDesc = ""
          const divs = element.querySelectorAll('div[id^="shown_"], div[id^="hidden_"]')


          const statusDiv = element.querySelector('.status')
          const studentImg = statusDiv?.querySelector('img[src*="student_"]')

          let type: 'single' | 'duo' = 'single' // default to single
          if (studentImg) {
            if (studentImg.getAttribute('src')?.includes('student_group')) {
              type = 'duo'
            } else if (studentImg.getAttribute('src')?.includes('student_singel')) {
              type = 'single'
            }
          }

          divs.forEach((div) => {
            const text = div.textContent?.trim() || ""
            if (div.id.startsWith("shown_")) shownDesc = text
            else if (div.id.startsWith("hidden_")) hiddenDesc = text
          })

          const project = {
            id: link.split("oid=")[1] || crypto.randomUUID(),
            title,
            shortDescription: description,
            fullDescription: hiddenDesc || shownDesc,
            teacher,
            status,
            link,
            programs: [programId],
            type,
          }

          const existingIndex = allProjects.findIndex(p => p.title === title && p.teacher === teacher)
          if (existingIndex >= 0) {
            allProjects[existingIndex].programs = [
              ...new Set([...allProjects[existingIndex].programs, ...project.programs]),
            ]
          } else {
            allProjects.push(project)
          }
        })
      })

      console.log(Array.from(supervisors).sort())

      setAvailableSupervisors(Array.from(supervisors).sort())
      setProjects(allProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects")
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedPrograms])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const toggleProgram = (programId: string) => {
    setSelectedPrograms(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }))
  }

  const filteredProjects = projects.filter(project => {
    // Filter by selected programs
    const programMatch = filterMode === "union"
      ? project.programs.some(programId => selectedPrograms[programId])
      : Object.keys(selectedPrograms)
        .filter(programId => selectedPrograms[programId])
        .every(selectedProgramId => project.programs.includes(selectedProgramId))

    const supervisorMatch =
      (Object.keys(selectedSupervisors).length === 0 &&
        Object.keys(excludedSupervisors).length === 0) ||
      (Object.keys(selectedSupervisors).length > 0
        ? selectedSupervisors[project.teacher]
        : !excludedSupervisors[project.teacher])

    const typeMatch =
      projectTypeFilter === 'all' ||
      project.type === projectTypeFilter

    // Filter by search query
    const searchMatch = searchQuery.toLowerCase() === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.fullDescription.toLowerCase().includes(searchQuery.toLowerCase())

    return programMatch && supervisorMatch && typeMatch && searchMatch
  })

  const getProgramName = (programId: string) =>
    STUDY_PROGRAMS.find(p => p.id === programId)?.name || programId

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          MSIT Master Proposals 2025
        </h1>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Project proposals can be registered <strong>from April 1, 2025</strong>. The deadline for submitting proposals are <strong>May 21, 2025</strong>.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <StudyProgramFilter
            programs={STUDY_PROGRAMS}
            selectedPrograms={selectedPrograms}
            onToggleProgram={toggleProgram}
          />

          <SupervisorFilter
            supervisors={availableSupervisors}
            selected={selectedSupervisors}
            excluded={excludedSupervisors}
            onToggle={(supervisor) => {
              setSelectedSupervisors(prev => ({
                ...prev,
                [supervisor]: !prev[supervisor]
              }))
              setExcludedSupervisors(prev => {
                const newExcluded = { ...prev }
                delete newExcluded[supervisor]
                return newExcluded
              })
            }}
            onExclude={(supervisor) => {
              setExcludedSupervisors(prev => ({
                ...prev,
                [supervisor]: true
              }))
              setSelectedSupervisors(prev => {
                const newSelected = { ...prev }
                delete newSelected[supervisor]
                return newSelected
              })
            }}
            onClear={() => {
              setSelectedSupervisors({})
              setExcludedSupervisors({})
            }}
            loading={loading}
          />
        </aside>

        <main className="lg:col-span-3">
          <SortAndFilterControls
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            projectCount={filteredProjects.length}
          />
          <ProjectTypeFilter
            value={projectTypeFilter}
            onChange={setProjectTypeFilter}
          />

          {loading && <LoadingSkeleton count={5} />}
          {error && <ErrorMessage message={error} onRetry={fetchProjects} />}

          {!loading && !error && (
            <div className="space-y-6">
              {filteredProjects.length > 0 ? (
                filteredProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    getProgramName={getProgramName}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    No projects found
                  </h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Try adjusting your filters or search query.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}