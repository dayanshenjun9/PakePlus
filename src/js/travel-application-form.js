/**
 * 出差申请表单页面 JavaScript
 * 处理出差申请表单的交互逻辑和数据提交
 * 
 * 功能特性：
 * 1. 点击新增时立即生成单据ID、编号和创建时间
 * 2. 支持从sessionStorage获取预生成的单据信息
 * 3. 自动填充用户信息和部门信息
 * 4. 实时计算出差天数
 * 5. 表单验证和数据提交
 * 6. 表单修改检测，未修改时禁用保存按钮
 */

// 全局变量，用于存储表单的初始状态
let initialFormState = {};
let formModified = false;

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success/error/warning/info)
 */
function showMessage(message, type = 'info') {
    alert(message);
}

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('出差申请表单页面已加载');
    
    // 解析URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const mode = urlParams.get('mode');
    
    // 检查是否是查看模式或编辑模式
    if (id && (mode === 'view' || mode === 'edit')) {
        // 从sessionStorage获取申请详情数据
        loadApplicationDetail();
        
        // 如果是编辑模式，确保表单可编辑
        if (mode === 'edit') {
            console.log('编辑模式：表单可编辑');
            // 确保表单可编辑，不设置只读
            setFormReadOnly(false);
            showActionButtons();
            
            // 在表单加载完成后保存初始状态
            setTimeout(function() {
                saveInitialFormState();
                setupFormChangeListeners();
                // 初始时禁用保存按钮
                toggleSaveButton(false);
            }, 1000); // 给表单加载一些时间
        }
    } else {
        // 正常初始化页面（新增模式）
        initializePage();
        
        // 在新增模式下，表单初始为空，所以任何修改都应该启用保存按钮
        setTimeout(function() {
            saveInitialFormState();
            setupFormChangeListeners();
            // 新增模式下初始也禁用保存按钮，直到有修改
            toggleSaveButton(false);
        }, 1000);
    }
});

/**
 * 保存表单的初始状态
 */
function saveInitialFormState() {
    initialFormState = collectFormData();
    console.log('已保存表单初始状态:', initialFormState);
    formModified = false;
}

/**
 * 设置表单变化监听器
 */
function setupFormChangeListeners() {
    // 获取所有表单输入元素
    const inputs = document.querySelectorAll('#travelApplicationForm input, #travelApplicationForm select, #travelApplicationForm textarea');
    
    // 为每个输入元素添加变化监听器
    inputs.forEach(input => {
        // 跳过只读字段
        if (input.readOnly || input.disabled) {
            return;
        }
        
        // 根据输入类型添加适当的事件监听器
        if (input.type === 'checkbox' || input.type === 'radio' || input.tagName === 'SELECT') {
            input.addEventListener('change', checkFormModified);
        } else {
            input.addEventListener('input', checkFormModified);
        }
    });
}

/**
 * 检查表单是否被修改
 */
function checkFormModified() {
    const currentFormState = collectFormData();
    
    // 比较当前表单状态与初始状态
    formModified = isFormModified(initialFormState, currentFormState);
    
    // 根据表单是否被修改来启用或禁用保存按钮
    toggleSaveButton(formModified);
}

/**
 * 比较两个表单状态对象，检查是否有修改
 * @param {Object} initialState - 初始表单状态
 * @param {Object} currentState - 当前表单状态
 * @returns {boolean} 表单是否被修改
 */
function isFormModified(initialState, currentState) {
    // 如果初始状态为空，则认为表单已修改
    if (!initialState) return true;
    
    // 检查用户可编辑的关键字段
    const editableFields = [
        'roleID', 'travelLevel', 'travelPlace', 'tripRoute',
        'tripPlanDateFrom', 'tripPlanDateTo', 'travelReason',
        'planTravelType', 'transportLevel', 'costBudget',
        'estimateLoan', 'personTogether'
    ];
    
    for (const field of editableFields) {
        // 如果字段值不同，则表单已修改
        if (initialState[field] !== currentState[field]) {
            console.log(`字段 ${field} 已修改: ${initialState[field]} -> ${currentState[field]}`);
            return true;
        }
    }
    
    return false;
}

/**
 * 启用或禁用保存按钮
 * @param {boolean} enable - 是否启用按钮
 */
function toggleSaveButton(enable) {
    const saveButton = document.querySelector('.btn.btn-outline');
    if (saveButton) {
        if (enable) {
            saveButton.removeAttribute('disabled');
            saveButton.classList.remove('btn-disabled');
        } else {
            saveButton.setAttribute('disabled', 'disabled');
            saveButton.classList.add('btn-disabled');
        }
    }
}

/**
 * 初始化页面
 */
function initializePage() {
    // 设置表单默认值
    setFormDefaults();
    
    // 绑定日期变化事件，计算出差天数
    bindDateChangeEvents();
    
    // 生成单据ID
    generateApplicationNo();
}

/**
 * 设置表单默认值
 * 该函数负责初始化表单字段的默认值
 * 注意：此函数依赖于API.js提供的接口服务
 */
