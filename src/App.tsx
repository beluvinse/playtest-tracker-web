import { Route, Routes } from 'react-router'
import { AuthLayout } from './components/AuthLayout'
import { ShellLayout } from './components/ShellLayout'
import { BugPage } from './pages/BugPage'
import { LoginPage } from './pages/LoginPage'
import { NewBugPage } from './pages/NewBugPage'
import { NewProjectPage } from './pages/NewProjectPage'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      {/* Sign in and sign up: their own frame, without the sidebar */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Everything else lives inside the app's frame */}
      <Route element={<ShellLayout />}>
        <Route path="/" element={<ProjectsPage />} />
        {/* A fixed segment ("new") wins over a parameter (":projectId"), whatever the order */}
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        {/* Like POST /api/projects/{projectId}/bugs: a new bug is created inside its project */}
        <Route path="/projects/:projectId/bugs/new" element={<NewBugPage />} />
        {/* Same shape as the API: a bug has its own address, outside its project */}
        <Route path="/bugs/:bugId" element={<BugPage />} />
      </Route>
    </Routes>
  )
}

export default App
