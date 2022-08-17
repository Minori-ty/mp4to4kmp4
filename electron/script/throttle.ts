export const throttle = (fn: (data: string) => void, delay = 1000) => {
    let lastTime = 0
    return function (data: string) {
        let nowTime = Date.now()
        if (nowTime - lastTime > delay) {
            fn(data)
            lastTime = nowTime
        }
    }
}
