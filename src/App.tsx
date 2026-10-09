import { Route, Routes } from 'react-router'

function App() {
  return (
    <main className="container">
      <h1>Playtest Tracker</h1>
      <Routes>
        <Route path="/" element={<p>Projects will be listed here.</p>} />
      </Routes>
    </main>
  )
}

export default App
