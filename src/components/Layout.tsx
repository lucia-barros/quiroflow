import { BarChart3, BedDouble, ChevronRight, ClipboardList, Monitor, RadioTower, ShieldCheck, Users, Video } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Brand } from './ui'

const groups = [
  { title: 'EXPOSICIÓN', links: [{ to: '/demo', label: 'Modo presentación', icon: Video }] },
  { title: 'BLOQUE QUIRÚRGICO', links: [
    { to: '/control', label: 'Panel de control', icon: ClipboardList },
    { to: '/quirofanos', label: 'Quirófanos', icon: BedDouble },
    { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  ] },
  { title: 'SALA DE ESPERA', links: [
    { to: '/espera/turnos', label: 'Llamadas UMCA', icon: Monitor },
    { to: '/espera/estado', label: 'Estado del paciente', icon: Users },
  ] },
]

export default function Layout() {
  const { pathname } = useLocation()
  const route = groups.flatMap(group => group.links).find(link => link.to === pathname.replace(/\/$/, ''))
  return <div className="app-layout">
    <a className="skip-link" href="#contenido">Ir al contenido</a>
    <aside className="sidebar">
      <NavLink to="/demo" className="sidebar-brand" aria-label="QUIROFLOW, inicio de la demostración"><Brand /></NavLink>
      <div className="sidebar-caption">PTH · ANESTESIOLOGÍA</div>
      <nav className="sidebar-nav" aria-label="Vistas de QUIROFLOW">
        {groups.map(group => <div className="nav-group" key={group.title}>
          <div className="nav-title">{group.title}</div>
          {group.links.map(({ to, label, icon: Icon }) =>
            <NavLink className="nav-link" to={to} key={to} title={label}>
              <Icon size={19} aria-hidden="true" /><span>{label}</span>
            </NavLink>,
          )}
        </div>)}
      </nav>
      <div className="sidebar-note">
        <ShieldCheck size={17} aria-hidden="true" />
        <div><strong>Entorno simulado</strong><span>Ingeniería Biomédica · UVigo</span></div>
      </div>
    </aside>
    <div className="app-content">
      <header className="topbar">
        <div className="breadcrumbs"><span>QUIROFLOW</span><ChevronRight size={13} aria-hidden="true" /><strong>{route?.label}</strong></div>
        <div className="simulation-tag"><RadioTower size={14} aria-hidden="true" /> <span>DATOS SIMULADOS</span></div>
      </header>
      <main className="workspace" id="contenido"><Outlet /></main>
      <footer className="workspace-footer"><span>QUIROFLOW · Prototipo académico</span><span>Universidade de Vigo · Tecnología Hospitalaria</span></footer>
    </div>
  </div>
}
