import React, { useState } from 'react';
import { Scale } from '@tonaljs/tonal';

const App = () => {
  const [root, setRoot] = useState('C');
  const [type, setType] = useState('major');

  // スケール音を取得
  const scale = Scale.get(`${root} ${type}`);
  const notes = scale.notes;

  // ギターの弦 (6弦から1弦)
  const strings = ['E', 'A', 'D', 'G', 'B', 'E'].reverse();
  const fretCount = 13; // 0〜12フレット

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎸 Guitar Scale App</h1>

      <div style={styles.controls}>
        <select value={root} onChange={(e) => setRoot(e.target.value)} style={styles.select}>
          {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)} style={styles.select}>
          {['major', 'minor', 'aeolian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div style={styles.info}>
        <strong>Scale Notes:</strong> {notes.join(' - ')}
      </div>

      {/* ここがスマホ対応の肝！横スクロール可能エリア */}
      <div style={styles.fretboardWrapper}>
        <div style={styles.fretboard}>
          {strings.map((openNote, sIdx) => (
            <div key={sIdx} style={styles.string}>
              {[...Array(fretCount)].map((_, fIdx) => {
                // 音階判定ロジック（簡易版）はここに。
                // 実際は各フレットの音を計算してnotesに含まれるかチェックします。
                return (
                  <div key={fIdx} style={styles.fret}>
                    {fIdx === 0 && <span style={styles.openLabel}>{openNote}</span>}
                    <div style={styles.stringLine}></div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <p style={styles.hint}>← 横にスクロールできます →</p>
    </div>
  );
};

// スタイル設定（スマホ対応）
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'sans-serif',
    backgroundColor: '#1a1a1a',
    color: 'white',
    minHeight: '100vh',
  },
  title: { fontSize: '1.5rem', marginBottom: '20px' },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap', // スマホでボタンがはみ出さないように折り返す
  },
  select: {
    padding: '10px',
    fontSize: '16px', // スマホでズームされないサイズ
    borderRadius: '5px',
  },
  info: { marginBottom: '20px', fontSize: '1.2rem', color: '#ffd700' },
  fretboardWrapper: {
    width: '100%',
    overflowX: 'auto', // スマホで横にスワイプできるようにする
    backgroundColor: '#333',
    borderRadius: '8px',
    padding: '20px 0',
    WebkitOverflowScrolling: 'touch',
  },
  fretboard: {
    display: 'inline-block',
    minWidth: '800px', // フレットが潰れないように横幅を確保
    padding: '0 20px',
  },
  string: {
    display: 'flex',
    height: '40px',
    position: 'relative',
    alignItems: 'center',
  },
  fret: {
    flex: 1,
    height: '100%',
    borderRight: '2px solid #888',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stringLine: {
    width: '100%',
    height: '2px',
    backgroundColor: '#ccc',
  },
  openLabel: {
    position: 'absolute',
    left: '-15px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '10px',
  }
};

export default App;
