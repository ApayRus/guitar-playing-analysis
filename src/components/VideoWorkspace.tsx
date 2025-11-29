import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PlayPositionEditor } from './guitar/PlayPositionEditor'
import { PlayPosition } from './guitar/PlayPosition'
import { getPlayPosition } from './guitar/PlayPositionEditor'
import type { GuitarSettings } from './guitar/PlayPosition'
import './VideoWorkspace.css'

interface Position {
	id: number
	timestamp: number
	label: number
	playPositionId: string // Random string ID for PlayPosition
}

const SPEEDS = [0.1, 0.2, 0.3, 0.4, 0.5, 1.0]

const DEFAULT_SETTINGS: GuitarSettings = {
	pluckMarkerSize: 10,
	pluckCellWidth: 20,
	clampMarkerSize: 14,
	clampCellSize: 40,
	stringSpacing: 30
}

// Generate random string ID for PlayPosition
const generatePlayPositionId = (): string => {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	)
}

const DEFAULT_FRET_COUNT = 4
const DEFAULT_PLUCK_COLS = 7

interface VideoWorkspaceProps {
	onDataReady?: (data: {
		positions: Position[]
		videoRef: React.RefObject<HTMLVideoElement | null>
		guitarSettings: GuitarSettings
		onActivatePosition: (positionId: number) => void
	}) => void
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
	onDataReady
}) => {
	const videoRef = useRef<HTMLVideoElement>(null)

	// State for positions list
	const [positions, setPositions] = useState<Position[]>(() => {
		try {
			const saved = localStorage.getItem('video-positions')
			return saved ? JSON.parse(saved) : []
		} catch (e) {
			console.error('Failed to load positions', e)
			return []
		}
	})

	// State for currently active position ID
	const [activeId, setActiveId] = useState<number | null>(null)

	// State for playback speed
	const [playbackRate, setPlaybackRate] = useState(1.0)

	// State for modal
	const [showPlayPositionsModal, setShowPlayPositionsModal] = useState(false)

	// State for guitar settings
	const [guitarSettings, setGuitarSettings] = useState<GuitarSettings>(() => {
		try {
			const saved = localStorage.getItem('guitar-settings')
			return saved ? JSON.parse(saved) : DEFAULT_SETTINGS
		} catch (e) {
			console.error('Failed to load guitar settings', e)
			return DEFAULT_SETTINGS
		}
	})

	// Persist positions list
	useEffect(() => {
		localStorage.setItem('video-positions', JSON.stringify(positions))
	}, [positions])

	// Persist guitar settings
	useEffect(() => {
		localStorage.setItem('guitar-settings', JSON.stringify(guitarSettings))
	}, [guitarSettings])

	// Handle position selection
	const handleSelectPosition = useCallback((pos: Position | number) => {
		const positionId = typeof pos === 'number' ? pos : pos.id
		const position = typeof pos === 'number' ? positions.find(p => p.id === positionId) : pos
		if (position && videoRef.current) {
			videoRef.current.currentTime = position.timestamp
		}
		setActiveId(positionId)
	}, [positions])

	// Notify parent component when data is ready
	useEffect(() => {
		if (onDataReady) {
			onDataReady({
				positions,
				videoRef,
				guitarSettings,
				onActivatePosition: handleSelectPosition
			})
		}
	}, [positions, guitarSettings, onDataReady, handleSelectPosition])

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!videoRef.current) return

			// Space: toggle play/pause
			if (e.key === ' ' || e.key === 'Spacebar') {
				e.preventDefault()
				if (videoRef.current.paused) {
					videoRef.current.play()
				} else {
					videoRef.current.pause()
				}
				return
			}

			let seekAmount = 0

			// Arrow keys
			if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				e.preventDefault()

				// Check modifiers for precision
				if (e.shiftKey && e.altKey && e.ctrlKey) {
					seekAmount = 0.05
				} else if (e.shiftKey && e.ctrlKey) {
					seekAmount = 0.1
				} else if (e.shiftKey) {
					seekAmount = 0.5
				} else {
					// No modifiers: standard 1 second seek
					seekAmount = 1.0
				}

				if (e.key === 'ArrowLeft') {
					videoRef.current.currentTime = Math.max(
						0,
						videoRef.current.currentTime - seekAmount
					)
				} else if (e.key === 'ArrowRight') {
					videoRef.current.currentTime = Math.min(
						videoRef.current.duration,
						videoRef.current.currentTime + seekAmount
					)
				}
			}
		}

		// Use capture phase (true) to intercept events before they reach focused elements
		window.addEventListener('keydown', handleKeyDown, true)
		return () => window.removeEventListener('keydown', handleKeyDown, true)
	}, [])

	const handleAddPosition = () => {
		if (!videoRef.current) return

		const timestamp = videoRef.current.currentTime
		// Determine next label number (1, 2, 3...)
		const maxLabel = positions.reduce((max, p) => Math.max(max, p.label), 0)
		const newLabel = maxLabel + 1
		const newId = newLabel // Use number ID for video position

		// Create new playPositionId
		const playPositionId = generatePlayPositionId()

		// Get dimensions from last position's playPosition if exists
		const lastPosition =
			positions.length > 0 ? positions[positions.length - 1] : null
		let fretCount = DEFAULT_FRET_COUNT
		let pluckCols = DEFAULT_PLUCK_COLS

		if (lastPosition) {
			try {
				const playPositions = JSON.parse(
					localStorage.getItem('playPositions') || '[]'
				)
				let saved = null
				if (Array.isArray(playPositions)) {
					saved = playPositions.find(p => p.id === lastPosition.playPositionId)
				} else {
					// Old object format
					saved = playPositions[lastPosition.playPositionId]
				}
				if (saved) {
					fretCount = saved.fretCount || DEFAULT_FRET_COUNT
					pluckCols = saved.pluckCols || DEFAULT_PLUCK_COLS
				}
			} catch (e) {
				console.error('Failed to load last position dimensions', e)
			}
		}

		// Create new empty playPosition with dimensions from previous
		const createEmptyGrid = (rows: number, cols: number) =>
			Array(rows)
				.fill(null)
				.map(() => Array(cols).fill(false))

		const createEmptyClampGrid = (rows: number, cols: number) =>
			Array(rows)
				.fill(null)
				.map(() => Array(cols).fill(0))

		const newPlayPositionData = {
			pluck: createEmptyGrid(6, pluckCols),
			clamp: createEmptyClampGrid(6, fretCount),
			barres: Array(fretCount).fill(false),
			fretCount,
			pluckCols
		}

		// Save to playPositions array
		const playPositions = JSON.parse(
			localStorage.getItem('playPositions') || '[]'
		)
		const positionsArray = Array.isArray(playPositions)
			? playPositions
			: Object.entries(playPositions).map(([id, data]: [string, any]) => ({
					id,
					...data
			  }))
		positionsArray.push({ id: playPositionId, ...newPlayPositionData })
		localStorage.setItem('playPositions', JSON.stringify(positionsArray))

		const newPosition: Position = {
			id: newId,
			timestamp,
			label: newLabel,
			playPositionId
		}

		setPositions(prev => [...prev, newPosition])
		setActiveId(newId)
	}

	const handleRemovePosition = () => {
		if (!activeId) return
		// Note: We don't remove PlayPosition from localStorage here
		// because it might be used by other video positions
		setPositions(prev => prev.filter(p => p.id !== activeId))
		setActiveId(null)
	}

	const handleSpeedChange = (speed: number) => {
		if (videoRef.current) {
			videoRef.current.playbackRate = speed
		}
		setPlaybackRate(speed)
	}

	const handleSettingChange = (key: keyof GuitarSettings, value: number) => {
		setGuitarSettings(prev => ({ ...prev, [key]: value }))
	}

	// Logic: When seeking, if position is active, update it.
	const handleSeeked = () => {
		if (activeId && videoRef.current) {
			const newTime = videoRef.current.currentTime
			setPositions(prev =>
				prev.map(p => (p.id === activeId ? { ...p, timestamp: newTime } : p))
			)
		}
	}

	// Logic: When playing (time updates), deselect active position
	const handleTimeUpdate = () => {
		if (!videoRef.current) return

		if (!videoRef.current.paused) {
			if (activeId) {
				setActiveId(null)
			}
		}
	}

	const handleSelectPlayPosition = (playPositionId: string) => {
		if (!activeId) return
		setPositions(prev =>
			prev.map(p => (p.id === activeId ? { ...p, playPositionId } : p))
		)
		setShowPlayPositionsModal(false)
	}

	const getAllPlayPositions = (): Array<{
		id: string
		fretCount: number
		pluckCols: number
	}> => {
		try {
			const playPositions = JSON.parse(
				localStorage.getItem('playPositions') || '[]'
			)
			// Handle migration from object to array
			if (Array.isArray(playPositions)) {
				return playPositions.map(p => ({
					id: p.id,
					fretCount: p.fretCount || DEFAULT_FRET_COUNT,
					pluckCols: p.pluckCols || DEFAULT_PLUCK_COLS
				}))
			}
			// Old object format - convert to array
			return Object.entries(playPositions).map(([id, data]: [string, any]) => ({
				id,
				fretCount: data.fretCount || DEFAULT_FRET_COUNT,
				pluckCols: data.pluckCols || DEFAULT_PLUCK_COLS
			}))
		} catch (e) {
			console.error('Failed to load playPositions', e)
			return []
		}
	}

	return (
		<div className='video-workspace'>
			<video
				ref={videoRef}
				className='fullscreen-video'
				src='/video.mp4'
				controls
				onSeeked={handleSeeked}
				onTimeUpdate={handleTimeUpdate}
			/>

			<div className='workspace-overlay'>
				{/* Left Panel: Positions Grid */}
				<div className='positions-panel'>
					{positions.map(pos => (
						<div
							key={pos.id}
							className={`position-marker ${
								activeId === pos.id ? 'active' : ''
							}`}
							onClick={() => handleSelectPosition(pos)}
						>
							{pos.label}
						</div>
					))}
				</div>

				{/* Right Panel: Controls & Guitar Tab */}
				<div className='controls-panel'>
					<div className='top-controls-row'>
						{/* Remove Button */}
						<button
							className='control-btn remove-btn'
							onClick={handleRemovePosition}
							title='Remove video position'
							disabled={!activeId}
							style={{
								opacity: activeId ? 1 : 0.5,
								cursor: activeId ? 'pointer' : 'default'
							}}
						>
							✕
						</button>

						{/* Speed Controls */}
						{SPEEDS.map(speed => (
							<button
								key={speed}
								className={`control-btn ${
									Math.abs(playbackRate - speed) < 0.01 ? 'active' : ''
								}`}
								onClick={() => handleSpeedChange(speed)}
								title='Speed'
							>
								{speed}
							</button>
						))}

						{/* Add Button */}
						<button
							className='add-position-btn'
							onClick={handleAddPosition}
							title='Add Position'
						>
							+
						</button>
					</div>

					{/* Guitar Settings Controls */}
					<div className='settings-controls'>
						<div className='setting-row'>
							<label title='Pluck marker size'>P.Mark</label>
							<input
								type='number'
								min='5'
								max='30'
								value={guitarSettings.pluckMarkerSize}
								onChange={e =>
									handleSettingChange('pluckMarkerSize', Number(e.target.value))
								}
							/>
						</div>
						<div className='setting-row'>
							<label title='Pluck cell width'>P.Cell</label>
							<input
								type='number'
								min='10'
								max='60'
								value={guitarSettings.pluckCellWidth}
								onChange={e =>
									handleSettingChange('pluckCellWidth', Number(e.target.value))
								}
							/>
						</div>
						<div className='setting-row'>
							<label title='Clamp marker size'>C.Mark</label>
							<input
								type='number'
								min='5'
								max='30'
								value={guitarSettings.clampMarkerSize}
								onChange={e =>
									handleSettingChange('clampMarkerSize', Number(e.target.value))
								}
							/>
						</div>
						<div className='setting-row'>
							<label title='Clamp cell size'>C.Cell</label>
							<input
								type='number'
								min='20'
								max='80'
								value={guitarSettings.clampCellSize}
								onChange={e =>
									handleSettingChange('clampCellSize', Number(e.target.value))
								}
							/>
						</div>
						<div className='setting-row'>
							<label title='String spacing'>Strings</label>
							<input
								type='number'
								min='15'
								max='60'
								value={guitarSettings.stringSpacing}
								onChange={e =>
									handleSettingChange('stringSpacing', Number(e.target.value))
								}
							/>
						</div>
					</div>

					{activeId &&
						(() => {
							const pos = positions.find(p => p.id === activeId)
							if (!pos) return null
							return (
								<div className='guitar-wrapper'>
									<PlayPositionEditor
										key={pos.playPositionId}
										id={pos.playPositionId}
										settings={guitarSettings}
										onShowAllPlayPositions={() =>
											setShowPlayPositionsModal(true)
										}
									/>
								</div>
							)
						})()}
				</div>
			</div>

			{/* Modal for selecting play positions */}
			{showPlayPositionsModal && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.9)',
						zIndex: 1000,
						overflow: 'auto',
						padding: '20px',
						boxSizing: 'border-box'
					}}
					onClick={e => {
						if (e.target === e.currentTarget) {
							setShowPlayPositionsModal(false)
						}
					}}
				>
					<div
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							flexDirection: 'column'
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '20px'
							}}
						>
							<h2 style={{ margin: 0, color: '#fff' }}>All Play Positions</h2>
							<button
								onClick={() => setShowPlayPositionsModal(false)}
								style={{
									padding: '10px 20px',
									backgroundColor: '#81a1c1',
									color: '#1a1a1a',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontWeight: 'bold'
								}}
							>
								Close
							</button>
						</div>
						<div
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: '10px',
								flex: 1,
								overflow: 'auto',
								alignContent: 'flex-start'
							}}
						>
							{getAllPlayPositions()
								.map(pp => {
									const playPositionData = getPlayPosition(pp.id)
									return playPositionData ? { ...pp, data: playPositionData } : null
								})
								.filter((pp): pp is { id: string; fretCount: number; pluckCols: number; data: NonNullable<ReturnType<typeof getPlayPosition>> } => {
									if (!pp || !pp.data) return false
									// Check if position is empty
									const { pluck, clamp, barres } = pp.data
									// Check pluck: all false
									const hasPluck = pluck.some(row => row.some(cell => cell === true))
									// Check clamp: all 0 (inactive)
									const hasClamp = clamp.some(row => row.some(cell => cell !== 0))
									// Check barres: all false
									const hasBarres = barres.some(barre => barre === true)
									// Show only if at least one value is set
									return hasPluck || hasClamp || hasBarres
								})
								.map(pp => {
									const currentPos = positions.find(p => p.id === activeId)
									const isSelected = currentPos?.playPositionId === pp.id
									const playPositionData = pp.data

									return (
									<div
										key={pp.id}
										onClick={() => handleSelectPlayPosition(pp.id)}
										style={{
											display: 'inline-block',
											padding: '5px',
											cursor: 'pointer',
											borderRadius: '8px',
											backgroundColor: isSelected
												? 'rgba(15, 116, 218, 0.5)'
												: 'transparent',
											transition: 'background-color 0.2s'
										}}
									>
										<PlayPosition
											pluck={playPositionData.pluck}
											clamp={playPositionData.clamp}
											barres={playPositionData.barres}
											fretCount={pp.fretCount}
											pluckCols={pp.pluckCols}
											settings={guitarSettings}
										/>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

// Export types for use in App.tsx
export type { Position }
