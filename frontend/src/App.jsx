import { useCallback, useMemo, useState } from 'react'
import axios from 'axios'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import './App.css'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
})

function App() {
  const [lintResult, setLintResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>தமிழ் தொழில்நுட்ப உள்ளடக்கத்தை இங்கே உள்ளிடுங்கள்...</p>',
  })

  const plainText = useMemo(() => editor?.getText() ?? '', [editor])

  const handleLint = useCallback(async () => {
    if (!editor) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data } = await apiClient.post('/lint', { content: plainText })
      setLintResult(data)
    } catch {
      setError('Lint request failed. Ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }, [editor, plainText])

  return (
    <main className="container">
      <h1>MozhiMathi AI - Tamil Technical Linter</h1>
      <p>RAG-ready linting workflow for Tamil technical writing.</p>

      <section className="panel">
        <h2>Rich Text Editor</h2>
        <EditorContent editor={editor} className="editor" />
        <button type="button" onClick={handleLint} disabled={loading || !plainText.trim()}>
          {loading ? 'Linting...' : 'Analyze Content'}
        </button>
      </section>

      {error && <p className="error">{error}</p>}

      {lintResult && (
        <section className="panel">
          <h2>Lint Issues</h2>
          <ul>
            {lintResult.issues.length === 0 && <li>No issues found.</li>}
            {lintResult.issues.map((issue, index) => (
              <li key={`${issue.type}-${index}`}>
                <strong>{issue.type}:</strong> {issue.message} <em>{issue.suggestion}</em>
              </li>
            ))}
          </ul>
          <h3>RAG Context</h3>
          <ul>
            {lintResult.rag_context.length === 0 && <li>No context documents yet.</li>}
            {lintResult.rag_context.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

export default App
