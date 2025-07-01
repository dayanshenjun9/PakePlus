/**
 * 工作日志页面逻辑
 * 处理工作日志的查看、新增、编辑、删除功能
 */

// 工作日志页面状态
const WorkLogState = {
    workLogs: [],
    currentEditingLog: null,
    deleteTargetId: null,
    originalFormData: null // 存储原始表单数据用于变更检测
};

/**
 * 显示消息提示
 * @param {string} message - 提示消息
 * @param {string} type - 消息类型 (success, error, info, warning)
 */
function showMessage(message, type = 'info') {
    // 简单的提示实现，可以后续优化为更美观的提示框
    alert(message);
}

/**
 * 显示加载状态
 */
function showLoading() {
    // 可以添加加载动画
    console.log('Loading...');
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    // 隐藏加载动画
    console.log('Loading finished.');
}

// API接口地址
const WORK_LOG_API = {
    SELECT: 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/my/selectMyWorkLog',
    SUBMIT: 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/my/submitMyWorkLog',
    DELETE: 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/my/deleteMyWorkLog'
};

/**
 * 加载工作日志列表
 */
async function loadWorkLogList() {
    console.log('加载工作日志列表...');
    
    // 获取当前用户信息
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.user_id) {
        console.error('用户未登录，无法加载工作日志列表');
        showMessage('请先登录', 'error');
        renderEmptyList();
        return;
    }
    
    showLoading();
    
    try {
        // 构建请求URL，添加用户ID参数
        const url = new URL(WORK_LOG_API.SELECT);
        url.searchParams.append('userID', currentUser.user_id);
        
        const response = await fetch(url.toString(), {
            method: 'GET'
            // 移除Content-Type头部以避免CORS预检请求
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('工作日志列表响应:', result);
        
        hideLoading();
        
        if (result.code === '200' && result.data) {
            // 参考出差申请列表的实现方式，直接使用result.data
            WorkLogState.workLogs = result.data;
            console.log('加载的工作日志数据:', WorkLogState.workLogs);
            
            renderWorkLogList();
            
            if (WorkLogState.workLogs.length === 0) {
                console.log('工作日志列表为空');
                showMessage('暂无工作日志数据', 'info');
            } else {
                console.log(`成功加载 ${WorkLogState.workLogs.length} 条工作日志`);
            }
        } else {
            console.error('获取工作日志列表失败:', result.message || '未知错误');
            showMessage(result.message || '获取工作日志列表失败', 'error');
            renderEmptyList();
        }
        
    } catch (error) {
        console.error('获取工作日志列表异常:', error);
        hideLoading();
        
        // 根据错误类型提供更具体的提示
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showMessage('网络连接失败，请检查网络连接', 'error');
        } else if (error.message.includes('HTTP')) {
            showMessage(`服务器错误: ${error.message}`, 'error');
        } else {
            showMessage('加载工作日志列表失败，请稍后重试', 'error');
        }
        
        renderEmptyList();
    }
}

/**
 * 渲染工作日志列表
 */
