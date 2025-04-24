/**
 * 格式化日期
 * @param {Date} date 日期对象
 * @param {String} fmt 格式化字符串，例如：yyyy-MM-dd hh:mm:ss
 * @returns {String} 格式化后的日期字符串
 */
export function formatDate(date, fmt) {
    if (!date) return '';
    
    if (typeof date === 'string') {
        date = new Date(date.replace(/-/g, '/'));
    }
    
    if (typeof date === 'number') {
        date = new Date(date);
    }
    
    var o = {
        'M+': date.getMonth() + 1, // 月份
        'd+': date.getDate(), // 日
        'h+': date.getHours(), // 小时
        'm+': date.getMinutes(), // 分
        's+': date.getSeconds(), // 秒
        'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
        'S': date.getMilliseconds() // 毫秒
    };
    
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
            );
        }
    }
    
    return fmt;
}

/**
 * 获取相对时间，例如：刚刚、1分钟前等
 * @param {Date|String|Number} date 日期
 * @returns {String} 相对时间
 */
export function getRelativeTime(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
        date = new Date(date.replace(/-/g, '/'));
    }
    
    if (typeof date === 'number') {
        date = new Date(date);
    }
    
    const now = new Date().getTime();
    const diff = (now - date.getTime()) / 1000;
    
    if (diff < 60) {
        return '刚刚';
    } else if (diff < 3600) {
        return Math.floor(diff / 60) + '分钟前';
    } else if (diff < 86400) {
        return Math.floor(diff / 3600) + '小时前';
    } else if (diff < 2592000) {
        return Math.floor(diff / 86400) + '天前';
    } else if (diff < 31536000) {
        return Math.floor(diff / 2592000) + '个月前';
    } else {
        return Math.floor(diff / 31536000) + '年前';
    }
} 