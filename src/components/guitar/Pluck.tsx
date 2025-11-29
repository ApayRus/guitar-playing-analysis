import React from 'react';
import './PlayPosition.css';

interface PluckProps {
  pattern: boolean[][]; // [stringIndex][timeIndex]
  onToggle: (stringIdx: number, timeIdx: number) => void;
  cols: number;
}

export const Pluck: React.FC<PluckProps> = ({ pattern, onToggle, cols }) => {
  const strings = 6;

  return (
    <div className="pluck-component">
      <div className="pluck-header">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="pluck-col-header">{i + 1}</div>
        ))}
      </div>
      
      <div className="guitar-grid" style={{ 
        gridTemplateColumns: `repeat(${cols}, var(--pluck-cell-width, 20px))`,
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

        {/* Cells */}
        {/* Display in reverse order: pattern[0] (string 1) at bottom, pattern[5] (string 6) at top */}
        {pattern.slice().reverse().map((row, reversedIdx) => {
          // Convert reversed index back to original: 0->5, 1->4, ..., 5->0
          const sIdx = strings - 1 - reversedIdx;
          return row.map((isActive, tIdx) => (
            <div 
              key={`${sIdx}-${tIdx}`} 
              className={`cell ${isActive ? 'active' : ''}`} 
              onClick={() => onToggle(sIdx, tIdx)}
            >
              <div className="note-marker" />
            </div>
          ));
        })}
      </div>
    </div>
  );
};
