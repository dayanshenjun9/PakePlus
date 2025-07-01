/**
 * 出差报告单页面 JavaScript
 * 处理出差报告单表单的交互逻辑和数据提交
 */

// 存储应用数据
let applicationData = [];

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('出差报告单页面已加载');
    initializePage();
    loadApplicationList();
});

/**
 * 初始化页面
 */
function initializePage() {
    // 页面初始化完成
    console.log('出差报告单页面初始化完成');
}

/**
 * 显示新增表单弹窗
 */
function createNewApplication() {
    // 先调用接口生成单据信息，然后跳转到表单页面
    generateNewTravelReportDocument()
        .then(documentInfo => {
            // 将生成的单据信息存储到sessionStorage，供表单页面使用
            sessionStorage.setItem('newTravelReportDocument', JSON.stringify(documentInfo));
            // 跳转到出差报告单表单页面
            window.location.href = 'travel-report-form.html';
        })
        .catch(error => {
            console.error('生成单据信息失败:', error);
            // 即使生成失败，也允许跳转到表单页面
            window.location.href = 'travel-report-form.html';
        });
}

/**
 * 生成新的出差报告单据信息
 * @returns {Promise} 返回包含单据ID、编号和创建时间的Promise
 */
function generateNewTravelReportDocument() {
    return new Promise((resolve, reject) => {
        // 调用后端接口生成单据信息
        const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/generateDocument';
        
        const requestData = {
            modelType: 'oa_businesstravel_report',
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
                    travelReportID: result.data.travelReportID,
                    reportNo: result.data.reportNo,
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
                    travelReportID: `TR${timestamp}${random}`,
                    reportNo: `CCBG${year}${month}${day}${random4}`,
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
                travelReportID: `TR${timestamp}${random}`,
                reportNo: `CCBG${year}${month}${day}${random4}`,
                createTime: formatDateTime(now)
            });
        });
    });
}

/**
 * 加载申请列表
 */
function loadApplicationList() {
    const listContainer = document.getElementById('applicationList');
    if (!listContainer) {
        console.error('找不到申请列表容器');
        return;
    }
    
    // 显示加载状态
    listContainer.innerHTML = '<div class="loading-state">正在加载...</div>';
    
    // 获取当前用户ID
    const currentUser = getCurrentUser();
    const userID = currentUser ? currentUser.userID : 'admin';
    
    // 调用API获取数据
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/getList';
    const requestData = {
        modelType: 'oa_businesstravel_report',
        userID: userID,
        pageSize: 50,
        pageIndex: 1
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
        if (result.code === '200' && result.data && result.data.list) {
            applicationData = result.data.list;
            renderApplicationList(applicationData);
        } else {
            console.warn('获取数据失败或数据格式不正确:', result);
            renderApplicationList([]);
        }
    })
    .catch(error => {
        console.error('加载申请列表失败:', error);
        listContainer.innerHTML = '<div class="error-state">加载失败，请重试</div>';
    });
}

/**
 * 渲染申请列表
 * @param {Array} data 申请数据数组
 */
