import { useEffect } from 'react'

const STEPS = [
  { key: 'queued', label: 'Job queued' },
  { key: 'generating', label: 'Generating entries' },
  { key: 'checking', label: 'Quality check' },
  { key: 'ready', label: 'Ready to review' },
]

const getStepIndex = (status) => {
  if (!status) return 0
  if (status === 'completed') return 4
  if (status === 'failed') return -1
  if (status === 'running') return 2
  if (status === 'pending' || status === 'queued') return 1
  return 0
}

export default function JobStatus({ job, onPoll }) {
  useEffect(() => {
    if (!job?.jobId || job?.status === 'completed' || job?.status === 'failed') return
    const id = setInterval(() => onPoll(job.jobId), 5000)
    return () => clearInterval(id)
  }, [job?.jobId, job?.status, onPoll])

  const activeStep = getStepIndex(job?.status)

  return (
    <div className="mx-auto w-full space-y-6" style={{ maxWidth: 'var(--max-w-lobby)' }}>
      <div className="bg-white border border-slate-200 rounded-[16px] p-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-700">Generating your game</h3>

        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const done = i < activeStep
            const active = i === activeStep
            const future = i > activeStep

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-all ${
                  done ? 'bg-emerald-500 text-white' :
                  active ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-600' :
                  'bg-slate-100 text-slate-300'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-semibold transition-colors ${
                  done ? 'text-emerald-600' : active ? 'text-slate-900' : 'text-slate-300'
                }`}>
                  {step.label}
                  {active && <span className="inline-block ml-2 animate-pulse text-emerald-500">…</span>}
                </span>
              </div>
            )
          })}
        </div>

        {job?.status === 'failed' && (
          <p className="text-xs font-semibold text-red-500">{job.error?.message || 'Job failed.'}</p>
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-[16px] p-5 text-center space-y-2">
        <p className="text-sm font-black text-emerald-700">You can close this page</p>
        <p className="text-xs text-emerald-600">Your game will appear in My Games once it's ready.</p>
      </div>
    </div>
  )
}