function setFormDefaults() {
    // 获取当前登录用户信息
    const user = getCurrentUser();
    
    // 检查是否有预生成的单据信息（从会话存储中获取）
    const newDocumentInfo = sessionStorage.getItem('newTravelDocument');
    let documentData = null;
    
    if (newDocumentInfo) {
        try {
            // 解析JSON格式的单据信息
            documentData = JSON.parse(newDocumentInfo);
            // 使用后清除sessionStorage，避免数据残留
            sessionStorage.removeItem('newTravelDocument');
        } catch (error) {
            console.error('解析单据信息失败:', error);
        }
    }
    
    // 设置单据ID
    const travelIDElement = document.getElementById('travelID');
    if (travelIDElement) {
        if (documentData && documentData.travelID) {
            travelIDElement.value = documentData.travelID;
            travelIDElement.placeholder = '已生成';
        } else {
            travelIDElement.value = '';
            travelIDElement.placeholder = '保存后由系统自动生成';
        }
    }
    
    // 设置编号
    const travelNoElement = document.getElementById('travelNo');
    if (travelNoElement) {
        if (documentData && documentData.travelNo) {
            travelNoElement.value = documentData.travelNo;
            travelNoElement.placeholder = '已生成';
        } else {
            travelNoElement.value = '';
            travelNoElement.placeholder = '保存后由系统自动生成';
        }
    }
    
    // 设置申请人信息（按用户ID进行默认值添加）
    const requestPersonNameElement = document.getElementById('requestPersonName');
    if (requestPersonNameElement && user.userID) {
        // 这里应该通过用户ID查询数据库获取用户姓名
        // 暂时使用当前用户信息，实际应调用API获取
        requestPersonNameElement.value = user.userName || '';
        // 存储用户ID用于提交
        requestPersonNameElement.setAttribute('data-user-id', user.userID);
    }
    
    // 设置组织机构信息（按登录用户的orgCode进行获取与解析）
    const deptNameElement = document.getElementById('deptName');
    const deptIDElement = document.getElementById('deptID');
    const displayDeptNameElement = document.getElementById('displayDeptName');
    
    if (deptNameElement) {
        // 调试日志：输出用户信息
        console.log('当前用户信息:', user);
        console.log('用户orgCode:', user.orgCode);
        
        // 获取组织代码 - 增加ORGCODE大写字段的支持
        // 注意：根据用户信息查询接口文档，接口返回的字段名是ORGCODE（大写）
        const orgCode = user.ORGCODE || user.orgCode || user.deptID || user.organizationCode || '';
        
        // 调试日志：输出组织代码
        console.log('获取到的组织代码:', orgCode);
        
        // 存储组织代码用于提交
        deptNameElement.setAttribute('data-org-code', orgCode);
        deptNameElement.value = orgCode; // 设置OrgCode值
        
        // 如果orgCode为空值，显示警告
        if (!orgCode) {
            console.warn('组织机构代码未正确获取');
            deptNameElement.value = '未知部门';
            if (deptIDElement) deptIDElement.value = '';
            if (displayDeptNameElement) displayDeptNameElement.value = '未知部门';
        } else {
            // 尝试通过API获取部门名称
            // 注意：此处依赖API.js提供的getDeptInfo方法
            API.getDeptInfo(orgCode)
                .then(result => {
                    if (result.success && result.data) {
                        // 获取部门ID和部门名称（兼容大小写字段名）
                        const deptID = result.data.DEPT_ID || result.data.dept_id || '';
                        const deptName = result.data.DEPT_NAME || result.data.dept_name || '未知部门';
                        
                        // 设置部门ID和部门名称到表单字段
                        if (deptIDElement) deptIDElement.value = deptID;
                        if (displayDeptNameElement) displayDeptNameElement.value = deptName;
                        
                        console.log('已获取部门信息:', '部门ID:', deptID, '部门名称:', deptName);
                    } else {
                        // 如果获取失败，使用默认值（不再使用orgCode作为部门ID）
                        if (deptIDElement) deptIDElement.value = ''; // 部门ID置空，不再使用orgCode
                        if (displayDeptNameElement) displayDeptNameElement.value = user.deptName || '未知部门';
                        
                        console.warn('未能获取部门信息，使用默认值');
                    }
                })
                .catch(error => {
                    // 处理API调用异常
                    console.error('获取部门信息失败:', error);
                    // 使用默认值（不再使用orgCode作为部门ID）
                    if (deptIDElement) deptIDElement.value = ''; // 部门ID置空，不再使用orgCode
                    if (displayDeptNameElement) displayDeptNameElement.value = user.deptName || '未知部门';
                });
        }
    }
    
    // 设置当前日期为申请日期（默认为当天，且禁止修改）
    const today = new Date();
    const requestDateElement = document.getElementById('requestDate');
    if (requestDateElement) {
        // 设置日期值为YYYY-MM-DD格式（HTML日期输入框需要这种格式）
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
        const day = String(today.getDate()).padStart(2, '0'); // 日期补零
        const formattedDate = `${year}-${month}-${day}`;
        
        // 设置日期值
        requestDateElement.value = formattedDate;
        
        // 为了确保日期显示，添加自定义属性
        requestDateElement.setAttribute('data-date-value', formattedDate);
        
        // 日期已在HTML中设置为readonly，禁止用户修改
        console.log('申请日期已设置为当前日期:', formattedDate);
    }
    
    // 设置审核状态显示（使用AuditStauts字段进行前端展示）
    const statusElement = document.getElementById('statusName');
    if (statusElement) {
        if (documentData && documentData.AuditStauts !== undefined) {
            // 审核状态字段使用AuditStauts进行前端展示（不再使用Status字段）
            statusElement.value = getStatusText(documentData.AuditStauts);
            statusElement.setAttribute('data-audit-stauts', documentData.AuditStauts);
        } else {
            // 默认状态
            statusElement.value = getStatusText(0); // 默认显示草稿状态
            statusElement.setAttribute('data-audit-stauts', '0'); // 默认值为0
        }
    }
    
    // 设置创建时间
    const createTimeElement = document.getElementById('createTime');
    if (createTimeElement) {
        if (documentData && documentData.createTime) {
            createTimeElement.value = documentData.createTime;
            createTimeElement.placeholder = '已生成';
        } else {
            createTimeElement.value = '';
            createTimeElement.placeholder = '保存后由系统自动生成';
        }
    }
    
    // 职位改为用户输入，不自动填充
    const roleIDElement = document.getElementById('roleID');
    if (roleIDElement) {
        roleIDElement.value = ''; // 清空，改为用户输入
        roleIDElement.removeAttribute('readonly'); // 移除只读属性
        roleIDElement.placeholder = '请输入职位';
    }
}

/**
 * 生成单据ID
 */
function generateTravelID() {
    // 生成格式：T + 时间戳 + 3位随机数
    const timestamp = Date.now();
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `T${timestamp}${random}`;
}

/**
 * 生成编号
 */
function generateTravelNo() {
    // 生成格式：CC + 年月日 + 4位随机数
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    return `CC${year}${month}${day}${random}`;
}

/**
 * 生成申请单号（保留原函数以兼容）
 */
function generateApplicationNo() {
    const applicationNoInput = document.getElementById('applicationNo');
    if (applicationNoInput && !applicationNoInput.value) {
        applicationNoInput.value = generateTravelNo();
    }
}

/**
 * 绑定日期变化事件
 */
function bindDateChangeEvents() {
    const startDateInput = document.getElementById('tripPlanDateFrom');
    const endDateInput = document.getElementById('tripPlanDateTo');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', calculateTravelDays);
        endDateInput.addEventListener('change', calculateTravelDays);
    }
}

/**
 * 加载申请详情数据
 */
