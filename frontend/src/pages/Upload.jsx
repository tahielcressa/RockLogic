import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Rocket,
  Table2,
  CircleAlert,
  CloudUpload,
  Check,
} from 'lucide-react'
import api from '../api'
import { Badge } from './Dashboard'

const EXPECTED = ['fecha', 'turno', 'zona', 'equipo', 'tonelaje', 'ley_cu', 'estado']
const ALLOWED = ['.csv', '.xlsx', '.xls']

export default function Upload() {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [upload, setUpload] = useState(null)
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED.includes(ext)) {
      setError(`Formato no permitido (${ext}). Usa CSV o Excel (.xlsx / .xls).`)
      return
    }
    setError('')
    setRun(null)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUpload(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir el archivo')
    } finally {
      setLoading(false)
    }
  }

  const process = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post(`/uploads/${upload.id}/run`)
      setRun(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const download = async (type) => {
    const res = await api.get(`/runs/${run.id}/download/${type}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = type === 'excel' ? run.excelFileName : run.pdfFileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const step = run ? 3 : upload ? 2 : 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Cargar datos de operación
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sube un Excel (.xlsx) o CSV. El sistema valida, transforma y cruza con el catálogo de
          equipos automáticamente.
        </p>
      </div>

      <Stepper step={step} />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files[0])
        }}
        onClick={() => inputRef.current?.click()}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
          dragging
            ? 'scale-[1.01] border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10'
            : 'border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50/40 hover:shadow-md'
        }`}
        aria-label="Zona para subir archivo"
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all group-hover:scale-110 ${
            dragging ? 'bg-amber-500 text-slate-900' : 'bg-amber-500/15'
          }`}
        >
          {loading ? (
            <Loader2 size={30} className="animate-spin text-amber-600" />
          ) : (
            <CloudUpload size={30} className="text-amber-600" />
          )}
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">
            {loading ? 'Subiendo archivo...' : 'Arrastra tu archivo aquí'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            o haz clic para seleccionarlo — CSV o Excel (.xlsx / .xls)
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".csv,.xlsx,.xls"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      <div className="rounded-2xl bg-slate-900 p-5 text-slate-300 shadow-lg">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
          <Table2 size={16} className="text-amber-500" />
          Formato esperado
        </div>
        <div className="flex flex-wrap gap-2">
          {EXPECTED.map((c) => (
            <code
              key={c}
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-400 ring-1 ring-slate-700"
            >
              {c}
            </code>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
          <CircleAlert size={14} className="mt-0.5 shrink-0" />
          El equipo debe existir en el catálogo (Administración → Usuarios y equipos). Ejemplos de
          fecha: 12/09/2026 → Turno A/B/C → tonelaje con punto o coma decimal.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <XCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {upload && (
        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Archivo subido
              </p>
              <p className="truncate text-lg font-bold text-slate-900">{upload.originalName}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {(upload.sizeBytes / 1024).toFixed(1)} KB ·{' '}
                {new Date(upload.createdAt).toLocaleString('es-AR')}
              </p>
            </div>
            <Badge status={upload.status} />
          </div>

          {!run ? (
            <button onClick={process} disabled={loading} className="btn-primary mt-6">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
              {loading ? 'Procesando...' : 'Ejecutar proceso (validar + transformar + cruzar)'}
            </button>
          ) : (
            <ResultCard run={run} onDownload={download} />
          )}
        </div>
      )}
    </div>
  )
}

function Stepper({ step }) {
  const steps = ['Subir archivo', 'Procesar', 'Descargar reportes']
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold" aria-label="Progreso">
      {steps.map((label, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 transition-all ${
                done
                  ? 'bg-emerald-500 text-white ring-emerald-400'
                  : active
                    ? 'bg-amber-500 text-slate-900 ring-amber-400 shadow-md shadow-amber-500/30'
                    : 'bg-white text-slate-400 ring-slate-200'
              }`}
            >
              {done ? <Check size={14} /> : n}
            </span>
            <span
              className={
                active ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-400'
              }
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-8 bg-slate-200 sm:w-16" />}
          </li>
        )
      })}
    </ol>
  )
}

function ResultCard({ run, onDownload }) {
  if (run.status === 'ERROR') {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        <XCircle size={20} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">El proceso falló</p>
          <p className="text-sm text-red-600">{run.logs?.split('\n').at(-1)}</p>
        </div>
      </div>
    )
  }

  const invalidPct =
    run.totalRows > 0 ? Math.round((run.invalidRows / run.totalRows) * 100) : 0

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200">
          <CheckCircle2 size={20} className="text-emerald-600" />
        </span>
        <div>
          <p className="font-semibold text-emerald-700">
            Proceso completado en {(run.durationMs / 1000).toFixed(1)} s
          </p>
          {run.invalidRows > 0 && (
            <p className="text-xs text-slate-500">
              {invalidPct}% de las filas requieren revisión
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Filas totales', value: run.totalRows },
          { label: 'Válidas', value: run.validRows, tone: 'text-emerald-600' },
          { label: 'Inválidas', value: run.invalidRows, tone: run.invalidRows > 0 ? 'text-red-500' : '' },
          { label: 'Tonelaje (t)', value: run.totalTonnage },
          { label: 'Ley media Cu (%)', value: run.avgGrade },
          { label: 'Duración', value: `${(run.durationMs / 1000).toFixed(1)} s` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <p className={`text-xl font-extrabold ${s.tone || 'text-slate-900'}`}>{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => onDownload('excel')} className="btn-primary !bg-emerald-600 !text-white hover:!bg-emerald-500">
          <Download size={15} /> Excel detallado
        </button>
        <button onClick={() => onDownload('pdf')} className="btn-primary !bg-red-600 !text-white hover:!bg-red-500">
          <Download size={15} /> Reporte PDF
        </button>
        <Link to="/historial" className="btn-ghost">
          Ver en historial
        </Link>
      </div>

      {run.logs && (
        <details className="group rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900">
            Ver log de ejecución
          </summary>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-300">
            {run.logs}
          </pre>
        </details>
      )}
    </div>
  )
}
