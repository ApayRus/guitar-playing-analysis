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
				{sortedPositions.map((pos, index) => {
					const playPositionData = getPlayPosition(pos.playPositionId)
					if (!playPositionData) return null

					const nextPosition = sortedPositions[index + 1]

					const handleClick = () => {
						// Activate the position
						onActivatePosition(pos.id)

						// Play interval
						if (!videoRef.current) return
						const startTime = pos.timestamp
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

					return (
						<div
							key={pos.id}
							onClick={handleClick}
							style={{
								display: 'inline-block',
								padding: '5px',
								cursor: 'pointer',
								borderRadius: '8px',
								backgroundColor: 'transparent',
								transition: 'background-color 0.2s'
							}}
							onMouseEnter={e => {
								e.currentTarget.style.backgroundColor =
									'rgba(255, 255, 255, 0.1)'
							}}
							onMouseLeave={e => {
								e.currentTarget.style.backgroundColor = 'transparent'
							}}
							title={`Play from ${pos.timestamp.toFixed(2)}s to ${
								nextPosition ? nextPosition.timestamp.toFixed(2) : 'end'
							}s`}
						>
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