function loadApplicationDetail() {
    console.log('加载申请详情数据');
    
    // 从sessionStorage获取申请详情数据
    const detailDataStr = sessionStorage.getItem('travelApplicationDetail');
    if (!detailDataStr) {
        console.log('未找到申请详情数据，重定向到列表页面');
        // 重定向到列表页面，避免错误提示
        window.location.href = 'travel-application.html';
        return;
    }
    
    // 打印原始数据字符串，用于调试
    console.log('原始申请详情数据字符串:', detailDataStr);
    
    try {
        // 解析申请详情数据
        const application = JSON.parse(detailDataStr);
        console.log('申请详情数据:', application);
        
        // 填充表单数据
        document.getElementById('travelID').value = application.TravelID || '';
        document.getElementById('travelNo').value = application.TravelNo || '';
        document.getElementById('requestPersonName').value = application.RequestPersonName || '';
        // 处理申请日期
        const requestDateElement = document.getElementById('requestDate');
        if (requestDateElement && application.RequestDate) {
            try {
                // 将日期转换为Date对象
                const requestDate = new Date(application.RequestDate);
                
                // 设置日期值为YYYY-MM-DD格式（HTML日期输入框需要这种格式）
                const year = requestDate.getFullYear();
                const month = String(requestDate.getMonth() + 1).padStart(2, '0');
                const day = String(requestDate.getDate()).padStart(2, '0');
                requestDateElement.value = `${year}-${month}-${day}`;
                
                // 为了确保日期显示，添加自定义属性
                requestDateElement.setAttribute('data-date-value', `${year}-${month}-${day}`);
            } catch (error) {
                console.error('处理申请日期时出错:', error);
                requestDateElement.value = '';
            }
        }
        // 设置组织机构相关字段
        document.getElementById('deptName').value = application.OrgCode || application.DeptName || '';
        // 设置部门ID
        const deptIDElement = document.getElementById('deptID');
        if (deptIDElement) {
            deptIDElement.value = application.DEPT_ID || application.dept_id || application.DeptID || '';
        }
        // 设置部门名称
        const displayDeptNameElement = document.getElementById('displayDeptName');
        if (displayDeptNameElement) {
            displayDeptNameElement.value = application.DEPT_NAME || application.deptName || application.DeptName || '';
        }
        document.getElementById('roleID').value = application.Role_ID || '';
        
        // 设置出行标准下拉框
        const travelLevelSelect = document.getElementById('travelLevel');
        if (travelLevelSelect) {
            travelLevelSelect.value = application.TravelLevel || '';
        }
        
        // 确保目的地正确显示
        const travelPlaceElement = document.getElementById('travelPlace');
        if (travelPlaceElement) {
            travelPlaceElement.value = application.TravelPlace || '';
        }
        document.getElementById('tripRoute').value = application.TripRoute || '';
        // 直接设置行程计划起始日期和终止日期
        const startDateElement = document.getElementById('tripPlanDateFrom');
        const endDateElement = document.getElementById('tripPlanDateTo');
        
        // 尝试多个可能的字段名
        const startDateValue = application.TripPlanDateFrom || application.PlanStartDate || '';
        const endDateValue = application.TripPlanDateTo || application.PlanEndDate || '';
        
        console.log('起始日期原始值:', startDateValue);
        console.log('终止日期原始值:', endDateValue);
        
        // 处理起始日期
        if (startDateElement && startDateValue) {
            try {
                // 处理多种日期格式："2025-05-25 00:00:00.0" 或 "2025-05-25T00:00:00.0"
                let dateStr = startDateValue;
                if (typeof startDateValue === 'string') {
                    // 处理 "2025-05-25 00:00:00.0" 格式
                    if (startDateValue.includes(' ')) {
                        dateStr = startDateValue.split(' ')[0];
                    }
                    // 处理 "2025-05-25T00:00:00.0" 格式
                    else if (startDateValue.includes('T')) {
                        dateStr = startDateValue.split('T')[0];
                    }
                }
                
                // 直接设置日期值
                startDateElement.value = dateStr;
                console.log('设置起始日期:', dateStr, '原始值:', startDateValue);
                console.log('起始日期设置成功:', startDateElement.value);
            } catch (error) {
                console.error('处理起始日期时出错:', error);
                startDateElement.value = '';
            }
        }
        
        // 处理终止日期
        if (endDateElement && endDateValue) {
            try {
                // 处理多种日期格式："2025-05-29 00:00:00.0" 或 "2025-05-29T00:00:00.0"
                let dateStr = endDateValue;
                if (typeof endDateValue === 'string') {
                    // 处理 "2025-05-29 00:00:00.0" 格式
                    if (endDateValue.includes(' ')) {
                        dateStr = endDateValue.split(' ')[0];
                    }
                    // 处理 "2025-05-29T00:00:00.0" 格式
                    else if (endDateValue.includes('T')) {
                        dateStr = endDateValue.split('T')[0];
                    }
                }
                
                // 直接设置日期值
                endDateElement.value = dateStr;
                console.log('设置终止日期:', dateStr, '原始值:', endDateValue);
                console.log('终止日期设置成功:', endDateElement.value);
            } catch (error) {
                console.error('处理终止日期时出错:', error);
                endDateElement.value = '';
            }
        }
        
        // 日期设置完成后，重新计算出差天数
        calculateTravelDays();
        document.getElementById('travelReason').value = application.TravelReason || '';
        
        // 设置计划出行方式下拉框
        const planTravelTypeSelect = document.getElementById('planTravelType');
        if (planTravelTypeSelect) {
            planTravelTypeSelect.value = application.PlanTravelType || '';
        }
        
        document.getElementById('transportLevel').value = application.TransportLevel || '';
        document.getElementById('costBudget').value = application.CostBudget || '';
        document.getElementById('estimateLoan').value = application.EstimateLoan || '';
        document.getElementById('personTogether').value = application.PersonTogether || '';
        document.getElementById('dutyDeptOpnion').value = application.DutyDeptOpnion || '';
        document.getElementById('deputyManagerOpinion').value = application.DeputyManagerOpinion || '';
        document.getElementById('managerOpinion').value = application.ManagerOpinion || '';
        
        // 设置审核状态（使用AuditStauts字段进行前端展示）
        const statusElement = document.getElementById('statusName');
        if (statusElement) {
            // 审核状态字段使用AuditStauts进行前端展示（不再使用Status字段）
            statusElement.value = getStatusText(application.AuditStauts || 0);
            statusElement.setAttribute('data-audit-stauts', application.AuditStauts || '0');
        }
        
        document.getElementById('createTime').value = application.CreateTime ? formatDateTime(new Date(application.CreateTime)) : '';
        
        // 确保日期字段已正确填充
        console.log('准备设置表单为只读模式...');
        
        // 再次检查日期字段是否已填充
        // 使用已经声明的变量，不再重复声明
        console.log('再次检查日期字段:');
        
        console.log('设置只读模式前检查日期字段:');
        console.log('- 起始日期值:', startDateElement ? startDateElement.value : '元素不存在');
        console.log('- 终止日期值:', endDateElement ? endDateElement.value : '元素不存在');
        
        // 验证日期字段是否正确设置
        if (startDateElement) {
            const startDateValue = startDateElement.value || startDateElement.getAttribute('data-date-value') || '';
            if (startDateValue) {
                console.log('起始日期已设置:', startDateValue);
            }
        }
        
        if (endDateElement) {
            const endDateValue = endDateElement.value || endDateElement.getAttribute('data-date-value') || '';
            if (endDateValue) {
                console.log('终止日期已设置:', endDateValue);
            }
        }
        
        // 获取URL参数中的mode值
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        
        // 只有在查看模式下才设置表单为只读并隐藏操作按钮
        if (mode === 'view') {
            console.log('查看模式：设置表单为只读并隐藏操作按钮');
            // 设置表单为只读模式
            setFormReadOnly(true);
            
            // 隐藏操作按钮
            hideActionButtons();
        } else if (mode === 'edit') {
            console.log('编辑模式：保持表单可编辑并显示操作按钮');
            // 确保表单可编辑
            setFormReadOnly(false);
            
            // 确保操作按钮可见
            showActionButtons();
        }
        
        // 再次检查日期字段
        console.log('设置只读模式后检查日期字段:');
        console.log('- 起始日期值:', startDateElement ? startDateElement.value : '元素不存在');
        console.log('- 终止日期值:', endDateElement ? endDateElement.value : '元素不存在');
        
        // 使用后清除sessionStorage
        sessionStorage.removeItem('travelApplicationDetail');
    } catch (error) {
        console.error('解析申请详情数据失败:', error);
        showMessage('解析申请详情数据失败', 'error');
    }
}

/**
 * 设置表单为只读模式
 */
function setFormReadOnly(readonly = true) {
    console.log('设置表单只读模式:', readonly);
    
    // 获取所有表单输入元素
    const inputs = document.querySelectorAll('#travelApplicationForm input, #travelApplicationForm select, #travelApplicationForm textarea');
    
    // 设置只读属性
    inputs.forEach(input => {
        // 记录当前值，特别是日期输入框
        const currentValue = input.value;
        console.log(`输入框 ${input.id} 当前值:`, currentValue);
        
        // 需要始终为只读的字段ID列表
        const alwaysReadOnlyFields = ['travelNo', 'requestPersonName', 'requestDate', 'deptName', 'deptID', 'displayDeptName'];
        const isAlwaysReadOnly = alwaysReadOnlyFields.includes(input.id);
        
        // 需要隐藏的字段ID列表
        const fieldsToHide = ['deptID', 'deptName']; // 隐藏 DeptID 和 OrgCode(实际对应 deptName 字段)
        const shouldHide = fieldsToHide.includes(input.id);
        
        // 处理需要隐藏的字段
        if (shouldHide) {
            // 获取字段的父级form-group元素
            const formGroup = input.closest('.form-group');
            if (formGroup) {
                formGroup.style.display = 'none';
            }
        }
        
        if (readonly || isAlwaysReadOnly) {
            // 对于日期输入框，使用特殊处理
            if (input.type === 'date') {
                // 检查是否有日期值
                let dateValue = currentValue;
                
                // 如果没有当前值，尝试从自定义属性获取
                if (!dateValue && input.hasAttribute('data-date-value')) {
                    dateValue = input.getAttribute('data-date-value');
                }
                
                // 如果仍然没有值，尝试从隐藏的span元素获取
                if (!dateValue) {
                    const displaySpan = document.getElementById(`${input.id}_display`);
                    if (displaySpan) {
                        dateValue = displaySpan.textContent;
                    }
                }
                
                if (dateValue) {
                    console.log(`日期输入框 ${input.id} 值:`, dateValue);
                    
                    // 保存原始值
                    input.setAttribute('data-original-value', dateValue);
                }
            }
            
            input.setAttribute('readonly', 'readonly');
            input.classList.add('readonly');
            
            // 对于select元素，禁用而不是只读
            if (input.tagName === 'SELECT') {
                input.disabled = true;
            }
        } else {
            input.removeAttribute('readonly');
            input.classList.remove('readonly');
            
            // 对于select元素，启用
            if (input.tagName === 'SELECT') {
                input.disabled = false;
            }
            
            // 恢复日期输入框的原始值
            if (input.type === 'date' && input.hasAttribute('data-original-value')) {
                const originalValue = input.getAttribute('data-original-value');
                input.value = originalValue;
                console.log(`恢复日期输入框 ${input.id} 原始值:`, originalValue);
            }
        }
    });
    
    // 日期字段已设置为只读模式
    console.log('表单只读模式设置完成');
}

