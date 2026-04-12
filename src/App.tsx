import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import DiagramPage from './pages/DiagramPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="diagram/:widgetId" element={<DiagramPage />} />
      </Route>
    </Routes>
  )
}
