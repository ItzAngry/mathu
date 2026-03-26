import { createClient } from '@/lib/supabaseServer'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: chaptersCount }, { count: nodesCount }, { count: questionsCount }, { count: usersCount }] =
    await Promise.all([
      supabase.from('chapters').select('*', { count: 'exact', head: true }),
      supabase.from('nodes').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    ])

  const stats = [
    { label: 'Kapitel', value: chaptersCount ?? 0, icon: '📚', color: '#6C63FF' },
    { label: 'Noder', value: nodesCount ?? 0, icon: '🗺️', color: '#43C6AC' },
    { label: 'Frågor', value: questionsCount ?? 0, icon: '❓', color: '#FF6584' },
    { label: 'Användare', value: usersCount ?? 0, icon: '👥', color: '#F59E0B' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-text mb-6">Översikt</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-5">
            <div className="text-3xl mb-2" aria-hidden="true">{stat.icon}</div>
            <div className="text-2xl font-bold text-text" aria-label={`${stat.value} ${stat.label}`}>
              {stat.value}
            </div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-text mb-4">Snabblänkar</h3>
        <div className="flex flex-col gap-2 text-sm">
          <a href="/admin/questions" className="text-primary hover:underline">→ Hantera frågor</a>
          <a href="/admin/tests" className="text-primary hover:underline">→ Hantera prov & noder</a>
        </div>
      </div>
    </div>
  )
}
