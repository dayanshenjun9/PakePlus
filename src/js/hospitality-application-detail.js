/**
 * 招待申请详情页面 JavaScript
 * 处理招待申请详情页面的交互逻辑和数据展示
 */

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('招待申请详情页面已加载');
    initializePage();
});

/**
 * 初始化页面
 */
function initializePage() {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        showMessage('未找到招待申请ID，无法加载详情', 'error');
        return;
    }
    
    // 加载招待申请详情
    loadHospitalityApplicationDetail(id);
}

/**
 * 加载招待申请详情
 * @param {string} id - 招待申请ID
 */
function loadHospitalityApplicationDetail(id) {
    showLoading();
    
    // 调用API获取招待申请详情
    const apiUrl = `http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/getDetail&id=${id}&modelType=oa_hospitality_application_main`;
    
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'x-requested-with': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        hideLoading();
        
        if (result.code === '200' && result.data) {
            renderHospitalityApplicationDetail(result.data);
        } else {
            console.error('获取招待申请详情失败:', result.message || '未知错误');
            showMessage('获取招待申请详情失败：' + (result.message || '未知错误'), 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('获取招待申请详情出错:', error);
        showMessage('获取数据失败，请检查网络连接', 'error');
    });
}

/**
 * 渲染招待申请详情
 * @param {Object} data - 招待申请详情数据
 */
function renderHospitalityApplicationDetail(data) {
    console.log('渲染招待申请详情:', data);
    
    // 提取详情数据
    const detail = data.detail || data;
    
    // 更新状态指示器
    updateStatusIndicator(detail.AuditStauts);
    
    // 更新基础信息
    document.getElementById('applicationNo').textContent = detail.ApplicationNo || '-';
    document.getElementById('handlePerson').textContent = detail.HandlePerson || detail.Creator || '-';
    document.getElementById('createTime').textContent = formatDateTime(detail.CreateTime) || '-';
    document.getElementById('deptName').textContent = detail.DEPT_NAME || detail.DeptName || '-';
    
    // 更新招待信息
    document.getElementById('hospitalityType').textContent = getHospitalityTypeText(detail.HospitalityType) || '-';
    document.getElementById('hospitalityDate').textContent = formatDate(detail.HospitalityDate) || '-';
    document.getElementById('customerName').textContent = detail.CustomerName || '-';
    document.getElementById('totalNum').textContent = detail.TotalNum || '-';
    document.getElementById('dutyPerson').textContent = detail.DutyPerson || '-';
    document.getElementById('hospitalityPlace').textContent = detail.HospitalityPlace || '-';
    document.getElementById('entourage').textContent = detail.Entourage || '-';
    document.getElementById('costBudget').textContent = detail.CostBudget ? `¥${detail.CostBudget}` : '-';
    document.getElementById('hospitalityCause').textContent = detail.HospitalityCause || '-';
    
    // 更新审批信息
    document.getElementById('auditStatus').textContent = getStatusText(detail.AuditStauts) || '-';
    
    // 更新其他信息
    document.getElementById('remark').textContent = detail.Remark || '-';
}

/**
 * 获取招待类型文本
 * @param {string} type - 招待类型代码
 * @returns {string} 招待类型文本
 */
function getHospitalityTypeText(type) {
    const typeMap = {
        '1': '商务接待',
        '2': '公务接待'
    };
    
    return typeMap[type] || type || '-';
}

/**
 * 更新状态指示器
 * @param {string} status - 状态代码
 */
function updateStatusIndicator(status) {
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    
    if (!statusIcon || !statusText) return;
    
    const statusMap = {
        '-1': { text: '返回修改', class: 'status-returned' },
        '0': { text: '编制', class: 'status-draft' },
        '1': { text: '提交审核', class: 'status-submitted' },
        '2': { text: '审核中...', class: 'status-pending' },
        '3': { text: '审核通过', class: 'status-approved' },
        '4': { text: '驳回', class: 'status-rejected' },
        '5': { text: '已撤销', class: 'status-canceled' }
    };
    
    const statusInfo = statusMap[status] || { text: '未知状态', class: 'status-unknown' };
    
    statusIcon.className = 'status-icon ' + statusInfo.class;
    statusText.textContent = statusInfo.text;
    statusText.className = 'status-text ' + statusInfo.class;
}

/**
 * 打印招待申请
 */
function printHospitalityApplication() {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        showMessage('未找到招待申请ID，无法打印', 'error');
        return;
    }
    
    // 跳转到打印页面
    window.location.href = `hospitality-application-print.html?id=${id}`;
}

/**
 * 获取状态文本
 * @param {string} status - 状态代码
 * @returns {string} 状态文本
 */
function getStatusText(status) {
    const statusMap = {
        '-1': '返回修改',
        '0': '编制',
        '1': '提交审核',
        '2': '审核中...',
        '3': '审核通过',
        '4': '驳回',
        '5': '已撤销'
    };
    
    return statusMap[status] || '未知状态';
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('日期格式化错误:', error);
        return dateString;
    }
}

/**
 * 格式化日期时间
 * @param {string} dateTimeStr - 日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return dateTimeStr;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error('日期时间格式化错误:', error);
        return dateTimeStr;
    }
}

/**
 * 显示加载状态
 */
function showLoading() {
    // 添加加载遮罩
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    // 移除加载遮罩
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success/error/warning/info)
 */
function showMessage(message, type = 'info') {
    // 移除可能存在的旧消息
    const oldMessage = document.querySelector('.message-toast');
    if (oldMessage) {
        oldMessage.remove();
    }
    
    // 创建新消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message-toast message-${type}`;
    messageElement.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageElement);
    
    // 淡入效果
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);
    
    // 自动移除
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            messageElement.remove();
        }, 300); // 等待淡出动画完成
    }, 3000);
} 