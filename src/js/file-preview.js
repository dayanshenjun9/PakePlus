/**
 * 文件预览工具
 * 支持多种文件类型的在线预览，包括Office文件
 * 无需服务器端支持，纯前端实现
 */

const FilePreview = {
    /**
     * 初始化文件预览模块
     */
    init: function() {
        console.log('文件预览模块初始化');
        
        // 加载必要的CSS
        this.loadStyles();
        
        // 创建预览模态框（如果不存在）
        this.createPreviewModal();
        
        // 绑定全局事件
        window.previewFile = this.previewFile.bind(this);
        window.closeFilePreview = this.closeFilePreview.bind(this);
    },
    
    /**
     * 加载必要的CSS样式
     */
    loadStyles: function() {
        // 检查是否已加载样式
        if (document.getElementById('file-preview-styles')) {
            return;
        }
        
        // 添加内联样式
        const styleElement = document.createElement('style');
        styleElement.id = 'file-preview-styles';
        styleElement.textContent = `
            /* 可以在这里添加额外的样式，如果需要 */
        `;
        document.head.appendChild(styleElement);
    },
    
    /**
     * 创建预览模态框
     */
    createPreviewModal: function() {
        // 检查是否已存在模态框
        if (document.getElementById('filePreviewModal')) {
            return;
        }
        
        // 创建模态框结构
        const modalHtml = `
            <div id="filePreviewModal" class="file-preview-modal">
                <div class="file-preview-content">
                    <div class="file-preview-header">
                        <h3 class="file-preview-title" id="filePreviewTitle">文件预览</h3>
                        <button class="file-preview-close" onclick="closeFilePreview()">×</button>
                    </div>
                    <div class="file-preview-body" id="filePreviewBody">
                        <!-- 文件预览内容将在这里动态加载 -->
                    </div>
                </div>
            </div>
        `;
        
        // 添加到文档中
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
    },
    
    /**
     * 预览文件
     * @param {string} fileUrl - 文件URL
     * @param {string} fileName - 文件名称
     */
    previewFile: function(fileUrl, fileName) {
        const modal = document.getElementById('filePreviewModal');
        const title = document.getElementById('filePreviewTitle');
        const body = document.getElementById('filePreviewBody');
        
        if (!modal || !title || !body) {
            console.error('文件预览模态框元素未找到');
            this.createPreviewModal();
            return this.previewFile(fileUrl, fileName);
        }
        
        // 设置标题
        title.textContent = fileName || '文件预览';
        
        // 清空预览内容
        body.innerHTML = '';
        
        // 先显示加载中状态
        body.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <span>正在加载文件，请稍候...</span>
            </div>
        `;
        
        // 显示模态框
        modal.style.display = 'flex';
        
        // 添加点击背景关闭功能
        modal.onclick = function(e) {
            if (e.target === modal) {
                FilePreview.closeFilePreview();
            }
        };
        
        // 获取文件扩展名
        const fileExt = fileName ? fileName.split('.').pop().toLowerCase() : '';
        
        console.log('预览文件:', fileName);
        console.log('文件URL:', fileUrl);
        console.log('文件类型:', fileExt);
        
        // 清空加载中状态
        body.innerHTML = '';
        
        // 根据文件类型选择预览方式
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt)) {
            this.previewImage(fileUrl, fileName, body);
        } else if (['pdf'].includes(fileExt)) {
            this.previewPdf(fileUrl, fileName, body);
        } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt)) {
            this.previewOffice(fileUrl, fileName, fileExt, body);
        } else {
            this.previewOther(fileUrl, fileName, fileExt, body);
        }
    },
    
    /**
     * 预览图片
     * @param {string} fileUrl - 文件URL
     * @param {string} fileName - 文件名称
     * @param {HTMLElement} container - 容器元素
     */
    previewImage: function(fileUrl, fileName, container) {
        const img = document.createElement('img');
        img.className = 'file-preview-image';
        img.alt = fileName;
        
        // 添加加载指示器
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'loading-message';
        loadingMsg.textContent = '图片加载中...';
        container.appendChild(loadingMsg);
        
        // 图片加载成功回调
        img.onload = function() {
            // 移除加载提示
            if (container.contains(loadingMsg)) {
                container.removeChild(loadingMsg);
            }
            container.appendChild(img);
        };
        
        // 图片加载失败回调
        img.onerror = function(error) {
            console.error('图片加载失败:', error);
            if (container.contains(loadingMsg)) {
                loadingMsg.remove();
            }
            
            // 显示错误信息
            FilePreview.showPreviewError(`图片加载失败，您可以 <a href="${fileUrl}" target="_blank">点击此处</a> 在新窗口查看`, container);
        };
        
        // 设置图片源 (这不会触发CORS预检请求)
        img.src = fileUrl;
    },
    
    /**
     * 预览PDF文件
     * @param {string} fileUrl - 文件URL
     * @param {string} fileName - 文件名称
     * @param {HTMLElement} container - 容器元素
     */
    previewPdf: function(fileUrl, fileName, container) {
        try {
            // 创建对象元素用于PDF预览
            const objElement = document.createElement('object');
            objElement.className = 'file-preview-object';
            objElement.type = 'application/pdf';
            objElement.data = fileUrl;
            objElement.setAttribute('width', '100%');
            objElement.setAttribute('height', '500px');
            
            // 添加内部后备内容
            objElement.innerHTML = `
                <div class="pdf-fallback">
                    <p>您的浏览器无法直接预览PDF，请使用下方按钮查看</p>
                </div>
            `;
            
            // 创建包装容器
            const pdfContainer = document.createElement('div');
            pdfContainer.className = 'pdf-container';
            pdfContainer.appendChild(objElement);
            container.appendChild(pdfContainer);
            
            // 添加下载按钮作为备选方案
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'pdf-button-container';
            buttonContainer.innerHTML = `
                <button class="file-download-btn" onclick="window.open('${fileUrl}', '_blank')">
                    在新窗口打开PDF
                </button>
            `;
            container.appendChild(buttonContainer);
            
            // 监听对象加载错误
            objElement.onerror = function() {
                FilePreview.showPreviewError(`PDF加载失败，您可以 <a href="${fileUrl}" target="_blank">点击此处</a> 在新窗口查看`, container);
            };
        } catch (e) {
            this.showPreviewError(`PDF加载失败，您可以 <a href="${fileUrl}" target="_blank">点击此处</a> 在新窗口查看`, container);
        }
    },
    
    /**
     * 预览Office文件
     * @param {string} fileUrl - 文件URL
     * @param {string} fileName - 文件名称
     * @param {string} fileExt - 文件扩展名
     * @param {HTMLElement} container - 容器元素
     */
    previewOffice: function(fileUrl, fileName, fileExt, container) {
        // 创建Office文档预览容器
        const viewerContainer = document.createElement('div');
        viewerContainer.className = 'document-viewer-container';
        
        // 显示文档标题
        const docTitle = document.createElement('p');
        docTitle.className = 'document-preview-title';
        docTitle.textContent = fileName;
        viewerContainer.appendChild(docTitle);
        
        // 创建预览框架
        const previewFrame = document.createElement('div');
        previewFrame.className = 'office-preview-frame';
        viewerContainer.appendChild(previewFrame);
        
        // 根据文件类型设置图标和文本
        let previewIcon, previewText;
        if (['xls', 'xlsx'].includes(fileExt)) {
            previewIcon = 'office-icon-excel';
            previewText = 'Excel电子表格';
        } else if (['doc', 'docx'].includes(fileExt)) {
            previewIcon = 'office-icon-word';
            previewText = 'Word文档';
        } else if (['ppt', 'pptx'].includes(fileExt)) {
            previewIcon = 'office-icon-ppt';
            previewText = 'PowerPoint演示文稿';
        }
        
        // 添加加载状态
        const loadingElement = document.createElement('div');
        loadingElement.className = 'office-loading';
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <p>正在加载文档，请稍候...</p>
        `;
        previewFrame.appendChild(loadingElement);
        
        // 编码文件URL
        const encodedFileUrl = encodeURIComponent(fileUrl);
        
        // 创建多种预览选项
        const previewOptions = [
            {
                name: 'Google Docs Viewer',
                url: `https://docs.google.com/viewer?url=${encodedFileUrl}&embedded=true`
            },
            {
                name: 'Office Online Viewer (新窗口)',
                url: `https://view.officeapps.live.com/op/view.aspx?src=${encodedFileUrl}`,
                newWindow: true
            }
        ];
        
        // 尝试使用第一个选项预览
        this.tryOfficePreview(previewOptions, 0, previewFrame, loadingElement, fileUrl, fileName, previewIcon, previewText);
        
        // 添加到容器
        container.appendChild(viewerContainer);
        
        // 添加备选按钮
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'office-button-container';
        buttonContainer.innerHTML = `
            <div class="preview-options">
                <button class="preview-option-btn" onclick="window.open('${fileUrl}', '_blank')">
                    下载文件
                </button>
                <button class="preview-option-btn" onclick="window.open('https://view.officeapps.live.com/op/view.aspx?src=${encodedFileUrl}', '_blank')">
                    在新窗口使用Office查看器打开
                </button>
                <button class="preview-option-btn" onclick="window.open('https://docs.google.com/viewer?url=${encodedFileUrl}', '_blank')">
                    在新窗口使用Google查看器打开
                </button>
            </div>
        `;
        container.appendChild(buttonContainer);
    },
    
    /**
     * 尝试使用不同的Office预览选项
     * @param {Array} options - 预览选项数组
     * @param {number} index - 当前选项索引
     * @param {HTMLElement} frame - 预览框架元素
     * @param {HTMLElement} loading - 加载指示器元素
     * @param {string} fileUrl - 文件URL
     * @param {string} fileName - 文件名称
     * @param {string} icon - 图标类名
     * @param {string} text - 文件类型文本
     */
    tryOfficePreview: function(options, index, frame, loading, fileUrl, fileName, icon, text) {
        // 如果没有更多选项，显示备选内容
        if (index >= options.length) {
            this.showOfficeFallback(frame, loading, fileName, icon, text);
            return;
        }
        
        const option = options[index];
        
        // 如果是新窗口选项，跳过
        if (option.newWindow) {
            this.tryOfficePreview(options, index + 1, frame, loading, fileUrl, fileName, icon, text);
            return;
        }
        
        // 创建iframe用于预览
        const iframeElement = document.createElement('iframe');
        iframeElement.className = 'office-preview-iframe';
        iframeElement.width = '100%';
        iframeElement.height = '500px';
        iframeElement.setAttribute('frameborder', '0');
        iframeElement.setAttribute('allowfullscreen', 'true');
        
        // 设置iframe源
        iframeElement.src = option.url;
        
        // 监听iframe加载事件
        iframeElement.onload = function() {
            if (loading.parentNode) {
                loading.parentNode.removeChild(loading);
            }
        };
        
        // 监听iframe错误事件
        iframeElement.onerror = function() {
            console.error(`${option.name}加载失败，尝试下一个选项`);
            // 移除当前iframe
            if (iframeElement.parentNode) {
                iframeElement.parentNode.removeChild(iframeElement);
            }
            // 尝试下一个选项
            FilePreview.tryOfficePreview(options, index + 1, frame, loading, fileUrl, fileName, icon, text);
        };
        
        // 添加iframe到预览框架
        frame.appendChild(iframeElement);
        
        // 设置超时，如果加载时间过长，尝试下一个选项
        setTimeout(function() {
            // 如果loading元素仍然存在，说明iframe加载失败或加载过慢
            if (loading.parentNode) {
                console.warn(`${option.name}加载超时，尝试下一个选项`);
                // 移除当前iframe
                if (iframeElement.parentNode) {
                    iframeElement.parentNode.removeChild(iframeElement);
                }
                // 尝试下一个选项
                FilePreview.tryOfficePreview(options, index + 1, frame, loading, fileUrl, fileName, icon, text);
            }
        }, 8000); // 8秒超时
    },
    
    /**
     * 显示Office文件备选内容
     * @param {HTMLElement} frame - 预览框架元素
     * @param {HTMLElement} loading - 加载指示器元素
     * @param {string} fileName - 文件名称
     * @param {string} icon - 图标类名
     * @param {string} text - 文件类型文本
     */
    showOfficeFallback: function(frame, loading, fileName, icon, text) {
        if (loading.parentNode) {
            loading.parentNode.removeChild(loading);
        }
        
        // 显示文件图标和信息
        const fallbackContent = document.createElement('div');
        fallbackContent.className = 'office-preview-fallback';
        fallbackContent.innerHTML = `
            <div class="office-preview-icon ${icon}"></div>
            <div class="office-preview-info">
                <h3>${fileName}</h3>
                <p>${text}</p>
                <p class="preview-hint">此文件需要在新窗口打开查看</p>
            </div>
        `;
        
        // 清空预览框架并添加备选内容
        frame.innerHTML = '';
        frame.appendChild(fallbackContent);
    },
    
    /**
     * 预览其他类型文件
     * @param {string} fileUrl - 文件URL
     * @param {string} fileName - 文件名称
     * @param {string} fileExt - 文件扩展名
     * @param {HTMLElement} container - 容器元素
     */
    previewOther: function(fileUrl, fileName, fileExt, container) {
        // 其他文件类型，提供下载
        const message = document.createElement('div');
        message.className = 'unsupported-file-message';
        message.innerHTML = `<p>文件类型 "${fileExt}" 不支持在线预览</p>`;
        container.appendChild(message);
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'file-download-btn';
        downloadBtn.textContent = '在新窗口打开';
        downloadBtn.onclick = function() {
            window.open(fileUrl, '_blank');
        };
        container.appendChild(downloadBtn);
    },
    
    /**
     * 显示预览错误信息
     * @param {string} message - 错误信息
     * @param {HTMLElement} container - 容器元素
     */
    showPreviewError: function(message, container) {
        container.innerHTML = `
            <div class="file-preview-error">
                <p>${message}</p>
            </div>
        `;
    },
    
    /**
     * 关闭文件预览
     */
    closeFilePreview: function() {
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
};

// 初始化文件预览模块
document.addEventListener('DOMContentLoaded', function() {
    FilePreview.init();
});

// 将文件预览模块暴露给全局作用域
window.FilePreview = FilePreview;
