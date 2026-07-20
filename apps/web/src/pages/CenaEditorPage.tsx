import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SKILLS, SKILL_LABELS, type Skill } from '@caravans/shared';
import { api } from '../lib/http';

interface EditorClue { id: string; skill: Skill; dt: number; text: string }
interface EditorObject { id: string; name: string; x: number; y: number; clues: EditorClue[] }
interface EditorScene { id: string; title: string; imagePath: string | null; objects: EditorObject[] }

export function CenaEditorPage() {
  const { id: campaignId, sceneId } = useParams<{ id: string; sceneId: string }>();
  const [scene, setScene] = useState<EditorScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // novo objeto
  const [oName, setOName] = useState('');
  const [oX, setOX] = useState('0.5');
  const [oY, setOY] = useState('0.5');

  async function load() {
    const { scene } = await api<{ scene: EditorScene }>(`/api/scenes/${sceneId}`);
    setScene(scene);
  }
  useEffect(() => {
    document.documentElement.dataset.mode = 'safe';
    load().catch((e) => setError((e as Error).message));
  }, [sceneId]);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/scenes/${sceneId}/image`, { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) {
      setError('Falha no upload (tipo/tamanho?).');
      return;
    }
    load();
  }

  async function addObject(e: React.FormEvent) {
    e.preventDefault();
    if (!oName.trim()) return;
    await api(`/api/scenes/${sceneId}/objects`, {
      method: 'POST',
      body: JSON.stringify({ name: oName.trim(), x: Number(oX), y: Number(oY) }),
    });
    setOName('');
    load();
  }

  if (error) return <main className="shell center-screen"><p style={{ color: 'var(--crit)' }}>{error}</p></main>;
  if (!scene) return <main className="shell center-screen"><p className="page-sub">Carregando…</p></main>;

  return (
    <div className="shell">
      <header className="appbar">
        <Link className="wordmark" to={`/campanha/${campaignId}`}>Sobrevivendo ao <b>Horror</b></Link>
        <span className="mode-chip"><span className="led"></span> Autoria de cena</span>
      </header>

      <main>
        <Link className="btn btn--muted btn--sm" to={`/campanha/${campaignId}`} style={{ marginBottom: 18 }}>← Voltar</Link>
        <p className="eyebrow">Editor</p>
        <h1 className="page-title">{scene.title}</h1>

        <div className="case-layout">
          <section className="stack" style={{ gap: 'var(--sp-5)' }}>
            <div className="card">
              <h2 className="section-title">Imagem da cena</h2>
              {scene.imagePath ? (
                <img src={scene.imagePath} alt="Cena" style={{ borderRadius: 8, border: '1px solid var(--line)' }} />
              ) : (
                <p className="page-sub" style={{ margin: 0 }}>Sem imagem ainda.</p>
              )}
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" />
                <button className="btn btn--primary btn--sm" onClick={upload}>Enviar imagem</button>
              </div>
            </div>

            <div className="card">
              <h2 className="section-title">Pontos de interesse</h2>
              {scene.objects.map((o) => (
                <ObjectEditor key={o.id} obj={o} onChange={load} />
              ))}
              <form className="stack" style={{ marginTop: 'var(--sp-4)' }} onSubmit={addObject}>
                <p className="skill-tab" style={{ marginTop: 0 }}>Novo ponto de interesse</p>
                <div className="field">
                  <label>Nome</label>
                  <input value={oName} onChange={(e) => setOName(e.target.value)} placeholder="ex.: Marca de sangue" />
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>X (0–1)</label>
                    <input value={oX} onChange={(e) => setOX(e.target.value)} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Y (0–1)</label>
                    <input value={oY} onChange={(e) => setOY(e.target.value)} />
                  </div>
                </div>
                <button className="btn btn--ghost btn--sm" type="submit">Adicionar ponto</button>
              </form>
            </div>
          </section>

          <aside className="card">
            <h2 className="section-title">Dica</h2>
            <p className="page-sub" style={{ margin: 0 }}>
              As coordenadas X/Y são relativas (0 a 1) sobre a imagem — assim o ponto acompanha qualquer resolução.
              As DTs e pistas ficam ocultas ao jogador até serem descobertas.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ObjectEditor({ obj, onChange }: { obj: EditorObject; onChange: () => void }) {
  const [skill, setSkill] = useState<Skill>(SKILLS[0]!);
  const [dt, setDt] = useState('10');
  const [text, setText] = useState('');

  async function addClue(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await api(`/api/objects/${obj.id}/clues`, {
      method: 'POST',
      body: JSON.stringify({ skill, dt: Number(dt), text: text.trim() }),
    });
    setText('');
    onChange();
  }

  return (
    <div style={{ borderTop: '1px solid var(--line)', padding: '12px 0' }}>
      <p className="skill-tab" style={{ marginTop: 0 }}>{obj.name}</p>
      {obj.clues.map((c) => (
        <div key={c.id} className="gm-clue">
          <div className="gm-left">
            <span className="dt">DT {c.dt}</span>
            <span className="txt"><span className="sk">{SKILL_LABELS[c.skill]}</span>{c.text}</span>
          </div>
        </div>
      ))}
      <form className="row" style={{ gap: 8, marginTop: 8, alignItems: 'flex-end' }} onSubmit={addClue}>
        <div className="field" style={{ flex: 1 }}>
          <label>Perícia</label>
          <select value={skill} onChange={(e) => setSkill(e.target.value as Skill)}>
            {SKILLS.map((s) => <option key={s} value={s}>{SKILL_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="field" style={{ width: 80 }}>
          <label>DT</label>
          <input value={dt} onChange={(e) => setDt(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 2 }}>
          <label>Texto da pista</label>
          <input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <button className="btn btn--muted btn--sm" type="submit">+ Pista</button>
      </form>
    </div>
  );
}
