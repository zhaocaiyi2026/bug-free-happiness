// ==UserScript==
// @name         吉林政府采购 - 一键入库
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  吉林省政府采购网站一键提取入库
// @author       Your App
// @match        *://*jilin*.gov.cn/*
// @match        *://*.jl.gov.cn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      *
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('[JL采购] 脚本已加载');
    
    // API 地址 - 根据实际部署情况修改
    const API_URL = 'http://localhost:9091/api/v1/csv-import';
    
    // ==================== 提取函数 ====================
    
    function extractData() {
        // 提取标题
        let title = '';
        const titleSelectors = ['h1', '.title', '.article-title', '[class*="title"]', 'header h1'];
        for (const sel of titleSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 5) {
                title = el.innerText.trim();
                break;
            }
        }
        if (!title) title = document.title.split(/[-_|]/)[0].trim();
        
        // 提取内容
        let content = '';
        const contentSelectors = [
            '.content', '.article-content', '.notice-content',
            '[class*="content"]', 'article', '.main-content', '#content'
        ];
        for (const sel of contentSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 100) {
                content = el.innerText.trim().substring(0, 30000);
                break;
            }
        }
        if (!content) {
            const body = document.body.cloneNode(true);
            ['nav', 'header', 'footer', '.nav', '.header', '.footer', '.sidebar', '.menu'].forEach(s => {
                body.querySelectorAll(s).forEach(el => el.remove());
            });
            content = body.innerText.trim().substring(0, 30000);
        }
        
        // 提取日期
        const dateMatch = document.body.innerText.match(/(\d{4}[-年]\d{1,2}[-月]\d{1,2}日?)/);
        const date = dateMatch 
            ? dateMatch[1].replace(/[年月]/g, '-').replace('日', '') 
            : new Date().toISOString().split('T')[0];
        
        // 判断类型
        const text = document.title + ' ' + content.substring(0, 500);
        let type = '招标公告';
        if (text.includes('中标') || text.includes('成交')) type = '中标公告';
        else if (text.includes('更正') || text.includes('变更')) type = '更正公告';
        else if (text.includes('废标') || text.includes('终止')) type = '废标公告';
        else if (text.includes('竞争性谈判')) type = '竞争性谈判';
        else if (text.includes('竞争性磋商')) type = '竞争性磋商';
        else if (text.includes('询价')) type = '询价公告';
        else if (text.includes('单一来源')) type = '单一来源';
        else if (text.includes('采购意向')) type = '采购意向';
        
        // 来源判断
        const host = window.location.hostname;
        let source = '吉林省政府采购网';
        if (host.includes('ggzyzx')) source = '吉林省公共资源交易中心';
        else if (host.includes('ccgp')) source = '吉林省政府采购网';
        
        return {
            '标题': title,
            '类型': type,
            '省份': '吉林省',
            '发布时间': date,
            '来源': source,
            '详情链接': window.location.href,
            '完整内容': content
        };
    }
    
    // ==================== 发送 API ====================
    
    function sendToAPI(data) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: API_URL,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ data: [data] }),
                onload: (res) => {
                    try {
                        const result = JSON.parse(res.responseText);
                        console.log('[JL采购] API响应:', result);
                        resolve(result);
                    } catch (e) {
                        console.error('[JL采购] 解析响应失败:', e);
                        reject(e);
                    }
                },
                onerror: (err) => {
                    console.error('[JL采购] 请求失败:', err);
                    reject(err);
                }
            });
        });
    }
    
    // ==================== UI ====================
    
    let isProcessing = false;
    
    function createButton() {
        if (document.getElementById('jl-import-btn')) return;
        
        const container = document.createElement('div');
        container.id = 'jl-import-container';
        container.innerHTML = `
            <style>
                #jl-import-container {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                #jl-import-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                }
                #jl-import-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }
                #jl-import-btn.processing {
                    background: #f59e0b;
                    cursor: wait;
                }
                #jl-import-btn.success {
                    background: #10b981;
                }
                #jl-import-btn.error {
                    background: #ef4444;
                }
                #jl-status {
                    position: absolute;
                    top: 50px;
                    right: 0;
                    background: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    min-width: 200px;
                    display: none;
                    font-size: 13px;
                }
                #jl-status.show { display: block; }
                .jl-status-item { margin: 6px 0; }
                .jl-status-label { color: #666; }
                .jl-status-value { color: #333; font-weight: 500; }
            </style>
            
            <button id="jl-import-btn">📥 一键入库</button>
            <div id="jl-status">
                <div class="jl-status-item">
                    <span class="jl-status-label">标题:</span>
                    <span class="jl-status-value" id="jl-preview-title">-</span>
                </div>
                <div class="jl-status-item">
                    <span class="jl-status-label">类型:</span>
                    <span class="jl-status-value" id="jl-preview-type">-</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        const btn = document.getElementById('jl-import-btn');
        const status = document.getElementById('jl-status');
        
        btn.addEventListener('click', handleImport);
        
        container.addEventListener('mouseenter', () => {
            status.classList.add('show');
            updatePreview();
        });
        
        container.addEventListener('mouseleave', () => {
            status.classList.remove('show');
        });
        
        console.log('[JL采购] 按钮已创建');
    }
    
    function updatePreview() {
        const data = extractData();
        document.getElementById('jl-preview-title').textContent = 
            data['标题'].substring(0, 25) + (data['标题'].length > 25 ? '...' : '');
        document.getElementById('jl-preview-type').textContent = data['类型'];
    }
    
    async function handleImport() {
        if (isProcessing) return;
        isProcessing = true;
        
        const btn = document.getElementById('jl-import-btn');
        btn.className = 'processing';
        btn.textContent = '⏳ 处理中...';
        
        try {
            const data = extractData();
            console.log('[JL采购] 提取数据:', data);
            
            const result = await sendToAPI(data);
            
            if (result.success) {
                btn.className = 'success';
                btn.textContent = '✅ 入库成功';
                
                setTimeout(() => {
                    btn.className = '';
                    btn.textContent = '📥 一键入库';
                    isProcessing = false;
                }, 2000);
            } else {
                throw new Error(result.error || '入库失败');
            }
        } catch (e) {
            btn.className = 'error';
            btn.textContent = '❌ 入库失败';
            console.error('[JL采购] 错误:', e);
            
            setTimeout(() => {
                btn.className = '';
                btn.textContent = '📥 一键入库';
                isProcessing = false;
            }, 2000);
        }
    }
    
    // ==================== 初始化 ====================
    
    if (document.readyState === 'complete') {
        createButton();
    } else {
        window.addEventListener('load', createButton);
    }
    
    // 延迟加载（应对动态页面）
    setTimeout(createButton, 1000);
    setTimeout(createButton, 3000);
    
    console.log('[JL采购] 初始化完成');
    
})();
