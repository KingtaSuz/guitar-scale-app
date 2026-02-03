import React, { useState, useEffect, useMemo } from 'react';
import { Note, Interval, Scale } from 'tonal';
import * as Tone from 'tone';

const TUNING = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
const FRETS_COUNT = 16;
const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SCALES = [
  { label: "Major", value: "major" }, { label: "Minor", value: "minor" },
  { label: "Major Pentatonic", value: "major pentatonic" }, { label: "Minor Pentatonic", value: "minor pentatonic" },
  { label: "Blues", value: "blues" }, { label: "Dorian", value: "dorian" }, { label: "Mixolydian", value: "mixolydian" }
];

const HIGHLIGHT_LIST = [
  { label: "なし", value: "" }, { label: "Root", value: "R" }, { label: "2nd / 9th", value: "2" },
  { label: "3rd", value: "3" }, { label: "4th / 11th", value: "4" }, { label: "5th", value: "5" },
  { label: "6th / 13th", value: "6" }, { label: "7th", value: "7" }
];

const formatDegree = (interval) => {
  const map = { 
    "1P": "R", "2M": "2", "3m": "m3", "3M": "3", "4P": "4", "4A": "#4", 
    "5d": "b5", "5P": "5", "5A": "#5", "6M": "6", "7m": "7", "7M": "7", "8P": "R"
  };
  return map[interval] || interval;
};

const getNoteStyles = (degree, highlightTarget) => {
  const formatted = formatDegree(degree);
  const isHighlighted = highlightTarget !== "" && formatted.includes(highlightTarget);
  
  let baseColor = "#bcaaa4";
  if (formatted === "R") baseColor = "#3e2723";
  else if (formatted.includes("3")) baseColor = "#8d6e63";
  else if (formatted.includes("5")) baseColor = "#a1887f";
  else if (formatted.includes("7")) baseColor = "#d2b48c";

  if (isHighlighted) {
    return { bg: "#ff7043", scale: 1.2, z: 40, border: "2px solid #fff" };
  }
  return { bg: baseColor, scale: 1, z: 20, border: "none" };
};

