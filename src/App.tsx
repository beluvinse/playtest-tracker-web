import { Link, Route, Routes } from 'react-router'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'

function App() {
  return (
    <>
      <header className="app-header">
        <div className="container">
          <Link to="/" className="app-title">
            Playtest Tracker
          </Link>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
