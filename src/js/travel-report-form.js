/**
 * 出差报告单表单页面 JavaScript
 * 处理出差报告单表单的交互逻辑和数据提交
 */

// 表单状态管理
let formState = {
    isModified: false,
    initialData: {},
    currentMode: 'create' // create, edit, view
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('出差报告单表单页面已加载');
    initializePage();
});

/**
 * 初始化页面
 */
function initializePage() {
    // 检查页面模式
    checkPageMode();
    
    // 设置表单默认值
    setFormDefaults();
    
    // 保存初始状态
    saveInitialState();
    
    // 绑定表单变化事件
    bindFormChangeEvents();
    
    // 绑定日期变化事件
    bindDateChangeEvents();
    
    // 绑定费用计算事件
    bindCostCalculationEvents();
    
    // 根据模式设置页面状态
    setPageModeState();
}

/**
 * 检查页面模式
 */
function checkPageMode() {
    const mode = sessionStorage.getItem('travelReportFormMode');
    const viewId = sessionStorage.getItem('viewTravelReportId');
    const editId = sessionStorage.getItem('editTravelReportId');
    
    if (mode === 'view' && viewId) {
        formState.currentMode = 'view';
        loadApplicationData(viewId);
    } else if (mode === 'edit' && editId) {
        formState.currentMode = 'edit';
        loadApplicationData(editId);
    } else {
        formState.currentMode = 'create';
        loadNewApplicationData();
    }
}

/**
 * 加载新申请数据
 */
function loadNewApplicationData() {
    const newDocumentData = sessionStorage.getItem('newTravelReportDocument');
    if (newDocumentData) {
        try {
            const documentInfo = JSON.parse(newDocumentData);
            // 设置生成的单据信息
            setFieldValue('travelReportID', documentInfo.travelReportID);
            setFieldValue('reportNo', documentInfo.reportNo);
            setFieldValue('createTime', documentInfo.createTime);
            
            // 清除sessionStorage中的数据
            sessionStorage.removeItem('newTravelReportDocument');
        } catch (error) {
            console.error('解析新单据数据失败:', error);
        }
    }
}

/**
 * 加载申请数据
 * @param {string} applicationId 申请ID
 */
function loadApplicationData(applicationId) {
    // 显示加载状态
    showLoading('正在加载申请数据...');
    
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/getList';
    const requestData = {
        modelType: 'oa_businesstravel_report',
        userID: getCurrentUser().userID || 'admin',
        travelReportID: applicationId
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
        hideLoading();
        
        if (result.code === '200' && result.data && result.data.list && result.data.list.length > 0) {
            const applicationData = result.data.list[0];
            populateForm(applicationData);
        } else {
            console.error('获取申请数据失败:', result.message);
            showMessage('获取申请数据失败', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('加载申请数据失败:', error);
        showMessage('加载申请数据失败，请重试', 'error');
    });
}

/**
 * 填充表单数据
 * @param {Object} data 申请数据
 */
function populateForm(data) {
    // 基本信息
    setFieldValue('travelReportID', data.travelReportID);
    setFieldValue('reportNo', data.reportNo);
    setFieldValue('travelApplicationID', data.travelApplicationID);
    setFieldValue('reporter', data.reporter);
    setFieldValue('reportDate', formatDateForInput(data.reportDate));
    setFieldValue('department', data.department);
    setFieldValue('position', data.position);
    
    // 出差信息
    setFieldValue('startDate', formatDateForInput(data.startDate));
    setFieldValue('endDate', formatDateForInput(data.endDate));
    setFieldValue('destination', data.destination);
    setFieldValue('purpose', data.purpose);
    setFieldValue('vehicle', data.vehicle);
    setFieldValue('accommodation', data.accommodation);
    
    // 报告内容
    setFieldValue('workSummary', data.workSummary);
    setFieldValue('achievement', data.achievement);
    setFieldValue('problems', data.problems);
    setFieldValue('suggestions', data.suggestions);
    
    // 费用信息
    setFieldValue('transportCost', data.transportCost);
    setFieldValue('accommodationCost', data.accommodationCost);
    setFieldValue('mealCost', data.mealCost);
    setFieldValue('otherCost', data.otherCost);
    setFieldValue('totalCost', data.totalCost);
    
    // 其他信息
    setFieldValue('remark', data.remark);
    setFieldValue('auditStatus', data.auditStatus);
    setFieldValue('createTime', formatDateTime(data.createTime));
    
    // 保存初始状态
    saveInitialState();
}

/**
 * 设置表单默认值
 */
function setFormDefaults() {
    const currentUser = getCurrentUser();
    
    // 设置报告人信息
    if (currentUser) {
        setFieldValue('reporter', currentUser.userName || currentUser.userID);
        setFieldValue('department', currentUser.orgName || '');
        setFieldValue('position', currentUser.position || '');
    }
    
    // 设置报告日期为当前日期
    const today = new Date();
    setFieldValue('reportDate', formatDateForInput(today));
    
    // 生成报告单号（如果是新建）
    if (formState.currentMode === 'create') {
        generateApplicationNumber();
    }
    
    // 设置默认审核状态
    setFieldValue('auditStatus', 'draft');
    
    // 设置创建时间
    if (formState.currentMode === 'create') {
        setFieldValue('createTime', formatDateTime(new Date()));
    }
    
    // 加载关联出差单列表
    loadTravelApplications();
}

/**
 * 生成申请单号
 */
function generateApplicationNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    const applicationNumber = `CCBG${year}${month}${day}${random}`;
    setFieldValue('reportNo', applicationNumber);
}

