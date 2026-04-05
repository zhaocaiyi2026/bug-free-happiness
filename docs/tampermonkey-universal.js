// ==UserScript==
// @name         政府采购 - 一键入库
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  全国政府采购网站通用提取入库工具
// @author       Your App
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      *
// ==/UserScript==

(function() {
    'use strict';
    
    // ==================== 配置 ====================
    
    const API_URL = 'http://localhost:9091/api/v1/csv-import';
    
    // 省份关键词映射
    const PROVINCE_MAP = {
        '吉林': '吉林省', 'jl': '吉林省', 'jilin': '吉林省',
        '北京': '北京市', 'beijing': '北京市', 'bj': '北京市',
        '天津': '天津市', 'tianjin': '天津市', 'tj': '天津市',
        '河北': '河北省', 'hebei': '河北省', 'he': '河北省',
        '山西': '山西省', 'shanxi': '山西省', 'sx': '山西省',
        '内蒙古': '内蒙古自治区', 'neimenggu': '内蒙古自治区', 'nm': '内蒙古自治区',
        '辽宁': '辽宁省', 'liaoning': '辽宁省', 'ln': '辽宁省',
        '黑龙江': '黑龙江省', 'heilongjiang': '黑龙江省', 'hl': '黑龙江省',
        '上海': '上海市', 'shanghai': '上海市', 'sh': '上海市',
        '江苏': '江苏省', 'jiangsu': '江苏省', 'js': '江苏省',
        '浙江': '浙江省', 'zhejiang': '浙江省', 'zj': '浙江省',
        '安徽': '安徽省', 'anhui': '安徽省', 'ah': '安徽省',
        '福建': '福建省', 'fujian': '福建省', 'fj': '福建省',
        '江西': '江西省', 'jiangxi': '江西省', 'jx': '江西省',
        '山东': '山东省', 'shandong': '山东省', 'sd': '山东省',
        '河南': '河南省', 'henan': '河南省', 'ha': '河南省',
        '湖北': '湖北省', 'hubei': '湖北省', 'hb': '湖北省',
        '湖南': '湖南省', 'hunan': '湖南省', 'hn': '湖南省',
        '广东': '广东省', 'guangdong': '广东省', 'gd': '广东省',
        '广西': '广西壮族自治区', 'guangxi': '广西壮族自治区', 'gx': '广西壮族自治区',
        '海南': '海南省', 'hainan': '海南省', 'hi': '海南省',
        '重庆': '重庆市', 'chongqing': '重庆市', 'cq': '重庆市',
        '四川': '四川省', 'sichuan': '四川省', 'sc': '四川省',
        '贵州': '贵州省', 'guizhou': '贵州省', 'gz': '贵州省',
        '云南': '云南省', 'yunnan': '云南省', 'yn': '云南省',
        '西藏': '西藏自治区', 'xizang': '西藏自治区', 'xz': '西藏自治区',
        '陕西': '陕西省', 'shaanxi': '陕西省', 'sn': '陕西省',
        '甘肃': '甘肃省', 'gansu': '甘肃省', 'gs': '甘肃省',
        '青海': '青海省', 'qinghai': '青海省', 'qh': '青海省',
        '宁夏': '宁夏回族自治区', 'ningxia': '宁夏回族自治区', 'nx': '宁夏回族自治区',
        '新疆': '新疆维吾尔自治区', 'xinjiang': '新疆维吾尔自治区', 'xj': '新疆维吾尔自治区',
    };
    
    // ==================== 检测是否是政府采购网站 ====================
    
    function isGovProcurementSite() {
        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        const bodyText = document.body.innerText.substring(0, 2000).toLowerCase();
        
        // 政府采购关键词
        const keywords = [
            '政府采购', '公共资源交易', '招标', '投标', '采购公告',
            '中标公告', '竞争性谈判', '竞争性磋商', '询价', '公开招标',
            'ccgp', 'ggzy', 'ztb', 'procurement', 'tender', 'bid'
        ];
        
        // 域名特征
        const domainPatterns = [
            '.gov.cn', 'ccgp', 'ggzy', 'ztb', 'ggzyjy', 'jczb',
            'publicresources', 'procurement', 'tender'
        ];
        
        // 检查域名
        const hasDomainPattern = domainPatterns.some(p => url.includes(p));
        
        // 检查关键词
        const hasKeyword = keywords.some(k => 
            title.includes(k) || bodyText.includes(k) || url.includes(k)
        );
        
        return hasDomainPattern || hasKeyword;
    }
    
    // ==================== 提取省份 ====================
    
    function extractProvince() {
        const url = window.location.href.toLowerCase();
        const title = document.title;
        const bodyText = document.body.innerText.substring(0, 3000);
        
        for (const [key, province] of Object.entries(PROVINCE_MAP)) {
            if (url.includes(key.toLowerCase()) || 
                title.includes(key) || 
                bodyText.includes(key)) {
                return province;
            }
        }
        
        return '未知';
    }
    
    // ==================== 提取数据 ====================
    
    function extractData() {
        // 提取标题
        let title = '';
        const titleSelectors = [
            'h1', 'h2.title', '.article-title', '.notice-title',
            '.content-title', '[class*="title"]', 'header h1', 'header h2'
        ];
        for (const sel of titleSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 5) {
                title = el.innerText.trim();
                break;
            }
        }
        if (!title) title = document.title.split(/[-_|【\[]/)[0].trim();
        
        // 提取内容
        let content = '';
        const contentSelectors = [
            '.article-content', '.notice-content', '.content',
            '.detail-content', '[class*="content"]', 'article',
            '.main-content', '#content', '.text-content'
        ];
        for (const sel of contentSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 100) {
                content = el.innerText.trim();
                break;
            }
        }
        if (!content) {
            const body = document.body.cloneNode(true);
            ['nav', 'header', 'footer', '.nav', '.header', '.footer', 
             '.sidebar', '.menu', '.comment', '.ad', '.ads'].forEach(s => {
                body.querySelectorAll(s).forEach(el => el.remove());
            });
            content = body.innerText.trim();
        }
        content = content.substring(0, 50000);
        
        // 提取日期
        const datePatterns = [
            /(\d{4}[-年\/]\d{1,2}[-月\/]\d{1,2}日?)/,
            /(\d{4}\.\d{1,2}\.\d{1,2})/
        ];
        let date = new Date().toISOString().split('T')[0];
        for (const pattern of datePatterns) {
            const match = content.match(pattern) || document.body.innerText.match(pattern);
            if (match) {
                date = match[1]
                    .replace(/[年月]/g, '-')
                    .replace('日', '')
                    .replace(/\//g, '-');
                break;
            }
        }
        
        // 判断类型
        const text = (title + ' ' + content.substring(0, 500)).toLowerCase();
        let type = '招标公告';
        if (text.includes('中标') || text.includes('成交')) type = '中标公告';
        else if (text.includes('更正') || text.includes('变更') || text.includes('澄清')) type = '更正公告';
        else if (text.includes('废标') || text.includes('终止') || text.includes('流标')) type = '废标公告';
        else if (text.includes('竞争性谈判')) type = '竞争性谈判';
        else if (text.includes('竞争性磋商')) type = '竞争性磋商';
        else if (text.includes('询价')) type = '询价公告';
        else if (text.includes('单一来源')) type = '单一来源';
        else if (text.includes('采购意向')) type = '采购意向';
        else if (text.includes('合同')) type = '合同公告';
        
        // 提取省份和来源
        const province = extractProvince();
        const source = document.title.split(/[-_|]/).pop().trim() || window.location.hostname;
        
        return {
            '标题': title,
            '类型': type,
            '省份': province,
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
                        resolve(JSON.parse(res.responseText));
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: reject
            });
        });
    }
    
    // ==================== UI ====================
    
    let isProcessing = false;
    
    function createButton() {
        if (document.getElementById('gp-import-container')) return;
        
        // 检测是否是政府采购网站
        if (!isGovProcurementSite()) {
            console.log('[政府采购] 当前页面不是政府采购网站，不显示按钮');
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'gp-import-container';
        container.innerHTML = `
            <style>
                #gp-import-container {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                #gp-import-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                #gp-import-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }
                #gp-import-btn.processing { background: #f59e0b; cursor: wait; }
                #gp-import-btn.success { background: #10b981; }
                #gp-import-btn.error { background: #ef4444; }
                #gp-status {
                    position: absolute;
                    top: 50px;
                    right: 0;
                    background: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    min-width: 220px;
                    display: none;
                    font-size: 13px;
                    max-height: 300px;
                    overflow-y: auto;
                }
                #gp-status.show { display: block; }
                .gp-status-item { margin: 6px 0; }
                .gp-status-label { color: #666; margin-right: 8px; }
                .gp-status-value { color: #333; font-weight: 500; word-break: break-all; }
            </style>
            
            <button id="gp-import-btn">📥 一键入库</button>
            <div id="gp-status">
                <div class="gp-status-item">
                    <span class="gp-status-label">标题:</span>
                    <span class="gp-status-value" id="gp-preview-title">-</span>
                </div>
                <div class="gp-status-item">
                    <span class="gp-status-label">类型:</span>
                    <span class="gp-status-value" id="gp-preview-type">-</span>
                </div>
                <div class="gp-status-item">
                    <span class="gp-status-label">省份:</span>
                    <span class="gp-status-value" id="gp-preview-province">-</span>
                </div>
                <div class="gp-status-item">
                    <span class="gp-status-label">来源:</span>
                    <span class="gp-status-value" id="gp-preview-source">-</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        const btn = document.getElementById('gp-import-btn');
        const status = document.getElementById('gp-status');
        
        btn.addEventListener('click', handleImport);
        
        container.addEventListener('mouseenter', () => {
            status.classList.add('show');
            updatePreview();
        });
        
        container.addEventListener('mouseleave', () => {
            status.classList.remove('show');
        });
        
        console.log('[政府采购] 按钮已创建');
    }
    
    function updatePreview() {
        const data = extractData();
        document.getElementById('gp-preview-title').textContent = 
            data['标题'].substring(0, 30) + (data['标题'].length > 30 ? '...' : '');
        document.getElementById('gp-preview-type').textContent = data['类型'];
        document.getElementById('gp-preview-province').textContent = data['省份'];
        document.getElementById('gp-preview-source').textContent = data['来源'].substring(0, 15);
    }
    
    async function handleImport() {
        if (isProcessing) return;
        isProcessing = true;
        
        const btn = document.getElementById('gp-import-btn');
        btn.className = 'processing';
        btn.innerHTML = '<span>⏳</span><span>处理中...</span>';
        
        try {
            const data = extractData();
            console.log('[政府采购] 提取数据:', data);
            
            const result = await sendToAPI(data);
            
            if (result.success) {
                btn.className = 'success';
                btn.innerHTML = '<span>✅</span><span>入库成功</span>';
                
                setTimeout(() => {
                    btn.className = '';
                    btn.innerHTML = '<span>📥</span><span>一键入库</span>';
                    isProcessing = false;
                }, 2000);
            } else {
                throw new Error(result.error || '入库失败');
            }
        } catch (e) {
            btn.className = 'error';
            btn.innerHTML = '<span>❌</span><span>入库失败</span>';
            console.error('[政府采购] 错误:', e);
            
            setTimeout(() => {
                btn.className = '';
                btn.innerHTML = '<span>📥</span><span>一键入库</span>';
                isProcessing = false;
            }, 2000);
        }
    }
    
    // ==================== 初始化 ====================
    
    function init() {
        console.log('[政府采购] 脚本已加载');
        
        if (document.readyState === 'complete') {
            createButton();
        } else {
            window.addEventListener('load', createButton);
        }
        
        // 延迟检测（应对动态页面）
        setTimeout(createButton, 1000);
        setTimeout(createButton, 3000);
        setTimeout(createButton, 5000);
    }
    
    init();
    
})();
