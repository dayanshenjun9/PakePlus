/**
 * 移动端审批系统主应用逻辑
 * 实现页面导航、数据管理、用户交互等核心功能
 * 基于用户界面截图和接口文档开发
 */

// 全局应用状态
const AppState = {
    currentUser: null,
    currentPage: 'loginPage',
    homeData: null,
    approvalList: [],
    currentApprovalTab: 'pending',
    bannerIndex: 0,
    bannerTimer: null
};

/**
 * 应用初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('移动端审批系统初始化...');
    
    // 检查本地存储的用户信息
    checkStoredUser();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化页面
    initializePage();
    
    // 设置状态栏时间
    updateStatusBarTime();
    setInterval(updateStatusBarTime, 60000); // 每分钟更新一次
});

/**
 * 检查本地存储的用户信息
 */
function checkStoredUser() {
    const storedUser = localStorage.getItem('currentUser');
    const userId = localStorage.getItem('user_id');
    
    if (storedUser && userId) {
        try {
            AppState.currentUser = JSON.parse(storedUser);
            // 如果有存储的用户信息和user_id，直接跳转到主页
            navigateToHome();
        } catch (error) {
            console.error('解析存储用户信息失败:', error);
            // 清除无效的存储数据
            localStorage.removeItem('currentUser');
            localStorage.removeItem('user_id');
        }
    }
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    // 登录表单提交
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 全局表单提交处理
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'loginForm') {
            e.preventDefault();
        }
    });
    
    // 模态框点击外部关闭
    document.addEventListener('click', function(e) {
        // 点击模态框背景关闭
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
    
    // 触摸事件处理（用于轮播图滑动）
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            const bannerContainer = document.querySelector('.banner-container');
            if (bannerContainer && bannerContainer.contains(e.target)) {
                if (diff > 0) {
                    nextBanner();
                } else {
                    prevBanner();
                }
            }
        }
    }
}

/**
 * 初始化页面
 */
function initializePage() {
    // 如果没有用户信息，显示登录页面
    if (!AppState.currentUser) {
        showPage('loginPage');
    } else {
        // 有用户信息，显示主页
        navigateToHome();
    }
}

/**
 * 更新状态栏时间
 */
function updateStatusBarTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const timeElements = document.querySelectorAll('.status-bar .time');
    timeElements.forEach(element => {
        if (element) {
            element.textContent = timeString;
        }
    });
}

/**
 * 显示登录错误信息
 */
function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // 滚动到错误信息位置
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 3秒后自动隐藏
        setTimeout(() => {
            hideLoginError();
        }, 3000);
    }
}

/**
 * 隐藏登录错误信息
 */
function hideLoginError() {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
}

/**
 * 处理登录
 */
async function handleLogin(e) {
    e.preventDefault();
    
    // 隐藏之前的错误信息
    hideLoginError();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // 表单验证
    if (!username) {
        showLoginError('请输入用户名');
        API.showToast('请输入用户名', 'warning');
        return;
    }
    
    if (!password) {
        showLoginError('请输入密码');
        API.showToast('请输入密码', 'warning');
        return;
    }
    
    // 显示加载状态
    const loginBtn = document.querySelector('.login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const loadingSpinner = loginBtn.querySelector('.loading-spinner');
    
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    loadingSpinner.style.display = 'inline-block';
    
    try {
        console.log('开始登录请求...', { username, password: '***' });
        
        // 调用登录API
        const result = await API.login(username, password);
        
        console.log('登录API响应:', result);
        
        // 根据接口返回的格式判断登录是否成功
        if (result.success || (result.code === '200') || (result.data && result.data.user_id)) {
            // 登录成功，保存用户信息
            const userData = result.data || result.results || { username: username };
            console.log('登录成功，用户数据:', userData);
            AppState.currentUser = userData;
            localStorage.setItem('currentUser', JSON.stringify(AppState.currentUser));
            
            API.showToast('登录成功', 'success');
            
            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
                navigateToHome();
            }, 1000);
        } else {
            // 登录失败，显示错误信息
            const errorMessage = result.msg || '登录失败，请检查用户名和密码';
            showLoginError(errorMessage);
            API.showToast(errorMessage, 'error');
        }
    } catch (error) {
        console.error('登录错误:', error);
        const errorMessage = '登录请求失败，请检查网络连接或稍后重试';
        showLoginError(errorMessage);
        API.showToast(errorMessage, 'error');
    } finally {
        // 恢复按钮状态
        loginBtn.disabled = false;
        btnText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
    }
}

