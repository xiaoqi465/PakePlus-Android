console.log(
    '%cbuild from PakePlus： https://github.com/Sjj1024/PakePlus',
    'color:orangered;font-weight:bolder'
)

// 保存原始的window.open函数
const originalWindowOpen = window.open

// 用于记录点击次数的Map，以链接URL为key
const clickCountMap = new Map()

// 可选：设置点击计数重置的时间间隔（毫秒）
const CLICK_RESET_TIME = 30000 // 30秒后重置点击计数

// 点击事件处理函数
const hookClick = (e) => {
    // 使用更精确的选择器查找链接
    const origin = e.target.closest('a[href]')
    const isBaseTargetBlank = document.querySelector('head base[target="_blank"]')
    
    console.log('检测到点击:', {
        target: e.target,
        origin: origin,
        href: origin?.href,
        targetAttr: origin?.target,
        isBaseTargetBlank: !!isBaseTargetBlank
    })
    
    // 检查是否应该处理链接
    if (origin && origin.href) {
        const shouldHandle = 
            origin.target === '_blank' || 
            (isBaseTargetBlank && !origin.target) ||
            origin.target === '_new'
        
        if (shouldHandle) {
            const linkUrl = origin.href
            
            // 获取当前链接的点击次数
            const currentCount = clickCountMap.get(linkUrl) || 0
            const newCount = currentCount + 1
            
            console.log(`链接 ${linkUrl} 被点击第 ${newCount} 次`)
            
            // 更新点击次数
            clickCountMap.set(linkUrl, newCount)
            
            // 设置定时器重置点击计数
            setTimeout(() => {
                if (clickCountMap.get(linkUrl) === newCount) {
                    console.log(`重置链接 ${linkUrl} 的点击计数`)
                    clickCountMap.delete(linkUrl)
                }
            }, CLICK_RESET_TIME)
            
            // 第一次点击：阻止默认行为，不跳转
            if (newCount === 1) {
                console.log('第一次点击，阻止跳转:', linkUrl)
                e.preventDefault()
                e.stopPropagation()
                
                // 可选：给用户一些视觉反馈
                if (origin.style) {
                    const originalColor = origin.style.backgroundColor
                    origin.style.backgroundColor = '#ffeb3b'
                    setTimeout(() => {
                        origin.style.backgroundColor = originalColor
                    }, 200)
                }
                
                return false
            }
            
            // 第二次及以后的点击：执行跳转
            if (newCount >= 2) {
                console.log('第二次点击，准备跳转:', linkUrl)
                
                // 阻止默认行为
                e.preventDefault()
                e.stopPropagation()
                
                // 清除该链接的点击计数
                clickCountMap.delete(linkUrl)
                
                // 延迟执行，确保事件处理完成
                setTimeout(() => {
                    try {
                        console.log('尝试打开新窗口:', linkUrl)
                        const newWindow = originalWindowOpen.call(window, linkUrl, '_blank', 'noopener,noreferrer')
                        
                        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                            console.warn('弹窗被阻止，尝试备用方案')
                            // 备用方案：尝试在当前窗口打开
                            window.location.href = linkUrl
                        } else {
                            console.log('新窗口打开成功')
                        }
                    } catch (error) {
                        console.error('打开新窗口失败:', error)
                        // 备用方案
                        window.location.href = linkUrl
                    }
                }, 10)
                
                return false
            }
        }
    }
    
    console.log('正常处理链接点击')
}

// 用于记录window.open调用次数的Map
const windowOpenCountMap = new Map()

// 重写window.open函数
window.open = function (url, target, features) {
    console.log('window.open 被调用:', { url, target, features })
    
    // 如果没有指定target或target为_blank，应用双击逻辑
    if (!target || target === '_blank' || target === '_new') {
        const currentCount = windowOpenCountMap.get(url) || 0
        const newCount = currentCount + 1
        
        console.log(`window.open 被调用第 ${newCount} 次，URL: ${url}`)
        
        // 更新调用次数
        windowOpenCountMap.set(url, newCount)
        
        // 设置定时器重置计数
        setTimeout(() => {
            if (windowOpenCountMap.get(url) === newCount) {
                windowOpenCountMap.delete(url)
            }
        }, CLICK_RESET_TIME)
        
        // 第一次调用：不执行
        if (newCount === 1) {
            console.log('第一次window.open调用，忽略')
            return window // 返回当前窗口对象
        }
        
        // 第二次及以后：正常执行
        if (newCount >= 2) {
            console.log('第二次window.open调用，执行打开')
            windowOpenCountMap.delete(url)
            
            target = '_blank'
            // 添加安全特性
            if (!features) {
                features = 'noopener,noreferrer'
            }
        }
    }
    
    try {
        const result = originalWindowOpen.call(this, url, target, features)
        console.log('window.open 执行结果:', result)
        return result
    } catch (error) {
        console.error('window.open 执行失败:', error)
        // 备用方案
        if (target === '_blank') {
            window.location.href = url
        }
        return null
    }
}

// 移除旧的事件监听器（如果存在）
document.removeEventListener('click', hookClick, { capture: true })

// 添加新的点击事件监听器，使用不同的配置
document.addEventListener('click', hookClick, { 
    capture: true, 
    passive: false 
})

// 额外的兼容性处理
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[target="_blank"]')
    if (link && link.href) {
        const currentCount = clickCountMap.get(link.href) || 0
        console.log(`备用处理器捕获到_blank链接: ${link.href} (第${currentCount + 1}次点击)`)
    }
}, false)

// 监听页面加载完成，确保脚本正确初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM加载完成，双击检测脚本已就绪')
    })
} else {
    console.log('双击检测脚本已就绪')
}

// 调试用：监听所有窗口打开尝试
const originalCreateElement = document.createElement
document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName)
    if (tagName.toLowerCase() === 'a') {
        console.log('创建了新的链接元素')
    }
    return element
}

// 调试功能：查看当前点击计数状态
window.showClickCounts = function() {
    console.log('当前点击计数状态:')
    console.log('链接点击计数:', Object.fromEntries(clickCountMap))
    console.log('window.open调用计数:', Object.fromEntries(windowOpenCountMap))
}

console.log('双击检测功能已启用 - 链接需要点击两次才会跳转')
console.log('可以在控制台运行 showClickCounts() 查看点击状态')