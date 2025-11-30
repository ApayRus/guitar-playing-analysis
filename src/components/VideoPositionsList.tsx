import React, { type RefObject } from 'react'
import { PlayPosition } from './guitar/PlayPosition'
import { getPlayPosition } from './guitar/PlayPositionEditor'
import type { GuitarSettings } from './guitar/PlayPosition'

interface Position {
	id: number
	timestamp: number
	label: number
	playPositionId: string
}

interface VideoPositionsListProps {
	positions: Position[]
	videoRef: RefObject<HTMLVideoElement | null>
	guitarSettings: GuitarSettings
	onActivatePosition: (positionId: number) => void
}

const DEFAULT_FRET_COUNT = 4
const DEFAULT_PLUCK_COLS = 7

export const VideoPositionsList: React.FC<VideoPositionsListProps> = ({
	positions,
	videoRef,
	guitarSettings,
	onActivatePosition
}) => {
	// Sort by label (creation order) to match localStorage.playPositions order
	const sortedPositions = [...positions].sort((a, b) => a.label - b.label)

	// Group consecutive identical positions
	const groupedPositions: Array<{
		positions: Position[]
		playPositionId: string
	}> = []
	
	for (let i = 0; i < sortedPositions.length; i++) {
		const pos = sortedPositions[i]
		const lastGroup = groupedPositions[groupedPositions.length - 1]
		
		if (lastGroup && lastGroup.playPositionId === pos.playPositionId) {
			// Add to existing group
			lastGroup.positions.push(pos)
		} else {
			// Create new group
			groupedPositions.push({
				positions: [pos],
				playPositionId: pos.playPositionId
			})
		}
	}

	return (
		<div>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '10px',
					alignContent: 'flex-start'
				}}
			>
				{groupedPositions.map((group, groupIndex) => {
					const firstPos = group.positions[0]
					const playPositionData = getPlayPosition(group.playPositionId)
					if (!playPositionData) return null

					const nextGroup = groupedPositions[groupIndex + 1]
					const nextPosition = nextGroup ? nextGroup.positions[0] : null

					const handleClick = () => {
						// Activate the first position in the group
						onActivatePosition(firstPos.id)

						// Play interval from first to last position in group
						if (!videoRef.current) return
						const startTime = firstPos.timestamp
						const endTime = nextPosition
							? nextPosition.timestamp
							: videoRef.current.duration

						// Set video time to start
						videoRef.current.currentTime = startTime

						// Play video
						videoRef.current.play()

						// Stop at end time
						const checkTime = () => {
							if (videoRef.current && videoRef.current.currentTime >= endTime) {
								videoRef.current.pause()
								videoRef.current.removeEventListener('timeupdate', checkTime)
							}
						}
						videoRef.current.addEventListener('timeupdate', checkTime)
					}

					const count = group.positions.length

					return (
						<div
							key={`${firstPos.id}-${groupIndex}`}
							onClick={handleClick}
							style={{
								display: 'inline-block',
								padding: '5px',
								cursor: 'pointer',
								borderRadius: '8px',
								backgroundColor: 'transparent',
								transition: 'background-color 0.2s',
								position: 'relative'
							}}
							onMouseEnter={e => {
								e.currentTarget.style.backgroundColor =
									'rgba(255, 255, 255, 0.1)'
							}}
							onMouseLeave={e => {
								e.currentTarget.style.backgroundColor = 'transparent'
							}}
							title={`Play from ${firstPos.timestamp.toFixed(2)}s to ${
								nextPosition ? nextPosition.timestamp.toFixed(2) : 'end'
							}s${count > 1 ? ` (${count} identical positions)` : ''}`}
						>
							{count > 1 && (
								<div
									style={{
										position: 'absolute',
										top: '0',
										right: '0',
										backgroundColor: 'rgba(0, 0, 0, 0.7)',
										color: 'white',
										borderRadius: '50%',
										width: '20px',
										height: '20px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '11px',
										fontWeight: 'bold',
										zIndex: 10,
										transform: 'translate(25%, -25%)'
									}}
								>
									{count}
								</div>
							)}
							<PlayPosition
								pluck={playPositionData.pluck}
								clamp={playPositionData.clamp}
								barres={playPositionData.barres}
								fretCount={playPositionData.fretCount || DEFAULT_FRET_COUNT}
								pluckCols={playPositionData.pluckCols || DEFAULT_PLUCK_COLS}
								settings={guitarSettings}
							/>
						</div>
					)
				})}
			</div>
		</div>
	)
}