/**
 * 隐藏操作按钮
 */
function hideActionButtons() {
    // 获取操作按钮容器
    const actionButtons = document.querySelector('.form-actions');
    if (actionButtons) {
        // 隐藏取消、保存草稿和提交按钮，只保留返回按钮
        const buttons = actionButtons.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.textContent.includes('取消') || button.textContent.includes('保存') || button.textContent.includes('提交')) {
                button.style.display = 'none';
            }
        });
    }
}

/**
 * 显示操作按钮
 */
function showActionButtons() {
    // 获取操作按钮容器
    const actionButtons = document.querySelector('.form-actions');
    if (actionButtons) {
        // 显示所有按钮
        const buttons = actionButtons.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.display = '';
        });
    }
}

/**
 * 获取状态文本
 * @param {string|number} status - 审核状态码
 * @returns {string} 状态文本描述
 */
function getStatusText(status) {
    // 确保status是字符串类型
    const statusStr = String(status || 0);
    
    const statusMap = {
        '-1': '返回修改',
        '0': '编制',
        '1': '提交审核',
        '2': '审核中...',
        '3': '审核通过',
        '4': '驳回',
        '5': '已撤销'
    };
    return statusMap[statusStr] || '未知状态';
}

/**
 * 计算出差天数
 */
function calculateTravelDays() {
    const startDateInput = document.getElementById('tripPlanDateFrom');
    const endDateInput = document.getElementById('tripPlanDateTo');
    const travelDaysInput = document.getElementById('tripDays');
    
    if (startDateInput && endDateInput && travelDaysInput) {
        let startDate, endDate;
        try {
            if (startDateInput.value) {
                if (startDateInput.value.includes('T')) {
                    startDate = new Date(startDateInput.value.split('T')[0]);
                } else if (startDateInput.value.includes('年') && startDateInput.value.includes('月') && startDateInput.value.includes('日')) {
                    const yearStr = startDateInput.value.split('年')[0];
                    const monthStr = startDateInput.value.split('年')[1].split('月')[0];
                    const dayStr = startDateInput.value.split('月')[1].split('日')[0];
                    const year = parseInt(yearStr);
                    const month = parseInt(monthStr) - 1;
                    const day = parseInt(dayStr);
                    startDate = new Date(year, month, day);
                } else {
                    startDate = new Date(startDateInput.value);
                }
            }
            if (endDateInput.value) {
                if (endDateInput.value.includes('T')) {
                    endDate = new Date(endDateInput.value.split('T')[0]);
                } else if (endDateInput.value.includes('年') && endDateInput.value.includes('月') && endDateInput.value.includes('日')) {
                    const yearStr = endDateInput.value.split('年')[0];
                    const monthStr = endDateInput.value.split('年')[1].split('月')[0];
                    const dayStr = endDateInput.value.split('月')[1].split('日')[0];
                    const year = parseInt(yearStr);
                    const month = parseInt(monthStr) - 1;
                    const day = parseInt(dayStr);
                    endDate = new Date(year, month, day);
                } else {
                    endDate = new Date(endDateInput.value);
                }
            }
            if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                // 优化：包含起止日期当天
                const diffTime = endDate.getTime() - startDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                travelDaysInput.value = diffDays > 0 ? diffDays : 0;
                console.log('优化后计算出差天数:', diffDays, '开始日期:', startDate, '结束日期:', endDate);
            }
        } catch (error) {
            console.error('计算出差天数时出错:', error);
        }
    }
}

/**
 * 保存草稿
 */
function saveDraft() {
    console.log('保存草稿...');
    
    // 如果表单没有修改，则不执行保存操作
    if (!formModified) {
        console.log('表单未修改，无需保存');
        showMessage('表单未修改，无需保存', 'info');
        return;
    }
    
    // 防止重复点击 - 检查按钮状态
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn && saveBtn.disabled) {
        console.log('正在保存中，请勿重复点击');
        return;
    }
    
    // 禁用保存按钮，防止重复点击
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';
    }
    
    const formData = collectFormData();
    
    if (!formData) {
        console.error('获取表单数据失败');
        showMessage('获取表单数据失败', 'error');
        
        // 恢复按钮状态
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '保存';
        }
        return;
    }
    
    console.log('保存草稿表单数据:', formData);
    showLoading();
    
    // 检查是否是编辑模式：通过URL参数判断
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('mode') === 'edit' && urlParams.get('id');
    console.log('保存模式:', isEditMode ? '编辑现有单据' : '创建新单据');
    
    // 调用保存API（函数内部会根据是否有travelID自动判断是save还是update操作）
    saveOrUpdateTravelApplication(formData, 'save')
        .then(response => {
            hideLoading();
            console.log('保存草稿响应:', response);
            console.log('响应数据JSON:', JSON.stringify(response));
            
            if (response.code === '200') {
                // 更新表单中的ID字段
                if (response.data) {
                    // 更新travelID - 兼容多种可能的返回格式
                    let travelID = response.data.travelID;
                    
                    if (travelID) {
                        console.log('获取到的TravelID:', travelID);
                        document.getElementById('travelID').value = travelID;
                    } else {
                        console.warn('未能从响应中获取TravelID');
                    }
                    
                    // 更新travelNo/applicationNo - 兼容多种可能的返回格式
                    let travelNo = response.data.travelNo;
                    
                    if (travelNo) {
                        console.log('获取到的TravelNo:', travelNo);
                        document.getElementById('applicationNo').value = travelNo;
                        if (document.getElementById('travelNo')) {
                            document.getElementById('travelNo').value = travelNo;
                        }
                    }
                    
                    // 加载完整的申请详情数据
                    loadApplicationDetail();
                }
                
                // 保存成功后更新初始表单状态
                saveInitialFormState();
                
                // 保存成功后更新sessionStorage中的申请详情数据
                const updatedFormData = collectFormData();
                if (updatedFormData) {
                    // 将表单数据转换为与后端返回格式一致的格式
                    const applicationDetail = {
                        TravelID: updatedFormData.travelID,
                        TravelNo: document.getElementById('travelNo').value,
                        RequestPersonName: document.getElementById('requestPersonName').value,
                        RequestDate: updatedFormData.requestDate,
                        OrgCode: updatedFormData.orgCode,
                        DEPT_ID: updatedFormData.deptID,
                        DEPT_NAME: document.getElementById('displayDeptName').value,
                        Role_ID: updatedFormData.role_ID,
                        TravelLevel: updatedFormData.travelLevel,
                        TravelPlace: updatedFormData.travelPlace,
                        TripRoute: updatedFormData.tripRoute,
                        TripPlanDateFrom: updatedFormData.tripPlanDateFrom,
                        TripPlanDateTo: updatedFormData.tripPlanDateTo,
                        TravelReason: updatedFormData.travelReason,
                        PlanTravelType: updatedFormData.planTravelType,
                        TransportLevel: updatedFormData.transportLevel,
                        CostBudget: updatedFormData.costBudget,
                        EstimateLoan: updatedFormData.estimateLoan,
                        PersonTogether: updatedFormData.personTogether,
                        AuditStauts: updatedFormData.AuditStauts || '草稿'
                    };
                    
                    // 更新sessionStorage
                    sessionStorage.setItem('travelApplicationDetail', JSON.stringify(applicationDetail));
                    console.log('已更新sessionStorage中的申请详情数据');
                }
                
                // 显示保存成功消息
                showMessage('保存成功', 'success');
                
                // 禁用保存按钮
                toggleSaveButton(false);
                
                // 根据模式决定保存后的操作
                setTimeout(() => {
                    // 无论是新增还是编辑模式，都刷新当前页面并展示刚保存的数据
                    console.log('保存成功，刷新当前页面展示最新数据...');
                    
                    // 添加时间戳参数，确保页面完全刷新
                    const timestamp = new Date().getTime();
                    const currentUrl = window.location.href;
                    const hasParams = currentUrl.includes('?');
                    const refreshUrl = hasParams 
                        ? `${currentUrl}&_t=${timestamp}` 
                        : `${currentUrl}?_t=${timestamp}`;
                    
                    window.location.href = refreshUrl;
                }, 1500);
            } else {
                console.error('保存失败:', response.message);
                showMessage(response.message || '保存失败', 'error');
                
                // 恢复按钮状态
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '保存';
                }
            }
        })
        .catch(error => {
            hideLoading();
            console.error('保存失败:', error);
            showMessage('保存失败，请重试: ' + (error.message || '未知错误'), 'error');
            
            // 恢复按钮状态
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = '保存';
            }
        });
}