function renderWorkLogList() {
    const listContainer = document.getElementById('workLogList');
    if (!listContainer) return;
    
    if (!WorkLogState.workLogs || WorkLogState.workLogs.length === 0) {
        renderEmptyList();
        return;
    }
    
    const listHTML = WorkLogState.workLogs.map(log => {
        // 获取用户要求的真实数据字段
        const startTime = formatDateTime(log.StartTime || log.startTime || log.STARTTIME || '未知时间');
        const routeAddress = log.RouteAddress || log.routeAddress || log.ROUTEADDRESS || '无地点';
        const creatorName = log.creatorName || log.CreatorName || log.CREATORNAME || log.creator || log.Creator || '未知创建者';
        const content = log.Content || log.content || log.CONTENT || '无内容';
        const advise = log.Advise || log.advise || log.ADVISE || '无对策建议';
        const signIn = (log.SignIn || log.signIn || log.SIGNIN) === '1' || (log.SignIn || log.signIn || log.SIGNIN) === 1 || (log.SignIn || log.signIn || log.SIGNIN) === true ? '是' : '否';
        
        // 添加调试信息以确认数据获取
        console.log('字段映射结果:', {
            StartTime: log.StartTime,
            RouteAddress: log.RouteAddress,
            SignIn: log.SignIn,
            creatorName: log.creatorName,
            Content: log.Content,
            Advise: log.Advise,
            处理后: { startTime, routeAddress, creatorName, content, advise, signIn }
        });
        
        // 获取ID，优先使用ActID作为单据ID，支持多种可能的字段名
        // 确保正确处理数字类型的ID，转换为字符串
        let logId = log.ActID || log.actID || log.ACTID || log.id || log.workLogId || log.ID || log.WORKLOGID || log.logId || log.LOG_ID || log.worklog_id || log.WORKLOG_ID;
        
        // 如果logId存在但不是字符串，转换为字符串
        if (logId !== undefined && logId !== null) {
            logId = String(logId);
        }
        
        // 如果logId仍为undefined或null，使用索引作为临时ID
        const finalLogId = (logId && logId !== 'undefined' && logId !== 'null') ? logId : `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <div class="list-item work-log-item" data-id="${finalLogId}" onclick="editWorkLog('${finalLogId}')" style="cursor: pointer;">
                <div class="item-header">
                    <div class="item-title">${startTime}</div>
                    <div class="item-actions">
                        <button class="btn-icon delete-btn" onclick="event.stopPropagation(); deleteWorkLog('${finalLogId}')" title="删除">
                            <span class="icon">🗑️</span>
                        </button>
                    </div>
                </div>
                <div class="item-content">
                    <div class="work-info">
                        <div class="info-row">
                            <span class="label">行程地点:</span>
                            <span class="value">${routeAddress}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">创建者:</span>
                            <span class="value">${creatorName}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">出勤:</span>
                            <span class="value">${signIn}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    listContainer.innerHTML = listHTML;
}

/**
 * 渲染空列表
 */
function renderEmptyList() {
    const listContainer = document.getElementById('workLogList');
    if (!listContainer) return;
    
    listContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📝</div>
            <div class="empty-text">暂无工作日志</div>
            <div class="empty-desc">点击上方"新增"按钮创建工作日志</div>
        </div>
    `;
}

/**
 * 新增工作日志
 */
function createNewWorkLog() {
    console.log('新增工作日志...');
    
    // 重置表单
    resetWorkLogForm();
    
    // 设置当前日期时间
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('startTime').value = localDateTime;
    
    // 设置弹窗标题
    document.getElementById('modalTitle').textContent = '新增工作日志';
    
    // 清空当前编辑状态
    WorkLogState.currentEditingLog = null;
    
    // 显示弹窗
    showWorkLogModal();
    
    // 新增模式下启用按钮
    enableModalButtons();
}

/**
 * 编辑工作日志
 * @param {string} logId - 工作日志ID
 */
function editWorkLog(logId) {
    console.log('编辑工作日志:', logId);
    
    const log = WorkLogState.workLogs.find(item => 
        (item.ActID && item.ActID.toString() === logId.toString()) ||
        (item.actID && item.actID.toString() === logId.toString()) ||
        (item.ACTID && item.ACTID.toString() === logId.toString()) ||
        (item.id && item.id.toString() === logId.toString()) || 
        (item.workLogId && item.workLogId.toString() === logId.toString())
    );
    
    if (!log) {
        showMessage('找不到要编辑的工作日志', 'error');
        return;
    }
    
    // 保存当前编辑的日志
    WorkLogState.currentEditingLog = log;
    
    // 填充表单数据 - 加载当前单据的真实数据
    document.getElementById('startTime').value = formatDateTimeForInput(log.StartTime || log.startTime || log.STARTTIME);
    document.getElementById('routeAddress').value = log.RouteAddress || log.routeAddress || log.ROUTEADDRESS || '';
    document.getElementById('members').value = log.creatorName || log.CreatorName || log.CREATORNAME || log.creator || log.Creator || log.members || log.MEMBERS || '';
    document.getElementById('content').value = log.Content || log.content || log.CONTENT || '';
    document.getElementById('advise').value = log.Advise || log.advise || log.ADVISE || '';
    
    // 处理出勤状态的多种可能值
    const signInValue = log.SignIn || log.signIn || log.SIGNIN;
    let signInDisplay = '';
    if (signInValue === '1' || signInValue === 1 || signInValue === true || signInValue === '是') {
        signInDisplay = '1';
    } else if (signInValue === '0' || signInValue === 0 || signInValue === false || signInValue === '否') {
        signInDisplay = '0';
    }
    document.getElementById('signIn').value = signInDisplay;
    
    // 设置弹窗标题
    document.getElementById('modalTitle').textContent = '编辑工作日志';
    
    // 显示弹窗并禁用按钮
    showWorkLogModal();
    
    // 编辑模式下默认禁用取消和保存按钮
    disableModalButtons();
    
    // 保存原始表单数据
    saveOriginalFormData();
    
    // 添加表单变更监听器
    addFormChangeListeners();
    
    console.log('已加载工作日志数据到编辑表单:', {
        原始数据: log,
        表单数据: {
            startTime: document.getElementById('startTime').value,
            routeAddress: document.getElementById('routeAddress').value,
            members: document.getElementById('members').value,
            content: document.getElementById('content').value,
            advise: document.getElementById('advise').value,
            signIn: document.getElementById('signIn').value
        }
    });
}

/**
 * 删除工作日志
 * @param {string} logId - 工作日志ID
 */
function deleteWorkLog(logId) {
    console.log('删除工作日志:', logId);
    
    // 保存要删除的ID
    WorkLogState.deleteTargetId = logId;
    
    // 显示确认删除弹窗
    showDeleteConfirmModal();
}

/**
 * 确认删除工作日志
 */
async function confirmDeleteWorkLog() {
    if (!WorkLogState.deleteTargetId) {
        showMessage('删除目标不存在', 'error');
        return;
    }
    
    console.log('确认删除工作日志:', WorkLogState.deleteTargetId);
    showLoading();
    
    try {
        // 构建URL参数，避免CORS问题
        const deleteUrl = `${WORK_LOG_API.DELETE}&ActID=${WorkLogState.deleteTargetId}`;
        
        const response = await fetch(deleteUrl, {
            method: 'POST',
            headers: {
                'x-requested-with': 'XMLHttpRequest'
            }
        });
        
        const result = await response.json();
        console.log('删除工作日志响应:', result);
        
        hideLoading();
        closeDeleteConfirmModal();
        
        if (result.code === '200') {
            showMessage('删除成功', 'success');
            // 重新加载列表
            loadWorkLogList();
        } else {
            console.error('删除工作日志失败:', result.message);
            showMessage(result.message || '删除失败', 'error');
        }
        
    } catch (error) {
        console.error('删除工作日志异常:', error);
        hideLoading();
        closeDeleteConfirmModal();
        showMessage('网络异常，删除失败', 'error');
    }
    
    // 清空删除目标
    WorkLogState.deleteTargetId = null;
}

/**
 * 提交工作日志
 */
async function submitWorkLog() {
    console.log('提交工作日志...');
    
    // 防止重复点击 - 检查按钮状态
    const submitBtn = document.querySelector('.btn-primary[onclick="submitWorkLog()"]');
    if (submitBtn && submitBtn.disabled) {
        console.log('正在提交中，请勿重复点击');
        return;
    }
    
    // 获取表单数据
    const formData = getWorkLogFormData();
    
    // 验证表单数据
    if (!validateWorkLogForm(formData)) {
        return;
    }
    
    // 禁用提交按钮，防止重复点击
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '保存中...';
    }
    
    showLoading();
    
    try {
        // 获取当前用户信息
        const currentUser = getCurrentUser();
        
        // 检查用户登录状态
        if (!currentUser || !currentUser.user_id) {
            hideLoading();
            showMessage('用户未登录，请先登录', 'error');
            return;
        }
        
        // 构建提交数据 - 按照后端接口要求格式
        const now = new Date();
        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };
        
        const worklogData = {
            actID: WorkLogState.currentEditingLog ? (WorkLogState.currentEditingLog.ActID || WorkLogState.currentEditingLog.actID || WorkLogState.currentEditingLog.ACTID || WorkLogState.currentEditingLog.id || WorkLogState.currentEditingLog.workLogId) : '',
            creator: currentUser.user_id || '',
            createTime: formatDateTime(now),
            startTime: formData.startTime || '',
            content: formData.content || '',
            routeAddress: formData.routeAddress || '',
            members: formData.members || '',
            advise: formData.advise || '',
            signIn: formData.signIn || '',
            remark: ''
        };
        
        // 验证必要字段
        if (!worklogData.creator) {
            hideLoading();
            showMessage('获取用户信息失败，请重新登录', 'error');
            return;
        }
        
        // 参考出差申请的实现方式，使用FormData格式提交
        const worklogsBeanStr = JSON.stringify(worklogData);
        const requestFormData = new FormData();
        requestFormData.append('worklogsBeanStr', worklogsBeanStr);
        
        console.log('提交数据:', worklogData);
        console.log('worklogsBeanStr:', worklogsBeanStr);
        console.log('参数长度:', worklogsBeanStr.length);
        
        // 验证参数是否为空
        if (!worklogsBeanStr || worklogsBeanStr === '{}' || worklogsBeanStr.length < 10) {
            console.error('worklogsBeanStr参数异常:', worklogsBeanStr);
            showMessage('数据构建失败，请检查表单填写', 'error');
            hideLoading();
            return;
        }
        
        // 参考出差申请的请求方式，使用FormData和简化的headers
        const response = await fetch(WORK_LOG_API.SUBMIT, {
            method: 'POST',
            body: requestFormData
        });
        
        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP错误:', response.status, response.statusText, errorText);
            hideLoading();
            
            if (response.status === 500) {
                showMessage('服务器内部错误，请检查提交的数据格式是否正确', 'error');
            } else if (response.status === 404) {
                showMessage('接口地址不存在，请联系管理员', 'error');
            } else {
                showMessage(`请求失败 (${response.status}): ${response.statusText}`, 'error');
            }
            return;
        }
        
        const result = await response.json();
        console.log('提交工作日志响应:', result);
        
        hideLoading();
        
        if (result.code === '200') {
            const action = WorkLogState.currentEditingLog ? '更新' : '新增';
            showMessage(`${action}成功`, 'success');
            closeWorkLogModal();
            
            // 保存成功后刷新页面跳转到工作日志列表
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            console.error('提交工作日志失败:', result.message);
            // 根据错误信息提供更具体的提示
            let errorMessage = result.message || '提交失败';
            if (errorMessage.includes('worklogsBeanStr不能为空')) {
                errorMessage = '提交参数格式错误，请检查表单数据';
            }
            showMessage(errorMessage, 'error');
            
            // 恢复按钮状态
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '保存';
            }
        }
        
    } catch (error) {
        console.error('提交工作日志异常:', error);
        hideLoading();
        
        // 恢复按钮状态
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '保存';
        }
        
        // 根据错误类型提供更具体的提示
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showMessage('网络连接失败，请检查网络连接或联系管理员', 'error');
        } else if (error.name === 'SyntaxError') {
            showMessage('服务器响应格式错误，请联系管理员', 'error');
        } else {
            showMessage(`提交异常: ${error.message}`, 'error');
        }
    }
}

