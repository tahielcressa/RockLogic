import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Truck,
  Percent,
  ArrowRight,
  FileUp,
} from 'lucide-react'
import api from '../api'

const COLORS = ['#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#ef4444']

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('es-AR'))

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Error al cargar el dashboard'))
  }, [])

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return <DashboardSkeleton />

  const cards = [
    { label: 'Procesos ejecutados', value: fmt(data.totalRuns), icon: Activity, accent: 'text-sky-600', bg: 'bg-sky-50', ring: 'ring-sky-100' },
    { label: 'Filas válidas', value: fmt(data.validRows), icon: CheckCircle2, accent: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
    { label: 'Filas inválidas', value: fmt(data.invalidRows), icon: XCircle, accent: 'text-red-500', bg: 'bg-red-50', ring: 'ring-red-100' },
    { label: 'Tonelaje total (t)', value: fmt(data.totalTonnage), icon: Truck, accent: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-100' },
    { label: 'Ley media de cobre (%)', value: fmt(data.avgGrade), icon: Percent, accent: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-100' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Dashboard de operación
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Resumen de los últimos procesos de carga y cruce de datos de tu empresa.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card group hover:-translate-y-0.5">
            <div
              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105 ${c.bg} ${c.ring} ${c.accent}`}
            >
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900">{c.value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 ring-1 ring-amber-100">
              <Truck size={15} className="text-amber-600" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Tonelaje por zona</h3>
          </div>
          <p className="mb-4 text-xs text-slate-400">En toneladas, según las filas válidas</p>
          {data.perZone.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.perZone}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                  cursor={{ fill: 'rgba(245,158,11,0.08)' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-100">
              <CheckCircle2 size={15} className="text-emerald-600" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Filas por estado</h3>
          </div>
          <p className="mb-4 text-xs text-slate-400">Distribución de equipos EN_PROCESO / DETENIDO</p>
          {data.perEstado.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.perEstado}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {data.perEstado.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <Activity size={15} className="text-slate-600" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Últimos procesos</h3>
          </div>
          <Link
            to="/historial"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-50 hover:text-amber-700"
          >
            Ver historial completo <ArrowRight size={14} />
          </Link>
        </div>
        <p className="mb-4 text-xs text-slate-400">Últimas 5 ejecuciones de tu empresa</p>

        {data.recentRuns.length === 0 ? (
          <Empty withCta />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-hover w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Archivo</th>
                  <th className="py-2 pr-4 font-semibold">Estado</th>
                  <th className="py-2 pr-4 font-semibold">Válidas</th>
                  <th className="py-2 pr-4 font-semibold">Inválidas</th>
                  <th className="py-2 pr-4 font-semibold">Tonelaje</th>
                  <th className="py-2 font-semibold">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRuns.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="max-w-[200px] truncate py-3 pr-4 font-medium text-slate-800">
                      {r.originalName}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3 pr-4 font-semibold text-emerald-600">{r.validRows}</td>
                    <td className="py-3 pr-4 font-semibold text-red-500">{r.invalidRows}</td>
                    <td className="py-3 pr-4 text-slate-600">{r.totalTonnage ?? '—'}</td>
                    <td className="py-3 text-slate-500">{r.executedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse-subtle" aria-label="Cargando dashboard" role="status">
      <div>
        <div className="h-7 w-64 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card">
            <div className="mb-3 h-10 w-10 rounded-xl bg-slate-200" />
            <div className="h-7 w-20 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card">
            <div className="mb-4 h-4 w-40 rounded bg-slate-200" />
            <div className="h-[260px] rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando dashboard...</span>
    </div>
  )
}

function Empty({ withCta = false }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">
        <FileUp size={22} className="text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600">Sin datos todavía</p>
        <p className="mt-0.5 text-xs text-slate-400">Sube un archivo para comenzar a ver métricas.</p>
      </div>
      {withCta && (
        <Link to="/cargar" className="btn-primary mt-1 text-xs">
          <FileUp size={14} /> Cargar datos
        </Link>
      )}
    </div>
  )
}

export function Badge({ status }) {
  const map = {
    OK: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    ERROR: 'bg-red-100 text-red-700 ring-red-200',
    EJECUTANDO: 'bg-sky-100 text-sky-700 ring-sky-200 animate-pulse',
    RECIBIDO: 'bg-slate-100 text-slate-600 ring-slate-200',
    PROCESADO: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        map[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {status}
    </span>
  )
}
