import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CampaignSummary } from '@caravans/shared';
import { api } from '../lib/http';

export function CampanhasPage() {
  const nav = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { campaigns } = await api<{ campaigns: CampaignSummary[] }>('/api/campaigns');
    setCampaigns(campaigns);
  }
  useEffect(() => {
    document.documentElement.dataset.mode = 'safe';
    load().catch((e) => setError((e as Error).message));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await api('/api/campaigns', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
    setName('');
    load();
  }
  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { campaign } = await api<{ campaign: { id: string } }>('/api/campaigns/join', {
        method: 'POST',
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
      });
      nav(`/campanha/${campaign.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    nav('/login');
  }

  return (
    <div className="shell">
      <header className="appbar">
        <span className="wordmark">Sobrevivendo ao <b>Horror</b></span>
        <div className="appbar__nav">
          <span className="mode-chip"><span className="led"></span> Zona Segura · Luz de Gás</span>
          <button className="btn btn--muted btn--sm" onClick={logout}>Sair</button>
        </div>
      </header>

      <main>
        <p className="eyebrow">Bem-vindo de volta</p>
        <h1 className="page-title">Suas campanhas</h1>
        {error && <p style={{ color: 'var(--crit)' }}>{error}</p>}

        <div className="grid-cards">
          {campaigns.map((c) => (
            <article key={c.id} className="mcard">
              <div className="between">
                <p className="place">{c.role === 'MASTER' ? 'Mestre' : 'Jogador'}</p>
                <span className="risk risk--elevado">{c.sessionCount} sessão(ões)</span>
              </div>
              <h3>{c.name}</h3>
              {c.synopsis && <p className="desc">{c.synopsis}</p>}
              <div className="actions">
                <Link className="btn btn--primary btn--sm" to={`/campanha/${c.id}`}>Abrir</Link>
              </div>
            </article>
          ))}
          {campaigns.length === 0 && <p className="page-sub">Nenhuma campanha ainda. Crie ou ingresse abaixo.</p>}
        </div>

        <div className="detail-layout" style={{ marginTop: 'var(--sp-6)' }}>
          <form className="card stack" onSubmit={create}>
            <p className="skill-tab" style={{ marginTop: 0 }}>Criar campanha (você será o mestre)</p>
            <div className="field">
              <label htmlFor="cname">Nome</label>
              <input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Arquivos de Highgate" />
            </div>
            <button className="btn btn--primary" type="submit">Criar</button>
          </form>

          <form className="card stack" onSubmit={join}>
            <p className="skill-tab" style={{ marginTop: 0 }}>Ingressar por código (como jogador)</p>
            <div className="field">
              <label htmlFor="code">Código</label>
              <input id="code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="ex.: BAKER" />
            </div>
            <button className="btn btn--ghost" type="submit">Ingressar</button>
          </form>
        </div>
      </main>
    </div>
  );
}
