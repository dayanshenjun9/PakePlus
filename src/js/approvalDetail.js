/**
 * 审批详情模块
 * 处理审批详情的获取和展示
 */

/**
 * 获取审批详情信息
 * @param {string} flowId - 流程ID
 * @param {string} flowName - 流程名称
 * @returns {Promise} 审批详情数据
 */
async function getApprovalInfo(flowId, flowName) {
    try {
        // 确保参数不为空
        if (!flowId) {
            console.error('流程ID不能为空');
            throw new Error('流程ID不能为空');
        }
        
        // 使用正确的审批详情接口路径
        const url = `http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/approval/getApprovalInfo&flow_id=${encodeURIComponent(flowId)}`;
        console.log('获取审批详情，请求URL:', url);
        
        // 移除Content-Type头部，只保留x-requested-with头部以解决CORS问题
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-requested-with': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP错误: ${response.status}`, errorText);
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('审批详情API返回结果:', result);
        
        // 验证返回的数据结构
        if (!result) {
            console.error('审批详情API返回空结果');
            throw new Error('获取审批详情失败，返回结果为空');
        }
        
        if (result.code !== '200') {
            console.error('审批详情API返回错误码:', result.code, '错误信息:', result.message);
            throw new Error(`获取审批详情失败: ${result.message || '未知错误'}`);
        }
        
        if (!result.data) {
            console.error('审批详情API返回数据为空');
            throw new Error('获取审批详情失败，返回数据为空');
        }
        
        // 检查data是否为空对象
        if (Object.keys(result.data).length === 0) {
            console.error('审批详情API返回空对象数据');
            throw new Error('获取审批详情失败，返回数据为空对象');
        }
        
        // 检查必要的数据字段是否存在 - 根据新接口调整字段检查
        // 注意：新接口可能不包含mainRecord_ZH和detailRecords_ZH字段
        const hasUsersData = result.data.usersData && Array.isArray(result.data.usersData);
        if (!hasUsersData) {
            console.error('审批详情API返回数据缺少关键字段', {
                'usersData': !!result.data.usersData && Array.isArray(result.data.usersData)
            });
            // 不抛出错误，让渲染函数处理这种情况
            console.warn('审批详情数据不完整，但将继续处理');
        }
        
        return result;
    } catch (error) {
        console.error('获取审批详情错误:', error);
        throw error;
    }
}

/**
 * 解析主记录数据
 * @param {string} mainRecordStr - 主记录JSON字符串
 * @returns {object} 解析后的主记录对象
 */
function parseMainRecord(mainRecordStr) {
    if (!mainRecordStr) {
        console.warn('主记录数据为空');
        return {};
    }
    
    try {
        // 尝试解析JSON字符串
        return JSON.parse(mainRecordStr);
    } catch (error) {
        console.error('解析主记录数据失败:', error, '原始数据:', mainRecordStr);
        return {};
    }
}

/**
 * 解析详细记录数据
 * @param {string} detailRecordsStr - 详细记录JSON字符串
 * @returns {Array} 解析后的详细记录数组
 */
function parseDetailRecords(detailRecordsStr) {
    if (!detailRecordsStr) {
        console.warn('详细记录数据为空');
        return [];
    }
    
    try {
        // 尝试解析JSON字符串
        return JSON.parse(detailRecordsStr);
    } catch (error) {
        console.error('解析详细记录数据失败:', error, '原始数据:', detailRecordsStr);
        return [];
    }
}

/**
 * 显示错误提示
 * @param {string} message - 错误信息
 * @param {string} containerId - 容器ID
 */
