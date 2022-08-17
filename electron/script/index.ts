import { BrowserWindow, ipcMain, dialog, App } from 'electron'
import { start } from './start'

export function init(win: BrowserWindow | null, app: App) {
    // win?.webContents.send('file', __dirname)
    ipcMain.on('selected', async (event, arg) => {
        const path = await dialog.showOpenDialog({ properties: ['openDirectory'] })
        console.log(path.filePaths)
        event.sender.send('reply', path.filePaths)
        ipcMain.on('start', () => {
            console.log(path.filePaths)
            start(path.filePaths[0] || '', win, app)
        })
    })
}
