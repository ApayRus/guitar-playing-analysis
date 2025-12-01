import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
	selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
	selectDataFile: () => ipcRenderer.invoke('select-data-file'),
	readDataFile: (filePath: string) => ipcRenderer.invoke('read-data-file', filePath),
	selectSaveFile: () => ipcRenderer.invoke('select-save-file'),
	writeDataFile: (filePath: string, content: string) => ipcRenderer.invoke('write-data-file', filePath, content)
})

// Type definitions for TypeScript
declare global {
	interface Window {
		electronAPI: {
			selectVideoFile: () => Promise<string | null>
			selectDataFile: () => Promise<string | null>
			readDataFile: (filePath: string) => Promise<string>
			selectSaveFile: () => Promise<string | null>
			writeDataFile: (filePath: string, content: string) => Promise<void>
		}
	}
}

