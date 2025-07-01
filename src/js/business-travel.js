/**
 * 差旅业务模块 JavaScript
 * 处理出差管理页面的交互逻辑
 */

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('差旅业务模块已加载');
});

/**
 * 导航到指定模块
 * @param {string} moduleType - 模块类型
 */
function navigateToModule(moduleType) {
    console.log('导航到模块:', moduleType);
    
    switch(moduleType) {
        case 'travel-application':
            window.location.href = 'travel-application.html';
            break;
        case 'vehicle-change':
            window.location.href = 'vehicle-change.html';
            break;
        case 'travel-report':
            window.location.href = 'travel-report.html';
            break;
        case 'hospitality-application':
            window.location.href = 'hospitality-application.html';
            break;
        default:
            console.warn('未知的模块类型:', moduleType);
    }
}

/**
 * 返回到出差管理页面
 */
function navigateToBusinessTravel() {
    window.location.href = 'business-travel.html';
}

/**
 * 返回到首页
 */
function navigateToHome() {
    window.location.href = 'home.html';
}

/**
 * 导航到待办页面
 */
function navigateToApproval() {
    window.location.href = 'approval.html';
}

/**
 * 导航到个人中心
 */
function navigateToProfile() {
    window.location.href = 'profile.html';
}

/**
 * 显示加载状态
 */
function showLoading() {
    // 可以添加加载动画
    console.log('显示加载状态');
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    // 隐藏加载动画
    console.log('隐藏加载状态');
}

/**
 * 显示提示消息
 * @param {string} message - 提示消息
 * @param {string} type - 消息类型 (success, error, warning)
 */
function showMessage(message, type = 'info') {
    // 简单的提示实现，可以后续优化为更美观的提示框
    alert(message);
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 验证表单数据
 * @param {Object} formData - 表单数据
 * @param {Array} requiredFields - 必填字段列表
 * @returns {Object} 验证结果
 */
function validateForm(formData, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === '') {
            errors.push(`${field} 为必填项`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 获取当前用户信息
 * @returns {Object} 用户信息
 */
function getCurrentUser() {
    // 从localStorage或其他地方获取用户信息
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        return JSON.parse(userInfo);
    }
    
    // 默认用户信息
    return {
        userID: 'admin',
        userName: '姚栋',
        deptID: 'D001',
        deptName: '信息部',
        roleID: 'R001'
    };
}

// setFormDefaults函数已移动到common.js中