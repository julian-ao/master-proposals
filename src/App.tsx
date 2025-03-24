import { useState, useEffect } from 'react';
import './App.css';

const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

const studyPrograms = [
  { id: 'p2_6', name: 'Programvaresystemer' },
  { id: 'p2_7', name: 'Databaser og søk' },
  { id: 'p2_9', name: 'Kunstig intelligens' },
  { id: 'p2_10', name: 'Interaksjonsdesign, spill- og læringsteknologi' }
];

function App() {
  const [selectedPrograms, setSelectedPrograms] = useState({
    p2_6: true,
    p2_7: true,
    p2_9: true,
    p2_10: true
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('2'); // Default sort by project name
  const [showUnion, setShowUnion] = useState(true);
  const [filteredProjects, setFilteredProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, [selectedPrograms, sortBy]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const programPromises = Object.entries(selectedPrograms)
        .filter(([_, isSelected]) => isSelected)
        .map(async ([programId]) => {
          const response = await fetch(
            `/api/fordypningsprosjekt.php?${programId}=1&s=${sortBy}`
          );
          const text = await response.text();
          return { programId, html: text };
        });

      const programResults = await Promise.all(programPromises);

      // Parse HTML for each program and combine results
      const allProjects = [];

      programResults.forEach(({ programId, html }) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const projectElements = doc.querySelectorAll('.oppgave');

        projectElements.forEach(element => {
          const title = element.querySelector('h3')?.textContent || 'No title';
          const description = element.querySelector('p')?.textContent || '';
          const teacher = element.querySelector('.status a')?.textContent || 'Unknown teacher';
          const status = element.querySelector('.status i')?.textContent || 'Unknown status';
          const link = element.querySelector('.status a[href^="oppgaveforslag"]')?.href || '#';

          // Find the description elements by checking IDs that start with shown_ or hidden_
          let shownDesc = '';
          let hiddenDesc = '';

          // Find all divs with IDs starting with 'shown_' or 'hidden_'
          const divs = element.querySelectorAll('div[id^="shown_"], div[id^="hidden_"]');

          divs.forEach(div => {
            if (div.id.startsWith('shown_')) {
              shownDesc = div.textContent || '';
            } else if (div.id.startsWith('hidden_')) {
              hiddenDesc = div.textContent || '';
            }
          });

          const project = {
            id: link.split('oid=')[1] || Math.random().toString(36).substr(2, 9),
            title,
            shortDescription: description,
            fullDescription: hiddenDesc || shownDesc,
            teacher,
            status,
            link,
            programs: [programId]
          };

          // Check if this project already exists (from another program)
          const existingIndex = allProjects.findIndex(p => p.title === title && p.teacher === teacher);
          if (existingIndex >= 0) {
            // Merge programs
            allProjects[existingIndex].programs = [...new Set([...allProjects[existingIndex].programs, ...project.programs])];
          } else {
            allProjects.push(project);
          }
        });
      });

      setProjects(allProjects);
    } catch (err) {
      setError('Failed to fetch projects. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProgram = (programId) => {
    setSelectedPrograms(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }));
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const getProgramName = (programId) => {
    return studyPrograms.find(p => p.id === programId)?.name || programId;
  };

  useEffect(() => {
    fetchProjects();
    setFilteredProjects(showUnion
      ? projects.filter(project =>
        project.programs.some(programId => selectedPrograms[programId])
      )
      : projects.filter(project =>
        project.programs.every(programId => selectedPrograms[programId])
      ))

  }, [selectedPrograms, showUnion]);


  return (
    <div className="App">
      <h1>Prosjekt 2025</h1>

      <div className="notice">
        <p>Prosjektønsker kan registreres <b>fra 1. april 2025</b>.</p>
      </div>

      <p>Velg hva du ønsker å vise prosjekt for.</p>

      <div className="filters">
        <fieldset>
          <legend>Studieprogram (Informatikk)</legend>
          <div className="program-grid">
            {studyPrograms.map(program => (
              <div key={program.id}>
                <input
                  type="checkbox"
                  id={program.id}
                  checked={selectedPrograms[program.id]}
                  onChange={() => toggleProgram(program.id)}
                />
                <label htmlFor={program.id}>{program.name}</label>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="filter-options">
          <div>
            <label>
              <input
                type="radio"
                checked={showUnion}
                onChange={() => setShowUnion(true)}
              />
              UNION (prosjekter fra minst ett valgt program)
            </label>
            <label>
              <input
                type="radio"
                checked={!showUnion}
                onChange={() => setShowUnion(false)}
              />
              SNITT (prosjekter fra alle valgte programmer)
            </label>
          </div>

          <div className="sort">
            Sorter etter:
            <select value={sortBy} onChange={handleSortChange}>
              <option value="2">Oppgave</option>
              <option value="1">Faglærer</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <p>Loading projects...</p>}
      {error && <p className="error">{error}</p>}

      <h2>Oppgaveforslag ({filteredProjects.length})</h2>

      <div className="projects">
        {filteredProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            getProgramName={getProgramName}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, getProgramName }) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Map program IDs to CSS classes
  const getLabelClass = (programId) => {
    switch (programId) {
      case 'p2_6': return 'label-programvaresystemer';
      case 'p2_7': return 'label-databaser';
      case 'p2_9': return 'label-kunstig-intelligens';
      case 'p2_10': return 'label-interaksjonsdesign';
      default: return '';
    }
  };

  return (
    <div className="oppgave">
      <h3>{project.title}</h3>
      <p>{project.shortDescription}</p>

      {/* Add study program labels */}
      <div className="study-program-labels">
        {project.programs.map(programId => (
          <span
            key={programId}
            className={`study-program-label ${getLabelClass(programId)}`}
          >
            {getProgramName(programId)}
          </span>
        ))}
      </div>

      {!showFullDescription ? (
        <p>
          [ <a href="#" onClick={(e) => { e.preventDefault(); setShowFullDescription(true); }}>
            Vis hele beskrivelsen
          </a> ]
        </p>
      ) : (
        <div className="full-description">
          <p>{project.fullDescription}</p>
          <p>
            [ <a href="#" onClick={(e) => { e.preventDefault(); setShowFullDescription(false); }}>
              Skjul beskrivelse
            </a> ]
          </p>
        </div>
      )}

      <div className="status">
        <div>
          <strong>Faglærer:</strong> {project.teacher}
        </div>
        <div>
          <strong>Status:</strong> {project.status}
        </div>
        <div>
          <a href={project.link} target="_blank" rel="noopener noreferrer">
            Permalenke
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;