/**
 * API接口管理模块
 * 封装所有与后端接口的交互逻辑
 * 基于接口文档实现标准化的API调用
 */

// 全局API对象，用于封装API调用和通用工具函数
const API = (function() {
    // API配置
    const API_CONFIG = {
        baseURL: 'http://219.145.169.207:8099/hmifmobile/',
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000
    };

    /**
     * JSONP请求封装，用于解决跨域问题
     * @param {string} url - 请求地址
     * @param {object} data - 请求数据
     * @returns {Promise} 请求结果
     */
    function jsonpRequest(url, data = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            
            // 创建script标签
            const script = document.createElement('script');
            
            // 设置全局回调函数
            window[callbackName] = function(response) {
                // 清理
                document.head.removeChild(script);
                delete window[callbackName];
                
                // 记录原始响应
                console.log('JSONP原始响应:', response);
                
                // 处理响应
                // 检查返回结果是否包含特定字段，如LAST_MODIFY_DATE或STATUS，这表明操作实际成功
                const hasSuccessIndicators = 
                    response.LAST_MODIFY_DATE !== undefined || 
                    response.STATUS !== undefined || 
                    response.NODE_NAME !== undefined;
                
                if (response.code === '200' || hasSuccessIndicators) {
                    resolve({
                        success: true,
                        data: response.data || response.results || response,
                        message: response.message || response.msg || '操作成功'
                    });
                } else {
                    // 即使API响应显示失败，我们也保留原始数据供后续检查
                    console.log('JSONP返回失败状态码，但操作可能已成功：', response);
                    resolve({
                        success: false,
                        data: response,  // 保留原始数据供后续检查
                        message: response.message || response.msg || '操作失败',
                        code: response.code
                    });
                }
            };
            
            // 为审批请求特别处理userData参数，确保正确传递
            if (data.userData && typeof data.userData === 'string') {
                // 复制一份数据以避免修改原始对象
                data = {...data};
                
                console.log('JSONP请求特殊处理userData:', {
                    原始长度: data.userData.length,
                    是否有效JSON: (() => {
                        try {
                            JSON.parse(data.userData);
                            return true;
                        } catch (e) {
                            return false;
                        }
                    })()
                });
            }
            
            // 构建查询参数
            const params = new URLSearchParams();
            
            // 针对每个参数进行处理
            Object.keys(data).forEach(key => {
                let value = data[key];
                
                // 特殊处理userData参数，确保它是有效的JSON字符串
                if (key === 'userData' && typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                
                params.append(key, value);
            });
            
            // 添加回调参数
            params.append('callback', callbackName);
            
            // 设置script src
            script.src = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
            console.log('JSONP请求URL:', script.src);
            
            script.onerror = function() {
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('JSONP请求失败'));
            };
            
            // 添加到页面
            document.head.appendChild(script);
            
            // 设置超时
            setTimeout(() => {
                if (window[callbackName]) {
                    document.head.removeChild(script);
                    delete window[callbackName];
                    reject(new Error('请求超时'));
                }
            }, API_CONFIG.timeout);
        });
    }

    /**
     * HTTP请求封装
     * @param {string} url - 请求地址
     * @param {object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    async function request(url, options = {}) {
        // 使用直连模式访问API
        
        // 获取token
        const token = localStorage.getItem('authToken');
        const headers = {
            ...API_CONFIG.headers
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            method: 'POST',

            headers: headers,
            mode: 'cors',
            ...options
        };
        
        // 针对不同请求方法设置不同的headers
        if (config.method === 'GET') {
            // GET请求不设置Content-Type，避免CORS预检请求问题
        } else {
            // 非GET请求设置Content-Type为表单格式，避免CORS预检请求
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
        }
    
        let requestUrl = url;
    
        // 处理请求体
        if (config.body) {
            if (config.headers['Content-Type'] && config.headers['Content-Type'].includes('application/json')) {
                // 如果是JSON类型，直接stringify
                config.body = JSON.stringify(config.body);
            } else if (config.method === 'GET') {
                // GET请求的body作为查询参数
                const queryParams = new URLSearchParams(config.body).toString();
                requestUrl = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`;
                delete config.body;
            } else if (typeof config.body === 'object') {
                // 否则，对于非GET的object body，转换为URLSearchParams
                const formData = new URLSearchParams();
                for (const [key, value] of Object.entries(config.body)) {
                    formData.append(key, value);
                }
                config.body = formData.toString();
                // 确保Content-Type是form-urlencoded，除非已经明确指定为json
                if (!config.headers['Content-Type']) {
                    config.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
                }
            } else if (config.body instanceof URLSearchParams) {
                config.body = config.body.toString();
            }
        }

        try {
            showLoading(true);
            
            const response = await fetch(requestUrl, config);
            
            // 检查响应状态
            if (!response.ok) {
                // 处理不同的HTTP错误状态
                if (response.status === 0 || response.status === 404) {
                    throw new Error('服务器连接失败，请检查网络或服务器地址');
                } else if (response.status === 403) {
                    throw new Error('访问被拒绝，可能是跨域问题');
                } else if (response.status >= 500) {
                    throw new Error('服务器内部错误，请稍后重试');
                } else {
                    throw new Error(`HTTP错误: ${response.status}`);
                }
            }
            
            const data = await response.json();
            
            // 统一处理API响应格式
            if (data.code === '200') {
                return {
                    success: true,
                    data: data.data || data.results,
                    message: data.message || data.msg || '操作成功'
                };
            } else {
                return {
                    success: false,
                    data: null,
                    message: data.message || data.msg || '操作失败',
                    code: data.code
                };
            }
        } catch (error) {
            console.error('API请求错误:', error);
            
            // 处理不同类型的错误
            let errorMessage = '网络请求失败';
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = 'CORS跨域错误或网络连接失败，请检查服务器配置';
            } else if (error.message.includes('ERR_FAILED')) {
                errorMessage = '网络连接失败，请检查网络状态';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return {
                success: false,
                data: null,
                message: errorMessage,
                error: error.message
            };
        } finally {
            showLoading(false);
        }
    }

    /**
     * 显示加载动画
     * @param {boolean} show - 是否显示
     */
    function showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * 显示Toast提示
     * @param {string} message - 提示信息
     * @param {string} type - 提示类型 (info, success, warning, error)
     */
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast ${type} show`;
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }

    /**
     * 处理API错误
     * @param {object} result - API返回结果
     * @param {string} defaultMessage - 默认错误信息
     */
    function handleAPIError(result, defaultMessage = '操作失败') {
        showToast(result.message || defaultMessage, 'error');
    }

    return {

        /**
         * 用户登录接口
         * @param {string} username - 用户名
         * @param {string} password - 密码
         * @returns {Promise} 登录结果
         */
        login: async function(username, password) {
            const url = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/base/login';
            
            // 使用 fetch 直接发送请求，参考成功的登录代码
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `USER_ID=${encodeURIComponent(username)}&PASSWORD=${encodeURIComponent(password)}`
                });
                
                const data = await response.json();
                
                // 登录成功后缓存user_id
                if (data.code === '200' && data.results && data.results.user_id) {
                    localStorage.setItem('user_id', data.results.user_id);
                }
                
                return data;
            } catch (error) {
                console.error('登录请求错误:', error);
                throw error;
            }
        },

        /**
         * 获取首页数据接口
         * @param {string} userID - 用户ID
         * @returns {Promise} 首页数据
         */
        getHomePageData: async function(userID) {
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/home/gethomepageinfo_1`;
            
            return await request(url, {
                method: 'GET',
                body: {
                    userID: userID
                }
            });
        },

        /**
         * 获取红马文化列表（规章制度）
         * @returns {Promise} 红马文化列表数据
         */
        getHongMaCultureList: async function() {
            const url = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/home/getHongMaCultureList';
            return await request(url, {
                method: 'POST'
            });
        },

        /**
         * 获取审批列表接口
         * @param {string} userID - 用户ID
         * @param {number} currentPage - 当前页码
         * @param {number} pageSize - 每页条数
         * @param {number} is_processed - 是否已处理 (0-待审批, 1-已审批)
         * @returns {Promise} 审批列表数据
         */
        getApprovalList: async function(userId, page = 1, pageSize = 100, status = 0) {
            // 使用GET请求方式，参数直接拼接在URL中
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/approval/getapproval_list&userID=${userId}&currentPage=${page}&pageSize=${pageSize}`;
            
            return await request(url, {
                method: 'GET'
            });
        },

        /**
         * 执行审批操作接口
         * @param {object} approvalData - 审批数据
         * @returns {Promise} 审批结果
         */
        doApproval: async function(approvalData) {
            const directUrl = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/approval/doApproval1`;
            // 直接使用API地址，不使用代理
            
            // 驳回操作必须填写审批意见
            if (approvalData.action === 'reject' && !approvalData.flow_remark) {
                return {
                    success: false,
                    data: null,
                    message: '驳回操作必须填写审批意见'
                };
            }

            // 在approval.js中已经处理了userData为JSON字符串，这里简单验证
            const userDataString = approvalData.userData;
            console.log('收到的userData类型:', typeof userDataString);
            
            // 构建请求数据，确保所有字段都有值
            const requestData = {
                flow_id: approvalData.flow_id,
                action: approvalData.action, // 'pass' 或 'reject'
                userData: userDataString, // 直接使用传入的JSON字符串
                node_name: approvalData.node_name,
                module: approvalData.module || '',
                flow_remark: approvalData.flow_remark || ''
            };
            
            // 验证必填参数
            if (!requestData.flow_id || !requestData.action || !requestData.userData || !requestData.node_name) {
                throw new Error('缺少必填参数：flow_id, action, userData, node_name');
            }
            
            // 确保module字段有值，根据接口文档要求设置为空字符串
            if (requestData.module === undefined) {
                requestData.module = '';
            }
            
            // 打印出完整的请求数据用于调试
            console.log('审批请求完整数据:', {
                flow_id: requestData.flow_id,
                action: requestData.action,
                userData: requestData.userData,
                userData_length: requestData.userData ? requestData.userData.length : 0,
                node_name: requestData.node_name,
                module: requestData.module,
                flow_remark: requestData.flow_remark
            });

            console.log('审批请求参数:', JSON.stringify(requestData));
            
            // 直接尝试JSONP请求

            try {
                showLoading(true);
                
                // 使用直连URL
                const url = directUrl;
                console.log('使用URL:', url, '(直连模式)');
                
                // 尝试使用fetch POST请求
                try {
                    // 使用FormData方式发送请求，避免JSON解析问题
                    const formData = new URLSearchParams();
                    Object.keys(requestData).forEach(key => {
                        formData.append(key, requestData[key]);
                    });
                    
                    console.log('使用表单方式发送请求:', url);
                    console.log('表单数据:', Array.from(formData.entries()));
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                            // 移除 'x-requested-with' 请求头以避免CORS预检请求问题
                        },
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP错误: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    console.log('审批API返回结果:', result);
                    
                    // 检查返回结果是否包含特定字段，如LAST_MODIFY_DATE或STATUS，这表明操作实际成功
                    const hasSuccessIndicators = 
                        result.LAST_MODIFY_DATE !== undefined || 
                        result.STATUS !== undefined || 
                        result.NODE_NAME !== undefined;
                        
                    if (result.code === '200' || hasSuccessIndicators) {
                        return {
                            success: true,
                            data: result.data || result.results || result,
                            message: result.message || result.msg || '操作成功'
                        };
                    } else {
                        // 即使API响应显示失败，如果请求发送成功，我们也可能认为操作成功
                        // 这是针对特定场景：接口返回错误但实际上操作已成功
                        console.log('API返回失败状态码，但操作可能已成功：', result);
                        return {
                            success: false,
                            data: result,  // 保留原始数据供后续检查
                            message: result.message || result.msg || '操作失败',
                            code: result.code
                        };
                    }
                } catch (fetchError) {
                    console.warn('fetch请求失败:', fetchError);
                    
                    // 直接尝试JSONP请求，不使用代理
                    console.log('尝试JSONP请求...');
                    const result = await jsonpRequest(directUrl, requestData);
                    if (!result.success) {
                        console.error('JSONP请求失败:', result.message);
                        throw new Error(result.message || 'JSONP请求失败');
                    }
                    return result;
                }
            } catch (error) {
                console.error('审批请求错误:', error);
                return {
                    success: false,
                    data: null,
                    message: error.message || '请求失败'
                };
            } finally {
                showLoading(false);
            }
        },
        
        /**
         * GET请求
         * @param {string} url - 请求地址
         * @param {object} params - 查询参数
         * @returns {Promise} 请求结果
         */
        get: async function(url, params = {}) {
            const queryString = Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            return await request(fullUrl, { method: 'GET' });
        },

        /**
         * 获取流程详情及审批历史接口
         * @param {string} flow_id - 流程ID
         * @param {string} userID - 用户ID
         * @returns {Promise} 流程详情数据
         */
        getFlowDetail: async function(flow_id, userID) {
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/approval/getFlowRecord`;
            
            return await request(url, {
                method: 'POST',
                body: {
                    flow_id: flow_id,
                    userID: userID
                }
            });
        },

        /**
         * 获取用户信息接口
         * @param {string} userID - 用户ID (可选，如果不传则从缓存中获取)
         * @returns {Promise} 用户信息
         */
        getUserInfo: async function(userID) {
            const url = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/getuser';
            
            // 如果没有传入userID，从缓存中获取
            const userId = userID || localStorage.getItem('user_id');
            
            if (!userId) {
                return {
                    success: false,
                    data: null,
                    message: '用户ID不存在，请重新登录'
                };
            }
            
            try {
                // 根据接口文档，这个接口不需要参数，返回所有用户列表
                const result = await request(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // 检查响应格式
                if (result && result.code === '200' && result.data) {
                    // 从用户列表中找到对应的用户
                    const user = result.data.find(u => 
                        String(u.USER_ID) === String(userId) || String(u.user_id) === String(userId)
                    );
                    
                    // 如果找到用户，确保所有字段都有值（大小写兼容）
                    if (user) {
                        // 确保用户对象同时有大写和小写的字段
                        if (user.USER_ID && !user.user_id) user.user_id = user.USER_ID;
                        if (user.user_id && !user.USER_ID) user.USER_ID = user.user_id;
                        
                        if (user.DEPT_ID && !user.dept_id) user.dept_id = user.DEPT_ID;
                        if (user.dept_id && !user.DEPT_ID) user.DEPT_ID = user.dept_id;
                        
                        if (user.USER_NAME && !user.user_name) user.user_name = user.USER_NAME;
                        if (user.user_name && !user.USER_NAME) user.USER_NAME = user.user_name;
                        
                        if (user.DISPLAY_NAME && !user.display_name) user.display_name = user.DISPLAY_NAME;
                        if (user.display_name && !user.DISPLAY_NAME) user.DISPLAY_NAME = user.display_name;
                        
                        return {
                            success: true,
                            data: user,
                            message: '获取成功'
                        };
                    } else {
                        return {
                            success: false,
                            data: null,
                            message: '未找到对应用户，用户ID: ' + userId
                        };
                    }
                } else {
                    return {
                        success: false,
                        data: null,
                        message: result.message || '获取用户信息失败'
                    };
                }
            } catch (error) {
                console.error('获取用户信息失败:', error);
                return {
                    success: false,
                    data: null,
                    message: '获取用户信息失败: ' + error.message
                };
            }
        },

        /**
         * 获取所有部门信息接口
         * @returns {Promise} 部门信息列表
         */
        getAllDeptInfo: async function() {
            const url = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/module/getDept';
            
            try {
                const result = await request(url, {
                    method: 'POST'
                });
                
                // 如果成功获取部门信息，确保字段名称兼容性
                if (result.success && result.data && Array.isArray(result.data)) {
                    // 处理每个部门对象，确保同时有大写和小写的字段
                    result.data = result.data.map(dept => {
                        // 确保部门ID字段兼容
                        if (dept.DEPT_ID && !dept.dept_id) dept.dept_id = dept.DEPT_ID;
                        if (dept.dept_id && !dept.DEPT_ID) dept.DEPT_ID = dept.dept_id;
                        
                        // 确保部门名称字段兼容
                        if (dept.DEPT_NAME && !dept.dept_name) dept.dept_name = dept.DEPT_NAME;
                        if (dept.dept_name && !dept.DEPT_NAME) dept.DEPT_NAME = dept.dept_name;
                        
                        return dept;
                    });
                }
                
                return result;
            } catch (error) {
                console.error('获取所有部门信息失败:', error);
                return {
                    success: false,
                    data: null,
                    message: '获取所有部门信息失败'
                };
            }
        },
        
        /**
         * 根据部门ID获取部门信息
         * @param {string} deptID - 部门ID
         * @returns {Promise} 部门信息
         */
        getDeptInfo: async function(deptID) {
            try {
                const result = await this.getAllDeptInfo();
                if (result.success && result.data) {
                    // 兼容不同格式的部门ID字段
                    const department = result.data.find(dept => 
                        (dept.DEPT_ID === deptID) || (dept.dept_id === deptID)
                    );
                    
                    return {
                        success: true,
                        data: department || null,
                        message: department ? '获取成功' : '未找到对应部门'
                    };
                }
                return result;
            } catch (error) {
                console.error('获取部门信息失败:', error);
                return {
                    success: false,
                    data: null,
                    message: '获取部门信息失败'
                };
            }
        },

        /**
         * 获取公司文化接口
         * @returns {Promise} 公司文化数据
         */
        getCompanyCulture: async function() {
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/home/getCompanyCulture`;
            
            return await request(url, {
                method: 'GET'
            });
        },

        /**
         * 获取消息列表接口
         * @param {string} userID - 用户ID
         * @returns {Promise} 消息列表数据
         */
        getMessages: async function(userID) {
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/home/getMessages`;
            
            return await request(url, {
                method: 'POST',
                body: {
                    userID: userID
                }
            });
        },

        /**
         * 获取动态项目接口
         * @param {string} userID - 用户ID
         * @returns {Promise} 动态项目数据
         */
        getDynamicItems: async function(userID) {
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/home/getDynamicItems`;
            
            return await request(url, {
                method: 'POST',
                body: {
                    userID: userID
                }
            });
        },

        /**
         * 获取轮播图数据接口
         * @returns {Promise} 轮播图数据
         */
        getBanners: async function() {
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/home/getBanners`;
            
            return await request(url, {
                method: 'GET'
            });
        },

        /**
         * 获取审批详情接口
         * @param {string} flowId - 流程ID
         * @param {string} flowName - 流程名称
         * @returns {Promise} 审批详情数据
         */
        getApprovalDetail: async function(flowId, flowName) {
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/approval/getApprovalDetail`;
            
            if (!flowId) {
                return {
                    success: false,
                    data: null,
                    message: '流程ID不能为空'
                };
            }
            
            if (!flowName) {
                return {
                    success: false,
                    data: null,
                    message: '流程名称不能为空'
                };
            }
            
            try {
                // 使用通用request函数处理请求，保持与其他API调用一致
                const result = await request(url, {
                    method: 'POST',
                    body: {
                        flow_id: flowId,
                        flow_name: flowName
                    }
                });
                
                console.log('审批详情原始响应:', result);
                
                // 如果使用通用request函数，结果已经被处理成统一格式
                // 为了保持与原函数兼容，转换回原始格式
                if (result.success) {
                    return {
                        code: '200',
                        message: result.message,
                        data: result.data
                    };
                } else {
                    return {
                        code: result.code || '500',
                        message: result.message,
                        data: null
                    };
                }
            } catch (error) {
                console.error('获取审批详情错误:', error);
                return {
                    code: '500',
                    message: '获取审批详情失败: ' + error.message,
                    data: null
                };
            }
        },

        /**
         * 获取键值对数据接口
         * @param {string} type - 键值对类型
         * @returns {Promise} 键值对数据
         */
        getKeyValuePair: async function(type) {
            const url = `${API_CONFIG.baseURL}m?hcf=public/MobileUtil/base/getKeyValuePair`;
            
            return await request(url, {
                method: 'POST',
                body: {
                    type: type
                }
            });
        },

        /**
         * 获取系统通知列表
         * @param {string} userId - 用户ID
         * @param {number} currentPage - 当前页码，默认为1
         * @param {number} pageSize - 每页条数，默认为10
         * @returns {Promise} 系统通知列表数据
         */
        getMsgList: async function(userId, currentPage = 1, pageSize = 10) {
            const url = 'http://219.145.169.207:8099/hmifmobile/m?hcf=public/MobileUtil/home/selectMsgList1';
            
            // 构造请求参数
            const requestData = {
                userId: userId,
                currentPage: currentPage,
                pageSize: pageSize
            };
            
            try {
                console.log('获取系统通知列表，请求参数:', requestData);
                
                // 优先尝试JSONP请求，避免跨域问题
                try {
                    const jsonpResult = await jsonpRequest(url, requestData);
                    console.log('JSONP请求结果:', jsonpResult);
                    return jsonpResult;
                } catch (jsonpError) {
                    console.warn('JSONP请求失败，尝试使用fetch:', jsonpError);
                    
                    // JSONP失败后，尝试普通请求
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        mode: 'cors',
                        body: new URLSearchParams(requestData).toString()
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP错误: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data.code === '200') {
                        return {
                            success: true,
                            data: data.data || [],
                            message: data.message || '获取成功',
                            totalCount: data.totalCount || 0
                        };
                    } else {
                        return {
                            success: false,
                            data: null,
                            message: data.message || data.errorMsg || '获取失败',
                            code: data.code
                        };
                    }
                }
            } catch (error) {
                console.error('获取系统通知错误:', error);
                return {
                    success: false,
                    data: [],
                    message: error.message || '获取系统通知失败'
                };
            }
        },

        showToast: showToast,
        handleAPIError: handleAPIError,
        jsonpRequest: jsonpRequest
    };
})();
// 将API对象暴露给全局作用域
window.API = API;
