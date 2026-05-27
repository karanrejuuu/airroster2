import { LogOut } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useAuth } from '../../../hooks/useAuth';

export function SettingsPage({ onSignedOut }: { onSignedOut: () => void }) {
  const logout = useAuth((state) => state.logout);
  async function signOut() {
    await logout();
    onSignedOut();
  }
  return (
    <>
      <div className="page-head"><div className="page-title"><div className="overline">ADMIN</div><h1>Settings</h1><p>Session and environment</p></div></div>
      <section className="panel"><div className="panel-body"><Button variant="danger" icon={<LogOut size={16} strokeWidth={1.5} />} onClick={() => void signOut()}>Sign out</Button></div></section>
    </>
  );
}
