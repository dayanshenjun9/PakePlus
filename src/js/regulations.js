/**
 * 规章制度列表页逻辑
 * 处理规章制度数据加载和渲染
 */

/**
 * 加载规章制度列表数据
 */
async function loadRegulationsList() {
    console.log('加载规章制度列表数据...');
    try {
        const result = await API.getHongMaCultureList();
        if (result.success) {
            renderRegulationsList(result.data);
        } else {
            API.showToast(result.message || '加载规章制度失败', 'error');
        }
    } catch (error) {
        console.error('加载规章制度数据错误:', error);
        API.showToast('网络请求失败，请检查网络或服务器地址', 'error');
    }
}

/**
 * 渲染规章制度列表
 * @param {Array} data - 规章制度数据数组
 */
function renderRegulationsList(data) {
    const regulationsList = document.getElementById('regulationsList');
    if (!regulationsList) return;

    regulationsList.innerHTML = ''; // 清空现有内容

    if (data && data.length > 0) {
        data.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'weui-cell weui-cell_access'; // 使用weui-cell_access来显示箭头
            
            // 添加渐入动画
            listItem.style.opacity = '0';
            listItem.style.transform = 'translateY(20px)';
            
            listItem.innerHTML = `
                <div class="weui-cell__bd">
                    <p>${item.text || item.title || '未命名文档'}</p>
                    ${item.description ? `<span style="font-size: 14px; color: #999; margin-top: 4px; display: block;">${item.description}</span>` : ''}
                </div>
                <div class="weui-cell__ft">
                    ${item.date ? `<span style="font-size: 12px; color: #ccc;">${item.date}</span>` : ''}
                </div>
            `;
            
            // 添加点击事件，跳转到对应的HTML文档
            listItem.addEventListener('click', () => {
                // 添加点击反馈
                listItem.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    listItem.style.transform = '';
                }, 150);
                
                if (item.url) {
                    // 假设文档路径是相对于当前页面的
                    const targetUrl = item.url.startsWith('/') ? item.url : `/${item.url}`;
                    window.location.href = targetUrl;
                } else {
                    // 如果没有URL，显示提示
                    showToast('该文档暂未配置链接', 'warning');
                }
            });
            
            regulationsList.appendChild(listItem);
            
            // 添加渐入动画
            setTimeout(() => {
                listItem.style.transition = 'all 0.3s ease';
                listItem.style.opacity = '1';
                listItem.style.transform = 'translateY(0)';
            }, index * 100); // 错开动画时间
        });
    } else {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'weui-cell';
        emptyItem.innerHTML = `
            <div class="weui-cell__bd" style="text-align: center; padding: 40px 20px;">
                <p style="color: #999; font-size: 16px;">📋</p>
                <p style="color: #999; margin-top: 8px;">暂无规章制度</p>
            </div>
        `;
        regulationsList.appendChild(emptyItem);
    }
}

/**
 * 显示提示消息
 * @param {string} message - 提示消息
 * @param {string} type - 消息类型 (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadRegulationsList();
});

// 导航函数（如果需要从其他页面跳转过来）
function navigateToRegulations() {
    window.location.href = 'regulations.html';
}