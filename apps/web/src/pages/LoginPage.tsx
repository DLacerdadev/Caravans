import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/http';

export function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('mestre@caravans.test');
  const [password, setPassword] = useState('caravans123');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') {
        await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, displayName }),
        });
      } else {
        await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      }
      nav('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function quick(as: string) {
    setMode('login');
    setEmail(as);
    setPassword('caravans123');
    setTimeout(submit, 0);
  }

  return (
    <main className="shell shell--narrow center-screen">
      <div className="stack" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <p className="eyebrow" style={{ letterSpacing: '.34em' }}>Motor Narrativo Operacional</p>
          <h1 className="page-title" style={{ margin: 0 }}>Sobrevivendo<br />ao Horror</h1>
        </div>
        <form className="card stack" onSubmit={submit}>
          <p className="skill-tab" style={{ marginTop: 0 }}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</p>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="nome">Nome do investigador</label>
              <input id="nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'var(--crit)', margin: 0, fontSize: '.85rem' }}>{error}</p>}
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? '…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
          <button
            type="button"
            className="btn btn--muted btn--sm"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Não tenho conta — criar' : 'Já tenho conta — entrar'}
          </button>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => quick('mestre@caravans.test')}>
              Demo: Mestre
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => quick('jogador@caravans.test')}>
              Demo: Jogador
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
