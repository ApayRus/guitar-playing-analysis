import { useState } from 'react'
import { VideoWorkspace, type Position } from './components/VideoWorkspace'
import { VideoPositionsList } from './components/VideoPositionsList'
import type { GuitarSettings } from './components/guitar/PlayPosition'
import './App.css'

function App() {
	const [workspaceData, setWorkspaceData] = useState<{
		positions: Position[]
		videoRef: React.RefObject<HTMLVideoElement | null>
		guitarSettings: GuitarSettings
		onActivatePosition: (positionId: number) => void
	} | null>(null)

	return (
		<div style={{ width: '100%', minHeight: '100vh' }}>
			<VideoWorkspace
				onDataReady={data => {
					setWorkspaceData(data)
				}}
			/>
			{workspaceData && (
				<div
					style={{ padding: '20px', maxWidth: '100%', boxSizing: 'border-box' }}
				>
					<VideoPositionsList
						positions={workspaceData.positions}
						videoRef={workspaceData.videoRef}
						guitarSettings={workspaceData.guitarSettings}
						onActivatePosition={workspaceData.onActivatePosition}
					/>
				</div>
			)}
		</div>
	)
}

export default App