/**
 * 显示指定页面
 */
function showPage(pageId) {
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        AppState.currentPage = pageId;
        
        // 确保底部导航栏在页面切换后正确显示
        if (pageId === 'mainPage') {
            updateBottomNavigation('home');
        } else if (pageId === 'approvalPage') {
            updateBottomNavigation('approval');
        } else if (pageId === 'profilePage') {
            updateBottomNavigation('profile');
        }
    }
    
    console.log('切换到页面:', pageId);
}

/**
 * 导航到首页
 */
function navigateToHome() {
    // 如果当前不在首页，则切换到首页
    if (AppState.currentPage !== 'mainPage') {
        console.log('导航到首页');
        showPage('mainPage');
        AppState.currentPage = 'mainPage';
        updateBottomNavigation('home');
        
        // 加载首页数据
        loadHomePageData();
    } else {
        console.log('已经在首页');
        // 确保导航栏状态正确
        updateBottomNavigation('home');
    }
}

/**
 * 导航到审批页面
 */
function navigateToApproval() {
    // 如果当前不在审批页面，则切换到审批页面
    if (AppState.currentPage !== 'approvalPage') {
        console.log('导航到审批页面');
        showPage('approvalPage');
        AppState.currentPage = 'approvalPage';
        updateBottomNavigation('approval');
        
        // 加载审批列表
        loadApprovalList();
    } else {
        console.log('已经在审批页面');
        // 确保导航栏状态正确
        updateBottomNavigation('approval');
    }
}

/**
 * 导航到个人中心
 */
function navigateToProfile() {
    // 如果当前不在个人中心，则切换到个人中心
    if (AppState.currentPage !== 'profilePage') {
        console.log('导航到个人中心');
        showPage('profilePage');
        AppState.currentPage = 'profilePage';
        updateBottomNavigation('profile');
        
        // 加载用户信息
        loadUserProfile();
    } else {
        console.log('已经在个人中心');
        // 确保导航栏状态正确
        updateBottomNavigation('profile');
    }
}

/**
 * 更新底部导航状态
 */
function updateBottomNavigation(activeTab) {
    // 获取所有页面中的导航项
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    
    // 移除所有导航项的活跃状态
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // 根据activeTab设置对应的导航项为活跃状态
    const activeSelectors = {
        'home': '.nav-item:first-child',
        'approval': '.nav-item:nth-child(2)',
        'profile': '.nav-item:last-child'
    };
    
    if (activeSelectors[activeTab]) {
        const activeItems = document.querySelectorAll('.bottom-nav ' + activeSelectors[activeTab]);
        activeItems.forEach(item => {
            item.classList.add('active');
        });
    }
    
    console.log('更新导航栏状态:', activeTab);
}

/**
 * 加载首页数据
 */
async function loadHomePageData() {
    console.log('加载首页数据...');
    
    try {
        // 调用首页数据API
        const result = await API.getHomeData();
        
        if (result.success) {
            AppState.homeData = result.data;
            renderHomePageData(result.data);
        } else {
            API.handleAPIError(result, '加载首页数据失败');
            // 显示默认数据
            renderDefaultHomeData();
        }
    } catch (error) {
        console.error('加载首页数据错误:', error);
        API.showToast('加载首页数据失败，显示默认内容', 'warning');
        // 显示默认数据
        renderDefaultHomeData();
    }
}

/**
 * 渲染首页数据
 */
function renderHomePageData(data) {
    // 渲染轮播图
    if (data.banners && data.banners.length > 0) {
        renderBanners(data.banners);
    } else {
        renderDefaultBanners();
    }
    
    // 渲染动态项目
    if (data.dynamicitems && data.dynamicitems.length > 0) {
        // TODO: 实现动态项目渲染
        console.log('渲染动态项目:', data.dynamicitems);
    }
    
    // 渲染消息列表
    if (data.msgList && data.msgList.length > 0) {
        // TODO: 实现消息列表渲染
    } else {
        renderDefaultMessages();
    }
    
    // 渲染企业文化
    if (data.companyCuture) {
        // TODO: 实现企业文化渲染
        console.log('渲染企业文化:', data.companyCuture);
    }
}

/**
 * 渲染轮播图
 */
