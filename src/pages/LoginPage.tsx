import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { GoogleIcon } from '@/components/GoogleIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const { session, loading: sessionLoading } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  if (!sessionLoading && session) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={redirectTo} replace />
  }

  async function handleGoogleSignIn() {
    setError(null)
    setGoogleLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (signInError) {
      setError(signInError.message)
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-2 text-[15px] text-muted">Sign in to see this month at a glance.</p>

      <Button
        type="button"
        variant="secondary"
        className="mt-8"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
      >
        <GoogleIcon className="h-[18px] w-[18px]" />
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </Button>

      <div className="my-7 flex items-center gap-3.5">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs tracking-wide text-muted-light">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-semibold text-[#4a453e]">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-semibold text-[#4a453e]">
              Password
            </label>
            <Link to="/forgot-password" className="text-[12.5px] font-medium text-tan-dark hover:text-tan-darker">
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            spellCheck={false}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p ref={errorRef} role="alert" tabIndex={-1} className="text-[13px] text-red-700 outline-none">
            {error} Double-check your email and password, or{' '}
            <Link to="/forgot-password" className="font-semibold underline">
              reset it
            </Link>
            .
          </p>
        )}

        <Button type="submit" className="mt-2" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to kovo?{' '}
        <Link to="/signup" className="font-semibold text-tan-dark hover:text-tan-darker">
          Create an account
        </Link>
      </p>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-light">
        By continuing you agree to kovo's{' '}
        <Link to="/privacy" className="text-tan-dark hover:text-tan-darker">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link to="/terms" className="text-tan-dark hover:text-tan-darker">
          Terms of Use
        </Link>
      </p>
    </AuthLayout>
  )
}
