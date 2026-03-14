import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ContactRequestModal({ pitchId, creatorId, onClose }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setLoading(true)
    await supabase.from('contact_requests').insert({
      pitch_id: pitchId,
      sponsor_id: user.id,
      creator_id: creatorId,
      message,
      status: 'pending',
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-stone-900 mb-2">Reach out to creator</h3>
        <p className="text-sm text-stone-600 mb-4">
          Your message will be sent as a contact request. The creator must accept before any contact info is shared.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message…"
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-none mb-4"
            rows={4}
            required
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-fish-pond text-white rounded-lg hover:bg-fish-deep disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
