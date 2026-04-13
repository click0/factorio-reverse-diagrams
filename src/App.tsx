import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import DiagramPage from './pages/DiagramPage'
import EmbedPage from './pages/EmbedPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="diagram/:widgetId" element={<DiagramPage />} />
      </Route>
      <Route path="embed/:widgetId" element={<EmbedPage />} />
    </Routes>
  )
}
