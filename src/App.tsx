import { Route, Routes } from 'react-router'
import { ProjectsPage } from './pages/ProjectsPage'

function App() {
  return (
    <>
      <header className="app-header">
        <div className="container">
          <span className="app-title">Playtest Tracker</span>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
