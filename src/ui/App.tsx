import { useEffect, useMemo, useState } from 'react';
import { GameController } from '../engine/controller';
import { MainMenu } from './MainMenu';
import { GameScreen } from './GameScreen';

export function App() {
  const c = useMemo(() => new GameController(), []); const [ready, setReady] = useState(false); const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  useEffect(() => { c.init().then(() => { document.documentElement.style.setProperty('--fs', String(c.settings.fontScale)); setReady(true); }); (window as any).__GC = c; }, [c]);
  if (!ready) return <div className="app" style={{ display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>読み込み中…</div>;
  return (
    <div className="app">
      {screen === 'menu' && <MainMenu c={c} onStart={() => setScreen('game')} />}
      {screen === 'game' && <GameScreen c={c} onExit={() => { c.active = false; c.audio.setZone('menu'); setScreen('menu'); }} />}
    </div>
  );
}
