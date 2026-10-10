import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
