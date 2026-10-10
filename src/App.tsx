import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { NewProjectPage } from './pages/NewProjectPage'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        {/* A fixed segment ("new") wins over a parameter (":projectId"), whatever the order */}
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
