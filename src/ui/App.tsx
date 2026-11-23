import { useEffect, useMemo, useState } from 'react';
import { GameController } from '../engine/controller';
import { MainMenu } from './MainMenu';
import { GameScreen } from './GameScreen';
import { Portrait } from './parts';

export function App() {
  const c = useMemo(() => new GameController(), []); const [ready, setReady] = useState(false); const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  useEffect(() => { c.init().then(() => { document.documentElement.style.setProperty('--fs', String(c.settings.fontScale)); setReady(true); }); (window as any).__GC = c; }, [c]);
  if (typeof location !== 'undefined' && /[?&]portraits/.test(location.search)) { const chars = Object.values(c.story.characters); const moods = ['normal', 'smile', 'worry', 'serious', 'surprise']; return <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: '#cfe0ef', padding: 10, color: '#111' }}>{chars.map(ch => <div key={ch.id} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}><b style={{ width: 80 }}>{ch.name}</b>{moods.map(m => <div key={m} style={{ textAlign: 'center', fontSize: 11 }}><Portrait def={ch} mood={m} size={150} />{m}</div>)}</div>)}</div>; }
  if (!ready) return <div className="app" style={{ display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>読み込み中…</div>;
  return (
    <div className="app">
      {screen === 'menu' && <MainMenu c={c} onStart={() => setScreen('game')} />}
      {screen === 'game' && <GameScreen c={c} onExit={() => { c.active = false; c.audio.setZone('menu'); setScreen('menu'); }} />}
    </div>
  );
}
