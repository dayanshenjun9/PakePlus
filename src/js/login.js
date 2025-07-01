/**
 * 登录页面逻辑
 * 处理用户登录和表单验证
 */

// 登录页面状态
const LoginState = {
    isLoggingIn: false
};

/**
 * 处理登录表单提交
 * @param {Event} e - 表单提交事件
 */
async function handleLogin(e) {
    e.preventDefault();
    
    // 如果正在登录中，不处理
    if (LoginState.isLoggingIn) return;
    
    // 获取表单数据
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberPassword = document.getElementById('rememberPassword').checked;
    
    // 表单验证
    if (!username || !password) {
        showLoginError('用户名和密码不能为空');
        return;
    }
    
    // 更新UI状态为登录中
    setLoggingInState(true);
    hideLoginError();
    
    try {
        // 调用登录API
        const result = await API.login(username, password);
        
        if (result.code === '200') {
            // 登录成功
            const userData = result.data || result.results;
            
            // 存储用户信息到本地存储
            if (userData) {
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                // user_id已在API.login中缓存，这里再次确认
                if (userData.user_id) {
                    localStorage.setItem('user_id', userData.user_id);
                }
            }
            
            // 处理记住密码功能
            if (rememberPassword) {
                saveCredentials(username, password);
            } else {
                clearSavedCredentials();
            }
            
            // 存储服务器返回的token - 确保使用正确的字段名
            if (userData && userData.token) {
                localStorage.setItem('authToken', userData.token);  // 从userData获取token
            } else if (result.token) {
                localStorage.setItem('authToken', result.token);   // 从顶层结果获取token
            } else {
                console.warn('登录响应中未找到token字段');
            }
            
            console.log('登录响应:', result.data);
            
            // 跳转到首页
            window.location.href = 'home.html';
        } else {
            // 登录失败
            showLoginError(result.msg || result.message || '登录失败，请检查用户名和密码');
            setLoggingInState(false);
        }
    } catch (error) {
        console.error('登录请求错误:', error);
        showLoginError('登录请求失败，请检查网络连接');
        setLoggingInState(false);
    }
}

/**
 * 显示登录错误信息
 * @param {string} message - 错误信息
 */
function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * 隐藏登录错误信息
 */
