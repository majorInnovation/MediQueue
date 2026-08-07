'use client'

import { X, MessageSquare, Sparkles, ArrowRight } from 'lucide-react'

const prompts = [
  'What is current queue status?',
  'Who is next?',
  'How long is waiting time?',
  'Show me urgent patients',
]

export function AIChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <section className="relative z-10 w-full max-w-md rounded-t-3xl bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Clinic AI</p>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Ask Clinic AI</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">AI assistant ready</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Use these quick prompts to surface urgent queue insights.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {prompts.map((prompt) => (
              <button key={prompt} className="flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-left text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
                <span>{prompt}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">Chat</div>
          <div className="space-y-3">
            <div className="rounded-3xl bg-slate-100 dark:bg-slate-900 p-4">
              <p className="text-sm text-slate-900 dark:text-slate-100">What is current queue status?</p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Estimated wait is 9 minutes. 3 patients are active.</p>
            </div>
            <div className="rounded-3xl bg-blue-50 dark:bg-blue-900/20 p-4">
              <p className="text-sm text-slate-900 dark:text-white">Who is next?</p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Patient Q-0248 is currently being prepared by triage.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
