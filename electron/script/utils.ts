import shell from 'child_process'
import fs from 'fs'
import { formatTime } from './formatTime'
import type { IAnswers, IModel } from '../types/type.d'
import chalk from 'chalk'
import { BrowserWindow, App, ipcMain } from 'electron'
import { throttle } from './throttle'
const start = chalk.hex('#f4f430')
/**
 * 视频转图片转4K转视频
 * @param img_temp_floder     作品的临时图片文件夹 `E:/img_temp/伪恋`
 * @param input               视频输入文件夹
 * @param file                每个视频的名字 example.mp4
 * @param img_out_floder      作品图片的优化文件夹 `E:/img_out/伪恋`
 * @param fps                 图片帧数
 * @param inputFileFullPath   视频所在的绝对路径 `E:/input/伪恋.mp4`
 * @param outputFileFullPath  视频所在的绝对路径 `E:/output/伪恋.mp4`
 */
export function Mp4ToImageTo4KToMp4(
    img_temp_floder: string,
    input: string,
    file: string,
    img_out_floder: string,
    fps: string,
    inputFileFullPath: string,
    outputFileFullPath: string,
    options: IAnswers,
    duration: string,
    win: BrowserWindow | null,
    app: App
) {
    /** 图片总数 */
    const total = formatTime(duration) * Number(fps)
    // 如果img_temp的子文件都是空的，则开始将视频转临时图片
    if (fs.readdirSync(img_temp_floder).length === 0) {
        console.log(start('开始视频转临时图片'))
        win?.webContents.send('file', { filename: file, precent: 0 })

        // 视频转图片的bash命令
        const result = shell.exec(
            `ffmpeg -i "${input}/${file}" -qscale:v 1 -qmin 1 -qmax 1 -vsync 0 "${img_temp_floder}/frame%08d.png"`,
            () => {
                console.log(start('\n开始图片转4K图片'))
                // 任务完成后，开始转4K图片
                ImageTo4kToMp4(
                    img_out_floder,
                    img_temp_floder,
                    fps,
                    inputFileFullPath,
                    outputFileFullPath,
                    file,
                    options,
                    duration,
                    win,
                    app
                )
            }
        )
        // 软件关闭时，结束所有子进程
        app.on('window-all-closed', () => {
            shell.exec(`taskkill /f /t /pid ${result.pid}`)
            console.log('任务停止')
        })
        // 开启节流，每1秒通知前端当前的进度
        result.stderr?.on('data', throttle(sendPrecent))
        result.stderr?.on('close', () => {
            // 子进程结束时，告诉前端当前的进度为1
            win?.webContents.send('precent', {
                filename: file,
                precent: 1,
            })
        })
        // 节流的回调函数
        function sendPrecent() {
            // 告诉前端当前的进度
            win?.webContents.send('precent', {
                filename: file,
                precent: fs.readdirSync(img_temp_floder).length / total,
            })
        }
    } else {
        ImageTo4kToMp4(
            img_out_floder,
            img_temp_floder,
            fps,
            inputFileFullPath,
            outputFileFullPath,
            file,
            options,
            duration,
            win,
            app
        )
    }
}

/**
 * 图片转4K转视频
 * @param img_out_floder      作品图片的优化文件夹 `E:/img_out/伪恋`
 * @param img_temp_floder     作品的临时图片文件夹 `E:/img_temp/伪恋`
 * @param fps                 图片帧数
 * @param inputFileFullPath   视频所在的绝对路径 `E:/input/伪恋.mp4`
 * @param outputFileFullPath  视频所在的绝对路径 `E:/output/伪恋.mp4`
 */
function ImageTo4kToMp4(
    img_out_floder: string,
    img_temp_floder: string,
    fps: string,
    inputFileFullPath: string,
    outputFileFullPath: string,
    file: string,
    options: IAnswers,
    duration: string,
    win: BrowserWindow | null,
    app: App
) {
    /** 如果图片已经优化好了，不用再优化了 */
    if (fs.readdirSync(img_out_floder).length === 0) {
        win?.webContents.send('file-4K', {
            filename: file,
            precent: 0,
        })
        optimizeImage(
            img_temp_floder,
            img_out_floder,
            fps,
            inputFileFullPath,
            outputFileFullPath,
            file,
            options,
            duration,
            win,
            app,
            ImageToMp4
        )
    } else {
        ImageToMp4(fps, img_out_floder, inputFileFullPath, outputFileFullPath, file, duration, win, app)
    }
}

