import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import KnowledgeBaseUploader from '../components/KnowledgeBaseUploader'

const MAX_CHARS = 8000

export default function AdminKnowledge() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('knowledge_base').select('*').order('uploaded_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const activeTotal = entries.filter((e) => e.active).reduce((sum, e) => sum + (e.content?.length || 0), 0)
  const overLimit = activeTotal > MAX_CHARS

  async function toggleActive(entry) {
    await supabase.from('knowledge_base').update({ active: !entry.active }).eq('id', entry.id)
    load()
  }

  async function deleteEntry(id) {
    if (!window.confirm('Delete this entry?')) return
    await supabase.from('knowledge_base').delete().eq('id', id)
    load()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-fish-pond mb-2">Knowledge Base Manager</h1>
      <p className="text-stone-600 mb-6">Upload text and files for Claude to use when evaluating pitches.</p>
      {overLimit && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
          Warning: total active knowledge base content ({activeTotal} characters) exceeds {MAX_CHARS} characters. Consider deactivating some entries.
        </div>
      )}
      <KnowledgeBaseUploader onUpload={load} />
      <h2 className="font-semibold text-stone-800 mt-8 mb-4">Uploaded entries</h2>
      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 bg-white border border-stone-200 rounded-lg p-4">
              <div>
                <p className="font-medium text-stone-800">{e.name}</p>
                <p className="text-sm text-stone-500">{e.type} · {(e.content?.length || 0).toLocaleString()} chars · {new Date(e.uploaded_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(e)}
                  className={`px-3 py-1 rounded text-sm ${e.active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}
                >
                  {e.active ? 'Active' : 'Inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteEntry(e.id)}
                  className="px-3 py-1 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && entries.length === 0 && (
        <p className="text-stone-500">No entries yet. Upload files or paste text above.</p>
      )}
    </div>
  )
}
