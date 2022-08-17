export type videoType = ['动漫视频', '普通视频']

export interface IQuestion {
    type: 'list'
    name: 'videoType'
    message: '请选择视频的类型'
    choices: videoType
}

export interface IAnswers {
    videoType: TupleToUnion<videoType>
}

export type IModel =
    /** 动漫模型 */
    | 'realesr-animevideov3'
    /** 普通模型 */
    | 'realesrgan-x4plus'
    /** 另一个普通模型 */
    | 'reaesrnet-x4plus'

type TupleToUnion<T extends any[]> = T[number]
