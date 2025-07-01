/**
 * 通用功能模块
 * 包含所有页面共享的功能和工具函数
 */

// 全局应用状态
const AppState = {
    currentUser: null,
    currentPage: null,
    bannerIndex: 0,
    bannerTimer: null
};

/**
 * 更新状态栏时间
 */
function updateStatusBarTime() {
    const timeElements = document.querySelectorAll('.status-bar .time');
    if (timeElements.length > 0) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        timeElements.forEach(el => {
            el.textContent = timeString;
        });
    }
}

/**
 * 显示确认对话框
 * @param {string} message - 确认信息
 * @param {Function} confirmCallback - 确认回调函数
 */
function showConfirmModal(message, confirmCallback) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    
    if (confirmModal && confirmMessage) {
        confirmMessage.textContent = message;
        confirmModal.classList.add('active');
        
        // 存储确认回调函数
        AppState.confirmCallback = confirmCallback;
    }
}

/**
 * 关闭确认对话框
 */
function closeConfirmModal() {
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.classList.remove('active');
    }
}

/**
 * 执行确认操作
 */
function confirmAction() {
    if (typeof AppState.confirmCallback === 'function') {
        AppState.confirmCallback();
    }
    closeConfirmModal();
}

/**
 * 关闭模态框
 * @param {HTMLElement} modal - 模态框元素
 */
function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 显示即将推出功能提示
 */
function showComingSoon() {
    API.showToast('此功能即将推出，敬请期待！', 'info');
}

/**
 * 导航到首页
 */
function navigateToHome() {
    window.location.href = 'home.html';
}

/**
 * 导航到审批页面
 */
function navigateToApproval() {
    window.location.href = 'approval.html';
}

/**
 * 导航到出差管理页面
 */
function navigateToBusinessTravel() {
    window.location.href = 'business-travel.html';
}

/**
 * 导航到个人中心页面
 */
function navigateToProfile() {
    window.location.href = 'profile.html';
}

/**
 * 设置表单默认值
 * @param {string} formId - 表单ID
 */
function setFormDefaults(formId) {
    const user = getCurrentUser();
    const form = document.getElementById(formId);
    
    if (!form) return;
    
    // 设置申请人信息
    const requestPersonName = form.querySelector('#requestPersonName');
    if (requestPersonName) {
        requestPersonName.value = user.userName;
    }
    
    // 设置部门信息
    const deptName = form.querySelector('#deptName');
    if (deptName) {
        deptName.value = user.deptName;
    }
    
    // 设置当前日期
    const requestDate = form.querySelector('#requestDate');
    if (requestDate) {
        requestDate.value = formatDate(new Date());
    }
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, warning, info)
 */
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    if (messageBox && messageText) {
        messageText.textContent = message;
        messageBox.className = 'message-box ' + type;
        messageBox.classList.add('show');
        setTimeout(() => {
            messageBox.classList.remove('show');
        }, 3000);
    }
}

/**
 * 显示加载提示
 * @param {string} message - 加载信息
 */