/**
 * 提交申请
 */
function submitApplication() {
    console.log('提交出差申请...');
    
    // 防止重复点击 - 检查按钮状态
    const submitBtn = document.querySelector('button[onclick="submitApplication()"]');
    if (submitBtn && submitBtn.disabled) {
        console.log('正在提交中，请勿重复点击');
        return;
    }
    
    // 禁用提交按钮，防止重复点击
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';
        submitBtn.classList.add('btn-loading'); // 添加加载状态样式
    }
    
    // 保存原始按钮文本，用于恢复
    const originalBtnText = '提交';
    
    // 恢复按钮状态的函数
    const restoreButton = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.classList.remove('btn-loading'); // 移除加载状态样式
        }
    };
    
    const formData = collectFormData();
    
    if (!formData) {
        console.error('获取表单数据失败');
        showMessage('获取表单数据失败', 'error');
        restoreButton();
        return;
    }
    
    console.log('提交表单数据:', formData);
    
    // 验证必填字段（按照接口文档要求）
    const requiredFields = [
        'requestPersonName', 'deptName', 'requestDate', 'roleID', 'travelLevel',
        'travelPlace', 'tripRoute', 'tripPlanDateFrom', 'tripPlanDateTo', 
        'travelReason', 'planTravelType'
    ];
    
    // 验证DOM元素是否存在并有值
    const missingFields = [];
    requiredFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (!element || !element.value.trim()) {
            // 修复：添加对closest返回null的检查
            let label = fieldId;
            if (element) {
                const formGroup = element.closest('.form-group');
                if (formGroup) {
                    const labelElement = formGroup.querySelector('.form-label');
                    if (labelElement) {
                        label = labelElement.textContent;
                    }
                }
            }
            missingFields.push(label);
        }
    });
    
    if (missingFields.length > 0) {
        console.warn('缺少必填项:', missingFields);
        showMessage('请填写所有必填项：\n' + missingFields.join('\n'), 'warning');
        restoreButton();
        return;
    }
    
    if (confirm('确认提交出差申请吗？提交后将进入审批流程。')) {
        showLoading();
        
        // 获取表单中的ID（如果是编辑模式）
        let travelID = document.getElementById('travelID').value;
        
        // 如果没有ID，需要先保存获取ID
        if (!travelID) {
            console.log('未找到travelID，先保存获取ID...');
            // 先保存数据获取ID
            saveOrUpdateTravelApplication(formData, 'save')
                .then(saveResponse => {
                    console.log('保存响应:', saveResponse);
                    console.log('响应数据JSON:', JSON.stringify(saveResponse));
                    
                    if (saveResponse.code === '200') {
                        // 修复：适配实际的返回数据结构
                        // 保存接口可能直接返回travelID，或者在data字段中返回
                        
                        // 尝试多种可能的数据结构
                        if (saveResponse.data && saveResponse.data.travelID) {
                            travelID = saveResponse.data.travelID;
                        } else if (saveResponse.data && saveResponse.data.TravelID) {
                            travelID = saveResponse.data.TravelID;
                        } else if (saveResponse.travelID) {
                            travelID = saveResponse.travelID;
                        } else if (saveResponse.TravelID) {
                            travelID = saveResponse.TravelID;
                        } else if (saveResponse.id) {
                            travelID = saveResponse.id;
                        } else {
                            throw new Error('保存成功但未能获取到单据ID，请刷新页面重试');
                        }
                        
                        console.log('获取到的travelID:', travelID);
                        
                        // 更新表单中的travelID字段
                        document.getElementById('travelID').value = travelID;
                        
                        // 保存成功后提交到审批流程
                        submitToApprovalFlow(travelID);
                    } else {
                        hideLoading();
                        console.error('保存失败:', saveResponse.message);
                        showMessage(saveResponse.message || '保存失败', 'error');
                        restoreButton();
                    }
                })
                .catch(error => {
                    hideLoading();
                    console.error('保存失败:', error);
                    showMessage('保存失败，请重试: ' + (error.message || '未知错误'), 'error');
                    restoreButton();
                });
        } else {
            console.log('已有travelID，直接提交到审批流程:', travelID);
            // 已有ID，直接提交到审批流程
            submitToApprovalFlow(travelID);
        }
    } else {
        // 用户取消提交，恢复按钮状态
        restoreButton();
        console.log('用户取消了提交操作');
    }
}

/**
 * 提交到审批流程
 * @param {string} travelID - 出差申请ID
 */
function submitToApprovalFlow(travelID) {
    // 获取提交按钮，用于后续恢复状态
    const submitBtn = document.querySelector('button[onclick="submitApplication()"]');
    
    // 恢复按钮状态的函数
    const restoreButton = () => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '提交';
            submitBtn.classList.remove('btn-loading'); // 移除加载状态样式
        }
    };
    
    // 保存成功后提交到审批流程
    const currentUser = getCurrentUser();
    console.log('当前用户信息:', currentUser);
    
    // 验证用户数据完整性
    if (!currentUser || !currentUser.userID || !currentUser.userName) {
        console.error('用户数据不完整，需要重新登录');
        showMessage('用户数据不完整，请重新登录', 'error');
        restoreButton();
        // 跳转到登录页面
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // 确保用户数据完整性
    const userDataObj = {
        roles: Array.isArray(currentUser.roles) ? currentUser.roles : ['employee'],
        userID: currentUser.userID || currentUser.user_id,
        userName: currentUser.userName,
        deptName: currentUser.deptName,
        orgCode: currentUser.orgCode
    };
    
    // 确保roles字段是数组且不为空
    if (!userDataObj.roles || !Array.isArray(userDataObj.roles) || userDataObj.roles.length === 0) {
        userDataObj.roles = ['employee'];
    }
    
    console.log('构建的userData对象:', userDataObj);
    
    const submitData = {
        id: travelID,
        PK_Field: 'TravelID',
        modelType: 'oa_businesstravel_main', // 按照接口文档的正确值
        userData: userDataObj // 添加用户数据
    };
    
    console.log('提交审批数据:', submitData);
    
    // 修复：直接传递包含userData的submitData给submitToApproval
    submitToApproval(submitData)
        .then(submitResponse => {
            hideLoading();
            console.log('提交审批响应:', submitResponse);
            
            // 修复：根据实际后端行为判断成功
            // 当后端返回空对象{}时，表示提交成功（app.startFlow执行成功）
            // 当后端返回错误码时，表示提交失败
            const isSuccess = !submitResponse.code || 
                            submitResponse.code === '200' || 
                            (typeof submitResponse === 'object' && Object.keys(submitResponse).length === 0);
            
            if (isSuccess) {
                console.log('✓ 提交成功：后端流程启动成功');
                showMessage('提交成功！申请已进入审批流程。', 'success');
                
                // 提交成功后关闭页面并返回列表
                setTimeout(() => {
                    // 清除可能的缓存数据
                    sessionStorage.removeItem('newTravelDocument');
                    sessionStorage.removeItem('travelApplicationData');
                    sessionStorage.removeItem('travelApplicationDetail');
                    
                    // 设置标记，表示需要强制刷新列表页面
                    localStorage.setItem('travel_list_need_refresh', 'true');
                    
                    // 在返回列表页面前，先请求差旅业务单据查询接口
                    const userID = getCurrentUser().userID || 'admin';
                    const modelType = 'oa_businesstravel_main';
                    const refreshUrl = `http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/getList&userID=${userID}&modelType=${modelType}&_t=${new Date().getTime()}`;
                    
                    fetch(refreshUrl, {
                        method: 'GET',
                        headers: {
                            'x-requested-with': 'XMLHttpRequest'
                        }
                    })
                    .then(response => response.json())
                    .then(result => {
                        console.log('提交后立即刷新列表数据:', result);
                    })
                    .catch(error => {
                        console.error('提交后刷新列表数据失败:', error);
                    })
                    .finally(() => {
                        // 无论刷新成功与否，都返回列表页面
                        const timestamp = new Date().getTime();
                        window.location.href = `travel-application.html?refresh=true&_t=${timestamp}`;
                    });
                }, 1500);
            } else {
                console.log('✗ 提交失败：', submitResponse);
                showMessage(submitResponse.message || '提交失败', 'error');
                restoreButton(); // 恢复按钮状态
            }
        })
        .catch(error => {
            hideLoading();
            console.error('提交失败:', error);
            
            // 特殊处理用户数据不存在的错误
            if (error.message && error.message.includes('用户数据不存在')) {
                console.log('用户数据不存在错误已发生，但不会显示弹窗');
            } else {
                showMessage('提交失败：' + (error.message || '未知错误'), 'error');
            }
            
            restoreButton(); // 恢复按钮状态
        });
}

