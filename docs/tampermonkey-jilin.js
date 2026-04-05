// ==UserScript==
// @name         吉林省政府采购网 - 一键入库
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动提取吉林省政府采购网公告信息，一键发送到API入库
// @author       Your App
// @match        http://www.ccgp-jilin.gov.cn/*
// @match        https://www.ccgp-jilin.gov.cn/*
// @match        http://www.ggzyzx.jl.gov.cn/*
// @match        https://www.ggzyzx.jl.gov.cn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置 ====================
    const API_URL = 'https://zcy-api.onrender.com/api/v1/csv-import';
    // 如果本地测试，改为：http://localhost:9091/api/v1/csv-import

    // ==================== 提取函数 ====================
    
    // 提取标题
    function extractTitle() {
        // 尝试多种选择器
        const selectors = [
            'h1',
            '.article-title',
            '.title',
            '.notice-title',
            '[class*="title"]',
            'header h1',
            'header h2'
        ];
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim().length > 5) {
                return el.innerText.trim();
            }
        }
        
        // 最后尝试从页面标题提取
        return document.title.split('-')[0].trim();
    }
    
    // 提取正文内容
    function extractContent() {
        const selectors = [
            '.article-content',
            '.content',
            '.notice-content',
            '[class*="content"]',
            'article',
            '.main-content',
            '#content',
            '.detail-content'
        ];
        
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim().length > 100) {
                // 清理内容
                return el.innerText
                    .replace(/\s+/g, ' ')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
            }
        }
        
        // 如果找不到，提取 body 内容（排除导航等）
        const body = document.body.cloneNode(true);
        const removeSelectors = ['nav', 'header', 'footer', '.nav', '.header', '.footer', '.sidebar', '.menu'];
        removeSelectors.forEach(s => {
            body.querySelectorAll(s).forEach(el => el.remove());
        });
        
        return body.innerText.trim().substring(0, 50000);
    }
    
    // 提取日期
    function extractDate() {
        const datePatterns = [
            /(\d{4}[-年]\d{1,2}[-月]\d{1,2}日?)/,
            /(\d{4}\/\d{1,2}\/\d{1,2})/
        ];
        
        const text = document.body.innerText;
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1]
                    .replace('年', '-')
                    .replace('月', '-')
                    .replace('日', '')
                    .replace(/\//g, '-');
            }
        }
        
        return new Date().toISOString().split('T')[0];
    }
    
    // 提取公告类型
    function extractType() {
        const title = document.title + ' ' + document.body.innerText.substring(0, 500);
        
        if (title.includes('中标') || title.includes('成交')) return '中标公告';
        if (title.includes('更正') || title.includes('变更')) return '更正公告';
        if (title.includes('废标') || title.includes('终止')) return '废标公告';
        if (title.includes('竞争性谈判')) return '竞争性谈判';
        if (title.includes('竞争性磋商')) return '竞争性磋商';
        if (title.includes('询价')) return '询价公告';
        if (title.includes('采购意向')) return '采购意向';
        if (title.includes('合同')) return '合同公告';
        
        return '招标公告';
    }
    
    // 提取 URL
    function extractUrl() {
        return window.location.href;
    }

    // ==================== 发送到 API ====================
    
    function sendToAPI(data) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: API_URL,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ data: [data] }),
                onload: function(response) {
                    try {
                        const result = JSON.parse(response.responseText);
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // ==================== UI 组件 ====================
    
    let isProcessing = false;
    
    // 创建浮动按钮
    function createFloatingButton() {
        const container = document.createElement('div');
        container.id = 'zcy-import-container';
        container.innerHTML = `
            <style>
                #zcy-import-container {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                
                #zcy-import-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                #zcy-import-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }
                
                #zcy-import-btn.processing {
                    background: #f59e0b;
                    cursor: wait;
                }
                
                #zcy-import-btn.success {
                    background: #10b981;
                }
                
                #zcy-import-btn.error {
                    background: #ef4444;
                }
                
                #zcy-status {
                    position: absolute;
                    top: 60px;
                    right: 0;
                    background: white;
                    padding: 15px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    min-width: 250px;
                    display: none;
                }
                
                #zcy-status.show {
                    display: block;
                }
                
                .zcy-status-item {
                    margin: 8px 0;
                    font-size: 13px;
                    color: #333;
                }
                
                .zcy-status-label {
                    color: #666;
                    margin-right: 8px;
                }
                
                .zcy-status-value {
                    color: #333;
                    font-weight: 500;
                }
                
                #zcy-auto-mode {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #eee;
                }
                
                #zcy-auto-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }
                
                #zcy-auto-toggle input {
                    width: 16px;
                    height: 16px;
                }
            </style>
            
            <button id="zcy-import-btn">
                <span>📥</span>
                <span>一键入库</span>
            </button>
            
            <div id="zcy-status">
                <div class="zcy-status-item">
                    <span class="zcy-status-label">标题:</span>
                    <span class="zcy-status-value" id="zcy-title">-</span>
                </div>
                <div class="zcy-status-item">
                    <span class="zcy-status-label">类型:</span>
                    <span class="zcy-status-value" id="zcy-type">-</span>
                </div>
                <div class="zcy-status-item">
                    <span class="zcy-status-label">状态:</span>
                    <span class="zcy-status-value" id="zcy-result">-</span>
                </div>
                
                <div id="zcy-auto-mode">
                    <label id="zcy-auto-toggle">
                        <input type="checkbox" id="zcy-auto-checkbox">
                        <span>自动模式（配合 Power Automate）</span>
                    </label>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 绑定事件
        const btn = document.getElementById('zcy-import-btn');
        const status = document.getElementById('zcy-status');
        
        // 点击按钮
        btn.addEventListener('click', async () => {
            if (isProcessing) return;
            await handleImport();
        });
        
        // 鼠标悬停显示状态
        container.addEventListener('mouseenter', () => {
            status.classList.add('show');
            updatePreview();
        });
        
        container.addEventListener('mouseleave', () => {
            status.classList.remove('show');
        });
        
        // 自动模式变化
        const autoCheckbox = document.getElementById('zcy-auto-checkbox');
        autoCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // 开启自动模式，监听 URL 变化
                startAutoMode();
            } else {
                stopAutoMode();
            }
        });
    }
    
    // 更新预览
    function updatePreview() {
        const title = extractTitle();
        const type = extractType();
        
        document.getElementById('zcy-title').textContent = title.substring(0, 30) + (title.length > 30 ? '...' : '');
        document.getElementById('zcy-type').textContent = type;
    }
    
    // 导入处理
    async function handleImport() {
        if (isProcessing) return;
        isProcessing = true;
        
        const btn = document.getElementById('zcy-import-btn');
        const resultEl = document.getElementById('zcy-result');
        
        btn.classList.add('processing');
        btn.innerHTML = '<span>⏳</span><span>处理中...</span>';
        resultEl.textContent = '正在提取数据...';
        
        try {
            // 提取数据
            const data = {
                '标题': extractTitle(),
                '类型': extractType(),
                '省份': '吉林省',
                '发布时间': extractDate(),
                '来源': '吉林省公共资源交易中心',
                '详情链接': extractUrl(),
                '完整内容': extractContent()
            };
            
            resultEl.textContent = '正在发送到服务器...';
            
            // 发送到 API
            const result = await sendToAPI(data);
            
            if (result.success) {
                btn.classList.remove('processing');
                btn.classList.add('success');
                btn.innerHTML = '<span>✅</span><span>入库成功</span>';
                resultEl.textContent = `成功入库 ${result.data?.imported || 1} 条`;
                
                // 通知 Power Automate（通过 localStorage）
                localStorage.setItem('zcy_import_status', 'success');
                localStorage.setItem('zcy_import_time', Date.now().toString());
                
                // 3秒后恢复
                setTimeout(() => {
                    btn.classList.remove('success');
                    btn.innerHTML = '<span>📥</span><span>一键入库</span>';
                    resultEl.textContent = '-';
                    isProcessing = false;
                }, 3000);
            } else {
                throw new Error(result.error || '入库失败');
            }
            
        } catch (error) {
            btn.classList.remove('processing');
            btn.classList.add('error');
            btn.innerHTML = '<span>❌</span><span>入库失败</span>';
            resultEl.textContent = error.message || '未知错误';
            
            localStorage.setItem('zcy_import_status', 'error');
            localStorage.setItem('zcy_import_time', Date.now().toString());
            
            setTimeout(() => {
                btn.classList.remove('error');
                btn.innerHTML = '<span>📥</span><span>一键入库</span>';
                resultEl.textContent = '-';
                isProcessing = false;
            }, 3000);
        }
    }
    
    // ==================== 自动模式 ====================
    
    let autoModeTimer = null;
    let lastUrl = '';
    
    function startAutoMode() {
        console.log('[ZCY] 自动模式已开启');
        
        // 检测 URL 变化（Power Automate 点击链接后）
        lastUrl = window.location.href;
        
        autoModeTimer = setInterval(() => {
            const currentUrl = window.location.href;
            
            // URL 变化且是详情页
            if (currentUrl !== lastUrl && isDetailPage()) {
                console.log('[ZCY] 检测到新页面，等待加载...');
                lastUrl = currentUrl;
                
                // 等待页面加载完成后自动入库
                setTimeout(() => {
                    if (!isProcessing) {
                        console.log('[ZCY] 自动入库开始');
                        handleImport();
                    }
                }, 2000);
            }
        }, 500);
    }
    
    function stopAutoMode() {
        if (autoModeTimer) {
            clearInterval(autoModeTimer);
            autoModeTimer = null;
        }
        console.log('[ZCY] 自动模式已关闭');
    }
    
    // 判断是否是详情页
    function isDetailPage() {
        const url = window.location.href;
        // 详情页通常包含 info、detail、article 等关键词
        return url.includes('/info/') || 
               url.includes('/detail') || 
               url.includes('/article') ||
               url.includes('/notice') ||
               document.querySelector('.article-content') !== null ||
               document.querySelector('.notice-content') !== null;
    }

    // ==================== 初始化 ====================
    
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFloatingButton);
    } else {
        createFloatingButton();
    }
    
    // 监听来自 Power Automate 的消息
    window.addEventListener('message', (event) => {
        if (event.data === 'zcy_import') {
            console.log('[ZCY] 收到入库指令');
            if (!isProcessing) {
                handleImport();
            }
        }
    });
    
    console.log('[ZCY] 吉林省政府采购网 - 一键入库脚本已加载');
    console.log('[ZCY] API地址:', API_URL);

})();
