/**
 * 出差申请页面 JavaScript
 * 处理出差申请表单的交互逻辑和数据提交
 */

// 存储应用数据
let applicationData = [];

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('出差申请页面已加载');
    initializePage();
    
    // 检查URL中是否包含刷新参数或者localStorage中是否有刷新标记
    const urlParams = new URLSearchParams(window.location.search);
    const needRefresh = urlParams.has('refresh') || localStorage.getItem('travel_list_need_refresh') === 'true';
    
    // 清除localStorage中的刷新标记
    if (localStorage.getItem('travel_list_need_refresh') === 'true') {
        console.log('检测到强制刷新标记，清除标记并刷新列表');
        localStorage.removeItem('travel_list_need_refresh');
    }
    
    // 加载申请列表，如果需要强制刷新则传入参数
    loadApplicationList(needRefresh);
});

/**
 * 初始化页面
 */
function initializePage() {
    // 页面初始化完成
    console.log('出差申请页面初始化完成');
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
            // 跳转到出差申请表单页面
            window.location.href = 'travel-application-form.html';
        })
        .catch(error => {
            console.error('生成单据信息失败:', error);
            // 即使生成失败，也允许跳转到表单页面
            window.location.href = 'travel-application-form.html';
        });
}

/**
 * 生成新的出差单据信息
 * @returns {Promise} 返回包含单据ID、编号和创建时间的Promise
 */
