// Type definitions for Electron API exposed via preload script
export interface ElectronAPI {
	selectVideoFile: () => Promise<string | null>
	selectDataFile: () => Promise<string | null>
	readDataFile: (filePath: string) => Promise<string>
	selectSaveFile: () => Promise<string | null>
	writeDataFile: (filePath: string, content: string) => Promise<void>
}

declare global {
	interface Window {
		electronAPI?: ElectronAPI
	}
}