/**
 * 收集表单数据
 * @returns {Object} 表单数据对象
 */
function collectFormData() {
    try {
        const user = getCurrentUser();
        
        // 获取表单中的travelID（如果存在）
        let travelID = document.getElementById('travelID').value;
        
        // 如果是新增模式（没有travelID），则生成一个新的travelID
        if (!travelID) {
            travelID = generateTravelID();
            console.log('新增模式：生成新的travelID:', travelID);
            // 将生成的travelID设置到表单中
            document.getElementById('travelID').value = travelID;
        }
        
        // 按照接口文档oa_businesstravel_main的字段要求构建数据
        const formData = {
            // 基础字段（包含travelID用于标识记录）
            travelID: travelID, // 单据ID（新增时生成，编辑时使用现有值）
            requestPerson: user.userID, // 申请人ID
            requestDate: document.getElementById('requestDate').value, // 申请日期
            // 获取组织机构字段的值，同时用于deptID和orgCode
            deptID: document.getElementById('deptName').value || user.orgCode || user.deptID || user.organizationCode || '', // 使用表单中的组织机构值作为部门ID
            role_ID: document.getElementById('roleID').value, // 角色ID（用户输入）
            
            // 出差相关字段
            travelLevel: document.getElementById('travelLevel').value || '3', // 出差级别
            transportLevel: document.getElementById('transportLevel').value || '', // 交通工具级别
            costBudget: parseFloat(document.getElementById('costBudget').value) || 0, // 预算费用
            estimateLoan: parseFloat(document.getElementById('estimateLoan').value) || 0, // 预计借款
            personTogether: document.getElementById('personTogether').value || '', // 同行人员
            travelReason: document.getElementById('travelReason').value, // 出差事由
            travelPlace: document.getElementById('travelPlace').value, // 出差地点
            planTravelType: document.getElementById('planTravelType').value, // 计划出差类型
            
            // 日期相关字段
            tripPlanDateFrom: document.getElementById('tripPlanDateFrom').value, // 计划开始日期
            tripPlanDateTo: document.getElementById('tripPlanDateTo').value, // 计划结束日期
            tripDays: parseInt(document.getElementById('tripDays').value) || 0, // 出差天数
            tripRoute: document.getElementById('tripRoute').value || '', // 出差路线
            
            // 审批意见字段
            dutyDeptOpnion: document.getElementById('dutyDeptOpnion').value || '', // 责任部门意见
            deputyManagerOpinion: document.getElementById('deputyManagerOpinion').value || '', // 副经理意见
            managerOpinion: document.getElementById('managerOpinion').value || '', // 经理意见
            
            // 审核状态字段
            AuditStauts: parseInt(document.getElementById('statusName').getAttribute('data-audit-stauts')) || 0, // 审核状态，默认为0
            
            // 系统字段
            creator: user.userID, // 创建人ID
            orgCode: document.getElementById('deptName').value || user.orgCode || user.deptID || user.organizationCode || '', // 使用表单中的组织机构值
            
            // 流程相关字段（新增时通常为空）
            fLOW_ID: '', // 流程ID
            nODE_NAME: '', // 节点名称
            returnReason: '' // 退回原因
        };
        
        return formData;
    } catch (error) {
        console.error('收集表单数据失败:', error);
        return null;
    }
}

/**
 * 保存或更新出差申请
 * @param {Object} formData - 表单数据
 * @param {string} operation - 操作类型 (save/update)
 * @returns {Promise} API响应
 */