function showErrorMessage(message, containerId = 'approvalDetailContent') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 创建错误提示元素
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <div class="error-icon">!</div>
        <div class="error-text">${message}</div>
        <button class="error-retry" onclick="retryLoadApprovalDetail()">重试</button>
    `;
    
    container.appendChild(errorElement);
}

/**
 * 重试加载审批详情
 */
function retryLoadApprovalDetail() {
    // 获取当前审批信息
    const currentApproval = window.ApprovalState?.currentApproval;
    if (!currentApproval) {
        console.error('无法获取当前审批信息');
        return;
    }
    
    // 重新调用查看审批详情函数
    if (typeof window.viewApprovalDetail === 'function') {
        window.viewApprovalDetail(currentApproval);
    }
}

/**
 * 渲染审批详情
 * @param {object} approvalInfo - 审批详情数据
 */
function renderApprovalInfo(approvalInfo) {
    if (!approvalInfo || !approvalInfo.data) {
        console.error('审批详情数据为空');
        showErrorMessage('获取审批详情失败，数据为空');
        return;
    }
    
    const data = approvalInfo.data;
    console.log('渲染审批详情:', data);
    
    // 检查data是否为空对象
    if (Object.keys(data).length === 0) {
        console.error('审批详情数据为空对象');
        showErrorMessage('审批详情数据不完整，请联系管理员');
        return;
    }
    
    // 检查必要的数据字段是否存在 - 适配新接口
    const hasUsersData = data.usersData && Array.isArray(data.usersData);
    if (!hasUsersData) {
        console.error('审批详情缺少关键数据字段', {
            'usersData': !!data.usersData && Array.isArray(data.usersData)
        });
        showErrorMessage('审批详情数据不完整，请联系管理员');
        return;
    }
    
    // 处理主记录和详细记录 - 适配新接口
    // 新接口可能直接返回流程信息，而不是通过mainRecord_ZH和detailRecords_ZH字段
    const mainRecord = data.mainRecord_ZH ? parseMainRecord(data.mainRecord_ZH) : data;
    const detailRecords = data.detailRecords_ZH ? parseDetailRecords(data.detailRecords_ZH) : [];
    const mainDtTab = data.mainDtTab || {};
    const usersData = data.usersData || [];
    
    console.log('解析后的主记录:', mainRecord);
    console.log('解析后的详细记录:', detailRecords);
    console.log('主表信息:', mainDtTab);
    console.log('用户数据:', usersData);
    
    // 更新基本信息区域
    updateBasicInfo(mainRecord, mainDtTab);
    
    // 渲染详细信息区域
    renderDetailInfo(mainRecord, detailRecords);
    
    // 渲染审批历史
    renderApprovalHistory(usersData);
    
    // 检查当前节点是否为"开始"，如果是则隐藏审批按钮
    const nodeName = mainRecord.node_name || mainRecord.NODE_NAME || mainDtTab.node_name || mainDtTab.NODE_NAME;
    if (nodeName === '开始') {
        console.log('当前节点为"开始"，隐藏审批按钮');
        const approvalRemark = document.getElementById('approvalRemark');
        const approvalRemarkSection = approvalRemark ? approvalRemark.closest('.detail-section') : null;
        const modalFooter = document.querySelector('.modal-footer');
        
        if (approvalRemarkSection) {
            approvalRemarkSection.style.display = 'none';
        }
        if (modalFooter) {
            modalFooter.style.display = 'none';
        }
        
        // 添加提示信息
        const detailContentContainer = document.getElementById('approvalDetailContent');
        if (detailContentContainer) {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'approval-note';
            noteDiv.innerHTML = '<i>当前流程节点为"开始"，无需审批操作</i>';
            noteDiv.style.color = '#666';
            noteDiv.style.fontStyle = 'italic';
            noteDiv.style.margin = '10px 0';
            noteDiv.style.padding = '8px';
            noteDiv.style.backgroundColor = '#f9f9f9';
            noteDiv.style.borderRadius = '4px';
            noteDiv.style.textAlign = 'center';
            detailContentContainer.appendChild(noteDiv);
        }
    }
}

/**
 * 更新基本信息区域
 * @param {object} mainRecord - 主记录数据
 * @param {object} mainDtTab - 主表信息
 */
function updateBasicInfo(mainRecord, mainDtTab) {
    // 更新申请人信息
    if (mainRecord.申请人) {
        document.getElementById('applicantName').textContent = mainRecord.申请人 || '-';
    }
    
    // 更新申请部门
    if (mainRecord.员工部门) {
        document.getElementById('applyDepartment').textContent = mainRecord.员工部门 || '-';
    }
    
    // 更新流程名称
    if (mainDtTab.flowName) {
        document.getElementById('flowName').textContent = mainDtTab.flowName || '-';
    }
    
    // 更新其他基本信息字段
    // 这里可以根据实际需求添加更多字段的更新
}

/**
 * 渲染详细信息区域
 * @param {object} mainRecord - 主记录数据
 * @param {Array} detailRecords - 详细记录数组
 */
function renderDetailInfo(mainRecord, detailRecords) {
    const detailContainer = document.getElementById('approvalDetailContent');
    if (!detailContainer) return;
    
    // 清空现有内容
    detailContainer.innerHTML = '';
    
    // 确保参数是有效的对象和数组
    mainRecord = mainRecord || {};
    detailRecords = Array.isArray(detailRecords) ? detailRecords : [];
    
    // 检查主记录是否为空对象
    const hasMainRecord = mainRecord && Object.keys(mainRecord).length > 0;
    
    // 检查详细记录是否为空数组
    const hasDetailRecords = detailRecords && Array.isArray(detailRecords) && detailRecords.length > 0;
    
    // 如果主记录和详细记录都为空，显示提示信息
    if (!hasMainRecord && !hasDetailRecords) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-detail-message';
        emptyMessage.textContent = '暂无详细信息数据';
        detailContainer.appendChild(emptyMessage);
        return;
    }
    
    // 创建详细信息标题
    const detailTitle = document.createElement('h4');
    detailTitle.textContent = '详细信息';
    detailContainer.appendChild(detailTitle);
    
    // 渲染主记录字段
    if (hasMainRecord) {
        const mainRecordFields = document.createElement('div');
        mainRecordFields.className = 'detail-fields';
        
        // 遍历主记录字段并显示
        for (const key in mainRecord) {
            if (mainRecord.hasOwnProperty(key) && mainRecord[key]) {
                const fieldItem = document.createElement('div');
                fieldItem.className = 'detail-item';
                
                // 检查字段是否为附件
                if (isAttachmentField(key, mainRecord[key])) {
                    console.log(`主记录字段 ${key} 被识别为附件:`, mainRecord[key]);
                    const attachmentHtml = createAttachmentLink(mainRecord[key]);
                    console.log(`主记录生成的附件HTML:`, attachmentHtml);
                    fieldItem.innerHTML = `
                        <span class="label">${key}：</span>
                        <span class="value">${attachmentHtml}</span>
                    `;
                } else {
                    fieldItem.innerHTML = `
                        <span class="label">${key}：</span>
                        <span class="value">${mainRecord[key]}</span>
                    `;
                }
                
                mainRecordFields.appendChild(fieldItem);
            }
        }
        
        detailContainer.appendChild(mainRecordFields);
    }
    
    // 如果有详细记录，渲染详细记录
    if (hasDetailRecords) {
        const detailRecordsTitle = document.createElement('h4');
        detailRecordsTitle.textContent = '明细信息';
        detailRecordsTitle.style.marginTop = '15px';
        detailContainer.appendChild(detailRecordsTitle);
        
        // 创建明细表格容器
        const detailTable = document.createElement('div');
        detailTable.className = 'detail-table';
        
        // 创建表格内容容器
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        
        // 添加表头（如果有数据）
        if (detailRecords.length > 0 && typeof detailRecords[0] === 'object') {
            const tableHeader = document.createElement('div');
            tableHeader.className = 'table-header';
            
            // 获取第一条记录的所有字段作为表头
            const headerFields = Object.keys(detailRecords[0]);
            headerFields.forEach(field => {
                const headerCell = document.createElement('div');
                headerCell.className = 'header-cell';
                headerCell.textContent = field;
                // 根据内容长度动态调整宽度
                const contentLength = Math.max(field.length, ...detailRecords.map(record => 
                    String(record[field] || '').length
                ));
                const cellWidth = Math.min(Math.max(contentLength * 8 + 20, 100), 200);
                headerCell.style.width = cellWidth + 'px';
                headerCell.style.minWidth = cellWidth + 'px';
                headerCell.style.maxWidth = cellWidth + 'px';
                tableHeader.appendChild(headerCell);
            });
            
            tableContainer.appendChild(tableHeader);
            
            // 添加表格内容
            detailRecords.forEach(record => {
                const tableRow = document.createElement('div');
                tableRow.className = 'table-row';
                
                headerFields.forEach((field, index) => {
                    const cell = document.createElement('div');
                    cell.className = 'table-cell';
                    
                    // 检查是否为附件链接
                    const cellValue = record[field] || '-';
                    if (isAttachmentField(field, cellValue)) {
                        cell.innerHTML = createAttachmentLink(cellValue, field);
                    } else {
                        cell.textContent = cellValue;
                    }
                    
                    // 保持与表头相同的宽度
                    const headerCell = tableHeader.children[index];
                    if (headerCell) {
                        const cellWidth = headerCell.style.width;
                        cell.style.width = cellWidth;
                        cell.style.minWidth = cellWidth;
                        cell.style.maxWidth = cellWidth;
                    }
                    
                    tableRow.appendChild(cell);
                });
                
                tableContainer.appendChild(tableRow);
            });
        }
        
        detailTable.appendChild(tableContainer);
        detailContainer.appendChild(detailTable);
    }
}

/**
 * 渲染审批历史
 * @param {Array} usersData - 审批历史数据
 */
function renderApprovalHistory(usersData) {
    const historyContainer = document.getElementById('approvalHistory');
    if (!historyContainer) return;
    
    // 清空现有内容
    historyContainer.innerHTML = '';
    
    // 创建审批历史标题
    const historyTitle = document.createElement('h4');
    historyTitle.textContent = '审批历史';
    historyContainer.appendChild(historyTitle);
    
    // 如果没有历史数据，显示空状态
    if (!usersData || !Array.isArray(usersData) || usersData.length === 0) {
        const emptyHistory = document.createElement('div');
        emptyHistory.className = 'empty-history';
        emptyHistory.textContent = '暂无审批历史记录';
        historyContainer.appendChild(emptyHistory);
        return;
    }
    
    // 创建审批历史列表
    usersData.forEach((record, index) => {
        // 统一字段名称，处理不同的数据结构
        const userData = {
            userDispName: record.userDispName || record.display_name || record.userName || record.user_name || '-',
            nodeName: record.node_name || record.nodeName || record.title || '',
            node: record.node || '',
            approvalTime: record.approval_time || record.date || '-',
            remark: record.remark || record.comment || '',
            action: record.action || ''
        };
        
        // 确定图标样式 - 根据审批结果设置不同的颜色
        let iconStyle = '';
        
        // 根据审批结果或动作设置图标颜色
        if (userData.action === 'reject') {
            iconStyle = 'background-color: #f44336;'; // 红色表示驳回/拒绝
        } else if (userData.action === 'pass') {
            iconStyle = 'background-color: #4CAF50;'; // 绿色表示通过/同意
        } else {
            iconStyle = 'background-color: #2196F3;'; // 蓝色表示其他状态
        }
        
        // 是否为最后一项，最后一项不显示左侧时间线
        const isLast = index === usersData.length - 1;
        
        // 创建历史项
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        if (isLast) {
            historyItem.style.borderLeft = 'none';
        }
        
        // 设置历史项内容
        historyItem.innerHTML = `
            <div class="history-line">
                <div class="history-icon" style="${iconStyle}"></div>
                <div class="history-content">
                    <span class="history-user">${userData.userDispName}</span>
                    ${userData.nodeName ? `<span class="history-node">(${userData.nodeName})</span>` : ''}
                    ${userData.node ? `<span class="history-node-info">节点：${userData.node}</span>` : ''}
                </div>
            </div>
            <div class="history-time-line">
                <span class="history-time">${userData.approvalTime}</span>
            </div>
            ${userData.remark ? `<div class="history-remark">审批意见：${userData.remark}</div>` : ''}
            <div class="history-result">审批结果：${userData.action === 'pass' ? '通过' : userData.action === 'reject' ? '驳回' : userData.action}</div>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

