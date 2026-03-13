import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { apiClient } from '@/services/apiClient'

export default function ProfilePage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const [preferredTopics, setPreferredTopics] = useState<string[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    apiClient
      .get('/users/me')
      .then((res) => {
        setPreferredTopics(res.data.preferences?.preferredTopics ?? [])
        setTheme(res.data.preferences?.theme ?? 'light')
      })
      .catch((err) => console.error(err))
  }, [user])

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiClient.put('/users/me/preferences', { preferredTopics, theme })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleTopicsChange = (value: string) => {
    const topics = value.split(',').map((t) => t.trim())
    setPreferredTopics(topics.filter(Boolean))
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Profile & Preferences</h2>
        <p className="text-sm text-slate-400">
          Update your learning interests and visual theme for the app.
        </p>
      </header>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
        <div>
          <p className="font-medium">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            Preferred topics (comma separated)
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={preferredTopics.join(', ')}
            onChange={(e) => handleTopicsChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Theme</label>
          <select
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-sky-600 px-3 py-2 text-xs font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