/**
 * 获取工作日志表单数据
 * @returns {Object} 表单数据
 */
function getWorkLogFormData() {
    return {
        startTime: document.getElementById('startTime').value,
        routeAddress: document.getElementById('routeAddress').value.trim(),
        members: document.getElementById('members').value.trim(),
        content: document.getElementById('content').value.trim(),
        advise: document.getElementById('advise').value.trim(),
        signIn: document.getElementById('signIn').value
    };
}

/**
 * 验证工作日志表单数据
 * 除参与人员和对策建议外的所有字段都为必填项
 * @param {Object} formData - 表单数据
 * @returns {boolean} 验证结果
 */
function validateWorkLogForm(formData) {
    // 工作时间必填
    if (!formData.startTime) {
        showMessage('请选择工作时间', 'error');
        return false;
    }
    
    // 行程地点必填
    if (!formData.routeAddress) {
        showMessage('请输入行程地点', 'error');
        return false;
    }
    
    // 主要事项必填
    if (!formData.content) {
        showMessage('请输入主要事项', 'error');
        return false;
    }
    
    // 出勤状态必填
    if (!formData.signIn) {
        showMessage('请选择出勤状态', 'error');
        return false;
    }
    
    // 参与人员和对策建议为可选项，不进行验证
    
    return true;
}