function hideLoginError() {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * 设置登录中状态
 * @param {boolean} isLoggingIn - 是否正在登录
 */
function setLoggingInState(isLoggingIn) {
    LoginState.isLoggingIn = isLoggingIn;
    
    const loginBtn = document.querySelector('.login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.loading-spinner');
    
    if (isLoggingIn) {
        btnText.textContent = '登录中...';
        spinner.style.display = 'inline-block';
        loginBtn.disabled = true;
    } else {
        btnText.textContent = '登录';
        spinner.style.display = 'none';
        loginBtn.disabled = false;
    }
}

/**
 * 保存用户凭据到本地存储
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
function saveCredentials(username, password) {
    try {
        // 简单的Base64编码（注意：这不是安全的加密，仅用于演示）
        const credentials = {
            username: btoa(username),
            password: btoa(password)
        };
        localStorage.setItem('savedCredentials', JSON.stringify(credentials));
        console.log('用户凭据已保存');
    } catch (error) {
        console.error('保存凭据失败:', error);
    }
}

/**
 * 加载保存的用户凭据
 * @returns {Object|null} 返回保存的凭据或null
 */
function loadSavedCredentials() {
    try {
        const saved = localStorage.getItem('savedCredentials');
        if (saved) {
            const credentials = JSON.parse(saved);
            return {
                username: atob(credentials.username),
                password: atob(credentials.password)
            };
        }
    } catch (error) {
        console.error('加载凭据失败:', error);
    }
    return null;
}

/**
 * 清除保存的用户凭据
 */
function clearSavedCredentials() {
    try {
        localStorage.removeItem('savedCredentials');
        console.log('已清除保存的凭据');
    } catch (error) {
        console.error('清除凭据失败:', error);
    }
}

/**
 * 初始化页面保护，防止第三方浏览器扩展干扰
 */
function initializePageProtection() {
    // 立即保护jQuery，防止扩展在页面加载时修改
    if (window.jQuery) {
        // 保护jQuery.Deferred
        if (window.jQuery.Deferred) {
            const originalDeferred = window.jQuery.Deferred;
            window.jQuery.Deferred = function() {
                const deferred = originalDeferred.apply(this, arguments);
                
                // 保护所有可能的方法
                const originalFail = deferred.fail;
                const originalDone = deferred.done;
                const originalAlways = deferred.always;
                
                deferred.fail = function() {
                    try {
                        return originalFail.apply(this, arguments);
                    } catch (e) {
                        console.warn('jQuery Deferred.fail错误已被捕获:', e);
                        return this;
                    }
                };
                
                deferred.done = function() {
                    try {
                        return originalDone.apply(this, arguments);
                    } catch (e) {
                        console.warn('jQuery Deferred.done错误已被捕获:', e);
                        return this;
                    }
                };
                
                deferred.always = function() {
                    try {
                        return originalAlways.apply(this, arguments);
                    } catch (e) {
                        console.warn('jQuery Deferred.always错误已被捕获:', e);
                        return this;
                    }
                };
                
                return deferred;
            };
        }
        
        // 保护jQuery.fn.ready
        if (window.jQuery.fn && window.jQuery.fn.ready) {
            const originalReady = window.jQuery.fn.ready;
            window.jQuery.fn.ready = function(fn) {
                return originalReady.call(this, function() {
                    try {
                        return fn.apply(this, arguments);
                    } catch (e) {
                        if (e.stack && (
                            e.stack.includes('extension://') ||
                            e.stack.includes('contentScript') ||
                            e.stack.includes('chrome-extension://')
                        )) {
                            console.warn('jQuery ready中的扩展错误已被捕获:', e);
                            return;
                        }
                        throw e;
                    }
                });
            };
        }
    }
    
    // 防止第三方扩展的错误影响页面功能
    window.addEventListener('error', function(event) {
        // 检查错误是否来自扩展
        if (event.filename && (
            event.filename.includes('extension://') ||
            event.filename.includes('contentScript') ||
            event.filename.includes('chrome-extension://') ||
            event.filename.includes('moz-extension://') ||
            event.error && event.error.stack && (
                event.error.stack.includes('extension://') ||
                event.error.stack.includes('contentScript') ||
                event.error.stack.includes('chrome-extension://')
            )
        )) {
            // 阻止扩展错误冒泡
            event.preventDefault();
            event.stopPropagation();
            console.warn('已忽略浏览器扩展错误:', event.message, event.filename);
            return false;
        }
    }, true);
    
    // 防止Promise rejection错误
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && (
            (event.reason.stack && (
                event.reason.stack.includes('extension://') ||
                event.reason.stack.includes('contentScript') ||
                event.reason.stack.includes('chrome-extension://') ||
                event.reason.stack.includes('moz-extension://')
            )) ||
            (typeof event.reason === 'string' && (
                event.reason.includes('extension://') ||
                event.reason.includes('contentScript') ||
                event.reason.includes('chrome-extension://')
            ))
        )) {
            event.preventDefault();
            console.warn('已忽略浏览器扩展Promise错误:', event.reason);
        }
    });
    
    // 拦截console.error，防止扩展错误污染控制台
    const originalConsoleError = console.error;
    console.error = function() {
        const args = Array.from(arguments);
        const errorStr = args.join(' ');
        
        if (errorStr.includes('extension://') || 
            errorStr.includes('contentScript') || 
            errorStr.includes('chrome-extension://')) {
            console.warn('已拦截扩展错误输出:', ...args);
            return;
        }
        
        return originalConsoleError.apply(this, arguments);
    };
}

// 初始化登录页面
document.addEventListener('DOMContentLoaded', () => {
    console.log('登录页面初始化...');
    
    // 初始化页面保护
    initializePageProtection();
    
    // 绑定登录表单提交事件
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 绑定输入框事件，输入时隐藏错误信息
    const inputs = document.querySelectorAll('#loginForm input');
    inputs.forEach(input => {
        input.addEventListener('input', hideLoginError);
    });
    
    // 加载保存的凭据
    const savedCredentials = loadSavedCredentials();
    if (savedCredentials) {
        document.getElementById('username').value = savedCredentials.username;
        document.getElementById('password').value = savedCredentials.password;
        document.getElementById('rememberPassword').checked = true;
        console.log('已加载保存的用户凭据');
    }
});