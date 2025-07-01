/**
 * 首页逻辑
 * 处理首页数据加载、轮播图、功能网格等
 */

/**
 * 导航到出差管理页面
 */
function navigateToBusinessTravel() {
    window.location.href = 'business-travel.html';
}

/**
 * 导航到规章制度页面
 */
function navigateToRegulations() {
    window.location.href = 'regulations.html';
}

/**
 * 导航到系统通知页面
 */
function navigateToNotifications() {
    window.location.href = 'notification-list.html';
}

// 首页状态
const HomeState = {
    homeData: null,
    bannerIndex: 0,
    bannerTimer: null,
    unreadNotificationCount: 0
};

/**
 * 加载首页数据
 */
async function loadHomePageData() {
    console.time('加载首页数据');
    console.log('加载首页数据...');
    
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
        
        // 调用首页数据API
        const result = await API.getHomePageData(userId);
        
        // 调用系统通知API获取通知列表（已在页面加载前预加载，这里可能是刷新数据）
        const msgResult = await API.getMsgList(userId, 1, 10);
        console.log('刷新系统通知数据:', msgResult);
        
        // 合并数据
        let homeData = {};
        if (result.success) {
            homeData = result.data || {};
        }
        
        // 将系统通知数据添加到homeData
        if (msgResult && msgResult.success) {
            homeData.systemMsgs = msgResult.data || [];
            
            // 计算未读通知数量
            const unreadCount = (msgResult.data || []).filter(msg => msg.Status === '0').length;
            HomeState.unreadNotificationCount = unreadCount;
            
            // 更新未读通知徽章
            updateNotificationBadge(unreadCount);
            
            // 存储通知数据到本地，方便其他页面使用
            localStorage.setItem('notifications', JSON.stringify(msgResult.data || []));
        } else {
            homeData.systemMsgs = [];
            console.error('获取系统通知失败:', msgResult ? msgResult.message : '未知错误');
        }
        
        HomeState.homeData = homeData;
        renderHomePageData(homeData);
        console.timeEnd('加载首页数据');
    } catch (error) {
        console.error('加载首页数据错误:', error);
        API.showToast('加载首页数据失败', 'error');
        renderDefaultHomeData();
        console.timeEnd('加载首页数据');
    }
}

/**
 * 更新未读通知徽章
 * @param {number} count - 未读通知数量
 */
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * 渲染首页数据
 * @param {object} data - 首页数据
 */
function renderHomePageData(data) {
    console.log('首页数据:', data);
    
    // 如果API返回了轮播图数据且与默认不同，再次渲染轮播图
    if (data.banners && data.banners.length > 0) {
        console.log('API返回的轮播图数据:', data.banners);
        renderBanners(data.banners);
    }
    
    // 渲染功能网格
    renderFunctionGrid(data.dynamicitems || []);
    
    // 渲染消息通知 - 优先使用系统通知API的数据
    if (data.systemMsgs && data.systemMsgs.length > 0) {
        renderMessages(data.systemMsgs);
    } else {
        renderMessages(data.msgList || []);
    }
    
    // 渲染企业风貌
    renderCompanyCulture(data.companyCulture || []);
    
    // 渲染异常流程数量
    renderExceptionCount(data.exceptionCount || 0);
}

/**
 * 渲染默认首页数据（当API请求失败时）
 */
function renderDefaultHomeData() {
    // 渲染默认轮播图 - 使用本地banner图片（正确的文件名和扩展名）
    renderBanners([
        {
            picUrl: 'images/hmif/banner_01.jpg',
            jumpUrl: '#'
        },
        {
            picUrl: 'images/hmif/banner_02.jpg', 
            jumpUrl: '#'
        }
    ]);
    
    // 渲染空的消息通知
    renderMessages([]);
    
    // 渲染空的企业风貌
    renderCompanyCulture([]);
    
    // 渲染异常流程数量为0
    renderExceptionCount(0);
}

/**
 * 渲染轮播图
 * @param {Array} banners - 轮播图数据
 */
