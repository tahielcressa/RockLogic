import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import { useState } from 'react'

import {
  LayoutDashboard,
  FileUp,
  History,
  Users as UsersIcon,
  LogOut,
  Mountain,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/cargar', label: 'Cargar datos', icon: FileUp },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/usuarios', label: 'Usuarios y equipos', icon: UsersIcon, admin: true },
]

function NavItems({ collapsed }) {
  const { user } = useAuth()
  return nav
    .filter((n) => !n.admin || user?.role === 'ADMIN')
    .map((n) => (
      <NavLink
        key={n.to}
        to={n.to}
        end={n.end}
        aria-label={n.label}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-base relative ${
            isActive
              ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`
        }
      >
        <n.icon size={18} className="shrink-0" />
        {!collapsed && (
          <span className="truncate transition-opacity duration-200">
            {n.label}
          </span>
        )}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
            {n.label}
          </span>
        )}
      </NavLink>
    ))
}

function Breadcrumbs() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)

  const getLabel = (path) => {
    switch (path) {
      case 'cargar':
        return 'Cargar datos'
      case 'historial':
        return 'Historial'
      case 'usuarios':
        return 'Usuarios y equipos'
      default:
        return path
    }
  }

  if (paths.length === 0) return null

  return (
    <nav
      className="mb-4 flex items-center gap-2 text-sm text-slate-500"
      aria-label="Breadcrumb"
    >
      <NavLink to="/" className="transition-colors hover:text-slate-700">
        Dashboard
      </NavLink>
      {paths.map((path, i) => (
        <div key={path} className="flex items-center gap-2">
          <span>/</span>
          {i === paths.length - 1 ? (
            <span className="font-medium text-slate-700">{getLabel(path)}</span>
          ) : (
            <NavLink
              to={`/${paths.slice(0, i + 1).join('/')}`}
              className="transition-colors hover:text-slate-700"
            >
              {getLabel(path)}
            </NavLink>
          )}
        </div>
      ))}
    </nav>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'U'
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <aside
        className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out relative ${
          collapsed ? 'w-16' : 'w-64'
        }`}
        aria-label="Sidebar de navegación"
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 shadow-lg transition-base hover:bg-slate-700 hover:text-white"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20">
            <Mountain size={22} className="text-slate-900" />
          </div>
          {!collapsed && (
            <div className="transition-opacity duration-200">
              <p className="text-lg font-extrabold tracking-tight">RockLogic</p>
              <p className="text-xs text-slate-400">
                Gestión de operaciones mineras
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin">
          <NavItems collapsed={collapsed} />
        </nav>

        <div className="space-y-3 border-t border-slate-800/80 p-4">
          {!collapsed && (
            <div className="mb-3 rounded-lg bg-slate-800/80 p-3 ring-1 ring-slate-700/50">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Empresa
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">
                {user?.companyName}
              </p>
              <span className="mt-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                Multi-tenant
              </span>
            </div>
          )}

          <div
            className={`flex items-center ${collapsed ? 'flex-col justify-center gap-2' : 'gap-3'}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/20">
              {initial}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 transition-opacity duration-200">
                <p className="truncate text-sm font-semibold">{user?.fullName}</p>
                <p className="truncate text-xs capitalize text-slate-400">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className={`flex items-center justify-center rounded-lg p-2 text-slate-400 transition-base hover:bg-slate-800/80 hover:text-white ${
                collapsed ? 'w-9' : ''
              }`}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  )
}