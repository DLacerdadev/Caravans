import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  ResolveDecision,
  SKILLS,
  SKILL_LABELS,
  type Skill,
  type SceneSnapshot,
  type PlayerSnapshot,
  type MasterSnapshot,
  type IntentView,
  type ClueView,
  type ClockView,
  type SceneSummary,
  type IntentCreatedEvent,
  type IntentUpdatedEvent,
  type ClueRevealedEvent,
  type ClockUpdatedEvent,
  type SceneSnapshotEvent,
} from '@caravans/shared';
import { api } from '../lib/http';

export function GamePage() {
  const nav = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [snapshot, setSnapshot] = useState<SceneSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    let lastSeq = -1;
    const fresh = (seq: number) => {
      if (seq <= lastSeq) return false;
      lastSeq = seq;
      return true;
    };

    const socket = io({ withCredentials: true });
    socketRef.current = socket;
    const join = () => socket.emit(CLIENT_EVENTS.SESSION_JOIN, { sessionId });
    socket.on('connect', join); // (re)entra na sessão ao conectar/reconectar

    socket.on(SERVER_EVENTS.SCENE_SNAPSHOT, (e: SceneSnapshotEvent) => {
      if (!active) return;
      lastSeq = e.seq;
      if (e.snapshot) {
        document.documentElement.dataset.mode = e.snapshot.role === 'MASTER' ? 'master' : 'mission';
      }
      setSnapshot(e.snapshot);
    });
    socket.on(SERVER_EVENTS.INTENT_CREATED, (e: IntentCreatedEvent) => {
      if (!fresh(e.seq)) return;
      setSnapshot((s) => (s && s.role === 'MASTER' ? { ...s, intents: upsertIntent(s.intents, e.intent) } : s));
    });
    socket.on(SERVER_EVENTS.INTENT_UPDATED, (e: IntentUpdatedEvent) => {
      if (!fresh(e.seq)) return;
      setSnapshot((s) => {
        if (!s) return s;
        if (s.role === 'MASTER') return { ...s, intents: upsertIntent(s.intents, e.intent) };
        return { ...s, myIntents: upsertIntent(s.myIntents, e.intent) };
      });
    });
    socket.on(SERVER_EVENTS.CLUE_REVEALED, (e: ClueRevealedEvent) => {
      if (!fresh(e.seq)) return;
      setSnapshot((s) => {
        if (!s) return s;
        if (s.role === 'PLAYER') return { ...s, groupClues: upsertClue(s.groupClues, e.clue) };
        return {
          ...s,
          scene: s.scene
            ? {
                ...s.scene,
                objects: s.scene.objects.map((o) => ({
                  ...o,
                  clues: o.clues.map((c) => (c.id === e.clue.id ? { ...c, discovered: true } : c)),
                })),
              }
            : s.scene,
        };
      });
    });
    socket.on(SERVER_EVENTS.CLOCK_UPDATED, (e: ClockUpdatedEvent) => {
      if (!fresh(e.seq)) return;
      setSnapshot((s) => (s && s.role === 'MASTER' ? { ...s, clocks: upsertClock(s.clocks, e.clock) } : s));
    });
    socket.on(SERVER_EVENTS.SCENE_CHANGED, () => join()); // troca de cena → novo snapshot
    socket.on(SERVER_EVENTS.ERROR, (e: { message: string }) => setError(e.message));

    return () => {
      active = false;
      socket.disconnect();
      document.documentElement.dataset.mode = 'safe';
    };
  }, [sessionId]);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    nav('/login');
  }

  if (error) {
    return (
      <main className="shell center-screen">
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button className="btn btn--muted btn--sm" style={{ marginTop: 12 }} onClick={logout}>
            Sair
          </button>
        </div>
      </main>
    );
  }
  if (!snapshot) {
    return (
      <main className="shell center-screen">
        <p className="page-sub">Conectando à sessão…</p>
      </main>
    );
  }

  return snapshot.role === 'MASTER' ? (
    <MasterView snapshot={snapshot} socket={socketRef.current!} onLogout={logout} />
  ) : (
    <PlayerView snapshot={snapshot} socket={socketRef.current!} onLogout={logout} />
  );
}

function upsertIntent(list: IntentView[], intent: IntentView): IntentView[] {
  const i = list.findIndex((x) => x.id === intent.id);
  if (i === -1) return [...list, intent];
  const copy = list.slice();
  copy[i] = intent;
  return copy;
}
function upsertClue(list: ClueView[], clue: ClueView): ClueView[] {
  return list.some((c) => c.id === clue.id) ? list : [...list, clue];
}
function upsertClock(list: ClockView[], clock: ClockView): ClockView[] {
  const i = list.findIndex((c) => c.id === clock.id);
  if (i === -1) return [...list, clock];
  const copy = list.slice();
  copy[i] = clock;
  return copy;
}