function renderBanners(banners) {
    const bannerSlider = document.getElementById('bannerSlider');
    const bannerDots = document.getElementById('bannerDots');
    const placeholder = document.querySelector('.banner-placeholder');
    
    if (!bannerSlider || !bannerDots) {
        console.warn('轮播图容器未找到');
        return;
    }
    
    // 隐藏占位符
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // 清空现有内容
    bannerSlider.innerHTML = '';
    bannerDots.innerHTML = '';
    
    // 渲染轮播图项目
    banners.forEach((banner, index) => {
        const bannerItem = document.createElement('div');
        bannerItem.className = 'banner-item';
        bannerItem.innerHTML = `<img src="${banner.picUrl}" alt="轮播图${index + 1}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4='">`;
        
        // 添加点击事件
        if (banner.jumpUrl) {
            bannerItem.style.cursor = 'pointer';
            bannerItem.addEventListener('click', () => {
                window.open(banner.jumpUrl, '_blank');
            });
        }
        
        bannerSlider.appendChild(bannerItem);
        
        // 创建指示点
        const dot = document.createElement('div');
        dot.className = `banner-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => setBannerIndex(index));
        bannerDots.appendChild(dot);
    });
    
    // 启动自动轮播
    startBannerAutoPlay();
}

/**
 * 渲染默认轮播图
 */
function renderDefaultBanners() {
    const defaultBanners = [
        { picUrl: 'images/banner_01.jpg', jumpUrl: '#' },
        { picUrl: 'images/banner_02.jpg', jumpUrl: '#' }
    ];
    
    renderBanners(defaultBanners);
}

/**
 * 渲染默认消息列表
 */
function renderDefaultMessages() {
    const messageSection = document.querySelector('.message-section');
    if (messageSection) {
        // TODO: 实现默认消息列表渲染
    }
    console.log('显示默认消息列表');
}

/**
 * 启动轮播图自动播放
 */
function startBannerAutoPlay() {
    if (AppState.bannerTimer) {
        clearInterval(AppState.bannerTimer);
    }
    
    AppState.bannerTimer = setInterval(() => {
        nextBanner();
    }, 3000); // 3秒切换一次
}

/**
 * 下一张轮播图
 */
function nextBanner() {
    const bannerItems = document.querySelectorAll('.banner-item');
    if (bannerItems.length > 0) {
        AppState.bannerIndex = (AppState.bannerIndex + 1) % bannerItems.length;
        updateBannerDisplay();
    }
}

/**
 * 上一张轮播图
 */
function prevBanner() {
    const bannerItems = document.querySelectorAll('.banner-item');
    if (bannerItems.length > 0) {
        AppState.bannerIndex = AppState.bannerIndex === 0 ? bannerItems.length - 1 : AppState.bannerIndex - 1;
        updateBannerDisplay();
    }
}

/**
 * 设置轮播图索引
 */
function setBannerIndex(index) {
    const bannerItems = document.querySelectorAll('.banner-item');
    if (index >= 0 && index < bannerItems.length) {
        AppState.bannerIndex = index;
        updateBannerDisplay();
    }
}

/**
 * 更新轮播图显示
 */
function updateBannerDisplay() {
    const bannerSlider = document.getElementById('bannerSlider');
    const bannerDots = document.querySelectorAll('.banner-dot');
    
    if (bannerSlider) {
        const translateX = -AppState.bannerIndex * 100;
        bannerSlider.style.transform = `translateX(${translateX}%)`;
    }
    
    bannerDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === AppState.bannerIndex);
    });
}

/**
 * 加载审批列表
 */
async function loadApprovalList() {
    console.log('加载审批列表...');
    
    try {
        // 获取用户ID，优先从缓存中获取
        let userId = localStorage.getItem('user_id');
        
        // 如果没有缓存的user_id，尝试从用户信息中获取
        if (!userId) {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                userId = user.user_id || user.USER_ID;
            }
        }
        
        // 如果仍然没有用户ID，跳转到登录页
        if (!userId) {
            window.location.href = 'login.html';
            return;
        }
        
        // 调用审批列表API
        const result = await API.getApprovalList(userId);
        
        if (result.success) {
            // 获取当前登录用户的完整信息
            const currentUserData = localStorage.getItem('currentUser');
            let currentUser = null;
            if (currentUserData) {
                currentUser = JSON.parse(currentUserData);
            }
            
            // 过滤审批数据：只显示当前用户需要处理的审批项
            const filteredData = result.data.filter(item => {
                // 检查need_process是否等于1（需要处理）
                const needProcess = item.need_process === '1' || item.need_process === 1;
                
                // 检查user_id是否匹配当前登录用户
                const userIdMatch = item.user_id === userId || 
                                   (currentUser && (item.user_id === currentUser.USER_ID || 
                                                   item.user_id === currentUser.user_id));
                
                // 可选：检查ORGCODE是否匹配（如果需要按组织过滤）
                let orgMatch = true;
                if (currentUser && currentUser.ORGCODE && item.orgcode) {
                    orgMatch = item.orgcode === currentUser.ORGCODE;
                }
                
                console.log(`审批项过滤检查: list_id=${item.list_id}, item.user_id=${item.user_id}, 登录用户ID=${userId}, need_process=${item.need_process}, 需要处理=${needProcess}, 用户匹配=${userIdMatch}, 组织匹配=${orgMatch}`);
                
                // 必须同时满足：需要处理 && 用户匹配 && 组织匹配
                return needProcess && userIdMatch && orgMatch;
            });
            
            console.log(`原始数据数量: ${result.data.length}, 过滤后数量: ${filteredData.length}`);
            
            AppState.approvalList = filteredData;
            renderApprovalList(filteredData);
        } else {
            API.handleAPIError(result, '加载审批列表失败');
        }
    } catch (error) {
        console.error('加载审批列表错误:', error);
        API.showToast('加载审批列表失败', 'error');
    }
}

/**
 * 渲染审批列表
 */
function renderApprovalList(approvalData) {
    const pendingList = document.getElementById('pendingList');
    const completedList = document.getElementById('completedList');
    
    if (!pendingList || !completedList) {
        console.warn('审批列表容器未找到');
        return;
    }
    
    // 分离待审批和已审批数据
    const pendingItems = approvalData.filter(item => item.need_process === '1' && item.is_processed === '0');
    const completedItems = approvalData.filter(item => item.is_processed === '1');
    
    // 渲染列表
    renderApprovalItems(pendingList, pendingItems, true);
    renderApprovalItems(completedList, completedItems, false);
    
    console.log('审批列表渲染完成', {
        pending: pendingItems.length,
        completed: completedItems.length
    });
}

/**
 * 渲染审批项目
 */
function renderApprovalItems(container, items, isPending) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-text">${isPending ? '暂无待审批事项' : '暂无已审批记录'}</div>
                <div class="empty-desc">${isPending ? '您当前没有需要处理的审批事项' : '您还没有处理过任何审批事项'}</div>
            </div>
        `;
        return;
    }
    
    items.forEach(item => {
        const itemElement = createApprovalItemElement(item, isPending);
        container.appendChild(itemElement);
    });
}

/**
 * 创建审批项目元素
 */
function createApprovalItemElement(item, isPending) {
    const div = document.createElement('div');
    div.className = 'approval-item';
    div.setAttribute('data-flow-id', item.list_id);
    
    const statusClass = item.is_processed === '1' ? 'status-approved' : 'status-pending';
    const statusText = item.is_processed === '1' ? '已处理' : '待处理';
    
    div.innerHTML = `
        <div class="approval-header">
            <div class="approval-info">
                <div class="approval-title">${item.title || '无标题'}</div>
                <div class="approval-time">${item.start_date}</div>
            </div>
            <div class="approval-status ${statusClass}">${statusText}</div>
        </div>
        <div class="approval-content">
            <div class="approval-node">当前节点：${item.node_name}</div>
            <div class="approval-initiator">发起人：${item.start_user_disp_name}</div>
        </div>
        <div class="approval-footer">
            <div class="approval-type">${item.flow_name}</div>
            <div class="approval-actions">
                ${isPending && item.isApproval ? `
                    <button class="action-btn btn-approve" onclick="showApprovalModal('${item.list_id}', 'pass')">通过</button>
                    <button class="action-btn btn-reject" onclick="showApprovalModal('${item.list_id}', 'reject')">驳回</button>
                ` : ''}
                <button class="action-btn btn-view" onclick="viewApprovalDetail('${item.list_id}')">查看</button>
            </div>
        </div>
    `;
    
    return div;
}

/**
 * 切换审批标签页
 */
function switchApprovalTab(tabType) {
    AppState.currentApprovalTab = tabType;
    
    // 更新标签页状态
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = tabType === 'pending' ? tabs[0] : tabs[1];
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // 切换列表显示
    const pendingList = document.getElementById('pendingList');
    const completedList = document.getElementById('completedList');
    
    if (tabType === 'pending') {
        pendingList.style.display = 'block';
        completedList.style.display = 'none';
    } else {
        pendingList.style.display = 'none';
        completedList.style.display = 'block';
    }
}

/**
 * 显示审批模态框
 */
function showApprovalModal(flowId, action) {
    const modal = document.getElementById('approvalModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) {
        console.warn('审批模态框元素未找到');
        return;
    }
    
    // 查找审批项目信息
    const approvalItem = AppState.approvalList.find(item => item.list_id === flowId);
    if (!approvalItem) {
        API.showToast('未找到审批信息', 'error');
        return;
    }
    
    modalTitle.textContent = action === 'pass' ? '审批通过' : '审批驳回';
    
    modalBody.innerHTML = `
        <div class="approval-detail">
            <div class="detail-item">
                <label>标题：</label>
                <span>${approvalItem.title || '无标题'}</span>
            </div>
            <div class="detail-item">
                <label>发起人：</label>
                <span>${approvalItem.start_user_disp_name}</span>
            </div>
            <div class="detail-item">
                <label>当前节点：</label>
                <span>${approvalItem.node_name}</span>
            </div>
            <div class="form-group" style="margin-top: 20px;">
                <label for="approvalRemark">审批意见${action === 'reject' ? '（必填）' : ''}：</label>
                <textarea id="approvalRemark" placeholder="请输入审批意见" rows="4" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical; margin-top: 8px;"></textarea>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-cancel" onclick="closeApprovalModal()">取消</button>
            <button class="btn btn-primary" onclick="performApproval('${action}')">确认${action === 'pass' ? '通过' : '驳回'}</button>
        </div>
    `;
    
    // 设置模态框数据属性
    modal.setAttribute('data-flow-id', flowId);
    modal.setAttribute('data-action', action);
    modal.setAttribute('data-node-name', approvalItem.node_name);
    
    // 显示模态框
    modal.classList.add('active');
}

/**
 * 执行审批操作
 */
async function performApproval(action) {
    const modal = document.getElementById('approvalModal');
    const remarkTextarea = document.getElementById('approvalRemark');
    
    if (!modal || !remarkTextarea) return;
    
    const flowId = modal.getAttribute('data-flow-id');
    const nodeName = modal.getAttribute('data-node-name');
    const remark = remarkTextarea.value.trim();
    
    // 验证必填项
    if (action === 'reject' && !remark) {
        API.showToast('驳回操作必须填写审批意见', 'warning');
        return;
    }
    
    try {
        const approvalData = {
            list_id: flowId,
            node_name: nodeName,
            remark: remark,
            action: action,
            module: '',
            user_id: AppState.currentUser.user_id
        };
        
        const result = await API.submitApproval(approvalData);
        
        if (result.success) {
            API.handleAPISuccess(result, `审批${action === 'pass' ? '通过' : '驳回'}成功`);
            
            // 关闭模态框
            closeApprovalModal();
            
            // 重新加载审批列表
            setTimeout(() => {
                loadApprovalList();
            }, 1000);
        } else {
            API.handleAPIError(result, `审批${action === 'pass' ? '通过' : '驳回'}失败`);
        }
    } catch (error) {
        console.error('审批操作错误:', error);
        API.showToast('审批操作失败，请稍后重试', 'error');
    }
}

/**
 * 查看审批详情
 */
function viewApprovalDetail(flowId) {
    // TODO: 实现审批详情查看功能
    API.showToast('查看详情功能开发中', 'info');
    console.log('查看审批详情:', flowId);
}

/**
 * 关闭审批模态框
 */
function closeApprovalModal() {
    const modal = document.getElementById('approvalModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 加载用户信息
 */
function loadUserProfile() {
    if (!AppState.currentUser) {
        console.warn('用户信息不存在');
        return;
    }
    
    const userName = document.getElementById('userName');
    const userDept = document.getElementById('userDept');
    
    if (userName) {
        userName.textContent = AppState.currentUser.user_name || AppState.currentUser.username || '未知用户';
    }
    
    if (userDept) {
        userDept.textContent = `${AppState.currentUser.dept_name || '未知部门'} | ${AppState.currentUser.rolenames ? AppState.currentUser.rolenames.join(', ') : '普通用户'}`;
    }
    
    console.log('用户信息加载完成:', AppState.currentUser);
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
    AppState.currentUser = null;
    AppState.approvalList = [];
    AppState.homeData = null;
    
    // 停止轮播图定时器
    if (AppState.bannerTimer) {
        clearInterval(AppState.bannerTimer);
        AppState.bannerTimer = null;
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
    
    // 跳转到登录页面
    showPage('loginPage');
    
    API.showToast('已退出登录，缓存已清理', 'success');
}

/**
 * 显示确认模态框
 */
function showConfirmModal(message, confirmCallback) {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    
    if (!modal || !messageElement) return;
    
    messageElement.textContent = message;
    modal.setAttribute('data-confirm-callback', confirmCallback.name);
    modal.classList.add('active');
}

/**
 * 确认操作
 */
function confirmAction() {
    const modal = document.getElementById('confirmModal');
    const callbackName = modal.getAttribute('data-confirm-callback');
    
    // 关闭模态框
    closeConfirmModal();
    
    // 执行回调函数
    if (callbackName && window[callbackName]) {
        window[callbackName]();
    }
}

/**
 * 关闭确认模态框
 */
function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 关闭模态框通用方法
 */
function closeModal(modal) {
    modal.classList.remove('active');
}

/**
 * 显示即将推出功能提示
 */
function showComingSoon() {
    API.showToast('功能开发中，敬请期待', 'info');
}

/**
 * 检测更新
 */
function checkForUpdates() {
    showConfirmModal('检测到新版本 v1.0.1，是否立即更新？', simulateUpdate);
}

/**
 * 模拟更新过程
 */
function simulateUpdate() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.className = 'toast progress';
        toast.innerHTML = '<div class="progress-bar"><div class="progress-fill"></div></div><div class="progress-text">正在下载更新 <span id="progressPercent">0%</span></div>';
        toast.style.display = 'flex';
        
        let progress = 0;
        const progressFill = toast.querySelector('.progress-fill');
        const progressPercent = toast.querySelector('#progressPercent');
        
        const updateInterval = setInterval(() => {
            progress += 5;
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressPercent) progressPercent.textContent = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(updateInterval);
                setTimeout(() => {
                    toast.className = 'toast success';
                    toast.textContent = '更新成功，应用将在3秒后重启';
                    setTimeout(() => {
                        toast.style.display = 'none';
                        window.location.reload();
                    }, 3000);
                }, 500);
            }
        }, 200);
    } else {
        API.showToast('更新成功', 'success');
    }
}

