/**
 * 通知详情页面逻辑
 */

// 页面状态
const NotificationDetailState = {
    msgId: null,
    notificationData: null,
    isLoading: false
};

/**
 * 初始化页面
 */
function initPage() {
    // 从URL获取消息ID
    const urlParams = new URLSearchParams(window.location.search);
    const msgId = urlParams.get('id');
    
    if (!msgId) {
        showError('未指定通知ID');
        return;
    }
    
    NotificationDetailState.msgId = msgId;
    
    // 加载通知详情
    loadNotificationDetail(msgId);
}

/**
 * 加载通知详情
 * @param {string} msgId - 通知ID
 */
async function loadNotificationDetail(msgId) {
    if (NotificationDetailState.isLoading) return;
    
    NotificationDetailState.isLoading = true;
    
    try {
        // 获取用户ID
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            window.location.href = 'login.html';
            return;
        }
        
        // 先尝试从本地存储获取通知列表，查找对应的通知
        let notifications = [];
        const notificationsJson = localStorage.getItem('notifications');
        if (notificationsJson) {
            try {
                notifications = JSON.parse(notificationsJson);
            } catch (e) {
                console.error('解析本地通知数据失败:', e);
            }
        }
        
        let notificationDetail = notifications.find(item => item.MsgID === msgId);
        
        // 如果本地没有找到，调用API获取通知列表并找到对应的通知
        if (!notificationDetail) {
            console.log('本地未找到通知，尝试从API获取');
            
            // 调用API获取通知列表
            const result = await API.getMsgList(userId, 1, 100);
            
            if (result.success && result.data && result.data.length > 0) {
                // 存储到本地
                localStorage.setItem('notifications', JSON.stringify(result.data));
                
                // 查找指定ID的通知
                notificationDetail = result.data.find(item => item.MsgID === msgId);
            }
        }
        
        if (notificationDetail) {
            NotificationDetailState.notificationData = notificationDetail;
            
            // 渲染通知详情
            renderNotificationDetail(notificationDetail);
            
            // 标记为已读
            markAsRead(msgId, userId);
        } else {
            showError('未找到通知详情');
        }
    } catch (error) {
        console.error('加载通知详情错误:', error);
        showError('加载通知详情失败');
    } finally {
        NotificationDetailState.isLoading = false;
    }
}

/**
 * 渲染通知详情
 * @param {object} notification - 通知数据
 */
function renderNotificationDetail(notification) {
    const detailContainer = document.getElementById('notificationDetail');
    if (!detailContainer) return;
    
    // 提取通知信息
    const title = notification.Title || '系统通知';
    const content = notification.Content || '无内容';
    const time = notification.CreateTime || notification.PushTime || '--';
    const msgType = getMsgTypeName(notification.MsgType) || '系统';
    const source = getSourceName(notification.Source) || '--';
    
    // 渲染通知详情
    detailContainer.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-meta">
            <span class="notification-type">${msgType}</span>
            <span class="notification-time">${time}</span>
        </div>
        <div class="notification-content">${formatNotificationContent(content)}</div>
    `;
}

/**
 * 将通知标记为已读
 * @param {string} msgId - 通知ID
 * @param {string} userId - 用户ID
 */
async function markAsRead(msgId, userId) {
    try {
        // 这里应该调用API将通知标记为已读
        // 由于没有这个API，我们只在本地进行处理
        
        // 更新本地存储的通知状态
        const notificationsJson = localStorage.getItem('notifications');
        if (notificationsJson) {
            try {
                const notifications = JSON.parse(notificationsJson);
                const index = notifications.findIndex(item => item.MsgID === msgId);
                
                if (index !== -1) {
                    notifications[index].Status = '1'; // 标记为已读
                    localStorage.setItem('notifications', JSON.stringify(notifications));
                }
            } catch (e) {
                console.error('更新本地通知状态失败:', e);
            }
        }
    } catch (error) {
        console.error('标记通知已读失败:', error);
    }
}

/**
 * 获取消息类型名称
 * @param {string} typeCode - 类型代码
 * @returns {string} 类型名称
 */
function getMsgTypeName(typeCode) {
    const types = {
        '1': '系统消息',
        '2': '审批消息',
        '3': '任务消息'
    };
    
    return types[typeCode] || '系统消息';
}

/**
 * 获取消息来源名称
 * @param {string} sourceCode - 来源代码
 * @returns {string} 来源名称
 */
function getSourceName(sourceCode) {
    const sources = {
        '1': '系统',
        '2': '审批',
        '3': '任务'
    };
    
    return sources[sourceCode] || '系统';
}

/**
 * 格式化通知内容
 * @param {string} content - 原始内容
 * @returns {string} 格式化后的内容
 */
function formatNotificationContent(content) {
    if (!content) return '无内容';
    
    // 将换行符转换为HTML换行
    return content.replace(/\n/g, '<br>');
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function showError(message) {
    const detailContainer = document.getElementById('notificationDetail');
    if (!detailContainer) return;
    
    detailContainer.innerHTML = `<div class="error">${message}</div>`;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initPage); 