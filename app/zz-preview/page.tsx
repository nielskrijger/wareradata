import { connection } from 'next/server'
import { PageShell } from '@/components/layout/page-shell'
import { UsersTable } from '@/app/users/users-table'

export default async function Preview() {
  await connection()
  return <PageShell title="Users" subtitle="Preview"><UsersTable initial={{ rows: [], total: 0 }} /></PageShell>
}
