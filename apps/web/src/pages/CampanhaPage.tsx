import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CampaignDetail } from '@caravans/shared';
import { api } from '../lib/http';

export function CampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [c, setC] = useState<CampaignDetail | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [sceneTitle, setSceneTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { campaign } = await api<{ campaign: CampaignDetail }>(`/api/campaigns/${id}`);
    setC(campaign);
  }
  useEffect(() => {
    document.documentElement.dataset.mode = 'safe';
    load().catch((e) => setError((e as Error).message));
  }, [id]);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionName.trim()) return;
    await api(`/api/campaigns/${id}/sessions`, {
      method: 'POST',
      body: JSON.stringify({ name: sessionName.trim() }),
    });
    setSessionName('');
    load();
  }

  async function createScene(e: React.FormEvent) {
    e.preventDefault();
    if (!sceneTitle.trim()) return;
    await api(`/api/campaigns/${id}/scenes`, { method: 'POST', body: JSON.stringify({ title: sceneTitle.trim() }) });
    setSceneTitle('');
    load();
  }

  if (error) return <main className="shell center-screen"><p style={{ color: 'var(--crit)' }}>{error}</p></main>;
  if (!c) return <main className="shell center-screen"><p className="page-sub">Carregando…</p></main>;

  const isMaster = c.role === 'MASTER';

  return (
    <div className="shell">
      <header className="appbar">
        <Link className="wordmark" to="/">Sobrevivendo ao <b>Horror</b></Link>
        <span className="mode-chip"><span className="led"></span> Zona Segura · Campanha</span>
      </header>

      <main>
        <Link className="btn btn--muted btn--sm" to="/" style={{ marginBottom: 18 }}>← Voltar</Link>
        <p className="eyebrow">{isMaster ? 'Mestre' : 'Jogador'}</p>
        <h1 className="page-title">{c.name}</h1>
        {c.synopsis && <p className="page-sub">{c.synopsis}</p>}

        {isMaster && c.joinCode && (
          <div className="card" style={{ marginBottom: 'var(--sp-5)' }}>
            <p className="skill-tab" style={{ marginTop: 0 }}>Código de ingresso (compartilhe com jogadores)</p>
            <p className="page-title" style={{ margin: 0, letterSpacing: '.2em' }}>{c.joinCode}</p>
          </div>
        )}

        <div className="detail-layout">
          <section className="card">
            <h2 className="section-title">Sessões</h2>
            {c.sessions.length === 0 && <p className="page-sub" style={{ margin: 0 }}>Nenhuma sessão ainda.</p>}
            {c.sessions.map((s) => (
              <div key={s.id} className="between" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <span>{s.name}</span>
                <button className="btn btn--primary btn--sm" onClick={() => nav(`/jogo/${s.id}`)}>Entrar</button>
              </div>
            ))}
            {isMaster && (
              <form className="stack" style={{ marginTop: 'var(--sp-4)' }} onSubmit={createSession}>
                <div className="field">
                  <label htmlFor="sname">Nova sessão</label>
                  <input id="sname" value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="ex.: Sessão 1" />
                </div>
                <button className="btn btn--ghost btn--sm" type="submit">Criar sessão</button>
              </form>
            )}
          </section>

          <aside className="card">
            <h2 className="section-title">O grupo</h2>
            {c.members.map((m) => (
              <div key={m.userId} className="between" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                <span>{m.displayName}</span>
                <span className="chip">{m.role === 'MASTER' ? 'Mestre' : 'Jogador'}</span>
              </div>
            ))}
          </aside>
        </div>

        {isMaster && (
          <section className="card" style={{ marginTop: 'var(--sp-5)' }}>
            <h2 className="section-title">Cenas</h2>
            {c.scenes.map((sc) => (
              <div key={sc.id} className="between" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                <span>{sc.title} {sc.isActive && <span className="chip">ativa</span>}</span>
                <Link className="btn btn--muted btn--sm" to={`/campanha/${id}/cena/${sc.id}`}>Editar</Link>
              </div>
            ))}
            <form className="stack" style={{ marginTop: 'var(--sp-4)' }} onSubmit={createScene}>
              <div className="field">
                <label htmlFor="scenetitle">Nova cena</label>
                <input id="scenetitle" value={sceneTitle} onChange={(e) => setSceneTitle(e.target.value)} placeholder="ex.: O Gabinete do Relojoeiro" />
              </div>
              <button className="btn btn--ghost btn--sm" type="submit">Criar cena</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
