/**
 * 个人中心页面逻辑
 * 处理用户信息显示、系统设置等功能
 */

// 个人中心页面状态
const ProfileState = {
    userInfo: null,
    updateProgress: 0,
    updateTimer: null,
    repairProgress: 0,
    repairTimer: null
};

/**
 * 加载用户个人资料
 */
async function loadUserProfile() {
    console.log('加载用户个人资料...');
    
    try {
        // 直接从localStorage获取登录时保存的用户信息
        const userData = localStorage.getItem('currentUser');
        console.log('从localStorage获取的currentUser:', userData);
        
        if (!userData) {
            console.error('用户信息不存在，跳转到登录页');
            API.showToast('用户信息丢失，请重新登录', 'error');
            window.location.href = 'login.html';
            return;
        }
        
        // 解析用户信息
        const user = JSON.parse(userData);
        console.log('解析的用户信息:', user);
        
        // 保存到状态中
        ProfileState.userInfo = user;
        
        // 更新用户名显示
        const userName = document.getElementById('userName');
        if (userName) {
            // 优先使用显示名称，其次用户名
            userName.textContent = user.DISPLAY_NAME || user.USER_NAME || user.display_name || user.user_name || '未知用户';
        }
        
        // 更新部门信息显示
        const userDept = document.getElementById('userDept');
        if (userDept) {
            // 登录接口已经返回了部门名称，直接使用
            userDept.textContent = user.dept_name || user.DEPT_NAME || '无部门信息';
        }
        
        console.log('用户信息加载完成');
        
    } catch (error) {
        console.error('解析用户信息失败:', error);
        API.showToast('用户信息解析失败，请重新登录', 'error');
        // 清除可能损坏的用户信息
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user_id');
        window.location.href = 'login.html';
    }
}



/**
 * 检测更新
 */
function checkForUpdates() {
    console.log('检测更新...');
    API.showToast('正在检测更新...', 'info');
    
    // 模拟检测更新过程
    setTimeout(() => {
        // 显示带进度条的Toast
        const toast = document.getElementById('toast');
        if (toast) {
            toast.className = 'toast progress show';
            toast.innerHTML = `
                <div class="progress-text">正在下载更新...</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-percentage">0%</div>
            `;
        }
        
        // 模拟更新进度
        simulateUpdate();
    }, 1500);
}

/**
 * 模拟更新过程
 */
function simulateUpdate() {
    ProfileState.updateProgress = 0;
    
    // 清除现有定时器
    if (ProfileState.updateTimer) {
        clearInterval(ProfileState.updateTimer);
    }
    
    // 创建新定时器
    ProfileState.updateTimer = setInterval(() => {
        ProfileState.updateProgress += Math.floor(Math.random() * 10) + 1;
        
        if (ProfileState.updateProgress >= 100) {
            ProfileState.updateProgress = 100;
            clearInterval(ProfileState.updateTimer);
            
            // 更新完成
            setTimeout(() => {
                API.showToast('更新完成，已是最新版本', 'success');
            }, 500);
        }
        
        // 更新进度条
        updateProgressBar(ProfileState.updateProgress);
    }, 300);
}

/**
 * 更新进度条
 * @param {number} progress - 进度值(0-100)
 */
function updateProgressBar(progress) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const progressFill = toast.querySelector('.progress-fill');
    const progressPercentage = toast.querySelector('.progress-percentage');
    
    if (progressFill && progressPercentage) {
        progressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
    }
}

/**
 * 跳转到工作日志页面
 */
function navigateToWorkLog() {
    console.log('跳转到工作日志页面...');
    window.location.href = 'work-log.html';
}

/**
 * 显示关于页面
 */
function showAbout() {
    console.log('显示关于页面...');
    
    const aboutModal = document.getElementById('aboutModal');
    if (aboutModal) {
        aboutModal.classList.add('active');
    }
}

/**
 * 关闭关于页面
 */
function closeAboutModal() {
    const aboutModal = document.getElementById('aboutModal');
    if (aboutModal) {
        aboutModal.classList.remove('active');
    }
}

/**
 * 系统一键修复
 */
function systemRepair() {
    console.log('系统一键修复...');
    API.showToast('正在检测系统...', 'info');
    
    // 模拟系统检测过程
    setTimeout(() => {
        // 显示带进度条的Toast
        const toast = document.getElementById('toast');
        if (toast) {
            toast.className = 'toast progress show';
            toast.innerHTML = `
                <div class="progress-text">正在修复系统...</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-percentage">0%</div>
            `;
        }
        
        // 模拟修复进度
        simulateRepair();
    }, 1500);
}

/**
 * 模拟修复过程
 */
function simulateRepair() {
    ProfileState.repairProgress = 0;
    
    // 清除现有定时器
    if (ProfileState.repairTimer) {
        clearInterval(ProfileState.repairTimer);
    }
    
    // 创建新定时器
    ProfileState.repairTimer = setInterval(() => {
        ProfileState.repairProgress += Math.floor(Math.random() * 15) + 5;
        
        if (ProfileState.repairProgress >= 100) {
            ProfileState.repairProgress = 100;
            clearInterval(ProfileState.repairTimer);
            
            // 修复完成
            setTimeout(() => {
                API.showToast('系统修复完成，运行正常', 'success');
            }, 500);
        }
        
        // 更新进度条
        updateProgressBar(ProfileState.repairProgress);
    }, 400);
}

// 初始化个人中心页面
document.addEventListener('DOMContentLoaded', () => {
    console.log('个人中心页面初始化...');
    
    // 检查登录状态，未登录则跳转到登录页
    if (!localStorage.getItem('currentUser')) {
        window.location.href = 'login.html';
        return;
    }

    // 加载用户个人资料
    loadUserProfile();
    
    // 确保底部导航栏状态正确
    updateBottomNavigation('profile');
});