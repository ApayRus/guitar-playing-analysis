import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readFile, writeFile } from 'fs/promises'

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Disable sandbox for AppImage compatibility - must be called before app.whenReady()
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-setuid-sandbox')

// Set app name for proper WM_CLASS on Linux
app.setName('GuitarNotebook')

let mainWindow: BrowserWindow | null = null

function createWindow() {
	const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
	
	mainWindow = new BrowserWindow({
		width: 1400,
		height: 900,
		icon: join(__dirname, '../dist/favicon/android-chrome-512x512.png'),
		webPreferences: {
			preload: join(__dirname, 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: false
		},
		titleBarStyle: 'default'
	})

	// Set WM_CLASS for Linux desktop integration
	if (process.platform === 'linux') {
		mainWindow.setTitle('GuitarNotebook')
	}

	// Load the app
	if (isDev) {
		mainWindow.loadURL('http://localhost:5173')
		mainWindow.webContents.openDevTools()
	} else {
		mainWindow.loadFile(join(__dirname, '../dist/index.html'))
	}

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// Handle file selection
ipcMain.handle('select-video-file', async () => {
	if (!mainWindow) return null

	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ['openFile'],
		filters: [
			{ name: 'Video Files', extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'] },
			{ name: 'All Files', extensions: ['*'] }
		]
	})

	if (result.canceled || result.filePaths.length === 0) {
		return null
	}

	return result.filePaths[0]
})

// Handle data file selection
ipcMain.handle('select-data-file', async () => {
	if (!mainWindow) return null

	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ['openFile'],
		filters: [
			{ name: 'JSON Files', extensions: ['json'] },
			{ name: 'All Files', extensions: ['*'] }
		]
	})

	if (result.canceled || result.filePaths.length === 0) {
		return null
	}

	return result.filePaths[0]
})

// Handle data file reading
ipcMain.handle('read-data-file', async (_event, filePath: string) => {
	try {
		const content = await readFile(filePath, 'utf-8')
		return content
	} catch (error) {
		console.error('Failed to read file:', error)
		throw error
	}
})

// Handle save file selection
ipcMain.handle('select-save-file', async () => {
	if (!mainWindow) return null

	const result = await dialog.showSaveDialog(mainWindow, {
		filters: [
			{ name: 'JSON Files', extensions: ['json'] },
			{ name: 'All Files', extensions: ['*'] }
		],
		defaultPath: `guitar-app-data-${new Date().toISOString().split('T')[0]}.json`
	})

	if (result.canceled || !result.filePath) {
		return null
	}

	return result.filePath
})

// Handle data file writing
ipcMain.handle('write-data-file', async (_event, filePath: string, content: string) => {
	try {
		await writeFile(filePath, content, 'utf-8')
	} catch (error) {
		console.error('Failed to write file:', error)
		throw error
	}
})

