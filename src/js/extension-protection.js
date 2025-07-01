/**
 * 浏览器扩展保护脚本
 * 必须在页面头部最早加载，防止扩展干扰
 */

(function() {
    'use strict';
    
    // 立即执行保护，不等待DOM加载
    console.log('🛡️ 启动扩展保护机制...');
    
    // 保护全局错误处理
    const originalWindowError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        // 检查是否为扩展错误
        if (source && (
            source.includes('extension://') ||
            source.includes('contentScript') ||
            source.includes('chrome-extension://') ||
            source.includes('moz-extension://')
        )) {
            console.warn('🚫 已拦截扩展错误:', message, source);
            return true; // 阻止错误冒泡
        }
        
        // 检查错误堆栈
        if (error && error.stack && (
            error.stack.includes('extension://') ||
            error.stack.includes('contentScript') ||
            error.stack.includes('chrome-extension://')
        )) {
            console.warn('🚫 已拦截扩展堆栈错误:', message, error.stack);
            return true;
        }
        
        // 调用原始错误处理器
        if (originalWindowError) {
            return originalWindowError.apply(this, arguments);
        }
        return false;
    };
    
    // 保护addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        // 包装监听器，捕获扩展错误
        const wrappedListener = function(event) {
            try {
                if (typeof listener === 'function') {
                    return listener.call(this, event);
                } else if (listener && typeof listener.handleEvent === 'function') {
                    return listener.handleEvent(event);
                }
            } catch (error) {
                if (error.stack && (
                    error.stack.includes('extension://') ||
                    error.stack.includes('contentScript') ||
                    error.stack.includes('chrome-extension://')
                )) {
                    console.warn('🚫 已拦截事件监听器中的扩展错误:', error);
                    return;
                }
                throw error;
            }
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
    };
    
    // 保护Promise
    const originalPromise = window.Promise;
    if (originalPromise) {
        window.Promise = function(executor) {
            return new originalPromise(function(resolve, reject) {
                try {
                    executor(resolve, function(reason) {
                        // 检查是否为扩展相关的拒绝
                        if (reason && (
                            (reason.stack && (
                                reason.stack.includes('extension://') ||
                                reason.stack.includes('contentScript') ||
                                reason.stack.includes('chrome-extension://')
                            )) ||
                            (typeof reason === 'string' && (
                                reason.includes('extension://') ||
                                reason.includes('contentScript')
                            ))
                        )) {
                            console.warn('🚫 已拦截Promise中的扩展错误:', reason);
                            return;
                        }
                        reject(reason);
                    });
                } catch (error) {
                    if (error.stack && (
                        error.stack.includes('extension://') ||
                        error.stack.includes('contentScript') ||
                        error.stack.includes('chrome-extension://')
                    )) {
                        console.warn('🚫 已拦截Promise执行器中的扩展错误:', error);
                        return;
                    }
                    reject(error);
                }
            });
        };
        
        // 复制静态方法
        Object.setPrototypeOf(window.Promise, originalPromise);
        Object.getOwnPropertyNames(originalPromise).forEach(name => {
            if (name !== 'length' && name !== 'name' && name !== 'prototype') {
                window.Promise[name] = originalPromise[name];
            }
        });
        window.Promise.prototype = originalPromise.prototype;
    }
    
    // 保护setTimeout和setInterval
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    
    window.setTimeout = function(callback, delay) {
        const wrappedCallback = function() {
            try {
                return callback.apply(this, arguments);
            } catch (error) {
                if (error.stack && (
                    error.stack.includes('extension://') ||
                    error.stack.includes('contentScript') ||
                    error.stack.includes('chrome-extension://')
                )) {
                    console.warn('🚫 已拦截setTimeout中的扩展错误:', error);
                    return;
                }
                throw error;
            }
        };
        return originalSetTimeout.call(this, wrappedCallback, delay);
    };
    
    window.setInterval = function(callback, delay) {
        const wrappedCallback = function() {
            try {
                return callback.apply(this, arguments);
            } catch (error) {
                if (error.stack && (
                    error.stack.includes('extension://') ||
                    error.stack.includes('contentScript') ||
                    error.stack.includes('chrome-extension://')
                )) {
                    console.warn('🚫 已拦截setInterval中的扩展错误:', error);
                    return;
                }
                throw error;
            }
        };
        return originalSetInterval.call(this, wrappedCallback, delay);
    };
    
    // 监听DOM加载，进一步保护jQuery
    function protectjQuery() {
        if (window.jQuery) {
            console.log('🛡️ 保护jQuery...');
            
            // 保护jQuery.Deferred.exceptionHook
            if (window.jQuery.Deferred && window.jQuery.Deferred.exceptionHook) {
                const originalExceptionHook = window.jQuery.Deferred.exceptionHook;
                window.jQuery.Deferred.exceptionHook = function(error, stack) {
                    if (stack && (
                        stack.includes('extension://') ||
                        stack.includes('contentScript') ||
                        stack.includes('chrome-extension://')
                    )) {
                        console.warn('🚫 已拦截jQuery.Deferred.exceptionHook中的扩展错误:', error);
                        return;
                    }
                    return originalExceptionHook.call(this, error, stack);
                };
            }
            
            // 保护jQuery全局错误处理
            if (window.jQuery.readyException) {
                const originalReadyException = window.jQuery.readyException;
                window.jQuery.readyException = function(error) {
                    if (error.stack && (
                        error.stack.includes('extension://') ||
                        error.stack.includes('contentScript') ||
                        error.stack.includes('chrome-extension://')
                    )) {
                        console.warn('🚫 已拦截jQuery.readyException中的扩展错误:', error);
                        return;
                    }
                    return originalReadyException.call(this, error);
                };
            }
        }
    }
    
    // 立即尝试保护jQuery
    protectjQuery();
    
    // DOM加载后再次保护
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', protectjQuery);
    } else {
        protectjQuery();
    }
    
    // 定期检查并重新保护jQuery（防止扩展覆盖）
    setInterval(function() {
        if (window.jQuery && window.jQuery.Deferred && !window.jQuery.Deferred._protected) {
            protectjQuery();
            window.jQuery.Deferred._protected = true;
        }
    }, 1000);
    
    console.log('✅ 扩展保护机制已启动');
})();