function App() {
  const [root, setRoot] = useState("C");
  const [selectedScale, setSelectedScale] = useState("major");
  const [highlightTarget, setHighlightTarget] = useState("");
  const [activePopup, setActivePopup] = useState(null); 
  const [synth, setSynth] = useState(null);

  useEffect(() => {
    const newSynth = new Tone.PolySynth(Tone.Synth, { 
      oscillator: { type: "sine" }, 
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 } 
    }).toDestination();
    setSynth(newSynth);
  }, []);

  const currentScale = useMemo(() => {
    const name = `${root} ${selectedScale}`;
    const s = Scale.get(name);
    return { name, notes: s.notes.map(n => Note.chroma(n)) };
  }, [root, selectedScale]);

  const getNoteInfo = (noteName) => {
    const chroma = Note.chroma(noteName);
    const isMatch = currentScale.notes.includes(chroma);
    if (!isMatch) return null;
    const degreeRaw = Interval.distance(root, Note.pitchClass(noteName));
    return {
      degreeFormatted: formatDegree(degreeRaw),
      styles: getNoteStyles(degreeRaw, highlightTarget)
    };
  };

  const closePopup = () => setActivePopup(null);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>ギターのスケールわかるやつ</h1>
        <div style={chordDisplayStyle}>{root} {selectedScale}</div>
      </header>

      <div style={controlsContainerStyle}>
        <div style={selectRowStyle}>
          <button onClick={() => setActivePopup('root')} style={mobileButtonStyle}>
            Key: {root}
          </button>
          <button onClick={() => setActivePopup('scale')} style={mobileButtonStyle}>
            {selectedScale}
          </button>
          <button 
            onClick={() => setActivePopup('highlight')} 
            style={{...mobileButtonStyle, backgroundColor: highlightTarget ? '#ff7043' : '#fff', color: highlightTarget ? '#fff' : '#3e2723'}}
          >
            {highlightTarget ? `★ ${highlightTarget}` : "Highlight"}
          </button>
        </div>
      </div>

      {activePopup && (
        <div style={overlayStyle} onClick={closePopup}>
          <div style={popupContentStyle} onClick={e => e.stopPropagation()}>
            <div style={popupHeaderStyle}>選択してください</div>
            <div style={popupGridStyle}>
              {activePopup === 'root' && ROOTS.map(r => (
                <div key={r} onClick={() => { setRoot(r); closePopup(); }} style={popupItemStyle}>{r}</div>
              ))}
              {activePopup === 'scale' && SCALES.map(s => (
                <div key={s.value} onClick={() => { setSelectedScale(s.value); closePopup(); }} style={{...popupItemStyle, width: '100%'}}>{s.label}</div>
              ))}
              {activePopup === 'highlight' && HIGHLIGHT_LIST.map(h => (
                <div key={h.label} onClick={() => { setHighlightTarget(h.value); closePopup(); }} style={{...popupItemStyle, width: '100%'}}>{h.label}</div>
              ))}
            </div>
            <button onClick={closePopup} style={closeButtonStyle}>閉じる</button>
          </div>
        </div>
      )}

      <div style={fretboardScrollStyle}>
        <div style={fretboardContainerStyle}>
          {TUNING.map((stringRoot, stringIndex) => (
            <div key={stringIndex} style={stringRowStyle}>
              <div style={openNoteAreaStyle} onClick={() => { Tone.start(); synth?.triggerAttackRelease(stringRoot, "4n"); }}>
                {(() => {
                  const info = getNoteInfo(stringRoot);
                  return info && (
                    <div style={{ ...noteStyle, backgroundColor: info.styles.bg, transform: `scale(${info.styles.scale})`, border: info.styles.border }}>
                      <div style={{fontSize: '0.8rem'}}>{Note.pitchClass(stringRoot)}</div>
                      <div style={{fontSize: '0.7rem', fontWeight: 'bold'}}>{info.degreeFormatted}</div>
                    </div>
                  );
                })()}
                {stringIndex === 5 && <span style={fretNumberStyle}>0</span>}
              </div>
              <div style={nutLineStyle}></div>
              <div style={fretContainerStyle}>
                <div style={stringLineStyle} />
                {[...Array(FRETS_COUNT - 1)].map((_, i) => {
                  const fretIndex = i + 1;
                  const noteWithOctave = Note.transpose(stringRoot, Interval.fromSemitones(fretIndex));
                  const info = getNoteInfo(noteWithOctave);
                  return (
                    <div key={fretIndex} style={{...fretSpaceStyle, borderRight: '2px solid #a1887f'}} onClick={() => { Tone.start(); synth?.triggerAttackRelease(noteWithOctave, "4n"); }}>
                      {info && (
                        <div style={{ ...noteStyle, backgroundColor: info.styles.bg, transform: `scale(${info.styles.scale})`, zIndex: info.styles.z, border: info.styles.border }}>
                          <div style={{fontSize: '0.8rem'}}>{Note.pitchClass(noteWithOctave)}</div>
                          <div style={{fontSize: '0.7rem', fontWeight: 'bold'}}>{info.degreeFormatted}</div>
                        </div>
                      )}
                      {stringIndex === 5 && <span style={fretNumberStyle}>{fretIndex}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p style={{marginTop: '20px', color: '#8d6e63', fontSize: '0.8rem'}}>※スマホを横向きにすると見やすいです</p>
    </div>
  );
}

const containerStyle = { backgroundColor: '#f5f5dc', color: '#3e2723', minHeight: '100vh', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif' };
const headerStyle = { textAlign: 'center', marginBottom: '5px' };
const titleStyle = { fontSize: '0.9rem', color: '#8d6e63', margin: 0 };
const chordDisplayStyle = { fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' };
const controlsContainerStyle = { width: '100%', maxWidth: '500px', marginBottom: '10px' };
const selectRowStyle = { display: 'flex', gap: '8px', justifyContent: 'center' };
const mobileButtonStyle = { flex: 1, padding: '12px 5px', borderRadius: '10px', border: '1px solid #d2b48c', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const popupContentStyle = { backgroundColor: '#fff', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '80vh', overflowY: 'auto' };
const popupHeaderStyle = { textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: '#8d6e63' };
const popupGridStyle = { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' };
const popupItemStyle = { padding: '15px', width: 'calc(33.3% - 10px)', textAlign: 'center', backgroundColor: '#f8f4f0', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };
const closeButtonStyle = { padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#3e2723', color: '#fff', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px' };
const fretboardScrollStyle = { width: '100vw', overflowX: 'auto', padding: '30px 0' };
const fretboardContainerStyle = { backgroundColor: '#d7ccc8', borderTop: '4px solid #5d4037', borderBottom: '4px solid #5d4037', display: 'inline-block', marginLeft: '20px' };
const stringRowStyle = { display: 'flex', height: '55px', alignItems: 'center' };
const openNoteAreaStyle = { width: '60px', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const nutLineStyle = { width: '10px', height: '100%', backgroundColor: '#5d4037', zIndex: 10 };
const fretContainerStyle = { display: 'flex', position: 'relative' };
const stringLineStyle = { position: 'absolute', top: '50%', left: 0, right: 0, backgroundColor: '#b0bec5', height: '2px', zIndex: 1 };
const fretSpaceStyle = { width: '80px', height: '55px', position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const noteStyle = { position: 'relative', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', boxShadow: '0 3px 6px rgba(0,0,0,0.16)', zIndex: 100 };
const fretNumberStyle = { position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', color: '#8d6e63', fontSize: '0.8rem', fontWeight: 'bold' };

export default App;
