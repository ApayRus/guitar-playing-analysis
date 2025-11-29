import React from 'react';
import './PlayPosition.css';

interface ClampProps {
  positions: number[][]; // [stringIndex][fretIndex] - 0: inactive, 1: active (normal), 2: active (red)
  barres: boolean[]; // [fretIndex]
  onTogglePosition: (stringIdx: number, fretIdx: number) => void;
  onToggleBarre: (fretIdx: number) => void;
  frets: number;
}

export const Clamp: React.FC<ClampProps> = ({ 
  positions, 
  barres, 
  onTogglePosition, 
  onToggleBarre,
  frets
}) => {
  const strings = 6;

  return (
    <div className="clamp-component">
      {/* Fret Headers (numbered right to left) */}
      <div className="clamp-header">
        {Array.from({ length: frets }).map((_, fIdx) => (
          <div 
            key={`fret-${fIdx}`}
            className={`pluck-col-header ${barres[fIdx] ? 'fret-barre-active' : ''}`}
            onClick={() => onToggleBarre(fIdx)}
            title="Toggle Barre"
            style={{ cursor: 'pointer' }}
          >
            {frets - fIdx}
          </div>
        ))}
        {/* Empty space for string numbers column */}
        <div className="string-number-header"></div>
      </div>

      <div className="guitar-grid-wrapper">
        <div className="guitar-grid" style={{ 
          gridTemplateColumns: `repeat(${frets}, var(--cell-size))`,
          gridTemplateRows: `repeat(${strings}, var(--string-spacing))`
        }}>
          {/* String Lines */}
          {Array.from({ length: strings }).map((_, sIdx) => (
            <div 
              key={`str-${sIdx}`} 
              className="string-line" 
              style={{ top: `calc(${sIdx} * var(--string-spacing) + var(--string-spacing) / 2)` }} 
            />
          ))}

          {/* Fret Lines */}
          <div className="fret-line" style={{ left: 0 }} />
          {Array.from({ length: frets }).map((_, fIdx) => (
            <React.Fragment key={`fret-group-${fIdx}`}>
               <div 
                className={`fret-line ${fIdx === frets - 1 ? 'nut' : ''}`}
                style={{ left: `calc(${fIdx + 1} * var(--cell-size))` }} 
              />
              {/* Barre Indicator */}
              {barres[fIdx] && (
                <div 
                  className="barre-indicator" 
                  style={{ left: `calc(${fIdx} * var(--cell-size) + var(--cell-size) / 2)` }} 
                />
              )}
            </React.Fragment>
          ))}

          {/* Cells */}
          {/* Display in reverse order: positions[0] (string 1) at bottom, positions[5] (string 6) at top */}
          {positions.slice().reverse().map((row, reversedIdx) => {
            // Convert reversed index back to original: 0->5, 1->4, ..., 5->0
            const sIdx = strings - 1 - reversedIdx;
            return row.map((state, fIdx) => {
              const isActive = state === 1 || state === 2;
              const isRed = state === 2;
              return (
                <div 
                  key={`${sIdx}-${fIdx}`} 
                  className={`cell ${isActive ? 'active' : ''} ${isRed ? 'active-red' : ''}`} 
                  onClick={() => onTogglePosition(sIdx, fIdx)}
                >
                  <div className="note-marker" />
                </div>
              );
            });
          })}
        </div>

        {/* String Numbers Column */}
        <div className="string-numbers">
          {/* Display in reverse order: string 1 at bottom, string 6 at top */}
          {Array.from({ length: strings }).map((_, sIdx) => {
            const stringNumber = sIdx + 1; // 0 -> 1, 1 -> 2, ..., 5 -> 6
            return (
              <div 
                key={`string-num-${sIdx}`}
                className="string-number"
              >
                {stringNumber}
              </div>
            );
          }).reverse()}
        </div>
      </div>
    </div>
  );
};
