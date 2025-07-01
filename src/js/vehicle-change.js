/**
 * 交通工具变更申请页面 JavaScript
 * 处理交通工具变更申请表单的交互逻辑和数据提交
 */

// 存储应用数据
let applicationData = [];

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('交通工具变更申请页面已加载');
    initializePage();
    
    // 检查URL中是否包含刷新参数或者localStorage中是否有刷新标记
    const urlParams = new URLSearchParams(window.location.search);
    const needRefresh = urlParams.has('refresh') || localStorage.getItem('vehicle_change_list_need_refresh') === 'true';
    
    // 清除localStorage中的刷新标记
    if (localStorage.getItem('vehicle_change_list_need_refresh') === 'true') {
        console.log('检测到强制刷新标记，清除标记并刷新列表');
        localStorage.removeItem('vehicle_change_list_need_refresh');
    }
    
    // 强制刷新列表
    loadApplicationList(needRefresh);
});

/**
 * 初始化页面
 */
function initializePage() {
    // 页面初始化完成
    console.log('交通工具变更申请页面初始化完成');
}

/**
 * 显示新增表单弹窗
 */
function createNewApplication() {
    // 先调用接口生成单据信息，然后跳转到表单页面
    generateNewTravelDocument()
        .then(documentInfo => {
            // 将生成的单据信息存储到sessionStorage，供表单页面使用
            sessionStorage.setItem('newTravelDocument', JSON.stringify(documentInfo));
            // 跳转到交通工具变更申请表单页面
            window.location.href = 'vehicle-change-form.html';
        })
        .catch(error => {
            console.error('生成单据信息失败:', error);
            // 即使生成失败，也允许跳转到表单页面
            window.location.href = 'vehicle-change-form.html';
        });
}

/**
 * 生成新的交通工具变更单据信息
 * @returns {Promise} 返回包含单据ID、编号和创建时间的Promise
 */
function generateNewTravelDocument() {
    return new Promise((resolve, reject) => {
        // 调用后端接口生成单据信息
        const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/generateDocument';
        
        const requestData = {
            modelType: 'oa_businesstravel_change_vehicle',
            userID: getCurrentUser().userID || 'admin'
        };
        
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-requested-with': 'XMLHttpRequest'
            },
            body: new URLSearchParams(requestData).toString()
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.code === '200' && result.data) {
                resolve({
                    travelChangeVehicleID: result.data.travelChangeVehicleID,
                    travelChangeVehicleNo: result.data.travelChangeVehicleNo,
                    createTime: result.data.createTime
                });
            } else {
                // 如果接口不支持，则前端生成
                const now = new Date();
                const timestamp = Date.now();
                const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const random4 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
                
                resolve({
                    travelChangeVehicleID: `V${timestamp}${random}`,
                    travelChangeVehicleNo: `VC${year}${month}${day}${random4}`,
                    createTime: formatDateTime(now)
                });
            }
        })
        .catch(error => {
            console.error('调用生成单据接口失败:', error);
            // 接口调用失败时，前端生成
            const now = new Date();
            const timestamp = Date.now();
            const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const random4 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
            
            resolve({
                travelChangeVehicleID: `V${timestamp}${random}`,
                travelChangeVehicleNo: `VC${year}${month}${day}${random4}`,
                createTime: formatDateTime(now)
            });
        });
    });
}

/**
 * 加载申请列表
 * @param {boolean} forceRefresh - 是否强制刷新，不使用缓存
 */
function loadApplicationList(forceRefresh = false) {
    const listContainer = document.getElementById('applicationList');
    if (!listContainer) return;
    
    // 显示加载状态
    showLoading();
    
    // 如果强制刷新，添加日志
    if (forceRefresh) {
        console.log('强制刷新列表，不使用缓存');
    }
    
    // 获取当前用户ID
    const userID = getCurrentUser().userID || 'admin';
    
    // 调用API获取交通工具变更申请数据 - 使用GET方法，添加必需的请求头
    const modelType = 'oa_businesstravel_change_vehicle';
    console.log('交通工具变更 - 查询modelType:', modelType);
    
    // 构建API URL
    let apiUrl = `http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/getList&userID=${userID}&modelType=${modelType}`;
    
    // 如果需要强制刷新，添加时间戳参数避免缓存
    if (forceRefresh) {
        apiUrl += `&_t=${new Date().getTime()}`;
    }
    
    console.log('交通工具变更 - 调用API:', apiUrl);
    
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'x-requested-with': 'XMLHttpRequest'  // 只保留必需的请求头，移除Content-Type和Cache-Control避免CORS问题
        }
    })
    .then(response => {
        console.log('交通工具变更 - API响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('交通工具变更 - API返回数据:', result);
        hideLoading();
        
        if (result.code === '200' && result.data) {
            // 保存数据到全局变量，供viewApplication函数使用
            window.currentApplicationData = result.data;
            renderApplicationList(result.data);
        } else {
            console.error('获取交通工具变更申请列表失败:', result.message || '未知错误');
            showEmptyState(listContainer);
        }
    })
    .catch(error => {
        hideLoading();
        console.error('获取交通工具变更申请列表出错:', error);
        showMessage('获取数据失败，请检查网络连接', 'error');
        showErrorState(listContainer);
    });
}

