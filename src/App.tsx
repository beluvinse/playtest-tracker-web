import { Route, Routes } from 'react-router'
import { AuthLayout } from './components/AuthLayout'
import { RequireAuth } from './components/RequireAuth'
import { ShellLayout } from './components/ShellLayout'
import { BugPage } from './pages/BugPage'
import { HomePage } from './pages/HomePage'
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

      {/* Everything else needs a signed-in person, and lives inside the app's frame */}
      <Route element={<RequireAuth />}>
        <Route element={<ShellLayout />}>
          {/* "/" has nothing of its own: it sends the person to one of their organizations */}
          <Route path="/" element={<HomePage />} />
          {/* Like GET /api/organizations/{id}/projects: projects are listed and created inside an organization */}
          <Route path="/organizations/:organizationId" element={<ProjectsPage />} />
          <Route
            path="/organizations/:organizationId/projects/new"
            element={<NewProjectPage />}
          />
          {/* Once a project exists it is reached by its own id: it knows its organization */}
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          {/* Like POST /api/projects/{projectId}/bugs: a new bug is created inside its project */}
          <Route path="/projects/:projectId/bugs/new" element={<NewBugPage />} />
          {/* Same shape as the API: a bug has its own address, outside its project */}
          <Route path="/bugs/:bugId" element={<BugPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