/**
 * 判断字段是否为附件字段
 * @param {string} fieldName - 字段名称
 * @param {string} fieldValue - 字段值
 * @returns {boolean} 是否为附件字段
 */
function isAttachmentField(fieldName, fieldValue) {
    // 检查字段名是否包含附件相关关键词
    const attachmentKeywords = ['附件', '文件', 'attachment', 'file', '图片', 'image'];
    const fieldNameLower = fieldName.toLowerCase();
    const hasAttachmentKeyword = attachmentKeywords.some(keyword => 
        fieldNameLower.includes(keyword) || fieldName.includes(keyword)
    );
    
    if (!hasAttachmentKeyword || !fieldValue || fieldValue === '-') {
        return false;
    }
    
    // 检查字段值是否为JSON格式的附件数据
    try {
        const parsed = JSON.parse(fieldValue);
        // 检查是否包含附件对象的关键字段
        if (Array.isArray(parsed)) {
            // 如果是数组，检查第一个元素
            return parsed.length > 0 && isValidAttachmentObject(parsed[0]);
        } else {
            // 如果是单个对象，直接检查
            return isValidAttachmentObject(parsed);
        }
    } catch (e) {
        // 如果不是JSON，检查是否为URL格式
        const isUrl = /^https?:\/\/.+/.test(fieldValue) || /\.(jpg|jpeg|png|gif|bmp|webp|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(fieldValue);
        return isUrl;
    }
}

/**
 * 验证是否为有效的附件对象
 * @param {object} obj - 待验证的对象
 * @returns {boolean} 是否为有效的附件对象
 */
function isValidAttachmentObject(obj) {
    return obj && 
           typeof obj === 'object' && 
           (obj.AttachmentId || obj.FileName || obj.Path) && 
           obj.FileName && 
           obj.Path;
}

/**
 * 创建附件链接
 * @param {string} fieldValue - 字段值（可能是JSON字符串或URL）
 * @param {string} fieldName - 字段名称
 * @returns {string} 附件链接HTML
 */
function createAttachmentLink(fieldValue, fieldName) {
    if (!fieldValue || fieldValue === '-') {
        return '-';
    }
    
    try {
        // 尝试解析JSON格式的附件数据
        const parsed = JSON.parse(fieldValue);
        
        if (Array.isArray(parsed)) {
            // 如果是数组，处理多个附件
            return parsed.map(attachment => createSingleAttachmentLink(attachment)).join('<br>');
        } else {
            // 如果是单个对象，处理单个附件
            return createSingleAttachmentLink(parsed);
        }
    } catch (e) {
        // 如果不是JSON，按原来的URL方式处理
        return createSingleAttachmentLinkFromUrl(fieldValue);
    }
}

/**
 * 从附件对象创建单个附件链接
 * @param {object} attachment - 附件对象
 * @returns {string} 附件链接HTML
 */
function createSingleAttachmentLink(attachment) {
    if (!attachment || !attachment.FileName || !attachment.Path) {
        return '-';
    }
    
    const fileName = attachment.FileName;
    const filePath = attachment.Path;
    const fileSize = attachment.Size ? formatFileSize(attachment.Size) : '';
    
    // 获取文件扩展名
    const fileExt = fileName.split('.').pop().toLowerCase();
    
    // 确定文件类型图标
    let iconClass = getFileIconClass(fileExt);
    
    // 构建文件URL - 修正为直接访问附件的正确URL结构
    const fileUrl = filePath.startsWith('http') ? filePath : `http://219.145.169.207:8099/hmifmobile/${filePath}`;
    
    // 对URL进行编码处理，确保中文字符正确传递
    const encodedFileUrl = encodeURI(fileUrl);
    const encodedFileName = fileName.replace(/'/g, "\\'");
    
    return `
        <div class="attachment-item">
            <a href="javascript:void(0)" class="attachment-link" onclick="previewFile('${encodedFileUrl}', '${encodedFileName}')">
                <span class="attachment-icon ${iconClass}"></span>
                <span class="attachment-name">${fileName}</span>
                ${fileSize ? `<span class="attachment-size">(${fileSize})</span>` : ''}
            </a>
        </div>
    `;
}

/**
 * 从URL创建单个附件链接（兼容旧格式）
 * @param {string} fileUrl - 文件URL
 * @returns {string} 附件链接HTML
 */
function createSingleAttachmentLinkFromUrl(fileUrl) {
    const fileName = fileUrl.split('/').pop() || '附件';
    const fileExt = fileName.split('.').pop().toLowerCase();
    const iconClass = getFileIconClass(fileExt);
    
    // 构建正确的文件URL - 修正直接访问附件的URL结构
    const correctUrl = fileUrl.startsWith('http') ? fileUrl : `http://219.145.169.207:8099/hmifmobile/${fileUrl}`;
    
    // 对URL进行编码处理，确保中文字符正确传递
    const encodedUrl = encodeURI(correctUrl);
    const encodedFileName = fileName.replace(/'/g, "\\'");
    
    return `
        <a href="javascript:void(0)" class="attachment-link" onclick="previewFile('${encodedUrl}', '${encodedFileName}')">
            <span class="attachment-icon ${iconClass}"></span>
            ${fileName}
        </a>
    `;
}

/**
 * 获取文件图标类名
 * @param {string} fileExt - 文件扩展名
 * @returns {string} 图标类名
 */
function getFileIconClass(fileExt) {
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt)) {
        return 'file-icon-image';
    } else if (['doc', 'docx'].includes(fileExt)) {
        return 'file-icon-word';
    } else if (['xls', 'xlsx'].includes(fileExt)) {
        return 'file-icon-excel';
    } else if (['ppt', 'pptx'].includes(fileExt)) {
        return 'file-icon-ppt';
    } else if (fileExt === 'pdf') {
        return 'file-icon-pdf';
    }
    return 'file-icon-default';
}

/**
 * 格式化文件大小
 * @param {string|number} size - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(size) {
    const bytes = parseInt(size);
    if (isNaN(bytes)) return '';
    
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
}

/**
 * 预览文件
 * @param {string} fileUrl - 文件URL
 * @param {string} fileName - 文件名称
 */
function previewFile(fileUrl, fileName) {
    // 使用新的FilePreview模块预览文件
    if (window.FilePreview) {
        window.FilePreview.previewFile(fileUrl, fileName);
    } else {
        console.error('FilePreview模块未加载');
        // 回退到旧的预览方式（打开新窗口）
        window.open(fileUrl, '_blank');
    }
}

/**
 * 关闭文件预览
 */
function closeFilePreview() {
    // 使用新的FilePreview模块关闭预览
    if (window.FilePreview) {
        window.FilePreview.closeFilePreview();
    } else {
        // 回退到旧的关闭方式
        const modal = document.getElementById('filePreviewModal');
        if (modal) {
            modal.style.display = 'none';
            // 清空预览内容
            const body = document.getElementById('filePreviewBody');
            if (body) {
                body.innerHTML = '';
            }
        }
    }
}

// 将函数暴露给全局作用域
window.ApprovalDetail = {
    getApprovalInfo,
    renderApprovalInfo,
    parseMainRecord,
    parseDetailRecords,
    showErrorMessage,
    retryLoadApprovalDetail
};

// 将附件相关函数暴露给全局作用域
window.previewFile = previewFile;
window.closeFilePreview = closeFilePreview;