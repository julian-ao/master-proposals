export interface IProject {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  teacher: string;
  status: string;
  link: string;
  teacherLink: string; // Link to the teacher's profile
  programs: string[];
  type: "single" | "duo";
}

export const STUDY_PROGRAMS = [
  { id: "p2_6", name: "Programvaresystemer", majorCourse: "informatics" },
  { id: "p2_7", name: "Databaser og søk", majorCourse: "informatics" },
  { id: "p2_9", name: "Kunstig intelligens", majorCourse: "informatics" },
  {
    id: "p2_10",
    name: "Interaksjonsdesign, spill- og læringsteknologi",
    majorCourse: "informatics",
  },
  {
    id: "p1_1",
    name: "Programvaresystemer",
    majorCourse: "computerScience",
  },
  {
    id: "p1_2",
    name: "Databaser og søk",
    majorCourse: "computerScience",
  },
  {
    id: "p1_3",
    name: "Kunstig intelligens",
    majorCourse: "computerScience",
  },
  {
    id: "p1_21",
    name: "Innvevde Systemer",
    majorCourse: "computerScience",
  },
];
