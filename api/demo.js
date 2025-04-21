import request from '@/utils/request.js'

// 查询设备当前位置信息
export const apiDemo = data => request.post('/demo', data)
