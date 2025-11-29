import React, { useState, useEffect, useRef } from 'react'
import { PlayPosition } from './PlayPosition'
import type { GuitarSettings } from './PlayPosition'
import './PlayPosition.css'

interface PlayPositionEditorProps {
	id: string
	settings?: GuitarSettings
	onShowAllPlayPositions?: () => void
}

interface GuitarData {
	pluck: boolean[][]
	clamp: number[][] // 0: inactive, 1: active (normal), 2: active (red)
	barres: boolean[]
	fretCount?: number
	pluckCols?: number
}

const STRINGS = 6

const createEmptyGrid = (rows: number, cols: number) =>
	Array(rows)
		.fill(null)
		.map(() => Array(cols).fill(false))

const createEmptyClampGrid = (rows: number, cols: number) =>
	Array(rows)
		.fill(null)
		.map(() => Array(cols).fill(0))

// Helper to resize grid by adding/removing columns from the start (for frets: index 0 is rightmost/highest number)
// Works with both boolean[][] (for pluck) and number[][] (for clamp)
const resizeGridFromStart = <T extends boolean | number>(
	grid: T[][],
	rows: number,
	oldCols: number,
	newCols: number,
	defaultValue: T
): T[][] => {
	const result = Array(rows)
		.fill(null)
		.map(() => Array(newCols).fill(defaultValue))

	if (newCols > oldCols) {
		// Adding columns: shift existing data to the right, new columns at start (index 0)
		const colsToAdd = newCols - oldCols
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < oldCols; c++) {
				result[r][c + colsToAdd] = (grid[r]?.[c] as T) ?? defaultValue
			}
			// New columns at start are already defaultValue
		}
	} else {
		// Removing columns: take data from the right (skip first oldCols - newCols columns)
		const colsToSkip = oldCols - newCols
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < newCols; c++) {
				result[r][c] = (grid[r]?.[c + colsToSkip] as T) ?? defaultValue
			}
		}
	}

	return result
}

// Helper to resize grid by adding/removing columns from the end (for pluck: left to right numbering)
const resizeGridFromEnd = (
	grid: boolean[][],
	rows: number,
	oldCols: number,
	newCols: number
): boolean[][] => {
	const result = Array(rows)
		.fill(null)
		.map(() => Array(newCols).fill(false))

	if (newCols > oldCols) {
		// Adding columns: copy all existing data, new columns are false at the end
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < oldCols; c++) {
				result[r][c] = grid[r]?.[c] || false
			}
		}
	} else {
		// Removing columns: copy only first newCols columns
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < newCols; c++) {
				result[r][c] = grid[r]?.[c] || false
			}
		}
	}

	return result
}

// Helper to resize array by adding/removing from the start (for barres: index 0 is rightmost/highest number)
const resizeArrayFromStart = (
	arr: boolean[],
	oldSize: number,
	newSize: number
): boolean[] => {
	if (newSize > oldSize) {
		// Adding: shift existing to the right, new elements at start (index 0)
		const elementsToAdd = newSize - oldSize
		return [...Array(elementsToAdd).fill(false), ...arr.slice(0, oldSize)]
	} else {
		// Removing: skip first elements, take from the right
		const elementsToSkip = oldSize - newSize
		return arr.slice(elementsToSkip)
	}
}

const DEFAULT_FRET_COUNT = 4
const DEFAULT_PLUCK_COLS = 7

// Helper functions for playPositions storage
// Structure: Array of { id: string, ...GuitarData }
export const getPlayPositions = (): Array<GuitarData & { id: string }> => {
	try {
		const saved = localStorage.getItem('playPositions')
		if (!saved) return []
		const parsed = JSON.parse(saved)
		// Handle migration from object to array
		if (Array.isArray(parsed)) {
			return parsed
		}
		// Convert old object format to array
		return Object.entries(parsed).map(([id, data]: [string, any]) => ({
			id,
			...data
		}))
	} catch (e) {
		console.error('Failed to load playPositions', e)
		return []
	}
}

export const savePlayPosition = (id: string, data: GuitarData) => {
	const playPositions = getPlayPositions()
	const existingIndex = playPositions.findIndex(p => p.id === id)

	if (existingIndex >= 0) {
		// Update existing
		playPositions[existingIndex] = { id, ...data }
	} else {
		// Add new at the end
		playPositions.push({ id, ...data })
	}

	localStorage.setItem('playPositions', JSON.stringify(playPositions))
}

