import { useEffect, useMemo, useState } from 'react'
import {
  Users as UsersIcon,
  Truck,
  Building2,
  Loader2,
  Plus,
  Shield,
  User,
  Search,
} from 'lucide-react'
import api from '../api'
import { Badge } from './Dashboard'

export default function Users() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [equipments, setEquipments] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/equipments'),
      api.get('/admin/company'),
    ])
      .then(([u, e, c]) => {
        setUsers(u.data)
        setEquipments(e.data)
        setCompany(c.data)
      })
      .catch((err) => setError(err.response?.data?.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-500" role="status">
        <Loader2 size={20} className="animate-spin" /> Cargando administración...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Administración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Usuarios, roles y catálogo de equipos de la empresa.
        </p>
      </div>

      {company && (
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white shadow-lg">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20">
            <Building2 size={24} className="text-slate-900" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold">{company.name}</p>
            <p className="text-sm text-slate-400">
              {company.code} · {company.country} · <span className="text-slate-300">{company.users} usuarios</span> · <span className="text-slate-300">{company.equipments} equipos</span>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {[
          { id: 'users', label: `Usuarios (${users.length})`, icon: UsersIcon },
          { id: 'equipment', label: `Catálogo de equipos (${equipments.length})`, icon: Truck },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === t.id
                ? 'border-b-2 border-amber-500 bg-white text-slate-900'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
            }`}
            aria-selected={tab === t.id}
            role="tab"
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <UsersTab users={users} onCreated={load} />
      ) : (
        <EquipmentTab equipments={equipments} onCreated={load} />
      )}
    </div>
  )
}

function RoleBadge({ role }) {
  return role === 'ADMIN' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      <Shield size={12} /> ADMIN
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
      <User size={12} /> OPERADOR
    </span>
  )
}

function UsersTab({ users, onCreated }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'OPERATOR' })
  const [msg, setMsg] = useState({ text: '', tone: 'slate' })
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          !query ||
          u.fullName?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  )

  const create = async (e) => {
    e.preventDefault()
    setMsg({ text: '', tone: 'slate' })
    try {
      await api.post('/admin/users', form)
      setForm({ fullName: '', email: '', password: '', role: 'OPERATOR' })
      setMsg({ text: 'Usuario creado correctamente', tone: 'emerald' })
      onCreated()
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error al crear el usuario', tone: 'red' })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Usuarios de la empresa</h3>
            <p className="text-xs text-slate-400">ADMIN gestiona todo; OPERADOR carga y procesa datos.</p>
          </div>
        </div>
        <div className="relative mb-4">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario..."
            className="input-base pl-9"
            aria-label="Buscar usuario"
          />
        </div>
        <div className="max-h-[380px] space-y-3 overflow-y-auto scrollbar-thin pr-1">
          {filtered.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-400">
              No se encontraron usuarios.
            </p>
          ) : (
            filtered.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 transition-all hover:bg-slate-100/70 hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white">
                    {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{u.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <RoleBadge role={u.role} />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-bold text-slate-900">Nuevo usuario</h3>
        <p className="mb-4 text-xs text-slate-400">Se crea dentro de tu empresa (multi-tenant).</p>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre completo</label>
            <input
              required
              placeholder="Juan Pérez"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input
              required
              type="email"
              placeholder="usuario@empresa.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Contraseña</label>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input-base"
            >
              <option value="OPERATOR">Operador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <button className="btn-secondary w-full">
            <Plus size={15} /> Crear usuario
          </button>
          {msg.text && (
            <p className={`text-xs font-medium ${msg.tone === 'red' ? 'text-red-600' : msg.tone === 'emerald' ? 'text-emerald-600' : 'text-slate-500'}`}>
              {msg.text}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

function EquipmentTab({ equipments, onCreated }) {
  const [form, setForm] = useState({ code: '', name: '', area: '', type: '' })
  const [msg, setMsg] = useState({ text: '', tone: 'slate' })
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      equipments.filter(
        (eq) =>
          !query ||
          eq.code?.toLowerCase().includes(query.toLowerCase()) ||
          eq.name?.toLowerCase().includes(query.toLowerCase()) ||
          eq.area?.toLowerCase().includes(query.toLowerCase()),
      ),
    [equipments, query],
  )

  const create = async (e) => {
    e.preventDefault()
    setMsg({ text: '', tone: 'slate' })
    try {
      await api.post('/admin/equipments', form)
      setForm({ code: '', name: '', area: '', type: '' })
      setMsg({ text: 'Equipo agregado al catálogo', tone: 'emerald' })
      onCreated()
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error al agregar el equipo', tone: 'red' })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="border-b border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-900">Catálogo de equipos</h3>
          <p className="mt-1 text-xs text-slate-400">
            El proceso cruza cada fila del archivo contra este catálogo.
          </p>
          <div className="relative mt-4">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar equipo..."
              className="input-base pl-9"
              aria-label="Buscar equipo"
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            {equipments.length === 0
              ? 'Todavía no hay equipos en el catálogo.'
              : 'No se encontraron equipos.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-hover w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-semibold">Código</th>
                  <th className="px-4 py-2 font-semibold">Nombre</th>
                  <th className="px-4 py-2 font-semibold">Área</th>
                  <th className="px-4 py-2 font-semibold">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((eq) => (
                  <tr key={eq.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-amber-600">{eq.code}</td>
                    <td className="px-4 py-2.5 text-slate-700">{eq.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{eq.area || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500">{eq.type || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-bold text-slate-900">Nuevo equipo</h3>
        <p className="mb-4 text-xs text-slate-400">Debe coincidir con el código usado en tus archivos.</p>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Código</label>
            <input
              required
              placeholder="CAM-04"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="input-base font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
            <input
              required
              placeholder="Camión 785C-04"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Área</label>
            <input
              placeholder="CHACRA, SUR, NORESTE"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tipo de equipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input-base"
            >
              <option value="">Seleccionar tipo...</option>
              <option value="CAMION">Camión</option>
              <option value="CARGADOR">Cargador</option>
              <option value="PERFORADORA">Perforadora</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <button className="btn-secondary w-full">
            <Plus size={15} /> Agregar equipo
          </button>
          {msg.text && (
            <p className={`text-xs font-medium ${msg.tone === 'red' ? 'text-red-600' : msg.tone === 'emerald' ? 'text-emerald-600' : 'text-slate-500'}`}>
              {msg.text}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}