/**
 * 图片转4K转视频
 * @param img_temp_floder     作品的临时图片文件夹 `E:/img_temp/伪恋`
 * @param img_out_floder      作品图片的优化文件夹 `E:/img_out/伪恋`
 * @param fps                 图片帧数
 * @param inputFileFullPath   视频所在的绝对路径 `E:/input/伪恋.mp4`
 * @param outputFileFullPath  视频所在的绝对路径 `E:/output/伪恋.mp4`
 * @param options             视频的类型 `normal | anime`
 * @param callback            完成后调用函数
 */
function optimizeImage(
    img_temp_floder: string,
    img_out_floder: string,
    fps: string,
    inputFileFullPath: string,
    outputFileFullPath: string,
    file: string,
    options: IAnswers,
    duration: string,
    win: BrowserWindow | null,
    app: App,
    callback: typeof ImageToMp4
) {
    /** 图片总数 */
    const total = formatTime(duration) * Number(fps)

    /** 跳转转换模型 */
    let model: IModel = 'realesr-animevideov3'

    /** 如果选择的是普通图片，则用默认模型 */
    if (options.videoType === '普通视频') model = 'realesrgan-x4plus'

    // 图片转4K的bash命令
    const result = shell.exec(
        `realesrgan-ncnn-vulkan.exe -i "${img_temp_floder}" -o "${img_out_floder}" -n ${model} -s 2 -f jpg`,
        () => {
            callback(fps, img_out_floder, inputFileFullPath, outputFileFullPath, file, duration, win, app)
            console.log(start('\n转4K图片已成功, 开始转4K视频'))
        }
    )
    // 软件关闭时，结束所有子进程
    app.on('window-all-closed', () => {
        shell.exec(`taskkill /f /t /pid ${result.pid}`)
        console.log('任务停止')
    })
    // 开启节流，每1秒通知前端当前的进度
    result.stderr?.on('data', throttle(sendPrecent))
    result.stderr?.on('close', () => {
        // 告诉前端当前的进度为1
        win?.webContents.send('precent-4K', {
            filename: file,
            precent: 1,
        })
    })
    // 节流的回调函数
    function sendPrecent() {
        // 告诉前端当前的进度
        win?.webContents.send('precent-4K', {
            filename: file,
            precent: fs.readdirSync(img_out_floder).length / total,
        })
    }
}

/**
 * 4K转视频
 * @param fps                 图片帧数
 * @param img_out_floder      作品图片的优化文件夹 `E:/img_out/伪恋`
 * @param inputFileFullPath   视频所在的绝对路径 `E:/input/伪恋.mp4`
 * @param outputFileFullPath  视频所在的绝对路径 `E:/output/伪恋.mp4`
 */
function ImageToMp4(
    fps: string,
    img_out_floder: string,
    inputFileFullPath: string,
    outputFileFullPath: string,
    file: string,
    duration: string,
    win: BrowserWindow | null,
    app: App
) {
    win?.webContents.send('file-mp4', { filename: file, precent: 0 })

    // 合成视频的bash命令
    const result = shell.exec(
        `ffmpeg -r ${fps} -i "${img_out_floder}/frame%08d.jpg" -i "${inputFileFullPath}" -map 0:v:0 -map 1:a:0 -c:a copy -c:v hevc_nvenc -r ${fps} -pix_fmt yuv420p "${outputFileFullPath}"`,
        () => {
            shell.exec('pause')
        }
    )
    // 软件关闭时，结束所有子进程
    app.on('window-all-closed', () => {
        shell.exec(`taskkill /f /t /pid ${result.pid}`)
        console.log('任务停止')
    })
    // 开启节流，每1秒通知前端当前的进度
    result.stderr?.on('data', throttle(sendPrecent))
    result.stderr?.on('close', () => {
        // 子进程结束时，告诉前端当前的进度为1
        win?.webContents.send('precent-mp4', {
            filename: file,
            precent: 1,
        })
    })

    // 节流的回调函数
    function sendPrecent(data: string) {
        /** 控制台的信息 */
        const result = data.match(/(?<=time=).+(?= bitrate)/)

        if (result) {
            /** 当前的进度 */
            const current = formatTime(result[0])

            /** 总的时长 */
            const total = formatTime(duration)
            // 子进程结束时，告诉前端当前的进度为1
            win?.webContents.send('precent-mp4', {
                filename: file,
                precent: current / total,
            })
        }
    }
}