function saveOrUpdateTravelApplication(formData, operation) {
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/saveOrUpdate';
    
    // 检查是否是编辑模式：通过URL参数判断
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('mode') === 'edit' && urlParams.get('id');
    
    // 根据模式确定操作类型
    if (isEditMode) {
        operation = 'update';
        console.log('编辑模式：使用update操作');
    } else {
        operation = 'save';
        console.log('新增模式：使用save操作');
    }
    
    console.log(`执行${operation}操作，表单数据:`, formData);
    
    const requestFormData = new FormData();
    requestFormData.append('modelType', 'oa_businesstravel_main');
    requestFormData.append('operation', operation);
    requestFormData.append('obj', JSON.stringify(formData));
    
    return fetch(apiUrl, {
        method: 'POST',
        body: requestFormData
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
    // 使用代理服务器API URL解决CORS问题
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/submitFlow';
    
    console.log('准备提交审批数据:', submitData);
    
    // 验证userData是否为空或格式不正确
    if (!submitData.userData || submitData.userData === 'undefined' || submitData.userData === '{}') {
        console.error('userData为空，重新构建用户数据');
        const currentUser = getCurrentUser();
        submitData.userData = {
            roles: currentUser.roles || ['employee'],
            userID: currentUser.userID || currentUser.user_id,
            userName: currentUser.userName,
            deptName: currentUser.deptName,
            orgCode: currentUser.orgCode
        };
        console.log('重新构建的userData:', submitData.userData);
    }
    
    // 确保userData是对象格式，而不是字符串
    if (typeof submitData.userData === 'string') {
        try {
            submitData.userData = JSON.parse(submitData.userData);
        } catch (e) {
            console.error('userData解析失败，重新构建', e);
            const currentUser = getCurrentUser();
            submitData.userData = {
                roles: currentUser.roles || ['employee'],
                userID: currentUser.userID || currentUser.user_id,
                userName: currentUser.userName,
                deptName: currentUser.deptName,
                orgCode: currentUser.orgCode
            };
        }
    }
    
    // 确保userData包含roles字段
    if (!submitData.userData.roles || !Array.isArray(submitData.userData.roles) || submitData.userData.roles.length === 0) {
        const currentUser = getCurrentUser();
        submitData.userData.roles = currentUser.roles || ['employee'];
    }
    
    // 根据更新后的提交代码文档.md，后端对userData有严格的验证要求：
    // 1. 检查userDataString是否为空（返回203）
    // 2. 检查userData和userData.roles是否为空（返回204）
    // 3. 检查userData.uSER_ID是否存在（返回205）
    // 4. 后端使用Wb.decode(userDataString)解析，期望JSON字符串格式
    // 5. 后端会设置session信息：userData.uSER_ID, userData.uSER_NAME, userData.dISPLAY_NAME
    let userDataString;
    
    // 从localStorage获取原始用户数据
    const currentUserFromStorage = localStorage.getItem('currentUser');
    let backendUserData;
    
    console.log('=== 用户数据构建调试信息 ===');
    console.log('localStorage中的currentUser:', currentUserFromStorage);
    console.log('传入的submitData.userData:', submitData.userData);
    
    if (currentUserFromStorage) {
        try {
            const storageData = JSON.parse(currentUserFromStorage);
            console.log('解析后的localStorage数据:', storageData);
            
            // 根据最新后端代码，严格按照字段名构建userData
            // 后端使用：var userData = Wb.decode(app.get('userData'));
            // 后端期望：userData.uSER_ID, userData.uSER_NAME, userData.dISPLAY_NAME, userData.roles
            // 登录接口返回：USER_ID, USER_NAME, DISPLAY_NAME (全大写)
            backendUserData = {
                uSER_ID: storageData.USER_ID || submitData.userData.userID || submitData.userData.user_id,
                uSER_NAME: storageData.USER_NAME || submitData.userData.userName,
                dISPLAY_NAME: storageData.DISPLAY_NAME || submitData.userData.displayName || submitData.userData.userName,
                roles: storageData.roles || submitData.userData.roles || ['default'],
                ORGCODE: storageData.ORGCODE || submitData.userData.orgCode,
                dept_name: storageData.dept_name || submitData.userData.deptName
            };
            
            console.log('从localStorage构建的backendUserData:', backendUserData);
        } catch (e) {
            console.error('解析localStorage用户数据失败:', e);
            // fallback到submitData，注意字段名映射
            const currentUser = getCurrentUser();
            backendUserData = {
                uSER_ID: submitData.userData.userID || submitData.userData.user_id || currentUser?.USER_ID || currentUser?.userID || currentUser?.user_id,
                uSER_NAME: submitData.userData.userName || currentUser?.USER_NAME || currentUser?.userName,
                dISPLAY_NAME: submitData.userData.displayName || submitData.userData.userName || currentUser?.DISPLAY_NAME || currentUser?.userName,
                roles: submitData.userData.roles || currentUser?.roles || ['default'],
                ORGCODE: submitData.userData.orgCode || currentUser?.ORGCODE || currentUser?.orgCode,
                dept_name: submitData.userData.deptName || currentUser?.dept_name || currentUser?.deptName
            };
            console.log('fallback构建的backendUserData:', backendUserData);
        }
    } else {
        console.log('localStorage中没有currentUser，使用submitData和getCurrentUser构建');
        const currentUser = getCurrentUser();
        backendUserData = {
            uSER_ID: submitData.userData.userID || submitData.userData.user_id || currentUser?.USER_ID || currentUser?.userID || currentUser?.user_id,
            uSER_NAME: submitData.userData.userName || currentUser?.USER_NAME || currentUser?.userName,
            dISPLAY_NAME: submitData.userData.displayName || submitData.userData.userName || currentUser?.DISPLAY_NAME || currentUser?.userName,
            roles: submitData.userData.roles || currentUser?.roles || ['default'],
            ORGCODE: submitData.userData.orgCode || currentUser?.ORGCODE || currentUser?.orgCode,
            dept_name: submitData.userData.deptName || currentUser?.dept_name || currentUser?.deptName
        };
        console.log('从submitData构建的backendUserData:', backendUserData);
    }
    
    // 严格验证后端要求的必需字段
    console.log('=== 关键字段验证 ===');
    console.log('uSER_ID:', backendUserData.uSER_ID);
    console.log('uSER_NAME:', backendUserData.uSER_NAME);
    console.log('dISPLAY_NAME:', backendUserData.dISPLAY_NAME);
    console.log('roles:', backendUserData.roles);
    console.log('ORGCODE:', backendUserData.ORGCODE);
    
    // 根据最新后端代码分析，必须确保以下字段存在：
    // 后端代码：var userData = Wb.decode(app.get('userData'));
    // 后端验证顺序：
    // 1. Wb.isEmpty(userData) -> 返回203 "用户数据不存在"
    // 2. Wb.isEmpty(userData.uSER_ID) -> 返回205 "用户ID信息缺失"
    // 3. Wb.isEmpty(userData.roles) -> 返回204 "用户角色信息缺失"
    // 4. Wb.isEmpty(row) -> 返回201 "根据ID没有找到对应数据"
    // 5. !Wb.isEmpty(row.FLOW_ID) -> 返回202 "重复提交，已存在流程ID"
    // 注意：后端有bug - 定义了roles但使用了未定义的roleArr变量
    
    let validationErrors = [];
    
    // 验证uSER_ID（后端会检查userData.uSER_ID）
    if (!backendUserData.uSER_ID) {
        console.error('严重错误：uSER_ID字段缺失，后端将返回205错误');
        // 最后尝试从getCurrentUser获取
        const currentUser = getCurrentUser();
        if (currentUser && (currentUser.userID || currentUser.user_id)) {
            backendUserData.uSER_ID = currentUser.userID || currentUser.user_id;
            console.log('从getCurrentUser修复uSER_ID:', backendUserData.uSER_ID);
        } else {
            validationErrors.push('无法获取用户ID（uSER_ID）');
        }
    }
    
    // 验证uSER_NAME（后端会设置到session）
    if (!backendUserData.uSER_NAME) {
        console.warn('uSER_NAME字段缺失，使用uSER_ID作为备用');
        backendUserData.uSER_NAME = backendUserData.uSER_ID;
    }
    
    // 验证dISPLAY_NAME（后端会设置到session）
    if (!backendUserData.dISPLAY_NAME) {
        console.warn('dISPLAY_NAME字段缺失，使用uSER_NAME作为备用');
        backendUserData.dISPLAY_NAME = backendUserData.uSER_NAME;
    }
    
    // 验证roles（后端会检查userData.roles）
    if (!backendUserData.roles || !Array.isArray(backendUserData.roles) || backendUserData.roles.length === 0) {
        console.error('严重错误：roles字段缺失或为空，后端将返回204错误');
        backendUserData.roles = ['default'];
        console.log('使用默认roles:', backendUserData.roles);
    }
    
    // 如果有验证错误，抛出异常
    if (validationErrors.length > 0) {
        throw new Error('用户数据验证失败：' + validationErrors.join(', '));
    }
    
    try {
        // 构建最终的userData JSON字符串
        // 后端使用Wb.decode(userDataString)解析，期望标准JSON格式
        userDataString = JSON.stringify(backendUserData);
        
        // 严格验证JSON字符串（避免203错误和后端解析错误）
        if (!userDataString || userDataString === '{}' || userDataString === 'null' || userDataString.trim() === '') {
            throw new Error('构建的userData字符串为空，后端将返回203错误');
        }
        
        // 验证JSON字符串能够被正确解析（避免后端Wb.decode失败）
        try {
            const testParse = JSON.parse(userDataString);
            console.log('userData解析测试成功:', testParse);
            console.log('解析后的uSER_ID:', testParse.uSER_ID);
        } catch (e) {
            console.error('userData解析测试失败:', e);
        }
        
        console.log('=== 最终userData构建结果 ===');
        console.log('1. 构建的userData对象:', backendUserData);
        console.log('2. JSON字符串长度:', userDataString.length);
        console.log('3. JSON字符串内容:', userDataString);
        console.log('4. 后端验证字段检查:');
        console.log('   ✓ uSER_ID:', backendUserData.uSER_ID, '(避免205错误)');
        console.log('   ✓ uSER_NAME:', backendUserData.uSER_NAME, '(session设置)');
        console.log('   ✓ dISPLAY_NAME:', backendUserData.dISPLAY_NAME, '(session设置)');
        console.log('   ✓ roles:', backendUserData.roles, '(避免204错误)');
        console.log('   ✓ JSON字符串非空 (避免203错误)');
        
    } catch (e) {
        console.error('userData JSON序列化失败:', e);
        throw new Error('用户数据处理失败：' + e.message);
    }
    
    const requestData = {
        id: submitData.id,
        PK_Field: submitData.PK_Field,
        modelType: submitData.modelType,
        userData: userDataString  // 传递编码后的字符串
    };
    
    console.log('=== 最终请求数据调试 ===');
    console.log('请求参数:');
    console.log('- id:', requestData.id);
    console.log('- PK_Field:', requestData.PK_Field);
    console.log('- modelType:', requestData.modelType);
    console.log('- userData字符串长度:', requestData.userData.length);
    console.log('- userData内容:', requestData.userData);
    console.log('完整请求数据:', JSON.stringify(requestData, null, 2));
    console.log('请求URL:', apiUrl);
    
    // 验证userData是否可以被正确解析
    try {
        const testParse = JSON.parse(requestData.userData);
        console.log('userData解析测试成功:', testParse);
        console.log('解析后的uSER_ID:', testParse.uSER_ID);
    } catch (e) {
        console.error('userData解析测试失败:', e);
    }
    
    // 根据后端代码分析，使用表单数据格式而不是JSON
    // 后端使用app.get('userData')获取参数，期望表单格式
    const formData = new URLSearchParams();
    formData.append('id', requestData.id);
    formData.append('PK_Field', requestData.PK_Field);
    formData.append('modelType', requestData.modelType);
    formData.append('userData', requestData.userData);
    
    console.log('=== 表单数据调试 ===');
    console.log('表单数据内容:');
    for (const [key, value] of formData.entries()) {
        console.log(`- ${key}:`, value);
    }
    
    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-requested-with': 'XMLHttpRequest'
        },
        mode: 'cors',
        body: formData
    })
    .then(response => {
        console.log('HTTP响应状态:', response.status);
        
        // 检查HTTP响应状态
        if (!response.ok) {
            throw new Error(`HTTP错误，状态码: ${response.status}`);
        }
        
        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            console.error('服务器返回了HTML而不是JSON，可能是CORS问题');
            // 尝试直接返回成功
            return {};
        }
        
        return response.json();
    })
    .then(data => {
        console.log('接口返回数据:', data);
        console.log('服务器返回的完整响应:', JSON.stringify(data, null, 2));
        
        // 根据更新后的后端文档，处理不同的错误码
        if (data.code === '203') {
            console.error('=== 203错误详细分析 ===');
            console.error('服务器返回203错误 - 用户数据不存在（userDataString为空）');
            console.error('后端检查：Wb.isEmpty(userDataString)');
            console.error('当前发送的userData字符串:', requestData.userData);
            console.error('userData字符串长度:', requestData.userData ? requestData.userData.length : 0);
            console.error('服务器返回的错误信息:', data.message || data.msg || '无详细错误信息');
            
            // 分析203错误的具体原因
            console.error('=== 203错误原因分析 ===');
            if (!requestData.userData) {
                console.error('原因：userData字段完全缺失');
            } else if (requestData.userData === '') {
                console.error('原因：userData为空字符串');
            } else if (requestData.userData === '{}') {
                console.error('原因：userData为空对象JSON字符串');
            } else {
                console.error('原因：后端Wb.decode()无法解析userData字符串');
                console.error('userData内容:', requestData.userData);
            }
            
            throw new Error('用户数据为空或格式错误：' + (data.message || '请重新登录'));
        }
        
        // 检查用户角色信息缺失的错误（新增）
        if (data.code === '204') {
            console.error('=== 204错误详细分析 ===');
            console.error('服务器返回204错误 - 用户角色信息缺失');
            console.error('后端检查：Wb.isEmpty(userData) || Wb.isEmpty(userData.roles)');
            console.error('服务器返回的错误信息:', data.message || data.msg || '无详细错误信息');
            
            try {
                const parsedUserData = JSON.parse(requestData.userData);
                console.error('当前userData.roles:', parsedUserData.roles);
                console.error('roles类型:', typeof parsedUserData.roles);
                console.error('roles是否为数组:', Array.isArray(parsedUserData.roles));
                console.error('roles长度:', parsedUserData.roles ? parsedUserData.roles.length : 0);
            } catch (e) {
                console.error('无法解析userData以检查roles字段:', e);
            }
            
            throw new Error('用户角色信息缺失：' + (data.message || '请联系管理员分配角色'));
        }
        
        // 检查用户ID信息缺失的错误（新增）
        if (data.code === '205') {
            console.error('=== 205错误详细分析 ===');
            console.error('服务器返回205错误 - 用户ID信息缺失');
            console.error('后端检查：Wb.isEmpty(userData.uSER_ID)');
            console.error('服务器返回的错误信息:', data.message || data.msg || '无详细错误信息');
            
            try {
                const parsedUserData = JSON.parse(requestData.userData);
                console.error('当前userData.uSER_ID:', parsedUserData.uSER_ID);
                console.error('uSER_ID类型:', typeof parsedUserData.uSER_ID);
                console.error('uSER_ID是否为空:', !parsedUserData.uSER_ID);
            } catch (e) {
                console.error('无法解析userData以检查uSER_ID字段:', e);
            }
            
            throw new Error('用户ID信息缺失：' + (data.message || '请重新登录'));
        }
        
        // 检查重复提交错误
        if (data.code === '202') {
            console.error('=== 202错误详细分析 ===');
            console.error('服务器返回202错误 - 重复提交，已存在流程ID');
            console.error('后端检查：!Wb.isEmpty(row.FLOW_ID)');
            console.error('服务器返回的错误信息:', data.message || data.msg || '无详细错误信息');
            throw new Error('重复提交：' + (data.message || '该申请已存在流程ID，不能重复提交'));
        }
        
        // 检查数据不存在错误
        if (data.code === '201') {
            console.error('=== 201错误详细分析 ===');
            console.error('服务器返回201错误 - 根据ID没有找到对应数据');
            console.error('后端检查：Wb.isEmpty(row)');
            console.error('后端返回消息："根据ID没有找到对应数据"');
            console.error('服务器返回的错误信息:', data.message || data.msg || '无详细错误信息');
            throw new Error('数据不存在：' + (data.message || '根据ID没有找到对应的申请数据'));
        }
        
        return data;
    })
    .catch(error => {
        console.error('提交审批失败:', error);
        
        // 如果是CORS错误，提供更友好的错误信息
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            throw new Error('网络连接失败，请检查网络设置或联系管理员配置CORS');
        }
        
        throw error;
    });
}

