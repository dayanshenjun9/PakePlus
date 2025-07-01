/**
 * 通知列表页面逻辑
 */

// 页面状态
const NotificationListState = {
    notifications: [],
    currentPage: 1,
    pageSize: 10,
    isLoading: false
};

/**
 * 初始化页面
 */
function initPage() {
    // 加载通知列表
    loadNotifications();
    
    // 移除滚动事件监听，禁止上拉加载
}

/**
 * 加载通知列表
 */
async function loadNotifications() {
    if (NotificationListState.isLoading) return;
    
    NotificationListState.isLoading = true;
    
    try {
        // 获取用户ID
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            window.location.href = 'login.html';
            return;
        }
        
        // 调用API获取通知列表
        const result = await API.getMsgList(
            userId, 
            NotificationListState.currentPage, 
            NotificationListState.pageSize
        );
        
        console.log('通知列表数据:', result);
        
        if (result.success) {
            // 更新状态
            const notifications = result.data || [];
            NotificationListState.notifications = notifications;
            
            // 渲染通知列表
            renderNotifications(notifications);
        } else {
            console.error('获取通知列表失败:', result.message);
            showErrorMessage('获取通知列表失败');
        }
    } catch (error) {
        console.error('加载通知列表错误:', error);
        showErrorMessage('加载通知列表失败');
    } finally {
        NotificationListState.isLoading = false;
    }
}

/**
 * 渲染通知列表
 * @param {Array} notifications - 通知数据
 */
function renderNotifications(notifications) {
    const listContainer = document.getElementById('notificationList');
    if (!listContainer) return;
    
    // 清空现有内容
    listContainer.innerHTML = '';
    
    // 如果没有数据，显示无数据提示
    if (!notifications || notifications.length === 0) {
        listContainer.innerHTML = '<div class="no-data">暂无通知</div>';
        return;
    }
    
    // 渲染通知项
    notifications.forEach(notification => {
        // 创建通知项元素
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        
        // 提取通知信息
        const title = notification.Title || '系统通知';
        const content = notification.Content || '';
        const time = formatNotificationTime(notification.CreateTime || notification.PushTime);
        const isRead = notification.Status !== '0'; // Status=0表示未读
        const msgId = notification.MsgID;
        
        // 设置通知项内容
        notificationItem.innerHTML = `
            <div class="notification-icon">📢</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-time">${time}</div>
                <div class="notification-preview">${content}</div>
            </div>
            ${!isRead ? '<div class="unread-dot"></div>' : ''}
        `;
        
        // 添加点击事件，跳转到详情页
        notificationItem.addEventListener('click', () => {
            navigateToDetail(msgId);
        });
        
        // 添加到列表容器
        listContainer.appendChild(notificationItem);
    });
}

/**
 * 跳转到通知详情页
 * @param {string} msgId - 通知ID
 */
function navigateToDetail(msgId) {
    if (!msgId) return;
    window.location.href = `notification-detail.html?id=${msgId}`;
}

/**
 * 格式化通知时间
 * @param {string} timeString - 时间字符串
 * @returns {string} 格式化后的时间
 */
function formatNotificationTime(timeString) {
    if (!timeString) return '--';
    
    // 如果时间格式是完整日期时间，则只显示月日和时间
    if (timeString.includes('-')) {
        const dateParts = timeString.split(' ');
        if (dateParts.length > 1) {
            const dateOnly = dateParts[0].split('-');
            if (dateOnly.length > 2) {
                return `${dateOnly[1]}-${dateOnly[2]} ${dateParts[1].substring(0, 5)}`;
            }
        }
    }
    
    return timeString;
}

/**
 * 显示错误消息
 * @param {string} message - 错误信息
 */
function showErrorMessage(message) {
    const listContainer = document.getElementById('notificationList');
    if (!listContainer) return;
    
    // 如果是首次加载失败，显示错误提示
    if (NotificationListState.currentPage === 1) {
        listContainer.innerHTML = `<div class="error">${message}</div>`;
    } else {
        // 否则使用Toast提示
        API.showToast(message, 'error');
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initPage); 