function renderBanners(banners) {
    console.time('轮播图渲染时间');
    const bannerSlider = document.getElementById('bannerSlider');
    const bannerDots = document.getElementById('bannerDots');
    const bannerPlaceholder = document.querySelector('.banner-placeholder');
    
    if (!bannerSlider || !bannerDots) return;
    
    // 清空现有内容
    bannerSlider.innerHTML = '';
    bannerDots.innerHTML = '';
    
    if (banners.length === 0) {
        // 显示占位符
        if (bannerPlaceholder) {
            bannerPlaceholder.style.display = 'flex';
        }
        return;
    }
    
    // 隐藏占位符
    if (bannerPlaceholder) {
        bannerPlaceholder.style.display = 'none';
    }
    
    // 创建轮播图
    banners.forEach((banner, index) => {
        // 创建轮播图项
        const slide = document.createElement('div');
        slide.className = 'banner-slide';
        slide.style.display = index === 0 ? 'block' : 'none';
        slide.style.width = '100%';
        slide.style.height = '100%';
        
        // 创建图片并进行优化
        const img = document.createElement('img');
        img.setAttribute('loading', 'eager'); // 立即加载，不延迟
        img.setAttribute('decoding', 'sync'); // 同步解码，不延迟渲染
        img.setAttribute('importance', 'high'); // 高优先级
        
        // 修复图片路径问题，将绝对路径转换为相对路径
        let imgSrc = banner.picUrl;
        console.log('原始图片路径:', imgSrc);
        
        if (imgSrc && imgSrc.startsWith('/D:/images/')) {
            imgSrc = imgSrc.replace('/D:/images/', 'images/');
        } else if (imgSrc && imgSrc.startsWith('/images/')) {
            imgSrc = imgSrc.replace('/images/', 'images/');
        }
        
        // 确保hmif文件夹路径正确处理
        // 处理路径格式和文件名
        if (imgSrc) {
            // 将Windows风格的路径转换为Web风格
            imgSrc = imgSrc.replace(/\\/g, '/');
            
            // 修正文件名和扩展名
            // 将banner_1.png转换为banner_01.jpg
            imgSrc = imgSrc.replace(/banner_(\d)\.png/g, 'banner_0$1.jpg');
            
            // 确保hmif文件夹路径正确
            if (!imgSrc.includes('/hmif/') && imgSrc.includes('banner_')) {
                imgSrc = imgSrc.replace(/(images\/)(banner_)/, '$1hmif/$2');
            }
        }
        
        const finalSrc = imgSrc || 'images/hmif/default-banner.png';
        console.log('最终图片路径:', finalSrc);
        img.src = finalSrc;
        img.alt = `Banner ${index + 1}`;
        
        // 添加图片加载错误处理，防止无限循环
        let hasTriedDefault = false;
        img.onerror = function() {
            if (!hasTriedDefault && this.src !== 'images/hmif/default-banner.png') {
                            console.log('轮播图加载失败，使用默认图片:', this.src);
            hasTriedDefault = true;
            this.src = 'images/hmif/default-banner.png';
            } else {
                console.warn('默认轮播图也加载失败，停止重试:', this.src);
                // 移除onerror处理器防止无限循环
                this.onerror = null;
                // 设置一个透明的1x1像素图片作为最后的回退
                this.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }
        };
        
        // 创建链接
        if (banner.jumpUrl) {
            const link = document.createElement('a');
            link.href = banner.jumpUrl;
            link.appendChild(img);
            slide.appendChild(link);
        } else {
            slide.appendChild(img);
        }
        
        bannerSlider.appendChild(slide);
        
        // 创建轮播点
        const dot = document.createElement('span');
        dot.className = 'dot';
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => switchBanner(index));
        bannerDots.appendChild(dot);
    });
    
    // 启动轮播定时器
    startBannerTimer();
    console.timeEnd('轮播图渲染时间');
}

/**
 * 切换轮播图
 * @param {number} index - 轮播图索引
 */
function switchBanner(index) {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dots .dot');
    
    if (slides.length === 0 || dots.length === 0) return;
    
    // 隐藏所有轮播图
    slides.forEach(slide => {
        slide.style.display = 'none';
    });
    
    // 移除所有点的激活状态
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    
    // 显示当前轮播图和点
    const targetIndex = index % slides.length;
    slides[targetIndex].style.display = 'block';
    dots[targetIndex].classList.add('active');
    
    // 更新当前索引
    HomeState.bannerIndex = targetIndex;
}

/**
 * 启动轮播图定时器
 */
function startBannerTimer() {
    // 清除现有定时器
    if (HomeState.bannerTimer) {
        clearInterval(HomeState.bannerTimer);
    }
    
    // 创建新定时器
    HomeState.bannerTimer = setInterval(() => {
        const slides = document.querySelectorAll('.banner-slide');
        if (slides.length > 1) {
            switchBanner(HomeState.bannerIndex + 1);
        }
    }, 5000); // 5秒切换一次
}

/**
 * 渲染功能网格
 * @param {Array} items - 功能项数据
 */