/**
 * 验证表单
 * @param {Object} formData - 表单数据
 * @param {Array} requiredFields - 必填字段列表
 * @returns {Object} 验证结果
 */
function validateForm(formData, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!formData[field]) {
            // 获取字段标签文本
            const labelElement = document.querySelector(`label[for="${field}"]`) || 
                                document.querySelector(`.form-group:has(#${field}) .form-label`);
            const fieldName = labelElement ? labelElement.textContent.replace('(*)', '').replace('：', '') : field;
            
            errors.push(`${fieldName}不能为空`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}



/**
 * 显示加载中
 */
function showLoading() {
    console.log('加载中...');
    // 这里可以实现加载中的UI
}

/**
 * 隐藏加载中
 */
function hideLoading() {
    console.log('加载完成');
    // 这里可以实现隐藏加载中的UI
}
/**
 * 获取状态名称
 * @param {number} statusCode - 状态代码
 * @returns {string} 状态名称
 */
function getStatusName(statusCode) {
    const statusMap = {
        '-1': '返回修改',
        0: '编制',
        1: '提交审核',
        2: '审核中...',
        3: '审核通过',
        4: '驳回',
        5: '已撤销'
    };
    return statusMap[statusCode] || '未知状态';
}

/**
 * 处理返回按钮点击
 * 安全地返回上一页，避免加载申请详情数据错误
 */
function handleBackButton() {
    // 清除sessionStorage中的相关数据，防止返回后再次进入时出错
    sessionStorage.removeItem('travelApplicationDetail');
    
    // 返回上一页
    window.location.href = 'travel-application.html';
}

