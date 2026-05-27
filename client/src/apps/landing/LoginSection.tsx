import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';

function redirectFor(role: UserRole) {
  if (role === 'admin') return '/ops/dashboard';
  if (role === 'dispatcher') return '/ops/flights';
  return '/crew/roster';
}

export function LoginSection() {
  const navigate = useNavigate();
  const login = useAuth((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const role = await login(email, password);
      navigate(redirectFor(role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-section" id="login">
      <div className="login-wrap">
        <div className="overline">SIGN IN</div>
        <h2>Welcome back.</h2>
        <form className="login-card" onSubmit={onSubmit}>
          <Input autoFocus placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <div style={{ position: 'relative' }}>
            <Input placeholder="Password" type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} />
            <button className="icon-btn" type="button" onClick={() => setShow((value) => !value)} style={{ position: 'absolute', right: 4, top: 3 }} aria-label="Toggle password visibility">
              {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
            </button>
          </div>
          <div className="error">{error}</div>
          <Button variant="primary" loading={loading} type="submit">Sign in</Button>
        </form>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 14 }}>Use the credentials provided by your administrator.</p>
      </div>
    </section>
  );
}