function renderApplicationList(data) {
    const listContainer = document.getElementById('applicationList');
    if (!listContainer) {
        return;
    }
    
    // 清空现有内容
    listContainer.innerHTML = '';
    
    if (!data || data.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-text">暂无出差报告单</div>
                <div class="empty-desc">点击右上角"新增"按钮创建申请</div>
            </div>
        `;
        return;
    }
    
    // 渲染申请列表
    data.forEach(item => {
        const listItem = createApplicationListItem(item);
        listContainer.appendChild(listItem);
    });
}

/**
 * 创建申请列表项
 * @param {Object} item 申请数据
 * @returns {HTMLElement} 列表项元素
 */
function createApplicationListItem(item) {
    const listItem = document.createElement('div');
    listItem.className = 'application-item';
    
    // 状态显示
    const statusText = getStatusText(item.auditStatus);
    const statusClass = getStatusClass(item.auditStatus);
    
    listItem.innerHTML = `
        <div class="application-header">
            <div class="application-title">${item.reportNo || '未知编号'}</div>
            <div class="application-status ${statusClass}">${statusText}</div>
        </div>
        <div class="application-content">
            <div class="application-info">
                <div class="info-item">
                    <span class="info-label">关联出差单：</span>
                    <span class="info-value">${item.travelApplicationNo || '无'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">报告人：</span>
                    <span class="info-value">${item.reporter || '未知'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">报告日期：</span>
                    <span class="info-value">${formatDate(item.reportDate)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">出差目的：</span>
                    <span class="info-value">${item.purpose || '无'}</span>
                </div>
            </div>
        </div>
        <div class="application-footer">
            <div class="application-time">创建时间：${formatDateTime(item.createTime)}</div>
            <div class="application-actions">
                <button class="btn-view" onclick="viewApplication('${item.travelReportID}')">查看</button>
                ${item.auditStatus === 'draft' || item.auditStatus === 'rejected' ? 
                    `<button class="btn-edit" onclick="editApplication('${item.travelReportID}')">编辑</button>` : ''}
            </div>
        </div>
    `;
    
    return listItem;
}

/**
 * 查看申请详情
 * @param {string} applicationId 申请ID
 */
function viewApplication(applicationId) {
    // 将申请ID存储到sessionStorage，供表单页面使用
    sessionStorage.setItem('viewTravelReportId', applicationId);
    sessionStorage.setItem('travelReportFormMode', 'view');
    // 跳转到出差报告单表单页面
    window.location.href = 'travel-report-form.html';
}

/**
 * 编辑申请
 * @param {string} applicationId 申请ID
 */
function editApplication(applicationId) {
    // 将申请ID存储到sessionStorage，供表单页面使用
    sessionStorage.setItem('editTravelReportId', applicationId);
    sessionStorage.setItem('travelReportFormMode', 'edit');
    // 跳转到出差报告单表单页面
    window.location.href = 'travel-report-form.html';
}

/**
 * 显示空状态
 */
function showEmptyState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-text">暂无出差报告记录</div>
            <div class="empty-desc">点击上方"新增报告"按钮创建第一条记录</div>
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
 * 渲染报告列表
 */
function renderReportList(data) {
    const listContainer = document.getElementById('reportList');
    if (!listContainer) return;
    
    // 从API返回的数据中提取报告列表
    const reports = data.tralReportList || [];
    
    if (!reports || reports.length === 0) {
        showEmptyState(listContainer);
        return;
    }
    
    const listHTML = reports.map(report => {
        const statusClass = getStatusClass(report.auditStauts);
        const statusText = getStatusText(report.auditStauts);
        
        return `
            <div class="report-item" onclick="viewReport('${report.travelReportID}')">
                <div class="item-header">
                    <div class="item-title">${report.reportNo || '出差报告'}</div>
                    <div class="item-status ${statusClass}">${statusText}</div>
                </div>
                <div class="item-content">
                    <div class="item-row">
                        <span class="label">报告人：</span>
                        <span class="value">${report.creator || '-'}</span>
                    </div>
                    <div class="item-row">
                        <span class="label">关联申请：</span>
                        <span class="value">${report.travelMainID || '-'}</span>
                    </div>
                    <div class="item-row">
                        <span class="label">工作报告：</span>
                        <span class="value">${(report.workReport || '').substring(0, 50)}${(report.workReport || '').length > 50 ? '...' : ''}</span>
                    </div>
                    <div class="item-row">
                        <span class="label">创建时间：</span>
                        <span class="value">${formatDateTime(report.createTime)}</span>
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
        '0': '待审批',
        '1': '已通过',
        '2': '已拒绝',
        '3': '草稿'
    };
    return statusMap[status] || '未知状态';
}

/**
 * 获取状态样式类
 */
function getStatusClass(status) {
    const classMap = {
        '0': 'status-pending',
        '1': 'status-approved',
        '2': 'status-rejected',
        '3': 'status-draft'
    };
    return classMap[status] || 'status-unknown';
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
 * 查看报告详情
 */
function viewReport(id) {
    // 调用API获取报告详情
    fetch('http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/getDetail', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            travelReportID: id
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.code === '200' && result.data) {
            const report = result.data;
            
            // 填充表单数据
            document.getElementById('reportNo').value = report.reportNo || '';
            document.getElementById('relatedTravelApplication').value = report.travelMainID || '';
            document.getElementById('reporter').value = report.creator || '';
            document.getElementById('organization').value = report.orgName || '';
            document.getElementById('department').value = report.deptName || '';
            document.getElementById('startDate').value = formatDate(report.startDate) || '';
            document.getElementById('endDate').value = formatDate(report.endDate) || '';
            document.getElementById('workReport').value = report.workReport || '';
            document.getElementById('importantInfo').value = report.importantInfo || '';
            document.getElementById('completionFlag').value = report.completionFlag || '';
            document.getElementById('remarks').value = report.remark || '';
            
            // 设置为查看模式
            setFormMode('view');
            
            // 显示弹窗
            showAddForm();
        } else {
            showMessage('获取报告详情失败', 'error');
        }
    })
    .catch(error => {
        console.error('获取报告详情出错:', error);
        showMessage('获取详情失败，请检查网络连接', 'error');
    });
}

/**
 * 生成报告单号
 */
function generateReportNo() {
    const reportNoInput = document.getElementById('reportNo');
    if (reportNoInput && !reportNoInput.value) {
        // 生成格式：TR + 年月日 + 4位随机数
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        
        const reportNo = `TR${year}${month}${day}${random}`;
        reportNoInput.value = reportNo;
    }
}

/**
 * 绑定关联出差单变化事件
 */
function bindRelatedTravelChange() {
    const relatedTravelSelect = document.getElementById('relatedTravelApplication');
    if (relatedTravelSelect) {
        relatedTravelSelect.addEventListener('change', onRelatedTravelChange);
    }
}

/**
 * 关联出差单变化处理
 */
function onRelatedTravelChange() {
    const selectedValue = document.getElementById('relatedTravelApplication').value;
    if (selectedValue) {
        // 根据选择的出差申请单加载相关信息
        loadTravelApplicationInfo(selectedValue);
    }
}

/**
 * 加载关联出差单列表
 */
function loadRelatedTravelApplications() {
    const user = getCurrentUser();
    
    // 模拟从API获取已审批通过的出差申请单数据
    const approvedTravelApplications = [
        { 
            travelID: 'T001', 
            travelNo: '2023031544454',
            travelReason: '客户拜访',
            travelPlace: '北京',
            tripPlanDateFrom: '2023-03-16',
            tripPlanDateTo: '2023-03-18',
            status: 'approved'
        },
        { 
            travelID: 'T002', 
            travelNo: '2023031544455',
            travelReason: '项目调研',
            travelPlace: '上海',
            tripPlanDateFrom: '2023-03-20',
            tripPlanDateTo: '2023-03-22',
            status: 'approved'
        }
    ];
    
    const select = document.getElementById('relatedTravelApplication');
    if (select) {
        // 清空现有选项
        select.innerHTML = '<option value="">请选择关联出差单</option>';
        
        // 添加选项
        approvedTravelApplications.forEach(app => {
            const option = document.createElement('option');
            option.value = app.travelID;
            option.textContent = `${app.travelNo} - ${app.travelReason} (${app.travelPlace})`;
            option.dataset.travelData = JSON.stringify(app);
            select.appendChild(option);
        });
    }
}

/**
 * 加载出差申请单信息
 * @param {string} travelID - 出差申请单ID
 */
function loadTravelApplicationInfo(travelID) {
    const select = document.getElementById('relatedTravelApplication');
    const selectedOption = select.querySelector(`option[value="${travelID}"]`);
    
    if (selectedOption && selectedOption.dataset.travelData) {
        const travelData = JSON.parse(selectedOption.dataset.travelData);
        
        // 填充相关字段
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) startDate.value = travelData.tripPlanDateFrom;
        if (endDate) endDate.value = travelData.tripPlanDateTo;
    }
}

/**
 * 保存草稿
 */
function saveDraft() {
    const formData = collectFormData();
    
    if (!formData) {
        showMessage('获取表单数据失败', 'error');
        return;
    }
    
    showLoading();
    
    // 调用保存API
    saveOrUpdateTravelReport(formData, 'save')
        .then(response => {
            hideLoading();
            if (response.code === '200') {
                showMessage('保存成功', 'success');
                // 更新表单中的ID字段
                if (response.data && response.data.reportID) {
                    document.getElementById('reportNo').value = response.data.reportNo || '';
                }
            } else {
                showMessage(response.message || '保存失败', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('保存失败:', error);
            showMessage('保存失败，请重试', 'error');
        });
}

/**
 * 提交报告
 */
function submitReport() {
    const formData = collectFormData();
    
    if (!formData) {
        showMessage('获取表单数据失败', 'error');
        return;
    }
    
    // 验证必填字段
    const requiredFields = [
        'relatedTravelApplication', 'reporterName', 'orgName', 'deptName',
        'startDate', 'endDate', 'workReport', 'completionFlag'
    ];
    
    const validation = validateForm(formData, requiredFields);
    if (!validation.isValid) {
        showMessage('请填写所有必填项：\n' + validation.errors.join('\n'), 'warning');
        return;
    }
    
    if (confirm('确认提交出差报告单吗？提交后将进入审批流程。')) {
        showLoading();
        
        // 先保存数据
        saveOrUpdateTravelReport(formData, 'save')
            .then(saveResponse => {
                if (saveResponse.code === '200') {
                    // 保存成功后提交到审批流程
                    const submitData = {
                        id: saveResponse.data.reportID,
                        PK_Field: 'ReportID',
                        modelType: 'oa_travel_report',
                        userData: {
                            roles: getCurrentUser().roles || ['employee']
                        }
                    };
                    
                    return submitToApproval(submitData);
                } else {
                    throw new Error(saveResponse.message || '保存失败');
                }
            })
            .then(submitResponse => {
                hideLoading();
                if (submitResponse.code === '200') {
                    showMessage('提交成功！报告已进入审批流程。', 'success');
                    // 返回到差旅业务页面
                    setTimeout(() => {
                        navigateToBusinessTravel();
                    }, 2000);
                } else {
                    showMessage(submitResponse.message || '提交失败', 'error');
                }
            })
            .catch(error => {
                hideLoading();
                console.error('提交失败:', error);
                showMessage('提交失败：' + error.message, 'error');
            });
    }
}

/**
 * 收集表单数据
 * @returns {Object} 表单数据对象
 */
function collectFormData() {
    try {
        const user = getCurrentUser();
        
        return {
            reportNo: document.getElementById('reportNo').value,
            relatedTravelApplication: document.getElementById('relatedTravelApplication').value,
            reporterName: document.getElementById('reporterName').value,
            reporterID: user.userID,
            orgName: document.getElementById('orgName').value,
            deptName: document.getElementById('deptName').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            workReport: document.getElementById('workReport').value,
            importantInfo: document.getElementById('importantInfo').value,
            completionFlag: document.getElementById('completionFlag').value,
            remarks: document.getElementById('remarks').value,
            creator: user.userID,
            createDate: new Date().toISOString(),
            orgCode: user.orgCode || 'ORG001',
            status: 'draft' // 草稿状态
        };
    } catch (error) {
        console.error('收集表单数据失败:', error);
        return null;
    }
}

/**
 * 保存或更新出差报告单
 * @param {Object} formData - 表单数据
 * @param {string} operation - 操作类型 (save/update)
 * @returns {Promise} API响应
 */
function saveOrUpdateTravelReport(formData, operation) {
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/saveOrUpdate';
    
    const requestData = {
        modelType: 'oa_businesstravel_report',
        operation: operation,
        obj: formData
    };
    
    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .catch(error => {
        console.error('API请求失败:', error);
        throw error;
    });
}

/**
 * 提交到审批流程
 * @param {Object} submitData - 提交数据
 * @returns {Promise} API响应
 */
function submitToApproval(submitData) {
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/submitFlow';
    
    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest'
        },
        body: JSON.stringify(submitData)
    })
    .then(response => response.json())
    .catch(error => {
        console.error('提交审批失败:', error);
        throw error;
    });
}

/**
 * 自动填充工作报告模板
 */
function fillReportTemplate() {
    const workReportTextarea = document.getElementById('workReport');
    if (workReportTextarea && !workReportTextarea.value.trim()) {
        const template = `一、出差目的：


二、主要工作内容：


三、工作成果：


四、遇到的问题及解决方案：


五、后续工作计划：

`;
        workReportTextarea.value = template;
    }
}

/**
 * 清空工作报告
 */
function clearWorkReport() {
    if (confirm('确认清空工作报告内容吗？')) {
        document.getElementById('workReport').value = '';
    }
}