function renderFunctionGrid(items) {
    const gridContainer = document.querySelector('.function-grid');
    if (!gridContainer) return;
    
    // 保留静态HTML中定义的功能模块（出差管理和待办）
    const staticItems = gridContainer.querySelectorAll('.grid-item[onclick]');
    const staticItemsHTML = Array.from(staticItems).map(item => item.outerHTML).join('');
    
    // 清空内容但保留静态项
    gridContainer.innerHTML = staticItemsHTML;
    
    // 如果没有动态功能项数据，直接返回，保留静态功能项
    if (!items || !Array.isArray(items) || items.length === 0) {
        console.log('没有动态功能模块数据，仅显示静态功能项');
        return;
    }
    
    // 过滤掉无效的项，确保只渲染有效的功能项
    const validItems = items.filter(item => item && typeof item === 'object');
    
    // 渲染功能项
    validItems.forEach(item => {
        try {
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';
            
            // 确保name有有效值
            const displayName = (item.name && typeof item.name === 'string') ? item.name : '功能项';
            
            // 处理图标路径
            let iconSrc = 'images/hmif/default-icon.png'; // 默认使用一个确定存在的图标，确保路径正确
            
            // 只有当icon是有效字符串时才尝试使用它
            if (item.icon && typeof item.icon === 'string') {
                if (item.icon.startsWith('/D:/')) {
                    iconSrc = item.icon.replace('/D:/', '');
                } else if (item.icon.startsWith('/')) {
                    iconSrc = item.icon.substring(1);
                } else {
                    iconSrc = item.icon;
                }
            }
            
            // 使用内联SVG作为默认图标，确保一定有图标显示
            const defaultIconSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
                </svg>
            `;
            
            gridItem.innerHTML = `
                <div class="grid-icon">
                    <img src="${iconSrc}" alt="${displayName}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display:none;">${defaultIconSvg}</div>
                </div>
                <span class="grid-label">${displayName}</span>
            `;
            
            // 添加点击事件
            if (item.url && typeof item.url === 'string') {
                gridItem.addEventListener('click', () => {
                    if (item.url.startsWith('http')) {
                        window.open(item.url, '_blank');
                    } else {
                        window.location.href = item.url;
                    }
                });
            }
            
            gridContainer.appendChild(gridItem);
        } catch (error) {
            console.error('渲染功能项失败:', error);
            // 发生错误时不添加此功能项，继续处理下一项
        }
    });
}

/**
 * 渲染消息通知
 * @param {Array} messages - 消息数据
 */
function renderMessages(messages) {
    console.time('渲染消息通知');
    // 获取消息通知容器
    const messageSection = document.querySelector('.message-section');
    if (!messageSection) return;
    
    // 获取第一个消息项，用于更新
    const messageItem = messageSection.querySelector('.message-item');
    if (!messageItem) return;
    
    // 获取消息标题元素
    const messageTitle = messageItem.querySelector('.message-title');
    if (!messageTitle) return;
    
    if (messages && messages.length > 0) {
        // 获取最新的通知信息
        const latestMsg = messages[0];
        
        // 更新通知标题，显示最新通知内容
        if (latestMsg.MessageContent) {
            messageTitle.textContent = latestMsg.MessageContent;
            messageTitle.setAttribute('title', latestMsg.MessageContent);
        }
        
        // 如果有未读通知，添加未读红点
        const unreadCount = messages.filter(msg => msg.Status === '0').length;
        
        // 检查是否已经有消息红点，如果没有则添加
        let messageDot = messageItem.querySelector('.message-dot');
        if (unreadCount > 0) {
            if (!messageDot) {
                messageDot = document.createElement('div');
                messageDot.className = 'message-dot';
                messageItem.appendChild(messageDot);
            }
        } else if (messageDot) {
            // 如果没有未读通知但有红点，则移除红点
            messageDot.remove();
        }
    }
    console.timeEnd('渲染消息通知');
}

/**
 * 渲染企业风貌
 * @param {Array} cultureData - 企业风貌数据
 */
function renderCompanyCulture(cultureData) {
    const cultureContainer = document.querySelector('.company-culture');
    if (!cultureContainer) return;
    
    // 清空现有内容
    cultureContainer.innerHTML = '';
    
    if (!cultureData || cultureData.length === 0) {
        cultureContainer.innerHTML = '<div class="no-data">暂无企业风貌</div>';
        return;
    }
    
    // 渲染企业风貌项
    cultureData.forEach(item => {
        const cultureItem = document.createElement('div');
        cultureItem.className = 'culture-item';
        
        cultureItem.innerHTML = `
            <div class="culture-image">
                <img src="${item.image || 'images/default-culture.png'}" alt="${item.title}">
            </div>
            <div class="culture-content">
                <div class="culture-title">${item.title || '企业风貌'}</div>
                <div class="culture-desc">${item.description || ''}</div>
            </div>
        `;
        
        // 添加点击事件
        if (item.url) {
            cultureItem.addEventListener('click', () => {
                if (item.url.startsWith('http')) {
                    window.open(item.url, '_blank');
                } else {
                    window.location.href = item.url;
                }
            });
        }
        
        cultureContainer.appendChild(cultureItem);
    });
}

/**
 * 渲染异常流程数量
 * @param {number} count - 异常流程数量
 */
function renderExceptionCount(count) {
    const exceptionContainer = document.querySelector('.exception-count');
    if (!exceptionContainer) return;
    
    exceptionContainer.innerHTML = `
        <div class="exception-item">
            <div class="exception-number">${count}</div>
            <div class="exception-label">异常流程</div>
        </div>
    `;
    
    // 如果有异常流程，添加点击事件跳转到审批页面
    if (count > 0) {
        exceptionContainer.addEventListener('click', () => {
            window.location.href = 'approval.html';
        });
        exceptionContainer.style.cursor = 'pointer';
    }
}

// 预加载图片
function preloadBannerImages() {
    const bannerImages = [
        'images/hmif/banner_01.jpg',
        'images/hmif/banner_02.jpg',
        'images/hmif/default-banner.png'
    ];
    
    console.log('预加载轮播图图片...');
    bannerImages.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => console.log(`图片预加载成功: ${src}`);
        img.onerror = () => console.warn(`图片预加载失败: ${src}`);
    });
}

// 预加载并缓存系统通知数据
function preloadNotificationData() {
    console.log('预加载系统通知数据...');
    
    // 尝试从localStorage获取用户ID
    let userId = localStorage.getItem('user_id');
    
    // 如果没有找到用户ID，尝试从用户信息中获取
    if (!userId) {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                userId = user.user_id || user.USER_ID;
            } catch (e) {
                console.error('解析用户数据失败:', e);
            }
        }
    }
    
    if (userId) {
        // 立即发起系统通知请求
        console.time('系统通知预加载');
        API.getMsgList(userId, 1, 10)
            .then(result => {
                console.timeEnd('系统通知预加载');
                if (result && result.success && result.data) {
                    console.log('系统通知预加载成功:', result.data.length + '条');
                    
                    // 缓存通知数据
                    localStorage.setItem('cachedNotifications', JSON.stringify(result.data));
                    
                    // 计算并缓存未读数量
                    const unreadCount = (result.data || []).filter(msg => msg.Status === '0').length;
                    localStorage.setItem('unreadNotificationCount', unreadCount.toString());
                    
                    // 更新徽章
                    updateNotificationBadge(unreadCount);
                    
                    // 如果页面已加载完成，更新通知UI
                    if (document.readyState === 'complete') {
                        renderMessages(result.data);
                    }
                }
            })
            .catch(err => {
                console.timeEnd('系统通知预加载');
                console.error('系统通知预加载失败:', err);
            });
    }
}

// 立即开始预加载图片和系统通知数据（不等待DOMContentLoaded）
preloadBannerImages();
preloadNotificationData();

// 初始化首页
document.addEventListener('DOMContentLoaded', () => {
    console.log('首页初始化...');
    
    // 检查登录状态，未登录则跳转到登录页
    if (!localStorage.getItem('currentUser')) {
        window.location.href = 'login.html';
        return;
    }

    // 立即渲染默认轮播图，不等待API数据
    renderBanners([
        { picUrl: 'images/hmif/banner_01.jpg', jumpUrl: '#' },
        { picUrl: 'images/hmif/banner_02.jpg', jumpUrl: '#' }
    ]);
    
    // 从本地缓存加载系统通知数据
    const cachedNotifications = localStorage.getItem('cachedNotifications');
    if (cachedNotifications) {
        try {
            const notifications = JSON.parse(cachedNotifications);
            console.log('从缓存加载系统通知数据:', notifications.length + '条');
            renderMessages(notifications);
            
            // 读取缓存的未读数量
            const unreadCount = parseInt(localStorage.getItem('unreadNotificationCount') || '0', 10);
            updateNotificationBadge(unreadCount);
        } catch (e) {
            console.error('解析缓存的系统通知数据失败:', e);
        }
    }
    
    // 加载首页数据
    loadHomePageData();
    
    // 确保底部导航栏状态正确
    updateBottomNavigation('home');
    
    // 绑定轮播图触摸事件
    const bannerContainer = document.querySelector('.banner-container');
    if (bannerContainer) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        bannerContainer.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        bannerContainer.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // 向左滑动，显示下一张
                    switchBanner(HomeState.bannerIndex + 1);
                } else {
                    // 向右滑动，显示上一张
                    switchBanner(HomeState.bannerIndex - 1 + document.querySelectorAll('.banner-slide').length);
                }
                
                // 重置定时器
                startBannerTimer();
            }
        }
    }
});