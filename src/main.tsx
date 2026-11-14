import { lazy, StrictMode, Suspense, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import '@fontsource-variable/inter'
import './styles.css'
import Layout from './components/Layout'

const DemoPage = lazy(() => import('./pages/DemoPage'))
const ControlPage = lazy(() => import('./pages/ControlPage'))
const RoomsPage = lazy(() => import('./pages/RoomsPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const TurnsPage = lazy(() => import('./pages/PublicMonitors').then(module => ({ default: module.TurnsPage })))
const FamiliesPage = lazy(() => import('./pages/PublicMonitors').then(module => ({ default: module.FamiliesPage })))

const titles: Record<string, string> = {
  '/demo': 'Modo presentación',
  '/control': 'Panel de control',
  '/quirofanos': 'Coordinación de quirófanos',
  '/estadisticas': 'Estadísticas',
  '/espera/turnos': 'Llamada de pacientes',
  '/espera/estado': 'Estado del paciente',
}

function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    const title = titles[pathname.replace(/\/$/, '')]
    document.title = title ? `${title} · QUIROFLOW` : 'QUIROFLOW · Coordinación perioperatoria'
    window.scrollTo(0, 0)
  }, [pathname])

  return <Suspense fallback={<div className="loading" role="status">Cargando QUIROFLOW…</div>}>
    <Routes>
      <Route path="/" element={<Navigate to="/demo" replace />} />
      <Route path="/espera/turnos" element={<TurnsPage />} />
      <Route path="/espera/estado" element={<FamiliesPage />} />
      <Route element={<Layout />}>
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/quirofanos" element={<RoomsPage />} />
        <Route path="/estadisticas" element={<StatsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/demo" replace />} />
    </Routes>
  </Suspense>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter basename={import.meta.env.BASE_URL}><App /></BrowserRouter></StrictMode>,
)