/**
 * 重置工作日志表单
 */
function resetWorkLogForm() {
    document.getElementById('workLogForm').reset();
}

/**
 * 显示工作日志弹窗
 */
function showWorkLogModal() {
    const modal = document.getElementById('workLogModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * 关闭工作日志弹窗
 */
function closeWorkLogModal() {
    const modal = document.getElementById('workLogModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // 清空编辑状态
    WorkLogState.currentEditingLog = null;
    
    // 清空原始表单数据
    WorkLogState.originalFormData = null;
    
    // 移除表单变更监听器
    removeFormChangeListeners();
    
    // 重新启用按钮
    enableModalButtons();
}

/**
 * 禁用弹窗按钮
 */
function disableModalButtons() {
    const cancelBtn = document.querySelector('#workLogModal .btn-cancel');
    const saveBtn = document.querySelector('#workLogModal .btn-primary');
    
    if (cancelBtn) {
        cancelBtn.disabled = true;
        cancelBtn.style.opacity = '0.5';
        cancelBtn.style.cursor = 'not-allowed';
    }
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.5';
        saveBtn.style.cursor = 'not-allowed';
    }
    
    console.log('已禁用弹窗按钮');
}

/**
 * 启用弹窗按钮
 */
function enableModalButtons() {
    const cancelBtn = document.querySelector('#workLogModal .btn-cancel');
    const saveBtn = document.querySelector('#workLogModal .btn-primary');
    
    if (cancelBtn) {
        cancelBtn.disabled = false;
        cancelBtn.style.opacity = '1';
        cancelBtn.style.cursor = 'pointer';
    }
    
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'pointer';
    }
    
    console.log('已启用弹窗按钮');
}

/**
 * 显示删除确认弹窗
 */
function showDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * 关闭删除确认弹窗
 */
function closeDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // 清空删除目标
    WorkLogState.deleteTargetId = null;
}

