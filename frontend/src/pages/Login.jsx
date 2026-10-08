import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mountain, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth'

const demos = [
  { label: 'Admin', email: 'admin@mineraandina.com', password: 'admin123' },
  { label: 'Operador', email: 'operador@mineraandina.com', password: 'oper123' },
  { label: 'Otra empresa', email: 'admin@minadelsur.com', password: 'admin123' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@mineraandina.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.15),transparent_50%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30">
            <Mountain size={26} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">RockLogic</h1>
            <p className="text-sm text-slate-400">Gestión inteligente de operaciones mineras</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-white/10">
          <h2 className="text-xl font-bold text-slate-900">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-slate-500">Accede a tu empresa y sus datos</p>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="tucorreo@empresa.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <ShieldCheck size={13} /> Cuentas de prueba
            </p>
            <div className="flex flex-wrap gap-2">
              {demos.map((d) => (
                <button
                  key={d.label}
                  onClick={() => {
                    setEmail(d.email)
                    setPassword(d.password)
                    setError('')
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-amber-100 hover:text-amber-800 hover:shadow-sm"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          MVP RockLogic — Los Menudos Desarrollo
        </p>
      </div>
    </div>
  )
}
