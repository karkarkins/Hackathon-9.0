import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

async function extractTextFromPdf(file) {
  const pdfjsLib = await import('pdfjs-dist')
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  }
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const numPages = pdf.numPages
  let text = ''
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item) => item.str).join(' ') + '\n'
  }
  return text.trim()
}

async function extractTextFromFile(file) {
  if (file.type === 'application/pdf') {
    return extractTextFromPdf(file)
  }
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return file.text()
  }
  throw new Error('Unsupported file type. Use .pdf or .txt')
}

export default function KnowledgeBaseUploader({ onUpload }) {
  const [dragging, setDragging] = useState(false)
  const [pasting, setPasting] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const uploadContent = useCallback(async (name, content, type) => {
    if (!content?.trim()) return
    setUploading(true)
    setError('')
    const { error: err } = await supabase.from('knowledge_base').insert({
      name,
      type,
      content: content.trim(),
      active: true,
    })
    setUploading(false)
    if (err) {
      setError(err.message)
      return
    }
    onUpload?.()
  }, [onUpload])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setDragging(false)
    const files = [...(e.dataTransfer?.files || [])].filter(
      (f) => f.name.endsWith('.pdf') || f.name.endsWith('.txt')
    )
    for (const file of files) {
      try {
        const text = await extractTextFromFile(file)
        await uploadContent(file.name, text, 'file')
      } catch (err) {
        setError(err.message || 'Failed to extract text')
      }
    }
  }, [uploadContent])

  const handlePasteSubmit = useCallback(() => {
    const name = 'Pasted text ' + new Date().toISOString().slice(0, 19)
    uploadContent(name, pasting, 'text')
    setPasting('')
  }, [pasting, uploadContent])

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragging ? 'border-fish-pond bg-fish-foam/30' : 'border-stone-300 bg-stone-50'
        }`}
      >
        <p className="text-stone-600 mb-2">Drop .pdf or .txt files here (client-side extraction)</p>
        <input
          type="file"
          accept=".pdf,.txt"
          multiple
          className="hidden"
          id="kb-file-input"
          onChange={async (e) => {
            const files = [...(e.target.files || [])]
            for (const file of files) {
              try {
                const text = await extractTextFromFile(file)
                await uploadContent(file.name, text, 'file')
              } catch (err) {
                setError(err.message || 'Failed to extract text')
              }
            }
            e.target.value = ''
          }}
        />
        <label htmlFor="kb-file-input" className="cursor-pointer px-4 py-2 bg-fish-pond text-white rounded-lg inline-block">
          Choose files
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Or paste raw text (success stories, rubric notes)</label>
        <textarea
          value={pasting}
          onChange={(e) => setPasting(e.target.value)}
          placeholder="Paste text here…"
          className="w-full px-3 py-2 border border-stone-300 rounded-lg resize-none"
          rows={4}
        />
        <button
          type="button"
          onClick={handlePasteSubmit}
          disabled={!pasting.trim() || uploading}
          className="mt-2 px-4 py-2 bg-fish-pond text-white text-sm rounded-lg hover:bg-fish-deep disabled:opacity-50"
        >
          Add to knowledge base
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}