// ----------------------------------------------------------------------------
// Visão do JOGADOR (Vígil)
// ----------------------------------------------------------------------------
function PlayerView({
  snapshot,
  socket,
  onLogout,
}: {
  snapshot: PlayerSnapshot;
  socket: Socket;
  onLogout: () => void;
}) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [skill, setSkill] = useState<Skill>(SKILLS[0]!);
  const [action, setAction] = useState('');
  const scene = snapshot.scene;

  function send() {
    if (!action.trim()) return;
    socket.emit(CLIENT_EVENTS.INTENT_SUBMIT, {
      sessionId: snapshot.sessionId,
      clientIntentId: crypto.randomUUID(),
      targetObjectId: targetId ?? undefined,
      action: action.trim(),
      skill,
    });
    setAction('');
  }

  return (
    <div className="shell">
      <header className="appbar">
        <span className="wordmark">Sobrevivendo ao <b>Horror</b></span>
        <div className="appbar__nav">
          <span className="mode-chip"><span className="led"></span> Sessão Ativa · Vígil</span>
          <button className="btn btn--muted btn--sm" onClick={onLogout}>Sair</button>
        </div>
      </header>

      <main>
        <p className="eyebrow">Cena investigativa</p>
        <h1 className="page-title">{scene?.title ?? 'Aguardando cena…'}</h1>
        <p className="page-sub">Escolha um ponto de interesse, declare sua intenção e aguarde o mestre.</p>

        <div className="case-layout">
          <section>
            <div className="row" style={{ gap: 8, marginBottom: 12 }}>
              {scene?.objects.map((o) => (
                <button
                  key={o.id}
                  className={'btn btn--sm ' + (targetId === o.id ? 'btn--primary' : 'btn--ghost')}
                  onClick={() => setTargetId(o.id)}
                >
                  {o.name}
                </button>
              ))}
            </div>

            {targetId && (
              <div className="card stack">
                <p className="skill-tab" style={{ marginTop: 0 }}>Declarar intenção</p>
                <div className="field">
                  <label htmlFor="skill">Perícia</label>
                  <select id="skill" value={skill} onChange={(e) => setSkill(e.target.value as Skill)}>
                    {SKILLS.map((s) => (
                      <option key={s} value={s}>{SKILL_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="acao">Ação</label>
                  <input id="acao" value={action} onChange={(e) => setAction(e.target.value)} placeholder="ex.: examinar a marca de sangue" />
                </div>
                <button className="btn btn--primary" onClick={send}>Enviar intenção ao mestre</button>
              </div>
            )}

            <p className="skill-tab">Minhas intenções</p>
            {snapshot.myIntents.length === 0 && <p className="page-sub" style={{ margin: 0 }}>Nenhuma enviada ainda.</p>}
            {snapshot.myIntents.map((i) => (
              <div key={i.id} className="clue">
                <span className="dt">{statusLabel(i.status)}</span>
                <span className="ct">{i.action} {i.note ? `— ${i.note}` : ''}</span>
              </div>
            ))}
          </section>

          <aside className="card">
            <p className="skill-tab" style={{ marginTop: 0 }}>Pistas descobertas</p>
            {snapshot.groupClues.length === 0 && (
              <p className="page-sub" style={{ margin: 0 }}>Nenhuma pista ainda. Investigue a cena.</p>
            )}
            {snapshot.groupClues.map((c) => (
              <div key={c.id} className="clue found">
                <span className="dt">{SKILL_LABELS[c.skill]}</span>
                <span className="ct">{c.text}</span>
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Visão do MESTRE (Posto de Comando)
// ----------------------------------------------------------------------------
function MasterView({
  snapshot,
  socket,
  onLogout,
}: {
  snapshot: MasterSnapshot;
  socket: Socket;
  onLogout: () => void;
}) {
  const pending = useMemo(() => snapshot.intents.filter((i) => i.status === 'PENDING'), [snapshot.intents]);

  function resolve(intentId: string, decision: keyof typeof ResolveDecision) {
    socket.emit(CLIENT_EVENTS.INTENT_RESOLVE, { intentId, decision: ResolveDecision[decision] });
  }
  function reveal(clueId: string) {
    socket.emit(CLIENT_EVENTS.CLUE_REVEAL, { clueId });
  }
  function advance(clockId: string, delta: 1 | -1) {
    socket.emit(CLIENT_EVENTS.CLOCK_ADVANCE, { clockId, delta });
  }
  function switchScene(sceneId: string) {
    socket.emit(CLIENT_EVENTS.SCENE_SWITCH, { sessionId: snapshot.sessionId, sceneId });
  }

  return (
    <div className="shell">
      <header className="appbar">
        <span className="wordmark">Sobrevivendo ao <b>Horror</b></span>
        <div className="appbar__nav">
          <span className="live">Sessão ao vivo</span>
          <span className="mode-chip"><span className="led"></span> Mestre · Posto de Comando</span>
          <button className="btn btn--muted btn--sm" onClick={onLogout}>Sair</button>
        </div>
      </header>

      <main>
        <p className="eyebrow">Cena ativa</p>
        <h1 className="page-title">{snapshot.scene?.title ?? 'Sem cena ativa'}</h1>

        {snapshot.scenes.length > 1 && (
          <div className="row" style={{ gap: 8, marginBottom: 14 }}>
            <span className="skill-tab" style={{ margin: 0 }}>Trocar cena:</span>
            <select value={snapshot.scene?.id ?? ''} onChange={(e) => switchScene(e.target.value)}>
              {snapshot.scenes.map((sc: SceneSummary) => (
                <option key={sc.id} value={sc.id}>{sc.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="case-layout">
          <section className="stack" style={{ gap: 'var(--sp-5)' }}>
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: 'var(--sp-4)' }}>
                Intenções pendentes <span className="count-badge">{pending.length}</span>
              </h2>
              <div className="queue">
                {pending.length === 0 && <p className="page-sub" style={{ margin: 0 }}>Nenhuma intenção aguardando.</p>}
                {pending.map((i) => (
                  <article key={i.id} className="intent-card">
                    <div style={{ minWidth: 0 }}>
                      <p className="who2">{i.authorName}</p>
                      <h4>{i.action}</h4>
                      <div className="intent-tags">
                        <span className="chip">{SKILL_LABELS[i.skill]}</span>
                      </div>
                    </div>
                    <div className="io-actions">
                      <button className="btn btn--sm btn--primary" onClick={() => resolve(i.id, 'APPROVE')}>Aprovar</button>
                      <button className="btn btn--sm btn--ghost" onClick={() => resolve(i.id, 'ADJUST')}>Ajustar</button>
                      <button className="btn btn--sm btn--muted" onClick={() => resolve(i.id, 'REJECT')}>Recusar</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="section-title">Pistas &amp; dificuldades da cena</h2>
              {snapshot.scene?.objects.map((o) => (
                <div key={o.id} style={{ marginBottom: 12 }}>
                  <p className="skill-tab" style={{ marginTop: 8 }}>{o.name}</p>
                  {o.clues.map((c) => (
                    <div key={c.id} className={'gm-clue' + (c.discovered ? ' revealed' : '')}>
                      <div className="gm-left">
                        <span className="dt">DT {c.dt}</span>
                        <span className="txt"><span className="sk">{SKILL_LABELS[c.skill]}</span>{c.text}</span>
                      </div>
                      {c.discovered ? (
                        <span className="chip">revelada</span>
                      ) : (
                        <button className="btn btn--sm btn--ghost" onClick={() => reveal(c.id)}>Revelar</button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <aside className="card">
            <h2 className="section-title">Relógios de ameaça</h2>
            {snapshot.clocks.length === 0 && <p className="page-sub" style={{ margin: 0 }}>Nenhum relógio.</p>}
            {snapshot.clocks.map((ck) => (
              <div key={ck.id} className="clockrow">
                <span className="cname">{ck.name}</span>
                <span className="cbits">
                  <span className="clock">
                    {Array.from({ length: ck.max }).map((_, idx) => (
                      <span key={idx} className={'seg' + (idx < ck.current ? ' on' : '')} />
                    ))}
                  </span>
                  <button className="btn btn--sm btn--muted" onClick={() => advance(ck.id, -1)}>−</button>
                  <button className="btn btn--sm btn--muted" onClick={() => advance(ck.id, 1)}>Avançar</button>
                </span>
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}

function statusLabel(s: IntentView['status']): string {
  return s === 'PENDING' ? 'Enviada'
    : s === 'APPROVED' ? 'Aprovada'
    : s === 'ADJUSTED' ? 'Ajustar'
    : 'Recusada';
}