/**
 * 加载关联出差单列表
 */
function loadTravelApplications() {
    const selectElement = document.getElementById('travelApplicationID');
    if (!selectElement) return;
    
    // 调用API获取已批准的出差申请单
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/getList';
    const requestData = {
        modelType: 'oa_businesstravel_main',
        userID: getCurrentUser().userID || 'admin',
        auditStatus: 'approved',
        pageSize: 100,
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
            // 清空现有选项（保留默认选项）
            selectElement.innerHTML = '<option value="">请选择关联出差单</option>';
            
            // 添加出差申请单选项
            result.data.list.forEach(item => {
                const option = document.createElement('option');
                option.value = item.travelApplicationID;
                option.textContent = `${item.applicationNo} - ${item.destination} (${formatDate(item.startDate)})`;
                selectElement.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('加载关联出差单失败:', error);
    });
}

/**
 * 保存初始状态
 */
function saveInitialState() {
    const formData = getFormData();
    formState.initialData = JSON.parse(JSON.stringify(formData));
    formState.isModified = false;
    updateSaveButtonState();
}

/**
 * 检测表单是否有修改
 */
function detectFormChanges() {
    const currentData = getFormData();
    const initialData = formState.initialData;
    
    // 比较当前数据和初始数据
    formState.isModified = !isObjectEqual(currentData, initialData);
    updateSaveButtonState();
}

/**
 * 更新保存按钮状态
 */
function updateSaveButtonState() {
    const saveButton = document.getElementById('saveButton');
    const submitButton = document.getElementById('submitButton');
    
    if (saveButton) {
        if (formState.currentMode === 'view') {
            saveButton.style.display = 'none';
        } else {
            saveButton.style.display = 'inline-block';
            saveButton.disabled = !formState.isModified;
        }
    }
    
    if (submitButton) {
        if (formState.currentMode === 'view') {
            submitButton.style.display = 'none';
        } else {
            submitButton.style.display = 'inline-block';
        }
    }
}

/**
 * 绑定表单变化事件
 */
function bindFormChangeEvents() {
    const form = document.getElementById('travelReportForm');
    if (!form) return;
    
    // 监听所有输入字段的变化
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', detectFormChanges);
        input.addEventListener('change', detectFormChanges);
    });
}

/**
 * 绑定日期变化事件
 */
function bindDateChangeEvents() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', calculateDays);
        endDateInput.addEventListener('change', calculateDays);
    }
}

/**
 * 绑定费用计算事件
 */
function bindCostCalculationEvents() {
    const costFields = ['transportCost', 'accommodationCost', 'mealCost', 'otherCost'];
    
    costFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', calculateTotalCost);
            field.addEventListener('change', calculateTotalCost);
        }
    });
}

/**
 * 计算出差天数
 */
function calculateDays() {
    const startDate = getFieldValue('startDate');
    const endDate = getFieldValue('endDate');
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end >= start) {
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            // 可以在这里显示天数信息
            console.log(`出差天数: ${diffDays}天`);
        }
    }
}

/**
 * 计算费用总计
 */
function calculateTotalCost() {
    const transportCost = parseFloat(getFieldValue('transportCost')) || 0;
    const accommodationCost = parseFloat(getFieldValue('accommodationCost')) || 0;
    const mealCost = parseFloat(getFieldValue('mealCost')) || 0;
    const otherCost = parseFloat(getFieldValue('otherCost')) || 0;
    
    const totalCost = transportCost + accommodationCost + mealCost + otherCost;
    setFieldValue('totalCost', totalCost.toFixed(2));
}

/**
 * 设置页面模式状态
 */
function setPageModeState() {
    const form = document.getElementById('travelReportForm');
    const pageTitle = document.querySelector('.page-title');
    
    if (formState.currentMode === 'view') {
        // 查看模式：禁用所有输入
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.disabled = true;
            });
        }
        
        if (pageTitle) {
            pageTitle.textContent = '查看出差报告单';
        }
    } else if (formState.currentMode === 'edit') {
        if (pageTitle) {
            pageTitle.textContent = '编辑出差报告单';
        }
    } else {
        if (pageTitle) {
            pageTitle.textContent = '新增出差报告单';
        }
    }
    
    updateSaveButtonState();
}

