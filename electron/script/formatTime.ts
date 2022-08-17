export function formatTime(time: string) {
    const hours = Number(time.split(':')[0])
    const mimutes = Number(time.split(':')[1])
    const seconds = Number(time.split(':')[2])
    return hours * 60 * 60 + mimutes * 60 + seconds
}