export const getPlayPosition = (id: string): GuitarData | null => {
	const playPositions = getPlayPositions()
	const found = playPositions.find(p => p.id === id)
	if (!found) return null
	// Remove id from returned data
	const { id: _, ...data } = found
	return data
}

export const PlayPositionEditor: React.FC<PlayPositionEditorProps> = ({
	id,
	settings,
	onShowAllPlayPositions
}) => {
	// Track previous dimensions to detect changes
	const prevIdRef = useRef(id)

	// Helper to convert boolean clamp to number clamp (for migration)
	const convertClampToNumber = (clamp: any): number[][] => {
		if (!clamp) return createEmptyClampGrid(STRINGS, DEFAULT_FRET_COUNT)
		if (Array.isArray(clamp) && clamp.length > 0 && clamp[0].length > 0) {
			// Check if it's boolean array (old format) or number array (new format)
			if (typeof clamp[0][0] === 'boolean') {
				// Convert boolean to number: false -> 0, true -> 1
				return clamp.map(row => row.map((val: boolean) => (val ? 1 : 0)))
			}
			// Already number array
			return clamp
		}
		return createEmptyClampGrid(STRINGS, DEFAULT_FRET_COUNT)
	}

	const [data, setData] = useState<GuitarData>(() => {
		const saved = getPlayPosition(id)
		if (saved) {
			// Load data as-is from playPositions, use saved dimensions if available
			const savedFretCount = saved.fretCount || DEFAULT_FRET_COUNT
			const savedPluckCols = saved.pluckCols || DEFAULT_PLUCK_COLS
			return {
				pluck: saved.pluck || createEmptyGrid(STRINGS, savedPluckCols),
				clamp:
					convertClampToNumber(saved.clamp) ||
					createEmptyClampGrid(STRINGS, savedFretCount),
				barres: saved.barres || Array(savedFretCount).fill(false),
				fretCount: savedFretCount,
				pluckCols: savedPluckCols
			}
		}
		return {
			pluck: createEmptyGrid(STRINGS, DEFAULT_PLUCK_COLS),
			clamp: createEmptyClampGrid(STRINGS, DEFAULT_FRET_COUNT),
			barres: Array(DEFAULT_FRET_COUNT).fill(false),
			fretCount: DEFAULT_FRET_COUNT,
			pluckCols: DEFAULT_PLUCK_COLS
		}
	})

	// Reload data when id changes (switching positions)
	useEffect(() => {
		if (id !== prevIdRef.current) {
			const saved = getPlayPosition(id)
			if (saved) {
				// Load data as-is from playPositions, use saved dimensions
				const savedFretCount = saved.fretCount || DEFAULT_FRET_COUNT
				const savedPluckCols = saved.pluckCols || DEFAULT_PLUCK_COLS
				setData({
					pluck: saved.pluck || createEmptyGrid(STRINGS, savedPluckCols),
					clamp:
						convertClampToNumber(saved.clamp) ||
						createEmptyClampGrid(STRINGS, savedFretCount),
					barres: saved.barres || Array(savedFretCount).fill(false),
					fretCount: savedFretCount,
					pluckCols: savedPluckCols
				})
			} else {
				setData({
					pluck: createEmptyGrid(STRINGS, DEFAULT_PLUCK_COLS),
					clamp: createEmptyClampGrid(STRINGS, DEFAULT_FRET_COUNT),
					barres: Array(DEFAULT_FRET_COUNT).fill(false),
					fretCount: DEFAULT_FRET_COUNT,
					pluckCols: DEFAULT_PLUCK_COLS
				})
			}
			prevIdRef.current = id
		}
	}, [id])

	// Save data to playPositions whenever it changes
	useEffect(() => {
		// Save with current dimensions
		const dataToSave = {
			pluck: data.pluck,
			clamp: data.clamp,
			barres: data.barres,
			fretCount: data.fretCount || DEFAULT_FRET_COUNT,
			pluckCols: data.pluckCols || DEFAULT_PLUCK_COLS
		}
		savePlayPosition(id, dataToSave)
	}, [data, id])

	// Ensure data is saved when component unmounts (position switch)
	useEffect(() => {
		return () => {
			// Save current data before unmounting
			const dataToSave = {
				pluck: data.pluck,
				clamp: data.clamp,
				barres: data.barres,
				fretCount: data.fretCount || DEFAULT_FRET_COUNT,
				pluckCols: data.pluckCols || DEFAULT_PLUCK_COLS
			}
			savePlayPosition(id, dataToSave)
		}
	}, [id, data])

	const handlePluckToggle = (stringIdx: number, timeIdx: number) => {
		setData(prev => {
			const newPluck = prev.pluck.map(row => [...row])
			newPluck[stringIdx][timeIdx] = !newPluck[stringIdx][timeIdx]
			return { ...prev, pluck: newPluck }
		})
	}

	const handleClampToggle = (stringIdx: number, fretIdx: number) => {
		setData(prev => {
			const newClamp = prev.clamp.map(row => [...row])
			const currentState = newClamp[stringIdx][fretIdx] || 0
			// Cycle: 0 -> 1 -> 2 -> 0
			newClamp[stringIdx][fretIdx] = (currentState + 1) % 3
			return { ...prev, clamp: newClamp }
		})
	}

	const handleBarreToggle = (fretIdx: number) => {
		setData(prev => {
			const newBarres = [...prev.barres]
			newBarres[fretIdx] = !newBarres[fretIdx]
			return { ...prev, barres: newBarres }
		})
	}

	const handleFretCountChange = (value: number) => {
		setData(prev => {
			const prevFretCount = prev.fretCount || DEFAULT_FRET_COUNT
			if (value === prevFretCount) return prev

			const newData = { ...prev }
			// Handle fretCount change (for clamp and barres)
			// Note: In Clamp, index 0 is the rightmost/highest numbered fret
			// So we add/remove from the start of the array (index 0)
			newData.clamp = resizeGridFromStart<number>(
				prev.clamp,
				STRINGS,
				prevFretCount,
				value,
				0 // defaultValue for clamp (inactive)
			)
			newData.barres = resizeArrayFromStart(prev.barres, prevFretCount, value)
			newData.fretCount = value
			return newData
		})
	}

	const handlePluckColsChange = (value: number) => {
		setData(prev => {
			const prevPluckCols = prev.pluckCols || DEFAULT_PLUCK_COLS
			if (value === prevPluckCols) return prev

			const newData = { ...prev }
			// Handle pluckCols change (for pluck)
			// Pluck columns are numbered left to right, so add/remove from end
			newData.pluck = resizeGridFromEnd(
				prev.pluck,
				STRINGS,
				prevPluckCols,
				value
			)
			newData.pluckCols = value
			return newData
		})
	}

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

	// Use saved dimensions from data
	const displayFretCount = data.fretCount ?? DEFAULT_FRET_COUNT
	const displayPluckCols = data.pluckCols ?? DEFAULT_PLUCK_COLS

	return (
		<div className='play-position-container' style={containerStyle}>
			{/* Dimension controls in column */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: '10px',
					marginBottom: '10px'
				}}
			>
				<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
					Frets:
					<input
						type='number'
						min='1'
						max='12'
						value={displayFretCount}
						onChange={e => handleFretCountChange(Number(e.target.value))}
						style={{
							width: '30px',
							backgroundColor: 'var(--guitar-bg)',
							color: 'white'
						}}
					/>
				</label>
				<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
					Pluck:
					<input
						type='number'
						min='1'
						max='20'
						value={displayPluckCols}
						onChange={e => handlePluckColsChange(Number(e.target.value))}
						style={{
							width: '30px',
							backgroundColor: 'var(--guitar-bg)',
							color: 'white'
						}}
					/>
				</label>
				{onShowAllPlayPositions && (
					<a
						href='#'
						onClick={e => {
							e.preventDefault()
							onShowAllPlayPositions()
						}}
						style={{
							color: '#81a1c1',
							textDecoration: 'underline',
							cursor: 'pointer'
						}}
					>
						all positions
					</a>
				)}
			</div>

			<PlayPosition
				pluck={data.pluck}
				clamp={data.clamp}
				barres={data.barres}
				fretCount={displayFretCount}
				pluckCols={displayPluckCols}
				onPluckToggle={handlePluckToggle}
				onClampToggle={handleClampToggle}
				onBarreToggle={handleBarreToggle}
				settings={settings}
			/>
		</div>
	)
}
