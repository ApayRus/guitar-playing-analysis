import React from 'react'
import { Pluck } from './Pluck'
import { Clamp } from './Clamp'
import './PlayPosition.css'

export interface GuitarSettings {
	pluckMarkerSize: number
	pluckCellWidth: number
	clampMarkerSize: number
	clampCellSize: number
	stringSpacing: number
}

interface PlayPositionProps {
	pluck: boolean[][]
	clamp: number[][] // 0: inactive, 1: active (normal), 2: active (red)
	barres: boolean[]
	fretCount: number
	pluckCols: number
	onPluckToggle?: (stringIdx: number, timeIdx: number) => void
	onClampToggle?: (stringIdx: number, fretIdx: number) => void
	onBarreToggle?: (fretIdx: number) => void
	settings?: GuitarSettings
}

export const PlayPosition: React.FC<PlayPositionProps> = ({
	pluck,
	clamp,
	barres,
	fretCount,
	pluckCols,
	onPluckToggle,
	onClampToggle,
	onBarreToggle,
	settings
}) => {
	// Apply settings as CSS variables
	const containerStyle = settings
		? ({
				'--pluck-marker-size': `${settings.pluckMarkerSize}px`,
				'--pluck-cell-width': `${settings.pluckCellWidth}px`,
				'--clamp-marker-size': `${settings.clampMarkerSize}px`,
				'--cell-size': `${settings.clampCellSize}px`,
				'--string-spacing': `${settings.stringSpacing}px`
		  } as React.CSSProperties)
		: {}

	return (
		<div className='play-position-container' style={containerStyle}>
			<Pluck
				pattern={pluck}
				onToggle={onPluckToggle || (() => {})}
				cols={pluckCols}
			/>
			<Clamp
				positions={clamp}
				barres={barres}
				onTogglePosition={onClampToggle || (() => {})}
				onToggleBarre={onBarreToggle || (() => {})}
				frets={fretCount}
			/>
		</div>
	)
}