function showLoading(message = '加载中...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (loadingOverlay && loadingText) {
        loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * 获取当前用户信息
 * 增强orgCode获取逻辑，确保组织机构信息能正确获取
 */
function getCurrentUser() {
    // 优先从localStorage获取登录用户信息
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            const userData = JSON.parse(currentUser);
            // 确保返回的用户对象包含必要的字段，增强orgCode获取逻辑
            // 增加对ORGCODE大写字段的支持
            const orgCode = userData.ORGCODE || userData.org_code || userData.orgCode || userData.ORG_CODE || 
                           userData.organization_code || userData.organizationCode || 
                           userData.dept_code || userData.deptCode || userData.DEPT_CODE;
            
            return {
                userID: userData.user_id || userData.userID || userData.USER_ID,
                userName: userData.user_name || userData.userName || userData.USER_NAME || userData.display_name || userData.DISPLAY_NAME,
                deptName: userData.dept_name || userData.deptName || userData.DEPT_NAME,
                orgCode: orgCode || '', // 使用实际的用户组织代码
                user_id: userData.user_id || userData.userID || userData.USER_ID,
                roles: userData.roles || ['employee'], // 添加角色信息
                rolenames: userData.rolenames || [],
                roleTypes: userData.roleTypes || []
            };
        } catch (e) {
            console.error('解析用户信息失败:', e);
        }
    }
    
    // 兼容旧版本，尝试读取userInfo
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        try {
            const userData = JSON.parse(userInfo);
            // 同样增强orgCode获取逻辑，增加对ORGCODE大写字段的支持
            const orgCode = userData.ORGCODE || userData.org_code || userData.orgCode || userData.ORG_CODE || 
                           userData.organization_code || userData.organizationCode || 
                           userData.dept_code || userData.deptCode || userData.DEPT_CODE;
            
            return {
                userID: userData.user_id || userData.userID || userData.USER_ID,
                userName: userData.user_name || userData.userName || userData.USER_NAME || userData.display_name || userData.DISPLAY_NAME,
                deptName: userData.dept_name || userData.deptName || userData.DEPT_NAME,
                orgCode: orgCode || '', // 使用实际的用户组织代码
                user_id: userData.user_id || userData.userID || userData.USER_ID,
                roles: userData.roles || ['employee'], // 添加角色信息
                rolenames: userData.rolenames || [],
                roleTypes: userData.roleTypes || []
            };
        } catch (e) {
            console.error('解析用户信息失败:', e);
        }
    }
    
    // 如果都没有，尝试从user_id获取基本信息
    const userId = localStorage.getItem('user_id');
    if (userId) {
        return {
            userID: userId,
            userName: '当前用户',
            deptName: '未知部门',
            orgCode: '', // 使用实际的用户组织代码
            user_id: userId,
            roles: ['employee'], // 默认角色
            rolenames: [],
            roleTypes: []
        };
    }
    
    // 默认用户信息（仅用于开发测试）
    return {
        userID: 'admin',
        userName: '张三',
        deptName: '信息技术部',
        orgCode: 'IT001',
        roles: ['employee'], // 默认角色
        rolenames: ['员工'],
        roleTypes: ['0'],
        user_id: 'admin'
    };
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串 (年月日)
 */
function formatDate(date) {
    if (!date) return '';
    
    // 如果传入的是字符串，尝试转换为日期对象
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}年${month}月${day}日`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTime(date) {
    if (!date) return '';
    
    // 如果传入的是字符串，尝试转换为日期对象
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取当前日期时间，格式为 YYYY-MM-DDTHH:mm（适用于 datetime-local 输入框）
 * @returns {string} 当前日期时间字符串
 */
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 格式化日期为输入框格式 YYYY-MM-DD
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDateForInput(date) {
    if (!date) return '';
    
    // 如果传入的是字符串，尝试转换为日期对象
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为显示格式 YYYY-MM-DD HH:mm:ss
 * @param {Date|string} dateTime - 日期时间对象或字符串
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTimeForDisplay(dateTime) {
    if (!dateTime) return '';
    
    // 如果传入的是字符串，尝试转换为日期对象
    if (typeof dateTime === 'string') {
        dateTime = new Date(dateTime);
    }
    
    // 检查日期是否有效
    if (isNaN(dateTime.getTime())) {
        return dateTime; // 如果无法解析，返回原始值
    }
    
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const seconds = String(dateTime.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 设置表单字段值
 * @param {string} fieldId - 字段ID
 * @param {any} value - 字段值
 */
function setFieldValue(fieldId, value) {
    const element = document.getElementById(fieldId);
    if (element) {
        // 根据元素类型设置值
        if (element.type === 'checkbox') {
            element.checked = Boolean(value);
        } else if (element.type === 'radio') {
            element.checked = element.value === value;
        } else {
            element.value = value || '';
        }
    } else {
        console.warn(`字段 ${fieldId} 不存在`);
    }
}

/**
 * 获取表单字段的值
 * @param {string} fieldId - 字段ID
 * @returns {string|boolean} 字段值
 */
function getFieldValue(fieldId) {
    const element = document.getElementById(fieldId);
    if (element) {
        if (element.type === 'checkbox') {
            return element.checked;
        } else if (element.type === 'radio') {
            const radioGroup = document.getElementsByName(element.name);
            for (let radio of radioGroup) {
                if (radio.checked) {
                    return radio.value;
                }
            }
            return '';
        } else {
            return element.value || '';
        }
    } else {
        console.warn(`字段 ${fieldId} 不存在`);
        return '';
    }
}

/**
 * 显示加载状态
 * @param {string} message - 加载提示信息
 */
function showLoading(message = '加载中...') {
    // 创建或显示加载遮罩
    let loadingElement = document.getElementById('loading-overlay');
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'loading-overlay';
        loadingElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 16px;
        `;
        document.body.appendChild(loadingElement);
    }
    loadingElement.innerHTML = `<div>${message}</div>`;
    loadingElement.style.display = 'flex';
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    const loadingElement = document.getElementById('loading-overlay');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * 深度比较两个对象是否相等
 * @param {any} obj1 - 第一个对象
 * @param {any} obj2 - 第二个对象
 * @returns {boolean} 是否相等
 */