function generateNewTravelDocument() {
    return new Promise((resolve, reject) => {
        // 调用后端接口生成单据信息
        const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/generateDocument';
        
        const requestData = {
            modelType: 'oa_businesstravel_main',
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
                    travelID: result.data.travelID,
                    travelNo: result.data.travelNo,
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
                    travelID: `T${timestamp}${random}`,
                    travelNo: `CC${year}${month}${day}${random4}`,
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
                travelID: `T${timestamp}${random}`,
                travelNo: `CC${year}${month}${day}${random4}`,
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
    
    // 调用API获取出差申请数据 - 使用GET方法，添加必需的请求头
    const modelType = 'oa_businesstravel_main';
    console.log('出差申请 - 查询modelType:', modelType);
    
    // 构建API URL
    let apiUrl = `http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/getList&userID=${userID}&modelType=${modelType}`;
    
    // 如果需要强制刷新，添加时间戳参数避免缓存
    if (forceRefresh) {
        apiUrl += `&_t=${new Date().getTime()}`;
    }
    
    console.log('出差申请 - 调用API:', apiUrl);
    
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'x-requested-with': 'XMLHttpRequest'  // 只保留必需的请求头，移除Content-Type避免CORS问题
        }
    })
    .then(response => {
        console.log('API响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('API返回数据:', result);
        hideLoading();
        
        if (result.code === '200' && result.data) {
            // 保存数据到全局变量，供viewApplication函数使用
            window.currentApplicationData = result.data;
            renderApplicationList(result.data);
        } else {
            console.error('获取出差申请列表失败:', result.message || '未知错误');
            showEmptyState(listContainer);
        }
    })
    .catch(error => {
        hideLoading();
        console.error('获取出差申请列表出错:', error);
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
            <div class="empty-text">暂无出差申请记录</div>
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
    
    // 从API返回的数据中提取申请列表
    const applications = data.tralMainList || [];
    
    if (!applications || applications.length === 0) {
        showEmptyState(listContainer);
        return;
    }
    
    const listHTML = applications.map(app => {
        // 根据接口文档修正字段名映射
        // 审核状态字段使用AuditStauts进行前端展示（不再使用Status字段）
        const statusText = getStatusText(app.AuditStauts);
        const statusClass = getStatusClass(app.AuditStauts);
        
        return `
            <div class="application-item enhanced-card" onclick="viewApplication('${app.TravelID}')">
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
                                ${app.TravelNo || '出差申请'}
                            </div>
                            <div class="item-subtitle">
                                <i class="icon-user"></i>
                                <span>${app.RequestPersonName || '-'}</span>
                                <span class="separator">•</span>
                                <i class="icon-calendar"></i>
                                <span>${formatDateTime(app.CreateTime)}</span>
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
                                <span class="detail-label">目的地</span>
                                <span class="detail-value">${app.TravelPlace || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="icon-org"></i>
                                <span class="detail-label">组织机构</span>
                                <span class="detail-value">${app.DEPT_NAME || app.deptName || app.DeptName || app.OrgCode || '-'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 卡片操作 -->
                    <div class="item-actions">
                        ${(app.AuditStauts !== '0' && app.AuditStauts !== '-1') ? `
                        <button class="action-btn view-btn" onclick="event.stopPropagation(); viewApplication('${app.TravelID}')" title="查看详情">
                            <i class="icon-eye"></i>
                            <span>查看</span>
                        </button>
                        ` : ''}
                        ${(app.AuditStauts === '0' || app.AuditStauts === '-1') ? `
                            <button class="action-btn edit-btn" onclick="event.stopPropagation(); editApplication('${app.TravelID}')" title="编辑申请">
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
 */
function getStatusClass(status) {
    const classMap = {
        '-1': 'returned',
        '0': 'draft',
        '1': 'submitted',
        '2': 'reviewing',
        '3': 'approved', 
        '4': 'rejected',
        '5': 'canceled'
    };
    return classMap[status] || 'draft';
}

/**
 * 格式化日期范围
 */
function formatDateRange(startDate, endDate) {
    if (!startDate && !endDate) return '-';
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        } catch (e) {
            return dateStr;
        }
    };
    
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (start && end) {
        return `${start} 至 ${end}`;
    } else if (start) {
        return start;
    } else if (end) {
        return end;
    } else {
        return '-';
    }
}

/**
 * 查看申请详情
 */
function viewApplication(id) {
    console.log('查看申请详情，ID:', id);
    
    // 从当前列表数据中查找对应的申请详情
    const currentData = window.currentApplicationData || {};
    
    // 根据不同数据结构查找申请记录
    let application = null;
    
    // 尝试从各种可能的数据结构中获取申请记录
    if (currentData.tralMainList) {
        // 从API实际返回的字段中查找
        application = currentData.tralMainList.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (currentData.travelList) {
        application = currentData.travelList.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (currentData.list) {
        application = currentData.list.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (currentData.businesstravelData && currentData.businesstravelData.list) {
        application = currentData.businesstravelData.list.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (Array.isArray(currentData)) {
        application = currentData.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (currentData.data && Array.isArray(currentData.data.list)) {
        application = currentData.data.list.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    }
    
    if (application) {
        // 确保行程计划起止日期字段存在
        if (!application.TripPlanDateFrom && application.PlanStartDate) {
            application.TripPlanDateFrom = application.PlanStartDate;
            console.log('从PlanStartDate复制到TripPlanDateFrom:', application.TripPlanDateFrom);
        }
        
        if (!application.TripPlanDateTo && application.PlanEndDate) {
            application.TripPlanDateTo = application.PlanEndDate;
            console.log('从PlanEndDate复制到TripPlanDateTo:', application.TripPlanDateTo);
        }
        
        // 将申请详情数据存储到sessionStorage
        console.log('存储到sessionStorage的申请详情数据:', application);
        sessionStorage.setItem('travelApplicationDetail', JSON.stringify(application));
        
        // 跳转到详情页面
        window.location.href = `travel-application-form.html?id=${id}&mode=view`;
    } else {
        showMessage('未找到对应的申请记录', 'error');
    }
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    if (!dateString) return '未知';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toISOString().split('T')[0];
    } catch (e) {
        return dateString;
    }
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateTimeStr;
    }
}

/**
 * 编辑申请
 */
function editApplication(id) {
    console.log('编辑申请，ID:', id);
    
    // 从当前列表数据中查找对应的申请详情
    const currentData = window.currentApplicationData || {};
    
    // 根据不同数据结构查找申请记录
    let application = null;
    
    // 尝试从各种可能的数据结构中获取申请记录
    if (currentData.tralMainList) {
        // 从API实际返回的字段中查找
        application = currentData.tralMainList.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (currentData.travelList) {
        application = currentData.travelList.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (currentData.list) {
        application = currentData.list.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (currentData.businesstravelData && currentData.businesstravelData.list) {
        application = currentData.businesstravelData.list.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (Array.isArray(currentData)) {
        application = currentData.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    } else if (currentData.data && Array.isArray(currentData.data.list)) {
        application = currentData.data.list.find(item => 
            item.TravelID === id || item.travelID === id || item.id === id || item.ID === id);
    }
    
    if (application) {
        // 确保行程计划起止日期字段存在
        if (!application.TripPlanDateFrom && application.PlanStartDate) {
            application.TripPlanDateFrom = application.PlanStartDate;
            console.log('从PlanStartDate复制到TripPlanDateFrom:', application.TripPlanDateFrom);
        }
        
        if (!application.TripPlanDateTo && application.PlanEndDate) {
            application.TripPlanDateTo = application.PlanEndDate;
            console.log('从PlanEndDate复制到TripPlanDateTo:', application.TripPlanDateTo);
        }
        
        // 将申请详情数据存储到sessionStorage
        console.log('存储到sessionStorage的申请详情数据:', application);
        sessionStorage.setItem('travelApplicationDetail', JSON.stringify(application));
        
        // 跳转到详情页面，使用edit模式
        window.location.href = `travel-application-form.html?id=${id}&mode=edit`;
    } else {
        showMessage('未找到对应的申请记录', 'error');
    }
}

/**
 * 显示更多操作菜单
 */
function showMoreActions(id) {
    // 创建操作菜单
    const menuHTML = `
        <div class="action-menu" id="actionMenu">
            <div class="menu-overlay" onclick="hideMoreActions()"></div>
            <div class="menu-content">
                <div class="menu-header">
                    <div class="menu-title">更多操作</div>
                    <button class="menu-close" onclick="hideMoreActions()">
                        <i class="icon-close"></i>
                    </button>
                </div>
                <div class="menu-items">
                    <button class="menu-item" onclick="viewApplication('${id}'); hideMoreActions();">
                        <i class="icon-eye"></i>
                        <span>查看详情</span>
                    </button>
                    <button class="menu-item" onclick="editApplication('${id}'); hideMoreActions();">
                        <i class="icon-edit"></i>
                        <span>编辑申请</span>
                    </button>
                    <button class="menu-item" onclick="copyApplication('${id}'); hideMoreActions();">
                        <i class="icon-copy"></i>
                        <span>复制申请</span>
                    </button>
                    <button class="menu-item" onclick="deleteApplication('${id}'); hideMoreActions();">
                        <i class="icon-delete"></i>
                        <span>删除申请</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的菜单
    const existingMenu = document.getElementById('actionMenu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // 添加新菜单
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    
    // 显示菜单
    setTimeout(() => {
        const menu = document.getElementById('actionMenu');
        if (menu) {
            menu.classList.add('show');
        }
    }, 10);
}

/**
 * 隐藏更多操作菜单
 */
function hideMoreActions() {
    const menu = document.getElementById('actionMenu');
    if (menu) {
        menu.classList.remove('show');
        setTimeout(() => {
            menu.remove();
        }, 300);
    }
}

/**
 * 复制申请
 */
function copyApplication(id) {
    window.location.href = `travel-application-form.html?copyFrom=${id}&mode=copy`;
}

/**
 * 删除申请
 */
function deleteApplication(id) {
    if (confirm('确认删除这条申请记录吗？此操作不可撤销。')) {
        showLoading();
        
        // 调用删除API
        const apiUrl = `http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/delete&travelMainID=${id}`;
        
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            hideLoading();
            if (result.code === '200') {
                showMessage('删除成功', 'success');
                loadApplicationList(); // 重新加载列表
            } else {
                showMessage(result.message || '删除失败', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('删除申请出错:', error);
            showMessage('删除失败，请检查网络连接', 'error');
        });
    }
}

/**
 * 提交申请
 */
function submitApplication() {
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    
    // 显示确认对话框
    showConfirmModal(
        '确认提交',
        '确定要提交这个出差申请吗？提交后将进入审批流程。',
        () => {
            // 调用API提交申请
            showMessage('正在提交申请...', 'info');
            
            const submitFormData = new FormData();
            submitFormData.append('userID', getCurrentUser().userID || 'admin');
            submitFormData.append('modelType', 'oa_businesstravel_main');
            submitFormData.append('PK_Field', 'TravelMainID');
            
            // 添加表单数据
            submitFormData.append('travelNo', formData.applicationNo);
            submitFormData.append('creator', formData.applicant);
            submitFormData.append('deptName', formData.department);
            submitFormData.append('travelPurpose', formData.travelPurpose);
            submitFormData.append('travelPlace', formData.destination);
            submitFormData.append('planStartDate', formData.startDate);
            submitFormData.append('planEndDate', formData.endDate);
            submitFormData.append('estimatedCost', formData.estimatedCost);
            submitFormData.append('remark', formData.remarks);
            submitFormData.append('createTime', new Date().toISOString());
            
            fetch('http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/approval/submitApproval', {
                method: 'POST',
                body: submitFormData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                if (result.code === '200') {
                    // 重新加载列表
                    loadApplicationList();
                    
                    // 关闭弹窗
                    hideAddForm();
                    
                    showMessage('申请提交成功！', 'success');
                } else {
                    showMessage(result.message || '提交失败', 'error');
                }
            })
            .catch(error => {
                console.error('提交申请出错:', error);
                showMessage('提交失败，请检查网络连接', 'error');
            });
        }
    );
}

/**
 * 显示加载状态
 */
function showLoading() {
    const loadingEl = document.createElement('div');
    loadingEl.id = 'loading';
    loadingEl.className = 'loading-overlay';
    loadingEl.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text">加载中...</div>
        </div>
    `;
    document.body.appendChild(loadingEl);
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.remove();
    }
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, info, warning)
 */
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message-toast message-${type}`;
    messageEl.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageEl);
    
    // 显示动画
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
}

/**
 * 验证表单
 */
function validateForm() {
    // 基本验证逻辑
    return true;
}

/**
 * 获取表单数据
 */
function getFormData() {
    return {
        applicationNo: document.getElementById('applicationNo')?.value || '',
        applicant: document.getElementById('applicant')?.value || '',
        department: document.getElementById('department')?.value || '',
        travelPurpose: document.getElementById('travelPurpose')?.value || '',
        destination: document.getElementById('destination')?.value || '',
        startDate: document.getElementById('startDate')?.value || '',
        endDate: document.getElementById('endDate')?.value || '',
        estimatedCost: document.getElementById('estimatedCost')?.value || '',
        remarks: document.getElementById('remarks')?.value || ''
    };
}

/**
 * 设置表单模式
 * @param {string} mode - 'edit' 或 'view'
 */
function setFormMode(mode) {
    const form = document.getElementById('travelApplicationForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea, select');
    const submitBtn = document.querySelector('.btn-primary');
    const saveBtn = document.querySelector('.btn-outline');
    
    if (mode === 'view') {
        // 查看模式：禁用所有输入控件
        inputs.forEach(input => {
            if (input.type !== 'button') {
                input.disabled = true;
                // 为只读字段添加特殊样式
                input.classList.add('readonly-field');
            }
        });
        
        // 隐藏提交和保存按钮
        if (submitBtn) submitBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';
    } else {
        // 编辑模式：启用输入控件（除了本身就是只读的字段）
        inputs.forEach(input => {
            if (!input.hasAttribute('readonly') && input.type !== 'button') {
                input.disabled = false;
                input.classList.remove('readonly-field');
            }
        });
        
        // 显示提交和保存按钮
        if (submitBtn) submitBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.style.display = 'inline-block';
    }
}

/**
 * 显示新增表单弹窗
 */
function showAddForm() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * 隐藏新增表单弹窗
 */
function hideAddForm() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
