export interface IProject {
    id: string
    title: string
    shortDescription: string
    fullDescription: string
    teacher: string
    status: string
    link: string
    programs: string[]
}

export const STUDY_PROGRAMS = [
    { id: "p2_6", name: "Programvaresystemer" },
    { id: "p2_7", name: "Databaser og søk" },
    { id: "p2_9", name: "Kunstig intelligens" },
    { id: "p2_10", name: "Interaksjonsdesign, spill- og læringsteknologi" },
]