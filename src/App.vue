<template>
    <span>请选择目录&nbsp;&nbsp;</span>
    <el-button type="primary" @click="select">选择</el-button>
    <span>&nbsp;&nbsp;&nbsp;&nbsp;选择的目录是：{{ path }}&nbsp;&nbsp;&nbsp;&nbsp;</span>
    <el-button type="success" @click="start">开始转换</el-button>
    <div>
        <h2 v-if="mp4ToImage.length > 0">视频转图片的任务</h2>
        <h3 v-for="item in mp4ToImage" :key="item.filename">
            <span class="filename">文件名</span> {{ item.filename }} &nbsp;&nbsp;&nbsp;&nbsp;
            <progress :value="item.precent" />
            <span class="precent">&nbsp;&nbsp;{{ Math.round(item.precent * 100) }}%</span>
        </h3>

        <h2 v-if="ImageTo4K.length > 0">图片转4K图片的任务</h2>
        <h3 v-for="item in ImageTo4K" :key="item.filename">
            <span class="filename">文件名</span> {{ item.filename }} &nbsp;&nbsp;&nbsp;&nbsp;
            <progress :value="item.precent" />
            <span class="precent">&nbsp;&nbsp;{{ Math.round(item.precent * 100) }}%</span>
        </h3>

        <h2 v-if="ImageToMp4.length > 0">4K图片转4K视频的任务</h2>
        <h3 v-for="item in ImageToMp4" :key="item.filename">
            <span class="filename">文件名</span> {{ item.filename }} &nbsp;&nbsp;&nbsp;&nbsp;
            <progress :value="item.precent" />
            <span class="precent">&nbsp;&nbsp;{{ Math.round(item.precent * 100) }}%</span>
        </h3>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ipcRenderer } from 'electron'
import { ElMessageBox } from 'element-plus'

const mp4ToImage = reactive<Item[]>([])
const ImageTo4K = reactive<Item[]>([])
const ImageToMp4 = reactive<Item[]>([])
const path = ref('')
const error = ref(false)

function select() {
    ipcRenderer.send('selected')
}

function start() {
    if (!path.value) {
        return ElMessageBox.alert('请选择目录', 'Title', {
            confirmButtonText: 'OK',
        })
    } else {
        ipcRenderer.send('start')
        error.value = false
    }
}

ipcRenderer.on('reply', (event, data: string[]) => {
    console.log(data)
    path.value = data[0]
})

ipcRenderer.on('file', (event, data: Item) => {
    console.log(data)
    if (!mp4ToImage.some((item) => item.filename == data.filename)) {
        mp4ToImage.push(data)
    }
})
ipcRenderer.on('file-4K', (event, data: Item) => {
    console.log(data)
    if (!ImageTo4K.some((item) => item.filename == data.filename)) {
        ImageTo4K.push(data)
    }
})
ipcRenderer.on('file-mp4', (event, data: Item) => {
    console.log(data)
    if (!ImageToMp4.some((item) => item.filename == data.filename)) {
        ImageToMp4.push(data)
    }
})

ipcRenderer.on('precent', (event, data: Item) => {
    console.log(data)
    mp4ToImage.forEach((item) => {
        if (item.filename == data.filename) item.precent = data.precent
    })
})
ipcRenderer.on('precent-4K', (event, data: Item) => {
    console.log(data)
    ImageTo4K.forEach((item) => {
        if (item.filename == data.filename) item.precent = data.precent
    })
})
ipcRenderer.on('precent-mp4', (event, data: Item) => {
    console.log(data)
    ImageToMp4.forEach((item) => {
        if (item.filename == data.filename) item.precent = data.precent
    })
})
ipcRenderer.on('error', (event, data: string) => {
    error.value = true
    console.log(data)
})
interface Item {
    filename: string
    precent: number
}

watch(
    () => error.value,
    (newValue, oldValue) => {
        console.log(newValue, oldValue)

        if (newValue) {
            ElMessageBox.alert('目标路径没有视频，请选择正确的路径', 'Title', {
                confirmButtonText: 'OK',
            })
        }
    }
)
</script>

<style scoped>
h3 {
    color: rgb(25, 95, 235);
}
.filename {
    color: #0dbc79;
}
.precent {
    color: #f4f430;
}
</style>
