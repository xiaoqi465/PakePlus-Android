console.log(
    '%cbuild from PakePlus： https://github.com/Sjj1024/PakePlus',
    'color:orangered;font-weight:bolder'
)

// 保存原始的window.open函数
const originalWindowOpen = window.open

// 点击事件处理函数
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin - opening in new window', origin)
        // 恢复弹窗行为：在新窗口中打开链接
        originalWindowOpen.call(window, origin.href, '_blank')
    } else {
        console.log('not handle origin', origin)
    }
}

// 重写window.open函数，恢复正常弹窗功能
window.open = function (url, target, features) {
    console.log('window.open called', url, target, features)
    // 调用原始的window.open函数，恢复弹窗
    return originalWindowOpen.call(this, url, target, features)
}

// 添加点击事件监听器
document.addEventListener('click', hookClick, { capture: true })