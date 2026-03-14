import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { evaluatePitch } from '../lib/claudeApi'

const INDUSTRIES = ['Tech', 'Health', 'Education', 'Finance', 'Retail', 'Food', 'Other']
const STAGES = [
  { value: 'idea', label: 'Idea' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'mvp', label: 'MVP' },
]

const STEPS = ['Basics', 'Description', 'Visibility', 'Review']

export default function SubmitPitch() {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    industry: 'Tech',
    target_demographic: '',
    stage: 'idea',
    description: '',
    status: 'draft',
  })

  useEffect(() => {
    if (editId) {
      supabase.from('pitches').select('*').eq('id', editId).single().then(({ data }) => {
        if (data) setForm({
          title: data.title || '',
          industry: data.industry || 'Tech',
          target_demographic: data.target_demographic || '',
          stage: data.stage || 'idea',
          description: data.description || '',
          status: data.status || 'draft',
        })
      })
    }
  }, [editId])

  function update(fields) {
    setForm((prev) => ({ ...prev, ...fields }))
  }

  function canNext() {
    if (step === 1) return form.title.trim() && form.target_demographic.trim()
    if (step === 2) return form.description.trim().length >= 100
    return true
  }

  async function handleSubmit() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setLoading(true)
    const payload = {
      creator_id: user.id,
      title: form.title.trim(),
      industry: form.industry,
      target_demographic: form.target_demographic.trim(),
      stage: form.stage,
      description: form.description.trim(),
      status: form.status,
    }
    let pitchId = editId
    if (editId) {
      await supabase.from('pitches').update(payload).eq('id', editId)
    } else {
      const { data: inserted } = await supabase.from('pitches').insert(payload).select('id').single()
      pitchId = inserted?.id
    }
    if (!pitchId) {
      setLoading(false)
      return
    }
    const fullPitch = { id: pitchId, ...payload }
    try {
      await evaluatePitch(fullPitch)
    } catch (e) {
      console.error('AI evaluation failed', e)
    }
    setLoading(false)
    navigate(`/pitch/${pitchId}`)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-fish-pond mb-2">{editId ? 'Edit' : 'Submit'} Pitch</h1>
      <div className="flex gap-2 mb-8">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i + 1)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              step === i + 1 ? 'bg-fish-pond text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        {step === 1 && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                placeholder="Pitch title"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => update({ industry: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">Target demographic</label>
              <input
                value={form.target_demographic}
                onChange={(e) => update({ target_demographic: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                placeholder="Who is this for?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => update({ stage: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <label className="block text-sm font-medium text-stone-700 mb-1">Full pitch description (min 100 characters)</label>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg resize-none"
              rows={8}
              placeholder="Describe your idea, problem, solution, and vision…"
            />
            <p className="text-sm text-stone-500 mt-1">{form.description.length} characters</p>
          </>
        )}

        {step === 3 && (
          <>
            <label className="block text-sm font-medium text-stone-700 mb-1">Visibility</label>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="status-draft"
                checked={form.status === 'draft'}
                onChange={() => update({ status: 'draft' })}
              />
              <label htmlFor="status-draft">Draft — only you can see it</label>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="radio"
                id="status-public"
                checked={form.status === 'public'}
                onChange={() => update({ status: 'public' })}
              />
              <label htmlFor="status-public">Public — appears in the feed for reviewers and sponsors</label>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {form.title}</p>
            <p><strong>Industry:</strong> {form.industry}</p>
            <p><strong>Target:</strong> {form.target_demographic}</p>
            <p><strong>Stage:</strong> {STAGES.find((s) => s.value === form.stage)?.label}</p>
            <p><strong>Status:</strong> {form.status}</p>
            <p><strong>Description:</strong></p>
            <p className="whitespace-pre-wrap text-stone-600 border border-stone-100 rounded p-2">{form.description}</p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="px-4 py-2 bg-fish-pond text-white rounded-lg hover:bg-fish-deep disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-fish-pond text-white rounded-lg hover:bg-fish-deep disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
