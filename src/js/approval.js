/**
 * 审批页面逻辑
 * 处理审批列表、审批详情、审批操作等
 */

// 审批页面状态
const ApprovalState = {
    approvalList: {
        pending: [],
        processed: [],
        completed: []
    },
    currentApprovalTab: 'pending',
    currentApproval: null,
    pendingPage: 1,
    processedPage: 1,
    completedPage: 1,
    pendingHasMore: true,
    processedHasMore: true,
    completedHasMore: true
};

/**
 * 切换审批标签页
 * @param {string} tab - 标签页名称 (pending/processed/completed)
 */
function switchApprovalTab(tab) {
    // 更新当前标签页
    ApprovalState.currentApprovalTab = tab;
    
    // 更新UI
    const pendingTab = document.querySelector('.tab-item:nth-child(1)');
    const processedTab = document.querySelector('.tab-item:nth-child(2)');
    const completedTab = document.querySelector('.tab-item:nth-child(3)');
    const pendingList = document.getElementById('pendingList');
    const processedList = document.getElementById('processedList');
    const completedList = document.getElementById('completedList');
    
    // 移除所有标签页的active状态
    pendingTab.classList.remove('active');
    processedTab.classList.remove('active');
    completedTab.classList.remove('active');
    
    // 隐藏所有列表
    pendingList.style.display = 'none';
    processedList.style.display = 'none';
    completedList.style.display = 'none';
    
    if (tab === 'pending') {
        pendingTab.classList.add('active');
        pendingList.style.display = 'block';
        
        // 每次切换都重新加载待审批列表
        // 先显示加载中提示
        pendingList.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
            </div>
        `;
        loadApprovalList('pending');
    } else if (tab === 'processed') {
        processedTab.classList.add('active');
        processedList.style.display = 'block';
        
        // 每次切换都重新加载已处理列表
        // 先显示加载中提示
        processedList.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
            </div>
        `;
        loadApprovalList('processed');
    } else if (tab === 'completed') {
        completedTab.classList.add('active');
        completedList.style.display = 'block';
        
        // 每次切换都重新加载已完成列表
        // 先显示加载中提示
        completedList.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
            </div>
        `;
        loadApprovalList('completed');
    }
}

/**
 * 加载审批列表
 * @param {string} type - 列表类型 (pending/processed/completed)
 * @param {boolean} loadMore - 是否加载更多
 */
async function loadApprovalList(type = 'pending', loadMore = false) {
    const typeNames = {
        pending: '待处理',
        processed: '已处理', 
        completed: '已完成'
    };
    console.log(`加载${typeNames[type] || '未知'}列表...`);
    
    // 当不是加载更多时，重置页码状态
    if (!loadMore) {
        if (type === 'pending') {
            ApprovalState.pendingPage = 1;
            ApprovalState.pendingHasMore = true;
        } else if (type === 'processed') {
            ApprovalState.processedPage = 1;
            ApprovalState.processedHasMore = true;
        } else if (type === 'completed') {
            ApprovalState.completedPage = 1;
            ApprovalState.completedHasMore = true;
        }
    }
    
    try {
        // 获取用户ID，优先从缓存中获取
        let userId = localStorage.getItem('user_id');
        console.log('从localStorage获取的user_id:', userId);
        
        // 如果没有缓存的user_id，尝试从用户信息中获取
        if (!userId) {
            const userData = localStorage.getItem('currentUser');
            console.log('从localStorage获取的currentUser:', userData);
            if (userData) {
                const user = JSON.parse(userData);
                console.log('解析后的用户数据:', user);
                userId = user.user_id || user.USER_ID;
                console.log('从用户数据中提取的userId:', userId);
                
                // 如果从用户数据中获取到了userId，保存到localStorage
                if (userId) {
                    localStorage.setItem('user_id', userId);
                }
            }
        }
        
        // 如果仍然没有用户ID，跳转到登录页
        if (!userId) {
            console.error('无法获取用户ID，跳转到登录页');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('最终使用的userId:', userId);
        
        // 确定页码
        let page;
        if (type === 'pending') {
            page = loadMore ? ApprovalState.pendingPage + 1 : 1;
        } else if (type === 'processed') {
            page = loadMore ? ApprovalState.processedPage + 1 : 1;
        } else {
            page = loadMore ? ApprovalState.completedPage + 1 : 1;
        }
        
        // 调用审批列表API
        console.log(`调用API: userId=${userId}, page=${page}, pageSize=100`);
        const result = await API.getApprovalList(
            userId, 
            page, 
            100
        );
        
        console.log('API返回结果:', result);
        
        if (result.success) {
            // 获取当前登录用户的完整信息
            const currentUserData = localStorage.getItem('currentUser');
            let currentUser = null;
            if (currentUserData) {
                currentUser = JSON.parse(currentUserData);
            }
            
            // 过滤审批数据：根据类型显示对应的审批项
            const filteredData = result.data.filter(item => {
                // 根据列表类型检查need_process状态
                // 待处理列表：显示need_process=1的数据
                // 已处理列表：显示need_process=0的数据（与已完成相同条件）
                // 已完成列表：显示need_process=0的数据
                let needProcess;
                if (type === 'pending') {
                    needProcess = (item.need_process === '1' || item.need_process === 1);
                } else {
                    // 已处理和已完成都使用相同的过滤条件
                    needProcess = (item.need_process === '0' || item.need_process === 0);
                }
                
                // 对于待审批项目，检查当前登录用户是否是当前节点的处理人
                // 对于已审批项目，检查当前登录用户是否参与过审批
                let userIdMatch = false;
                
                if (type === 'pending') {
                    // 待处理：检查当前用户是否是当前节点的处理人
                    // 可能的字段：user_id, last_user_id, 或者需要根据node_name和用户权限判断
                    userIdMatch = item.user_id === userId || 
                                 item.last_user_id === userId ||
                                 (currentUser && (
                                     item.user_id === currentUser.USER_ID || 
                                     item.user_id === currentUser.user_id ||
                                     item.last_user_id === currentUser.USER_ID ||
                                     item.last_user_id === currentUser.user_id
                                 ));
                } else {
                    // 已处理和已完成：检查当前用户是否参与过审批（发起人或处理人）
                    userIdMatch = item.start_user_id === userId ||
                                 item.user_id === userId || 
                                 item.last_user_id === userId ||
                                 (currentUser && (
                                     item.start_user_id === currentUser.USER_ID || 
                                     item.start_user_id === currentUser.user_id ||
                                     item.user_id === currentUser.USER_ID || 
                                     item.user_id === currentUser.user_id ||
                                     item.last_user_id === currentUser.USER_ID ||
                                     item.last_user_id === currentUser.user_id
                                 ));
                }
                
                // 可选：检查ORGCODE是否匹配（如果需要按组织过滤）
                let orgMatch = true;
                if (currentUser && currentUser.ORGCODE && item.orgcode) {
                    orgMatch = item.orgcode === currentUser.ORGCODE;
                }
                
                // 检查是否为管理员权限
                const isAdmin = currentUser && (currentUser.is_admin === true || currentUser.is_admin === '1');
                
                // 对于已处理和已完成列表，还需要检查status状态
                let statusMatch = true;
                if (type === 'processed') {
                    // 已处理列表：status不等于2
                    statusMatch = item.status !== '2' && item.status !== 2;
                } else if (type === 'completed') {
                    // 已完成列表：status等于2
                    statusMatch = item.status === '2' || item.status === 2;
                }
                
                // 对于已完成列表，还需要检查NODE_NAME是否为"结束"
                let nodeNameMatch = true;
                if (type === 'completed') {
                    // 已完成列表需要NODE_NAME=结束
                    nodeNameMatch = item.node_name === '结束' || item.NODE_NAME === '结束';
                }
                
                console.log(`审批项过滤检查: list_id=${item.list_id}, 处理人ID(user_id)=${item.user_id}, 发起人ID(start_user_id)=${item.start_user_id}, 最后处理人ID(last_user_id)=${item.last_user_id}, 登录用户ID=${userId}, need_process=${item.need_process}, status=${item.status}, node_name=${item.node_name || item.NODE_NAME}, 需要处理=${type === 'pending' ? needProcess : false}, 不需要处理=${type === 'completed' ? needProcess : false}, 用户匹配=${userIdMatch}, 管理员权限=${isAdmin}, 节点名称匹配=${nodeNameMatch}, 应显示=${needProcess && userIdMatch && orgMatch && statusMatch && nodeNameMatch}, 类型=${type}`);
                
                // 必须同时满足：状态匹配 && 用户匹配 && 组织匹配 && 状态检查 && 节点名称匹配
                return needProcess && userIdMatch && orgMatch && statusMatch && nodeNameMatch;
            });
            
            console.log(`原始数据数量: ${result.data.length}, 过滤后数量: ${filteredData.length}`);
            
            // 更新状态
            if (type === 'pending') {
                ApprovalState.pendingPage = page;
                // 如果返回的数据量等于请求的pageSize，说明可能还有更多数据
                // 如果返回的数据量小于pageSize，说明已经到底了
                ApprovalState.pendingHasMore = result.data.length >= 100;
                
                if (loadMore) {
                    ApprovalState.approvalList.pending = [...ApprovalState.approvalList.pending, ...filteredData];
                } else {
                    ApprovalState.approvalList.pending = filteredData;
                }
            } else if (type === 'processed') {
                ApprovalState.processedPage = page;
                // 如果返回的数据量等于请求的pageSize，说明可能还有更多数据
                // 如果返回的数据量小于pageSize，说明已经到底了
                ApprovalState.processedHasMore = result.data.length >= 100;
                
                if (loadMore) {
                    ApprovalState.approvalList.processed = [...ApprovalState.approvalList.processed, ...filteredData];
                } else {
                    ApprovalState.approvalList.processed = filteredData;
                }
            } else {
                ApprovalState.completedPage = page;
                // 如果返回的数据量等于请求的pageSize，说明可能还有更多数据
                // 如果返回的数据量小于pageSize，说明已经到底了
                ApprovalState.completedHasMore = result.data.length >= 100;
                
                if (loadMore) {
                    ApprovalState.approvalList.completed = [...ApprovalState.approvalList.completed, ...filteredData];
                } else {
                    ApprovalState.approvalList.completed = filteredData;
                }
            }
            
            // 渲染列表
            renderApprovalList(type, filteredData, loadMore);
        } else {
            const typeNames = {
                pending: '待处理',
                processed: '已处理', 
                completed: '已完成'
            };
            API.showToast(`加载${typeNames[type] || '未知'}列表失败`, 'error');
        }
    } catch (error) {
        const typeNames = {
            pending: '待处理',
            processed: '已处理', 
            completed: '已完成'
        };
        console.error(`加载${typeNames[type] || '未知'}列表错误:`, error);
        API.showToast(`加载${typeNames[type] || '未知'}列表失败`, 'error');
    }
}

/**
 * 渲染审批列表
 * @param {string} type - 列表类型 (pending/processed/completed)
 * @param {Array} data - 列表数据
 * @param {boolean} append - 是否追加模式
 */
function renderApprovalList(type, data, append = false) {
    const listContainer = document.getElementById(`${type}List`);
    
    if (!listContainer) return;
    
    // 清除加载中提示
    const loadingContainer = listContainer.querySelector('.loading-container');
    if (loadingContainer) {
        listContainer.removeChild(loadingContainer);
    }
    
    // 如果不是追加模式，清空列表
    if (!append) {
        listContainer.innerHTML = '';
    }

    // 移除旧的加载更多按钮（如果存在）
    const oldLoadMoreBtn = listContainer.querySelector('.load-more-btn');
    if (oldLoadMoreBtn) {
        listContainer.removeChild(oldLoadMoreBtn);
    }

    if (data.length === 0 && !append) {
        // 没有数据且不是追加模式，显示暂无事项提示
        const typeNames = {
            pending: '待处理',
            processed: '已处理', 
            completed: '已完成'
        };
        const emptyTip = document.createElement('div');
        emptyTip.className = 'empty-tip';
        emptyTip.innerHTML = `<p>暂无${typeNames[type] || '未知'}事项</p>`;
        listContainer.appendChild(emptyTip);
        return;
    }
    
    // 创建列表项
    data.forEach(item => {
        const approvalItem = document.createElement('div');
        approvalItem.className = 'approval-item';
        approvalItem.onclick = () => viewApprovalDetail(item);
        
        approvalItem.innerHTML = `
            <div class="item-header">
                <span class="flow-title">${item.flow_name || '未命名流程'}</span>
                <span class="flow-status ${type === 'pending' ? 'pending' : 'completed'}">
                    ${type === 'pending' ? '待处理' : (type === 'processed' ? '已处理' : '已完成')}
                </span>
            </div>
            <div class="item-info">
                <div class="info-row">
                    <span class="label">申请人：</span>
                    <span class="value">${item.start_user_disp_name || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">申请时间：</span>
                    <span class="value">${item.start_date || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="label">当前节点：</span>
                    <span class="value">${item.node_name || '-'}</span>
                </div>
            </div>
        `;
        
        listContainer.appendChild(approvalItem);
    });
    
    // 添加加载更多按钮
    if ((type === 'pending' && ApprovalState.pendingHasMore) || 
        (type === 'processed' && ApprovalState.processedHasMore) || 
        (type === 'completed' && ApprovalState.completedHasMore)) {
        
        const loadMoreBtn = document.createElement('div');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.innerHTML = `
            <span class="load-more-text">点击加载更多数据</span>
            <span class="load-more-icon">↓</span>
        `;
        loadMoreBtn.onclick = async () => {
            // 显示加载状态
            loadMoreBtn.innerHTML = `
                <span class="load-more-text">正在加载...</span>
                <span class="load-more-spinner">⟳</span>
            `;
            loadMoreBtn.style.pointerEvents = 'none';
            
            try {
                await loadApprovalList(type, true);
            } catch (error) {
                console.error('加载更多数据失败:', error);
                // 恢复按钮状态
                loadMoreBtn.innerHTML = `
                    <span class="load-more-text">点击加载更多数据</span>
                    <span class="load-more-icon">↓</span>
                `;
                loadMoreBtn.style.pointerEvents = 'auto';
            }
        };
        listContainer.appendChild(loadMoreBtn);
    } else if (!((type === 'pending' && ApprovalState.pendingHasMore) || 
                (type === 'processed' && ApprovalState.processedHasMore) || 
                (type === 'completed' && ApprovalState.completedHasMore))) {
        // 如果没有更多数据，显示提示
        const noMoreBtn = document.createElement('div');
        noMoreBtn.className = 'no-more-tip';
        noMoreBtn.textContent = '已加载全部数据';
        listContainer.appendChild(noMoreBtn);
    }
}

/**
 * 查看审批详情
 * @param {object} approval - 审批数据
 */
async function viewApprovalDetail(approval) {
    console.log('查看审批详情:', approval);
    
    // 保存当前审批
    ApprovalState.currentApproval = approval;
    
    // 显示模态框
    const approvalModal = document.getElementById('approvalModal');
    if (approvalModal) {
        // 更新模态框标题
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = '审批详情';
        }
        
        // 更新基本信息（先使用列表中的基础信息）
        document.getElementById('applicantName').textContent = approval.start_user_disp_name || '-';
        document.getElementById('applyTime').textContent = approval.start_date || '-';
        document.getElementById('flowName').textContent = approval.flow_name || '-';
        document.getElementById('applyDepartment').textContent = approval.dept_name || '-';
        document.getElementById('applyDate').textContent = approval.start_date ? approval.start_date.split(' ')[0] : '-';
        document.getElementById('creator').textContent = approval.start_user_disp_name || '-';
        document.getElementById('createTime').textContent = approval.start_date || '-';

        // 清空之前的动态详情内容
        const detailContentContainer = document.getElementById('approvalDetailContent');
        if (detailContentContainer) {
            detailContentContainer.innerHTML = '';
        }
        
        // 根据审批状态控制按钮和输入框的显示
        // 判断是否为已完成的审批（need_process为0或'0'表示已完成）
        const isCompleted = approval.need_process === '0' || approval.need_process === 0;
        
        // 判断当前节点是否为"开始"节点
        const isStartNode = (approval.node_name === '开始' || approval.NODE_NAME === '开始');
        console.log('当前节点是否为开始节点:', isStartNode, '节点名称:', approval.node_name || approval.NODE_NAME);
        
        // 获取审批意见输入框和按钮容器
        const approvalRemark = document.getElementById('approvalRemark');
        const approvalRemarkSection = approvalRemark ? approvalRemark.closest('.detail-section') : null;
        const modalFooter = document.querySelector('.modal-footer');
        
        if (isCompleted || isStartNode) {
            // 已完成的审批或当前节点为"开始"：隐藏审批意见输入框和按钮
            if (approvalRemarkSection) {
                approvalRemarkSection.style.display = 'none';
            }
            if (modalFooter) {
                modalFooter.style.display = 'none';
            }
            
            // 如果是开始节点，添加提示信息
            if (isStartNode && !isCompleted) {
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
        } else {
            // 待处理的审批且不是开始节点：显示审批意见输入框和按钮
            if (approvalRemarkSection) {
                approvalRemarkSection.style.display = 'block';
            }
            if (modalFooter) {
                modalFooter.style.display = 'flex';
            }
        }
        
        // 显示加载中状态
        const loadingHtml = `
            <div class="loading-container" style="padding: 20px; text-align: center;">
                <div class="loading-spinner"></div>
                <span>加载详情中...</span>
            </div>
        `;
        if (detailContentContainer) {
            detailContentContainer.innerHTML = loadingHtml;
        }
        
        // 显示模态框
        approvalModal.classList.add('active');
        
        try {
            // 使用新的审批详情接口获取详情 - 只传递flow_id参数
            const result = await ApprovalDetail.getApprovalInfo(approval.flow_id);
            
            if (result && result.code === '200') {
                // 使用新的渲染函数处理详情数据
                ApprovalDetail.renderApprovalInfo(result);
            } else {
                console.error('获取审批详情失败:', result);
                API.showToast('获取审批详情失败', 'error');
                
                // 使用新的错误提示功能
                ApprovalDetail.showErrorMessage('获取审批详情失败，请重试');
            }
        } catch (error) {
            console.error('获取审批详情错误:', error);
            
            // 根据错误类型显示不同的错误消息
            let errorMessage = '获取审批详情失败，请重试';
            
            // 检查错误消息中是否包含特定关键词
            if (error.message) {
                if (error.message.includes('空对象')) {
                    errorMessage = '审批详情数据为空，请联系管理员';
                } else if (error.message.includes('HTTP错误')) {
                    errorMessage = '网络请求失败，请检查网络连接';
                } else if (error.message.includes('流程ID不能为空')) {
                    errorMessage = '审批流程ID无效，请联系管理员';
                }
            }
            
            API.showToast(errorMessage, 'error');
            
            // 使用新的错误提示功能
            ApprovalDetail.showErrorMessage(errorMessage);
        }
    }
}

/**
 * 渲染审批详情
 * @param {object} data - 审批详情数据
 */
function renderApprovalDetail(data) {
    // 渲染流程主表信息
    const detailContainer = document.getElementById('approvalDetailContent');
    if (detailContainer && data) {
        let detailHtml = '';
        
        // 遍历主表数据，动态渲染字段
        for (const key in data) {
            // 排除 usersData 字段，因为它需要单独渲染
            if (key !== 'usersData' && data[key] !== null && data[key] !== undefined) {
                const label = getFieldLabel(key);
                // 确保只渲染有对应标签的字段
                if (label !== key) { 
                    detailHtml += `
                        <div class="detail-row">
                            <span class="detail-label">${label}：</span>
                            <span class="detail-value">${data[key]}</span>
                        </div>
                    `;
                }
            }
        }
        detailContainer.innerHTML = detailHtml;

        // 渲染审批历史
        if (data.usersData) {
            renderApprovalHistory(data.usersData);
        }
    }
}

/**
 * 渲染审批历史
 * @param {Array} usersData - 审批历史数据
 */
function renderApprovalHistory(usersData) {
    const historyContainer = document.getElementById('approvalHistory');
    if (!historyContainer || !usersData || usersData.length === 0) {
        if (historyContainer) {
            historyContainer.innerHTML = '<div class="detail-section"><h4>审批历史</h4><div class="empty-history">暂无审批历史记录</div></div>'; 
        }
        return;
    }
    
    // 清空之前的历史记录
    historyContainer.innerHTML = '';

    let historyHtml = '<div class="detail-section"><h4>审批历史</h4>';
    
    // 创建审批历史时间线
    usersData.forEach((record, index) => {
        // 统一字段名称，处理不同的数据结构
        const userData = {
            userId: record.userId || record.user_id || '',
            userName: record.user_name || record.userName || '',
            userDispName: record.userDispName || record.display_name || record.userName || record.user_name || '-',
            nodeName: record.node_name || record.nodeName || '',
            node: record.node || '',
            approvalTime: record.approval_time || record.date || '-',
            remark: record.remark || record.comment || '',
            approvalResult: record.approval_result || getActionText(record.action) || ''
        };
        
        // 确定图标样式 - 根据审批结果设置不同的颜色
        let iconClass = 'icon-check';
        let iconStyle = '';
        
        // 根据审批结果或动作设置图标颜色
        if (userData.approvalResult === '驳回' || userData.approvalResult === '拒绝' || 
            record.action === 'reject') {
            iconStyle = 'background-color: #f44336;'; // 红色表示驳回/拒绝
        } else if (userData.approvalResult === '通过' || userData.approvalResult === '同意' || 
                  record.action === 'approve' || record.action === 'pass') {
            iconStyle = 'background-color: #4CAF50;'; // 绿色表示通过/同意
        } else {
            iconStyle = 'background-color: #2196F3;'; // 蓝色表示其他状态
        }
        
        // 是否为最后一项，最后一项不显示左侧时间线
        const isLast = index === usersData.length - 1;
        
        historyHtml += `
            <div class="history-item" ${isLast ? 'style="border-left: none;"' : ''}>
                <div class="history-line">
                    <div class="history-icon ${iconClass}" style="${iconStyle}"></div>
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
                ${userData.approvalResult ? `<div class="history-result">审批结果：${userData.approvalResult}</div>` : ''}
            </div>
        `;
    });
    
    historyHtml += '</div>';
    historyContainer.innerHTML = historyHtml;
}

/**
 * 获取字段标签
 * @param {string} key - 字段名
 * @returns {string} 字段标签
 */
function getFieldLabel(key) {
    const labelMap = {
        'flow_id': '流程ID',
        'flow_name': '流程名称',
        'start_user_disp_name': '申请人',
        'start_date': '申请时间',
        'dept_name': '申请部门',
        'apply_date': '申请日期',
        'creator_name': '创建人',
        'create_time': '创建时间',
        'node_name': '当前节点',
        'flow_status': '流程状态',
        'title': '流程标题',
        'amount': '金额',
        'reason': '申请原因',
        'remark': '备注'
    };
    return labelMap[key] || key;
}

/**
 * 获取操作文本
 * @param {string} action - 操作类型
 * @returns {string} 操作文本
 */
function getActionText(action) {
    const actionMap = {
        'approve': '通过',
        'reject': '驳回',
        'pass': '通过',
        'submit': '提交'
    };
    return actionMap[action] || action;
}

/**
 * 关闭审批详情模态框
 */
function closeApprovalModal() {
    const approvalModal = document.getElementById('approvalModal');
    if (approvalModal) {
        approvalModal.classList.remove('active');
    }
    
    // 清空审批意见
    const approvalRemark = document.getElementById('approvalRemark');
    if (approvalRemark) {
        approvalRemark.value = '';
    }
    
    // 重置按钮和输入框的显示状态（恢复默认显示状态）
    const approvalRemarkSection = approvalRemark ? approvalRemark.closest('.detail-section') : null;
    const modalFooter = document.querySelector('.modal-footer');
    
    if (approvalRemarkSection) {
        approvalRemarkSection.style.display = 'block';
    }
    if (modalFooter) {
        modalFooter.style.display = 'flex';
    }
}

/**
 * 执行审批操作
 * @param {string} action - 审批操作 (pass/reject)
 */
async function performApproval(action) {
    console.log('执行审批操作:', action);
    
    if (!ApprovalState.currentApproval) {
        API.showToast('未找到审批信息', 'error');
        return;
    }
    
    // 获取审批意见
    const remarkElement = document.getElementById('approvalRemark');
    if (!remarkElement) {
        console.error('未找到审批意见输入框');
        API.showToast('页面元素异常，请刷新重试', 'error');
        return;
    }
    
    const remark = remarkElement.value.trim();
    console.log('审批意见:', remark);
    
    // 驳回操作必须填写审批意见
    if (action === 'reject' && !remark) {
        API.showToast('驳回操作必须填写审批意见', 'warning');
        remarkElement.classList.add('required');
        remarkElement.focus();
        
        // 添加输入事件监听，当用户开始输入时移除必填样式
        const removeRequiredStyle = () => {
            remarkElement.classList.remove('required');
            remarkElement.removeEventListener('input', removeRequiredStyle);
        };
        remarkElement.addEventListener('input', removeRequiredStyle);
        
        return;
    }
    
    // 移除可能存在的必填样式
    remarkElement.classList.remove('required');
    
    try {
        // 获取用户数据
        const userDataStr = localStorage.getItem('currentUser');
        if (!userDataStr) {
            API.showToast('用户信息丢失，请重新登录', 'error');
            window.location.href = 'login.html';
            return;
        }
        
        const userData = JSON.parse(userDataStr);
        console.log('当前用户数据:', userData);
        
        // 验证必要的用户信息
        // 检查多种可能的用户ID字段格式
        if (!userData.USER_ID && !userData.user_id && !userData.uSER_ID) {
            API.showToast('用户ID缺失，请重新登录', 'error');
            window.location.href = 'login.html';
            return;
        }
        
        // 构建审批数据，确保用户信息字段的一致性
        // 注意：后端期望的字段名是 uSER_ID, uSER_NAME, dISPLAY_NAME（参考通过与驳回接口.md）
        // 确保包含必要的角色信息，避免后端参数校验失败
        if (!userData.roles || !Array.isArray(userData.roles) || userData.roles.length === 0) {
            // 提供默认角色以避免后端验证失败
            userData.roles = userData.rolenames || ['USER'];
        }
        
        // 构建与后端数据结构完全匹配的userData对象
        const userDataObj = {
            uSER_ID: userData.USER_ID || userData.user_id || userData.uSER_ID,
            uSER_NAME: userData.USER_NAME || userData.user_name || userData.uSER_NAME,
            dISPLAY_NAME: userData.DISPLAY_NAME || userData.display_name || userData.dISPLAY_NAME,
            oRGCODE: userData.ORGCODE || userData.orgcode || userData.oRGCODE,
            roles: userData.roles || ['USER'],  // 确保总是有角色数组
            // 其他可选字段
            dept_id: userData.dept_id,
            dept_name: userData.dept_name,
            rolenames: userData.rolenames || [],
            roleTypes: userData.roleTypes || []
        };
        
        // 直接将userData序列化为JSON字符串
        const userDataString = JSON.stringify(userDataObj);
        console.log('审批userData字符串:', userDataString);
        
        const approvalData = {
            flow_id: ApprovalState.currentApproval.flow_id,
            action: action,
            userData: userDataString,  // 直接传递JSON字符串，而不是对象
            node_name: ApprovalState.currentApproval.node_name,
            module: ApprovalState.currentApproval.module || '',  // 确保module字段有值
            flow_remark: remark
        };
        
        console.log('module值:', approvalData.module);
        
        console.log('审批操作数据:', approvalData);
        console.log('当前审批项信息:', ApprovalState.currentApproval);
        
        // 显示确认对话框
        const confirmMessage = `确认要${action === 'pass' ? '通过' : '驳回'}这个审批吗？${remark ? '\n审批意见：' + remark : ''}`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // 调用审批API
        console.log('开始调用审批API...');
        const result = await API.doApproval(approvalData);
        console.log('审批API返回结果:', result);
        
        // 检查API返回的当前审批项信息和响应数据，判断操作是否实际成功
        const hasSuccessData = ApprovalState.currentApproval && 
                              (ApprovalState.currentApproval.LAST_MODIFY_DATE || 
                               ApprovalState.currentApproval.STATUS !== undefined);
        
        // 检查API响应中是否有表明操作成功的字段
        const resultData = result.data || {};
        const hasSuccessResponse = 
            (resultData.LAST_MODIFY_DATE !== undefined) || 
            (resultData.STATUS !== undefined) ||
            (resultData.NODE_NAME !== undefined);
            
        console.log('审批结果分析：', {
            API返回成功: result.success,
            审批项状态表明成功: hasSuccessData,
            响应数据表明成功: hasSuccessResponse
        });
        
        // 如果满足任一成功条件，则视为操作成功
        if (result.success || hasSuccessData || hasSuccessResponse) {
            API.showToast(`审批${action === 'pass' ? '通过' : '驳回'}成功`, 'success');
        } else {
            console.error('审批失败:', result);
            API.showToast(`审批${action === 'pass' ? '通过' : '驳回'}失败: ${result.message}`, 'error');
        }
        
        // 关闭模态框
        closeApprovalModal();
        
        // 无论成功失败，都重新加载列表，确保数据最新
        setTimeout(() => {
            // 使用setTimeout确保先完成关闭模态框操作
            loadApprovalList(ApprovalState.currentApprovalTab);
        }, 100);
    } catch (error) {
        console.error('审批操作错误:', error);
        API.showToast(`审批${action === 'pass' ? '通过' : '驳回'}失败: ${error.message || '未知错误'}`, 'error');
        
        // 即使发生错误，也关闭模态框并刷新列表
        closeApprovalModal();
        
        // 使用setTimeout确保先完成关闭模态框操作
        setTimeout(() => {
            loadApprovalList(ApprovalState.currentApprovalTab);
        }, 100);
    }
}

// 初始化审批页面
document.addEventListener('DOMContentLoaded', () => {
    console.log('审批页面初始化...');
    
    // 检查登录状态，未登录则跳转到登录页
    if (!localStorage.getItem('currentUser')) {
        window.location.href = 'login.html';
        return;
    }

    // 初始化审批列表状态
    ApprovalState.approvalList = {
        pending: [],
        completed: []
    };
    
    // 加载待审批列表
    loadApprovalList('pending');
    
    // 确保底部导航栏状态正确
    updateBottomNavigation('approval');
    
    // 添加滚动监听，实现下拉自动加载更多数据
    initScrollListener();
});

/**
 * 初始化滚动监听器
 * 当用户滚动到页面底部时自动加载更多数据
 */
function initScrollListener() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    let isLoading = false;
    
    mainContent.addEventListener('scroll', () => {
        // 防止重复触发
        if (isLoading) return;
        
        // 获取滚动信息
        const scrollTop = mainContent.scrollTop;
        const scrollHeight = mainContent.scrollHeight;
        const clientHeight = mainContent.clientHeight;
        
        // 当滚动到距离底部50px时触发加载
        const threshold = 50;
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            const currentTab = ApprovalState.currentApprovalTab;
            const hasMore = currentTab === 'pending' ? ApprovalState.pendingHasMore : ApprovalState.completedHasMore;
            
            if (hasMore) {
                console.log('触发滚动加载更多数据，当前标签页:', currentTab);
                isLoading = true;
                
                // 显示加载提示
                showScrollLoadingTip();
                
                // 加载更多数据
                loadApprovalList(currentTab, true).finally(() => {
                    isLoading = false;
                    hideScrollLoadingTip();
                });
            }
        }
    });
}

/**
 * 显示滚动加载提示
 */
function showScrollLoadingTip() {
    const currentList = ApprovalState.currentApprovalTab === 'pending' 
        ? document.getElementById('pendingList') 
        : document.getElementById('completedList');
    
    // 移除现有的加载提示
    const existingTip = currentList.querySelector('.scroll-loading-tip');
    if (existingTip) {
        existingTip.remove();
    }
    
    // 添加新的加载提示
    const loadingTip = document.createElement('div');
    loadingTip.className = 'scroll-loading-tip';
    loadingTip.innerHTML = `
        <div class="loading-spinner"></div>
        <span>正在加载更多...</span>
    `;
    currentList.appendChild(loadingTip);
}

/**
 * 隐藏滚动加载提示
 */
function hideScrollLoadingTip() {
    const currentList = ApprovalState.currentApprovalTab === 'pending' 
        ? document.getElementById('pendingList') 
        : document.getElementById('completedList');
    
    const loadingTip = currentList.querySelector('.scroll-loading-tip');
    if (loadingTip) {
        loadingTip.remove();
    }
}