/**
 * 格式化日期时间显示
 * @param {string} dateTimeStr - 日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '未知时间';
    
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('日期时间格式化失败:', error);
        return dateTimeStr;
    }
}

/**
 * 格式化日期时间为输入框格式
 * @param {string} dateTimeStr - 日期时间字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTimeForInput(dateTimeStr) {
    if (!dateTimeStr) return '';
    
    try {
        const date = new Date(dateTimeStr);
        const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDateTime.toISOString().slice(0, 16);
    } catch (error) {
        console.error('日期时间格式化失败:', error);
        return '';
    }
}

/**
 * 格式化日期显示
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateStr) {
    if (!dateStr) return '未知日期';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        console.error('日期格式化失败:', error);
        return dateStr;
    }
}

/**
 * 格式化日期为输入框格式
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('日期格式化失败:', error);
        return '';
    }
}

/**
 * 导航到个人中心页面
 */
function navigateToProfile() {
    window.location.href = 'profile.html';
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('工作日志页面初始化...');
    
    // 检查登录状态
    if (!localStorage.getItem('currentUser')) {
        window.location.href = 'login.html';
        return;
    }
    
    // 加载工作日志列表
    loadWorkLogList();
});

/**
 * 保存原始表单数据
 */
function saveOriginalFormData() {
    WorkLogState.originalFormData = {
        startTime: document.getElementById('startTime').value,
        routeAddress: document.getElementById('routeAddress').value,
        members: document.getElementById('members').value,
        content: document.getElementById('content').value,
        advise: document.getElementById('advise').value,
        signIn: document.getElementById('signIn').value
    };
    console.log('已保存原始表单数据:', WorkLogState.originalFormData);
}

/**
 * 获取当前表单数据
 */
function getCurrentFormData() {
    return {
        startTime: document.getElementById('startTime').value,
        routeAddress: document.getElementById('routeAddress').value,
        members: document.getElementById('members').value,
        content: document.getElementById('content').value,
        advise: document.getElementById('advise').value,
        signIn: document.getElementById('signIn').value
    };
}

/**
 * 检查表单是否有变更
 */
function hasFormChanged() {
    if (!WorkLogState.originalFormData) return false;
    
    const currentData = getCurrentFormData();
    
    return Object.keys(WorkLogState.originalFormData).some(key => {
        return WorkLogState.originalFormData[key] !== currentData[key];
    });
}

/**
 * 处理表单变更事件
 */
function handleFormChange() {
    if (hasFormChanged()) {
        enableModalButtons();
    } else {
        disableModalButtons();
    }
}

/**
 * 添加表单变更监听器
 */
function addFormChangeListeners() {
    const formElements = [
        'startTime',
        'routeAddress', 
        'members',
        'content',
        'advise',
        'signIn'
    ];
    
    formElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('input', handleFormChange);
            element.addEventListener('change', handleFormChange);
        }
    });
    
    console.log('已添加表单变更监听器');
}

/**
 * 移除表单变更监听器
 */
function removeFormChangeListeners() {
    const formElements = [
        'startTime',
        'routeAddress',
        'members', 
        'content',
        'advise',
        'signIn'
    ];
    
    formElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.removeEventListener('input', handleFormChange);
            element.removeEventListener('change', handleFormChange);
        }
    });
    
    console.log('已移除表单变更监听器');
}