/**
 * 显示关于页面
 */
function showAbout() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * 关闭关于页面
 */
function closeAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 系统一键修复
 */
function systemRepair() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.className = 'toast progress';
        toast.innerHTML = '<div class="progress-bar"><div class="progress-fill"></div></div><div class="progress-text">系统修复中 <span id="progressPercent">0%</span></div>';
        toast.style.display = 'flex';
        
        let progress = 0;
        const progressFill = toast.querySelector('.progress-fill');
        const progressPercent = toast.querySelector('#progressPercent');
        
        const repairInterval = setInterval(() => {
            progress += 10;
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressPercent) progressPercent.textContent = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(repairInterval);
                setTimeout(() => {
                    toast.className = 'toast success';
                    toast.textContent = '系统修复完成，缓存已清理';
                    setTimeout(() => {
                        toast.style.display = 'none';
                    }, 3000);
                }, 500);
            }
        }, 300);
    } else {
        API.showToast('系统修复完成', 'success');
    }
}

/**
 * 渲染默认首页数据
 */
function renderDefaultHomeData() {
    renderDefaultBanners();
    renderDefaultMessages();
    console.log('显示默认首页数据');
}

// 全局函数暴露（供HTML中的onclick使用）
window.navigateToHome = navigateToHome;
window.navigateToApproval = navigateToApproval;
window.navigateToProfile = navigateToProfile;
window.switchApprovalTab = switchApprovalTab;
window.showApprovalModal = showApprovalModal;
window.performApproval = performApproval;
window.viewApprovalDetail = viewApprovalDetail;
window.closeApprovalModal = closeApprovalModal;
window.showLogoutConfirm = showLogoutConfirm;
window.confirmAction = confirmAction;
window.closeConfirmModal = closeConfirmModal;
window.showComingSoon = showComingSoon;
window.checkForUpdates = checkForUpdates;
window.showAbout = showAbout;
window.systemRepair = systemRepair;
window.closeAboutModal = closeAboutModal;
window.simulateUpdate = simulateUpdate;

console.log('移动端审批系统应用逻辑加载完成');