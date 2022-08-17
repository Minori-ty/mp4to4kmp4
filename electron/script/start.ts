import { resolve } from 'path'
import fs from 'fs'
import type { IAnswers } from '../types/type'
import shell from 'child_process'
import { Mp4ToImageTo4KToMp4 } from './utils'
import type { BrowserWindow, App } from 'electron'

export function start(path: string, win: BrowserWindow | null, app: App) {
    /** 视频输入文件夹 E:/input */
    const input = resolve(path, 'input')

    /** 如果input文件夹存在，在进行下一步操作 */
    if (fs.existsSync(input)) {
        /** 视频输出文件夹 E:/output */
        const output = resolve(path, 'output')

        /** 临时图片文件存放文件夹 E:/img_temp */
        const img_temp = resolve(path, 'img_temp')

        /** 优化后的图片输出文件夹 E:/out */
        const img_out = resolve(path, 'img_out')

        /** 需要创建的文件夹 */
        const fileList = [img_temp, img_out, output]
        /** 循环创建基础文件夹 */
        fileList.forEach((file) => {
            /** 如果文件夹不存在则创建一个 */
            if (!fs.existsSync(file)) {
                fs.mkdirSync(file)
            }
        })

        /** output已经有的视频 */
        const complieteList = fs.readdirSync(output)

        /** 读取输入文件夹 */
        fs.readdir(
            input,
            /**
             * @param err    失败的信息
             * @param files  视频的集合
             */
            async (err, files) => {
                if (err) return console.log(err)
                // const options = await prompt()
                const options: IAnswers = { videoType: '动漫视频' }
                files.forEach(
                    /** @param file 每个视频的名字 伪恋.mp4 */
                    (file) => {
                        /** 如果这个视频已经有了，则不用再生成了 */
                        if (!complieteList.includes(file)) {
                            /** 截取视频的文件名 伪恋 */
                            const filename = file.slice(0, -4)

                            /** 视频所在的绝对路径 E:/input/伪恋.mp4 */
                            const inputFileFullPath = resolve(input + `/${file}`)

                            /** 视频所在的绝对路径 E:/output/伪恋.mp4 */
                            const outputFileFullPath = resolve(output + `/${file}`)

                            /** 作品的临时图片文件夹 E:/img_temp/伪恋 */
                            const img_temp_floder = resolve(img_temp + `/${filename}_temp`)

                            /** 作品图片的优化文件夹 E:/img_out/伪恋 */
                            const img_out_floder = resolve(img_out + `/${filename}_out`)

                            /** 需要创建的文件夹 */
                            const fileList = [img_temp_floder, img_out_floder]

                            /** 循环创建图片的临时文件夹 */
                            fileList.forEach((file) => {
                                /** 如果文件夹不存在则创建一个 */
                                if (!fs.existsSync(file)) {
                                    fs.mkdirSync(file)
                                }
                            })
                            /** 视频的帧数 */
                            let fps = '0'
                            let duration = '0'
                            // shell.exec(
                            //     `ffmpeg -i "${inputFileFullPath}"`,
                            //     /**
                            //      *
                            //      * @param _code    返回的状态码，`0`为成功
                            //      * @param _s
                            //      * @param message  控制台输出的信息
                            //      */
                            //     (_code, _s, message) => {
                            //         /** 匹配fps */
                            //         const result = message.match(/\w{2}\.?\w{0,2}(?= fps)/)
                            //         fps = (result && result[0]) || '29.97'
                            //         console.log(message)

                            //         duration = message.match(/(?<=Duration: ).+(?=,)/)![0]
                            //     }
                            // )
                            try {
                                const result = shell.execSync(`ffmpeg -i "${inputFileFullPath}"`)
                            } catch (err: any) {
                                const message = err.toString()
                                // console.log(fps, duration)

                                const fpsResult = message.match(/\w{2}\.?\w{0,2}(?= fps)/)
                                fps = fpsResult && fpsResult[0]

                                const durationResult = message.match(/(?<=Duration: ).+(?=, start)/)
                                duration = durationResult && durationResult[0]
                                // console.log(fps, duration)
                            }
                            if (fps === '0' || duration === '0') {
                                console.log('fps, duration解析错误')
                                return
                            }
                            // console.log(iconv.decode(file, 'gbk'))
                            console.log(file)

                            /** 开始转视频 */
                            Mp4ToImageTo4KToMp4(
                                img_temp_floder,
                                input,
                                file,
                                img_out_floder,
                                fps,
                                inputFileFullPath,
                                outputFileFullPath,
                                options,
                                duration,
                                win,
                                app
                            )
                        }
                    }
                )
            }
        )
    } else {
        win?.webContents.send('error', 'error')
        console.log('input文件夹不存在', input)
    }
}
