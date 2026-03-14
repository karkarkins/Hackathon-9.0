import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { evaluatePitch } from '../lib/claudeApi'
import RadarChart from './RadarChart'

export default function AIFeedbackPanel({ pitchId, pitch, aiFeedback, onFeedbackUpdate }) {
  const [refinedPitch, setRefinedPitch] = useState(aiFeedback?.refined_pitch ?? '')
  const [saving, setSaving] = useState(false)
  const [rerunning, setRerunning] = useState(false)

  const similarStories = Array.isArray(aiFeedback?.similar_stories) ? aiFeedback.similar_stories : []

  async function handleSaveRefined() {
    setSaving(true)
    await supabase.from('pitches').update({ description: refinedPitch }).eq('id', pitchId)
    setSaving(false)
  }

  async function handleRerunAI() {
    setRerunning(true)
    try {
      const result = await evaluatePitch(pitch)
      onFeedbackUpdate(result)
      setRefinedPitch(result.refined_pitch || '')
    } catch (e) {
      console.error(e)
      alert('AI evaluation failed: ' + (e.message || 'Unknown error'))
    }
    setRerunning(false)
  }

  return (
    <div className="mt-6 p-4 bg-fish-foam/50 rounded-xl border border-fish-light/50">
      <h3 className="font-semibold text-fish-pond mb-4">AI Feedback</h3>
      <RadarChart feedback={aiFeedback} />
      {aiFeedback?.summary && (
        <p className="text-stone-700 text-sm mt-4">{aiFeedback.summary}</p>
      )}
      {similarStories.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-stone-700 mb-2">Similar success stories</h4>
          <ul className="list-disc list-inside text-sm text-stone-600 space-y-1">
            {similarStories.map((s, i) => (
              <li key={i}>
                <strong>{s.company}</strong> ({s.industry}) — {s.lesson}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-stone-700 mb-2">Refined pitch (editable)</h4>
        <textarea
          value={refinedPitch}
          onChange={(e) => setRefinedPitch(e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-none"
          rows={6}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSaveRefined}
            disabled={saving}
            className="px-4 py-2 bg-fish-pond text-white text-sm rounded-lg hover:bg-fish-deep disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleRerunAI}
            disabled={rerunning}
            className="px-4 py-2 bg-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-300 disabled:opacity-50"
          >
            {rerunning ? 'Running…' : 'Re-run AI Evaluation'}
          </button>
        </div>
      </div>
    </div>
  )
}