/**
 * 显示空状态
 */
function showEmptyState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-text">暂无交通工具变更申请记录</div>
            <div class="empty-desc">点击上方"新增"按钮创建第一条记录</div>
        </div>
    `;
}

/**
 * 显示错误状态
 */
function showErrorState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <div class="empty-text">数据加载失败</div>
            <div class="empty-desc">请检查网络连接后重试</div>
        </div>
    `;
}

/**
 * 渲染申请列表
 */
function renderApplicationList(data) {
    const listContainer = document.getElementById('applicationList');
    if (!listContainer) return;
    
    // 直接从localStorage获取原始用户数据
    let userDisplayName = '当前用户';
    let userDeptName = '未知部门';
    
    try {
        // 从localStorage获取原始用户数据
        const rawUserData = localStorage.getItem('currentUser');
        if (rawUserData) {
            const userData = JSON.parse(rawUserData);
            console.log('localStorage中的原始用户数据:', userData);
            
            // 直接获取DISPLAY_NAME字段，不做任何转换
            userDisplayName = userData.DISPLAY_NAME || '当前用户';
            userDeptName = userData.dept_name || '未知部门';
            
            console.log('提取的DISPLAY_NAME:', userDisplayName);
            console.log('提取的dept_name:', userDeptName);
        }
    } catch (error) {
        console.error('解析用户数据出错:', error);
    }
    
    // 从API返回的数据中提取申请列表
    // 修改这里，确保能正确获取列表数据，无论后端返回什么字段名
    let applications = [];
    if (data.tralChangeList) {
        // 使用API实际返回的字段名
        applications = data.tralChangeList;
    } else if (data.travelChangeVehicleList) {
        applications = data.travelChangeVehicleList;
    } else if (data.businesstravelData && data.businesstravelData.list) {
        // 从通用格式中提取
        applications = data.businesstravelData.list;
    } else if (Array.isArray(data.list)) {
        // 直接使用list字段
        applications = data.list;
    } else if (data.data && Array.isArray(data.data.list)) {
        // 嵌套的data.list结构
        applications = data.data.list;
    } else if (Array.isArray(data)) {
        // 直接是数组的情况
        applications = data;
    }
    
    console.log('处理后的申请列表数据:', applications);
    
    if (!applications || applications.length === 0) {
        showEmptyState(listContainer);
        return;
    }
    
    const listHTML = applications.map(app => {
        // 根据接口文档修正字段名映射
        // 审核状态字段使用AuditStauts进行前端展示（不再使用Status字段）
        const statusText = getStatusText(app.AuditStauts || app.Status || app.status || '0');
        const statusClass = getStatusClass(app.AuditStauts || app.Status || app.status || '0');
        
        // 提取应用程序ID，使用第一个找到的值
        const appId = app.TravelChangeVehicleID || app.travelChangeVehicleID || app.TravelID || app.travelID || app.id || app.ID || '';
        
        // 提取申请编号
        const appNo = app.TravelChangeVehicleNo || app.travelChangeVehicleNo || app.TravelNo || app.travelNo || app.no || app.NO || '交通工具变更申请';
        
        // 使用当前用户的显示名称
        const creator = userDisplayName;
        
        // 提取创建时间
        const createTime = app.CreateTime || app.createTime || app.createDate || app.CreateDate || '';
        
        // 提取变更原因
        const changeCause = app.ChangeCause || app.changeCause || app.cause || app.Cause || app.TravelCause || '-';
        
        return `
            <div class="application-item enhanced-card" onclick="viewApplication('${appId}')">
                <!-- 卡片装饰元素 -->
                <div class="card-decoration">
                    <div class="decoration-line ${statusClass}"></div>
                </div>
                
                <div class="item-content">
                    <!-- 卡片头部 -->
                    <div class="item-header">
                        <div class="title-section">
                            <div class="item-title">
                                <i class="icon-plane"></i>
                                ${appNo}
                            </div>
                            <div class="item-subtitle">
                                <i class="icon-user"></i>
                                <span>${creator}</span>
                                <span class="separator">•</span>
                                <i class="icon-calendar"></i>
                                <span>${formatDateTime(createTime)}</span>
                            </div>
                        </div>
                        <div class="status-container">
                            <div class="status-badge ${statusClass}">
                                <div class="status-icon"></div>
                                <span>${statusText}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 详情信息 -->
                    <div class="item-details">
                        <div class="detail-row">
                            <div class="detail-item">
                                <i class="icon-location"></i>
                                <span class="detail-label">变更原因</span>
                                <span class="detail-value">${changeCause}</span>
                            </div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-item">
                                <i class="icon-org"></i>
                                <span class="detail-label">组织机构</span>
                                <span class="detail-value">${userDeptName}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 卡片操作 -->
                    <div class="item-actions">
                        ${(app.AuditStauts !== '0' && app.AuditStauts !== '-1') ? `
                        <button class="action-btn view-btn" onclick="event.stopPropagation(); viewApplication('${appId}')" title="查看详情">
                            <i class="icon-eye"></i>
                            <span>查看</span>
                        </button>
                        ` : ''}
                        ${(app.AuditStauts === '0' || app.AuditStauts === '-1') ? `
                            <button class="action-btn edit-btn" onclick="event.stopPropagation(); viewApplication('${appId}', 'edit')" title="编辑申请">
                                <i class="icon-edit"></i>
                                <span>编辑</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    listContainer.innerHTML = listHTML;
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
 * 获取状态样式类
 * @param {string} status - 状态代码
 * @returns {string} 状态样式类
 */
function getStatusClass(status) {
    const statusClassMap = {
        '-1': 'status-returned',
        '0': 'status-draft',
        '1': 'status-submitted',
        '2': 'status-pending',
        '3': 'status-approved',
        '4': 'status-rejected',
        '5': 'status-canceled'
    };
    
    return statusClassMap[status] || 'status-draft';
}

/**
 * 查看申请详情
 * @param {string} id - 申请ID
 * @param {string} mode - 查看模式，默认为view
 */
function viewApplication(id, mode = 'view') {
    console.log('查看交通工具变更申请详情，ID:', id);
    
    // 从当前列表数据中查找对应的申请详情
    const currentData = window.currentApplicationData || {};
    
    // 根据不同数据结构查找申请记录
    let application = null;
    
    // 尝试从各种可能的数据结构中获取申请记录
    if (currentData.tralChangeList) {
        // 从API实际返回的字段中查找
        application = currentData.tralChangeList.find(item => 
            item.TravelChangeVehicleID === id || item.TravelID === id || item.travelChangeVehicleID === id || item.id === id || item.ID === id);
    } else if (currentData.travelChangeVehicleList) {
        application = currentData.travelChangeVehicleList.find(item => 
            item.TravelChangeVehicleID === id || item.travelChangeVehicleID === id || item.id === id || item.ID === id);
    } else if (currentData.list) {
        application = currentData.list.find(item => 
            item.TravelChangeVehicleID === id || item.travelChangeVehicleID === id || item.id === id || item.ID === id);
    } else if (currentData.businesstravelData && currentData.businesstravelData.list) {
        application = currentData.businesstravelData.list.find(item => 
            item.TravelChangeVehicleID === id || item.travelChangeVehicleID === id || item.id === id || item.ID === id);
    } else if (Array.isArray(currentData)) {
        application = currentData.find(item => 
            item.TravelChangeVehicleID === id || item.travelChangeVehicleID === id || item.id === id || item.ID === id);
    } else if (currentData.data && Array.isArray(currentData.data.list)) {
        application = currentData.data.list.find(item => 
            item.TravelChangeVehicleID === id || item.travelChangeVehicleID === id || item.id === id || item.ID === id);
    }
    
    if (application) {
        // 将申请详情数据存储到sessionStorage
        console.log('存储到sessionStorage的交通工具变更申请详情数据:', application);
        sessionStorage.setItem('vehicleChangeDetail', JSON.stringify(application));
        
        // 跳转到详情页面
        window.location.href = `vehicle-change-form.html?id=${id}&mode=${mode}`;
    } else {
        showMessage('未找到对应的申请记录', 'error');
    }
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
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
    if (!dateTimeStr) return '-';
    
    try {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return dateTimeStr;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
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
 * @param {string} type - 消息类型（success、error、warning、info）
 */
function showMessage(message, type = 'info') {
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

/**
 * 导航回出差业务页面
 */
function navigateToBusinessTravel() {
    window.location.href = 'business-travel.html';
}