function isObjectEqual(obj1, obj2) {
    // 如果两个值严格相等，直接返回true
    if (obj1 === obj2) {
        return true;
    }
    
    // 如果其中一个为null或undefined，返回false
    if (obj1 == null || obj2 == null) {
        return false;
    }
    
    // 如果类型不同，返回false
    if (typeof obj1 !== typeof obj2) {
        return false;
    }
    
    // 如果是基本类型，直接比较
    if (typeof obj1 !== 'object') {
        return obj1 === obj2;
    }
    
    // 如果是数组
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) {
            return false;
        }
        for (let i = 0; i < obj1.length; i++) {
            if (!isObjectEqual(obj1[i], obj2[i])) {
                return false;
            }
        }
        return true;
    }
    
    // 如果一个是数组另一个不是
    if (Array.isArray(obj1) || Array.isArray(obj2)) {
        return false;
    }
    
    // 比较对象的键
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
        return false;
    }
    
    // 递归比较每个键的值
    for (let key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }
        if (!isObjectEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    
    return true;
}

/**
 * 导航到个人中心页面
 */
function navigateToProfile() {
    window.location.href = 'profile.html';
}

/**
 * 显示退出登录确认
 */
function showLogoutConfirm() {
    showConfirmModal('确定要退出登录吗？', confirmLogout);
}

/**
 * 确认退出登录
 */
function confirmLogout() {
    console.log('开始清理用户缓存信息...');
    
    // 清除所有localStorage中的用户相关信息
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('sessionToken');
    
    // 清理所有可能的缓存数据
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('user') || key.includes('approval') || key.includes('cache'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`已清理缓存: ${key}`);
    });
    
    // 重置应用状态
    if (typeof AppState !== 'undefined') {
        AppState.currentUser = null;
        AppState.approvalList = [];
        AppState.homeData = null;
        
        // 停止轮播图定时器
        if (AppState.bannerTimer) {
            clearInterval(AppState.bannerTimer);
            AppState.bannerTimer = null;
        }
    }
    
    // 重置审批状态（如果存在）
    if (typeof ApprovalState !== 'undefined') {
        ApprovalState.approvalList = {
            pending: [],
            completed: []
        };
        ApprovalState.pendingPage = 1;
        ApprovalState.completedPage = 1;
        ApprovalState.pendingHasMore = true;
        ApprovalState.completedHasMore = true;
    }
    
    // 重置首页状态（如果存在）
    if (typeof HomeState !== 'undefined') {
        HomeState.homeData = null;
        HomeState.bannerIndex = 0;
        if (HomeState.bannerTimer) {
            clearInterval(HomeState.bannerTimer);
            HomeState.bannerTimer = null;
        }
    }
    
    // 重置登录表单
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }
    
    // 清理页面中的用户信息显示
    const userNameElements = document.querySelectorAll('.user-name, .username, [data-user-name]');
    userNameElements.forEach(element => {
        element.textContent = '';
    });
    
    const deptNameElements = document.querySelectorAll('.dept-name, .department, [data-dept-name]');
    deptNameElements.forEach(element => {
        element.textContent = '';
    });
    
    console.log('用户缓存信息清理完成');
    
    // 显示清理完成提示
    if (typeof API !== 'undefined' && API.showToast) {
        API.showToast('已退出登录，缓存已清理', 'success');
    }
    
    // 延迟跳转，确保清理完成
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

/**
 * 更新底部导航状态
 * @param {string} activePage - 当前激活的页面
 */
function updateBottomNavigation(activePage) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (activePage === 'home') {
        navItems[0].classList.add('active');
    } else if (activePage === 'approval') {
        navItems[1].classList.add('active');
    } else if (activePage === 'profile') {
        navItems[2].classList.add('active');
    }
}

/**
 * 获取审核状态文本
 * @param {string|number} status - 审核状态码
 * @returns {string} 审核状态对应的文本
 */
function getStatusText(status) {
    const statusStr = String(status || 0);
    const statusMap = {
        '0': '编制',
        '1': '提交审核',
        '2': '审核中',
        '3': '审核通过',
        '4': '驳回',
        '5': '已撤销',
        '6': '已完成',
        '7': '已作废'
    };
    return statusMap[statusStr] || '未知状态';
}

// 初始化通用功能
document.addEventListener('DOMContentLoaded', function() {
    // 设置状态栏时间
    updateStatusBarTime();
    setInterval(updateStatusBarTime, 60000); // 每分钟更新一次
    
    // 模态框点击外部关闭
    document.addEventListener('click', function(e) {
        // 点击模态框背景关闭
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
});
