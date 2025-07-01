/**
 * 用户认证检查模块
 * 在所有页面加载时检查用户登录状态，未登录则跳转到登录页面
 */

/**
 * 检查用户登录状态
 * @returns {boolean} 是否已登录
 */
function checkUserAuth() {
    // 如果当前页面就是登录页面，则不需要检查
    if (window.location.pathname.includes('login.html') || window.location.pathname.endsWith('login.html')) {
        return true;
    }
    
    try {
        // 检查localStorage中的用户信息
        const currentUser = localStorage.getItem('currentUser');
        const userInfo = localStorage.getItem('userInfo');
        const userId = localStorage.getItem('user_id');
        
        // 如果有任何一种用户信息存在，则认为已登录
        if (currentUser || userInfo || userId) {
            // 进一步验证用户信息的有效性
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                if (userData && (userData.user_id || userData.userID || userData.USER_ID)) {
                    return true;
                }
            }
            
            if (userInfo) {
                const userData = JSON.parse(userInfo);
                if (userData && (userData.user_id || userData.userID || userData.USER_ID)) {
                    return true;
                }
            }
            
            if (userId && userId.trim() !== '') {
                return true;
            }
        }
        
        // 如果没有有效的用户信息，则未登录
        return false;
        
    } catch (error) {
        console.error('检查用户登录状态时出错:', error);
        return false;
    }
}

/**
 * 跳转到登录页面
 */
function redirectToLogin() {
    // 保存当前页面URL，登录成功后可以跳转回来
    const currentUrl = window.location.href;
    const loginUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, 'login.html');
    
    // 存储原始页面URL（可选，用于登录后跳转回原页面）
    sessionStorage.setItem('redirectUrl', currentUrl);
    
    // 跳转到登录页面
    window.location.href = loginUrl;
}

/**
 * 页面加载时执行认证检查
 */
function initAuthCheck() {
    // 检查用户登录状态
    if (!checkUserAuth()) {
        console.log('用户未登录，跳转到登录页面');
        redirectToLogin();
        return false;
    }
    
    console.log('用户已登录，继续加载页面');
    return true;
}

// 页面加载完成后立即执行认证检查
// 使用DOMContentLoaded确保在页面内容加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthCheck);
} else {
    // 如果页面已经加载完成，立即执行
    initAuthCheck();
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkUserAuth,
        redirectToLogin,
        initAuthCheck
    };
}