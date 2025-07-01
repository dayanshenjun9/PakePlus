/**
 * 入口页面逻辑
 * 默认跳转到登录页面
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('应用入口页面初始化...');
    
    // 模拟加载过程，然后直接跳转到登录页
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000); // 2秒后跳转到登录页
});