import { redirect } from 'next/navigation';
import { isAuthenticatedServer } from '@/lib/auth';
import Dashboard from './components/Dashboard';

export default async function AdminPage() {
  const authed = await isAuthenticatedServer();
  if (!authed) redirect('/login');

  return <Dashboard />;
}
