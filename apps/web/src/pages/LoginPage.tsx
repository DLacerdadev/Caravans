import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/http';

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('mestre@caravans.test');
  const [password, setPassword] = useState('caravans123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      nav('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function quick(as: string) {
    setEmail(as);
    setPassword('caravans123');
    setTimeout(login, 0);
  }

  return (
    <main className="shell shell--narrow center-screen">
      <div className="stack" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <p className="eyebrow" style={{ letterSpacing: '.34em' }}>Motor Narrativo Operacional</p>
          <h1 className="page-title" style={{ margin: 0 }}>Sobrevivendo<br />ao Horror</h1>
        </div>
        <form className="card stack" onSubmit={login}>
          <div className="field">
            <label htmlFor="email">Investigador</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'var(--crit)', margin: 0, fontSize: '.85rem' }}>{error}</p>}
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn--muted btn--sm" onClick={() => quick('mestre@caravans.test')}>
              Entrar como Mestre
            </button>
            <button type="button" className="btn btn--muted btn--sm" onClick={() => quick('jogador@caravans.test')}>
              Entrar como Jogador
            </button>
          </div>
          <p className="page-sub" style={{ margin: 0, textAlign: 'center', fontSize: '.72rem' }}>
            Dev: senha padrão <strong>caravans123</strong>.
          </p>
        </form>
      </div>
    </main>
  );
}