/**
 * 保存申请
 */
function saveApplication() {
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    
    // 显示保存状态
    showLoading('正在保存...');
    
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/saveOrUpdate';
    
    const requestData = {
        modelType: 'oa_businesstravel_report',
        userID: getCurrentUser().userID || 'admin',
        obj: JSON.stringify(formData)
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
        hideLoading();
        
        if (result.code === '200') {
            showMessage('保存成功', 'success');
            
            // 更新表单状态
            saveInitialState();
            
            // 如果是新建，更新为编辑模式
            if (formState.currentMode === 'create') {
                formState.currentMode = 'edit';
                setPageModeState();
            }
        } else {
            showMessage(result.message || '保存失败', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('保存申请失败:', error);
        showMessage('保存失败，请重试', 'error');
    });
}

/**
 * 提交申请
 */
function submitApplication() {
    if (!validateForm()) {
        return;
    }
    
    // 确认提交
    if (!confirm('确定要提交申请吗？提交后将无法修改。')) {
        return;
    }
    
    const formData = getFormData();
    
    // 显示提交状态
    showLoading('正在提交...');
    
    const apiUrl = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/businesstravel/businesstravel/submitFlow';
    
    const requestData = {
        modelType: 'oa_businesstravel_report',
        userID: getCurrentUser().userID || 'admin',
        obj: JSON.stringify(formData)
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
        hideLoading();
        
        if (result.code === '200') {
            showMessage('提交成功', 'success');
            
            // 延迟返回列表页面
            setTimeout(() => {
                goBack();
            }, 1500);
        } else {
            showMessage(result.message || '提交失败', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('提交申请失败:', error);
        showMessage('提交失败，请重试', 'error');
    });
}

/**
 * 表单验证
 */
function validateForm() {
    const requiredFields = [
        { id: 'reportNo', name: '报告编号' },
        { id: 'reporter', name: '报告人' },
        { id: 'reportDate', name: '报告日期' },
        { id: 'startDate', name: '开始日期' },
        { id: 'endDate', name: '结束日期' },
        { id: 'destination', name: '目的地' },
        { id: 'purpose', name: '出差目的' },
        { id: 'workSummary', name: '工作总结' }
    ];
    
    for (const field of requiredFields) {
        const value = getFieldValue(field.id);
        if (!value || value.trim() === '') {
            showMessage(`请填写${field.name}`, 'error');
            focusField(field.id);
            return false;
        }
    }
    
    // 验证日期逻辑
    const startDate = new Date(getFieldValue('startDate'));
    const endDate = new Date(getFieldValue('endDate'));
    
    if (endDate < startDate) {
        showMessage('结束日期不能早于开始日期', 'error');
        focusField('endDate');
        return false;
    }
    
    return true;
}

/**
 * 获取表单数据
 */
function getFormData() {
    return {
        travelReportID: getFieldValue('travelReportID'),
        reportNo: getFieldValue('reportNo'),
        travelApplicationID: getFieldValue('travelApplicationID'),
        reporter: getFieldValue('reporter'),
        reportDate: getFieldValue('reportDate'),
        department: getFieldValue('department'),
        position: getFieldValue('position'),
        startDate: getFieldValue('startDate'),
        endDate: getFieldValue('endDate'),
        destination: getFieldValue('destination'),
        purpose: getFieldValue('purpose'),
        vehicle: getFieldValue('vehicle'),
        accommodation: getFieldValue('accommodation'),
        workSummary: getFieldValue('workSummary'),
        achievement: getFieldValue('achievement'),
        problems: getFieldValue('problems'),
        suggestions: getFieldValue('suggestions'),
        transportCost: getFieldValue('transportCost'),
        accommodationCost: getFieldValue('accommodationCost'),
        mealCost: getFieldValue('mealCost'),
        otherCost: getFieldValue('otherCost'),
        totalCost: getFieldValue('totalCost'),
        remark: getFieldValue('remark'),
        auditStatus: getFieldValue('auditStatus'),
        createTime: getFieldValue('createTime')
    };
}

/**
 * 返回上一页
 */
function goBack() {
    // 清除sessionStorage中的相关数据
    sessionStorage.removeItem('travelReportFormMode');
    sessionStorage.removeItem('viewTravelReportId');
    sessionStorage.removeItem('editTravelReportId');
    sessionStorage.removeItem('newTravelReportDocument');
    
    // 检查是否有未保存的修改
    if (formState.isModified && formState.currentMode !== 'view') {
        if (confirm('有未保存的修改，确定要离开吗？')) {
            window.location.href = 'travel-report.html';
        }
    } else {
        window.location.href = 'travel-report.html';
    }
}