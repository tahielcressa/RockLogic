import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  ChevronDown,
  History as HistoryIcon,
} from 'lucide-react'
import api from '../api'
import { Badge } from './Dashboard'

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'OK', label: 'OK' },
  { id: 'ERROR', label: 'Error' },
]

export default function History() {
  const [runs, setRuns] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = () => {
    api
      .get('/runs')
      .then((res) => setRuns(res.data))
      .catch(() => setRuns([]))
  }

  useEffect(load, [])

  const download = async (run, type) => {
    const res = await api.get(`/runs/${run.id}/download/${type}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = type === 'excel' ? run.excelFileName : run.pdfFileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    if (!runs) return []
    return runs.filter((r) => {
      const matchQuery =
        !query ||
        r.originalName?.toLowerCase().includes(query.toLowerCase()) ||
        r.executedByName?.toLowerCase().includes(query.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
      return matchQuery && matchStatus
    })
  }, [runs, query, statusFilter])

  if (!runs) {
    return (
      <div className="flex items-center gap-3 text-slate-500" role="status">
        <Loader2 size={20} className="animate-spin" /> Cargando historial...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Historial de ejecuciones
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cada proceso guarda su resultado, KPIs, reportes generados y log de validación.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por archivo o usuario..."
            className="input-base pl-9"
            aria-label="Buscar en historial"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
            <HistoryIcon size={26} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Todavía no hay procesos</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Los procesos ejecutados en esta empresa aparecerán aquí.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          No se encontraron resultados para la búsqueda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="overflow-x-auto">
            <table className="table-hover w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Archivo</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Válidas / Inválidas</th>
                  <th className="px-4 py-3 font-semibold">Tonelaje</th>
                  <th className="px-4 py-3 font-semibold">Ley Cu</th>
                  <th className="px-4 py-3 font-semibold">Reportes</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <Row
                    key={r.id}
                    run={r}
                    expanded={expanded === r.id}
                    onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                    onDownload={download}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {runs.length > 0 && (
        <p className="text-xs text-slate-400">
          {filtered.length} de {runs.length} procesos
        </p>
      )}
    </div>
  )
}

function Row({ run, expanded, onToggle, onDownload }) {
  return (
    <>
      <tr className="border-b border-slate-100">
        <td className="px-4 py-3">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-left font-medium text-slate-800 transition-colors hover:text-amber-600"
            aria-expanded={expanded}
          >
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            <span className="max-w-[180px] truncate">{run.originalName}</span>
          </button>
        </td>
        <td className="px-4 py-3 text-slate-500">
          {run.finishedAt ? new Date(run.finishedAt).toLocaleString('es-AR') : '—'}
        </td>
        <td className="px-4 py-3">
          <Badge status={run.status} />
        </td>
        <td className="px-4 py-3 text-slate-600">
          <span className="font-semibold text-emerald-600">{run.validRows}</span>
          {' / '}
          <span className="font-semibold text-red-500">{run.invalidRows}</span>
        </td>
        <td className="px-4 py-3 text-slate-600">{run.totalTonnage ?? '—'}</td>
        <td className="px-4 py-3 text-slate-600">{run.avgGrade ?? '—'}</td>
        <td className="px-4 py-3">
          {run.status === 'OK' && (
            <div className="flex gap-2">
              <button
                onClick={() => onDownload(run, 'excel')}
                className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 transition-all ring-1 ring-emerald-100 hover:bg-emerald-100"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button
                onClick={() => onDownload(run, 'pdf')}
                className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-all ring-1 ring-red-100 hover:bg-red-100"
              >
                <FileText size={14} /> PDF
              </button>
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-slate-500">{run.executedByName}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50/70">
          <td colSpan={8} className="px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>
                Tipo: <b className="text-slate-700">{run.runType}</b>
              </span>
              <span>
                Duración: <b className="text-slate-700">{(run.durationMs / 1000).toFixed(1)} s</b>
              </span>
              <span>
                Ejecutado por: <b className="text-slate-700">{run.executedByName}</b>
              </span>
              <span>
                Inicio: <b className="text-slate-700">{run.startedAt ?? '—'}</b>
              </span>
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-300">
              {run.logs || 'Sin log'}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}
