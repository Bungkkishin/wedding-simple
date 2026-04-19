'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('our-wedding')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleLogin() {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('이메일 또는 비밀번호가 맞지 않아요'); setLoading(false); return }
    router.push('/room')
    router.refresh()
  }

  async function handleSignup() {
    if (!name.trim()) { setError('이름을 입력해주세요'); return }
    setLoading(true); setError('')

    // 1. 방 존재 확인
    const { data: room } = await supabase.from('rooms').select('id').eq('id', roomId.trim()).single()
    if (!room) { setError(`'${roomId}' 방을 찾을 수 없어요. 방 코드를 확인해주세요`); setLoading(false); return }

    // 2. 계정 생성
    const { data, error: signupErr } = await supabase.auth.signUp({ email, password })
    if (signupErr) { setError(signupErr.message); setLoading(false); return }

    // 3. 프로필 생성
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        room_id: roomId.trim(),
        display_name: name.trim(),
      })
    }

    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-stone-100 fade-up">
        <div className="text-4xl mb-4">💌</div>
        <h2 className="font-serif text-2xl text-stone-800 mb-2">가입 완료!</h2>
        <p className="text-sm text-stone-500 mb-6">
          이메일({email})로 확인 링크를 보냈어요.<br />
          확인 후 로그인해주세요.
        </p>
        <button onClick={() => { setDone(false); setMode('login') }}
          className="w-full py-3 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors">
          로그인하러 가기
        </button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      {/* Soft background blob */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-50 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-stone-100 rounded-full blur-3xl opacity-60 -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-sm fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-[.25em] text-stone-400 uppercase mb-2">Wedding Checklist</p>
          <h1 className="font-serif text-4xl font-light text-stone-800">
            {mode === 'login' ? '로그인' : '시작하기'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-stone-200 overflow-hidden text-sm">
            <button onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2.5 font-medium transition-colors ${mode === 'login' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>
              로그인
            </button>
            <button onClick={() => { setMode('signup'); setError('') }}
              className={`flex-1 py-2.5 font-medium transition-colors ${mode === 'signup' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>
              회원가입
            </button>
          </div>

          {/* Signup only fields */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs text-stone-400 mb-1.5">이름 (체크리스트에 표시됨)</label>
                <input
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:border-rose-300 transition-colors"
                  placeholder="예: 신부 지수"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1.5">방 코드</label>
                <input
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 font-mono focus:border-rose-300 transition-colors"
                  placeholder="our-wedding"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                />
                <p className="text-xs text-stone-400 mt-1">파트너에게 방 코드를 받으세요</p>
              </div>
            </>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-xs text-stone-400 mb-1.5">이메일</label>
            <input
              type="email"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:border-rose-300 transition-colors"
              placeholder="hello@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            />
          </div>
          <div>
            <label className="block text-xs text-stone-400 mb-1.5">비밀번호</label>
            <input
              type="password"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:border-rose-300 transition-colors"
              placeholder="6자 이상"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            />
          </div>

          {error && <p className="text-xs text-rose-500 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading || !email || !password}
            className="w-full py-3.5 bg-rose-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-rose-600 transition-colors"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </div>
      </div>
    </main>
  )
}
