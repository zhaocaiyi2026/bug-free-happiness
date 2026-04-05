// ==UserScript==
// @name         政府采购 - 一键入库
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  全国政府采购网站通用提取入库工具（激进内容提取策略）
// @author       Your App
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      *
// ==/UserScript==

(function() {
    'use strict';
    
    const API_URL = 'https://4dedb0b5-952a-4a4c-a211-0bf5165689d2.dev.coze.site/api/v1/csv-import';
    
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
    
    function isGovProcurementSite() {
        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        const bodyText = document.body.innerText.substring(0, 2000).toLowerCase();
        const keywords = ['政府采购', '公共资源交易', '招标', '投标', '采购公告', '中标公告', '竞争性谈判', '竞争性磋商', '询价', '公开招标', 'ccgp', 'ggzy', 'ztb'];
        const domainPatterns = ['.gov.cn', 'ccgp', 'ggzy', 'ztb', 'ggzyjy', 'jczb'];
        return domainPatterns.some(p => url.includes(p)) || keywords.some(k => title.includes(k) || bodyText.includes(k) || url.includes(k));
    }
    
    function extractProvince() {
        const url = window.location.href.toLowerCase();
        const title = document.title;
        const bodyText = document.body.innerText.substring(0, 3000);
        for (const [key, province] of Object.entries(PROVINCE_MAP)) {
            if (url.includes(key.toLowerCase()) || title.includes(key) || bodyText.includes(key)) return province;
        }
        return '未知';
    }
    
    // ==================== 激进内容提取策略 ====================
    
    function findLargestContentElement() {
        console.log('[政府采购] 开始激进内容搜索...');
        
        const keywords = ['采购', '招标', '磋商', '谈判', '联系人', '预算', '资格要求', '投标', '中标', '公告'];
        
        // 策略1: 遍历所有元素，找到包含关键词最多的最长文本块
        let bestElement = null;
        let bestScore = 0;
        let bestText = '';
        
        const allElements = document.querySelectorAll('div, section, article, main, p, span');
        
        for (const el of allElements) {
            const text = el.innerText || '';
            if (text.length < 200) continue;
            
            // 计算关键词匹配分数
            let score = 0;
            for (const kw of keywords) {
                const count = (text.match(new RegExp(kw, 'g')) || []).length;
                score += count;
            }
            
            // 如果分数高且文本长度合理，更新最佳结果
            if (score > 2 && text.length > bestScore) {
                bestScore = text.length;
                bestElement = el;
                bestText = text;
            }
        }
        
        if (bestElement && bestText.length > 500) {
            console.log('[政府采购] 找到最佳内容块，长度:', bestText.length, '关键词分数:', keywords.filter(k => bestText.includes(k)).length);
            return bestText;
        }
        
        // 策略2: 如果没找到，使用全文
        console.log('[政府采购] 使用全文兜底');
        return document.body.innerText.trim();
    }
    
    function waitForDynamicContent(maxWait = 15000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let lastContent = '';
            let stableCount = 0;
            
            const check = () => {
                const currentContent = findLargestContentElement();
                const keywordCount = ['采购', '招标', '磋商', '联系人', '预算'].filter(k => currentContent.includes(k)).length;
                
                console.log('[政府采购] 当前内容长度:', currentContent.length, '关键词数:', keywordCount);
                
                // 如果找到包含多个关键词的长内容，认为加载完成
                if (currentContent.length > 1000 && keywordCount >= 3) {
                    console.log('[政府采购] 内容加载完成');
                    return resolve(currentContent);
                }
                
                // 检查内容是否稳定
                if (currentContent === lastContent) {
                    stableCount++;
                    if (stableCount >= 4) {
                        console.log('[政府采购] 内容已稳定');
                        return resolve(currentContent);
                    }
                } else {
                    lastContent = currentContent;
                    stableCount = 0;
                }
                
                // 超时
                if (Date.now() - startTime > maxWait) {
                    console.log('[政府采购] 等待超时');
                    return resolve(currentContent);
                }
                
                setTimeout(check, 500);
            };
            
            check();
        });
    }
    
    async function extractData() {
        console.log('[政府采购] 开始提取数据 v2.4...');
        
        // 等待动态内容加载
        let content = await waitForDynamicContent(10000);
        
        // 额外等待
        await new Promise(r => setTimeout(r, 1500));
        
        // 再次尝试提取
        const finalContent = findLargestContentElement();
        if (finalContent.length > content.length) {
            content = finalContent;
        }
        
        console.log('[政府采购] 最终内容长度:', content.length);
        
        // 提取标题
        let title = '';
        const titleSelectors = ['h1', 'h2', '.article-title', '.notice-title', '.content-title', '[class*="title"]'];
        for (const sel of titleSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 5) {
                const t = el.innerText.trim();
                // 标题通常比较短
                if (t.length < 200) {
                    title = t;
                    break;
                }
            }
        }
        if (!title) title = document.title.split(/[-_|【\[]/)[0].trim();
        
        // 清理内容
        content = content
            .replace(/\.[a-zA-Z-]+\s*\{[^}]*\}/g, '')
            .replace(/function\s*\([^)]*\)\s*\{[^}]*\}/g, '')
            .replace(/var\s+\w+\s*=\s*[^;]+;/g, '')
            .replace(/const\s+\w+\s*=\s*[^;]+;/g, '')
            .replace(/let\s+\w+\s*=\s*[^;]+;/g, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 50000);
        
        // 提取日期
        let date = new Date().toISOString().split('T')[0];
        const dateMatch = content.match(/(\d{4})[-年\/](\d{1,2})[-月\/](\d{1,2})日?/);
        if (dateMatch) {
            date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
        }
        
        // 判断类型
        const textLower = (title + ' ' + content.substring(0, 500)).toLowerCase();
        let type = '招标公告';
        if (textLower.includes('中标') || textLower.includes('成交')) type = '中标公告';
        else if (textLower.includes('更正') || textLower.includes('变更')) type = '更正公告';
        else if (textLower.includes('废标') || textLower.includes('终止')) type = '废标公告';
        else if (textLower.includes('竞争性谈判')) type = '竞争性谈判';
        else if (textLower.includes('竞争性磋商')) type = '竞争性磋商';
        else if (textLower.includes('询价')) type = '询价公告';
        else if (textLower.includes('单一来源')) type = '单一来源';
        else if (textLower.includes('采购意向')) type = '采购意向';
        else if (textLower.includes('合同')) type = '合同公告';
        
        return {
            '标题': title,
            '类型': type,
            '省份': extractProvince(),
            '发布时间': date,
            '来源': document.title.split(/[-_|]/).pop().trim() || window.location.hostname,
            '详情链接': window.location.href,
            '完整内容': content
        };
    }
    
    function sendToAPI(data) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: API_URL,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ data: [data] }),
                onload: (res) => { try { resolve(JSON.parse(res.responseText)); } catch (e) { reject(e); } },
                onerror: reject
            });
        });
    }
    
    let isProcessing = false;
    
    function createButton() {
        if (document.getElementById('gp-import-container')) return;
        if (!isGovProcurementSite()) return;
        
        const container = document.createElement('div');
        container.id = 'gp-import-container';
        container.innerHTML = `
            <style>
                #gp-import-container{position:fixed;top:80px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
                #gp-import-btn{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;padding:12px 20px;border-radius:25px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(102,126,234,0.4);transition:all 0.3s ease;display:flex;align-items:center;gap:6px}
                #gp-import-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(102,126,234,0.6)}
                #gp-import-btn.processing{background:#f59e0b;cursor:wait}
                #gp-import-btn.success{background:#10b981}
                #gp-import-btn.error{background:#ef4444}
                #gp-status{position:absolute;top:50px;right:0;background:white;padding:12px 16px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);min-width:220px;display:none;font-size:13px;max-height:300px;overflow-y:auto}
                #gp-status.show{display:block}
                .gp-status-item{margin:6px 0}
                .gp-status-label{color:#666;margin-right:8px}
                .gp-status-value{color:#333;font-weight:500;word-break:break-all}
            </style>
            <button id="gp-import-btn">📥 一键入库</button>
            <div id="gp-status">
                <div class="gp-status-item"><span class="gp-status-label">标题:</span><span class="gp-status-value" id="gp-preview-title">-</span></div>
                <div class="gp-status-item"><span class="gp-status-label">类型:</span><span class="gp-status-value" id="gp-preview-type">-</span></div>
                <div class="gp-status-item"><span class="gp-status-label">省份:</span><span class="gp-status-value" id="gp-preview-province">-</span></div>
                <div class="gp-status-item"><span class="gp-status-label">内容:</span><span class="gp-status-value" id="gp-preview-content">-</span></div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        const btn = document.getElementById('gp-import-btn');
        const status = document.getElementById('gp-status');
        
        btn.addEventListener('click', handleImport);
        container.addEventListener('mouseenter', () => { status.classList.add('show'); updatePreview(); });
        container.addEventListener('mouseleave', () => { status.classList.remove('show'); });
        
        console.log('[政府采购] 按钮已创建 v2.4');
    }
    
    async function updatePreview() {
        const data = await extractData();
        document.getElementById('gp-preview-title').textContent = data['标题'].substring(0, 25) + (data['标题'].length > 25 ? '...' : '');
        document.getElementById('gp-preview-type').textContent = data['类型'];
        document.getElementById('gp-preview-province').textContent = data['省份'];
        document.getElementById('gp-preview-content').textContent = data['完整内容'].length + ' 字';
    }
    
    async function handleImport() {
        if (isProcessing) return;
        isProcessing = true;
        
        const btn = document.getElementById('gp-import-btn');
        btn.className = 'processing';
        btn.innerHTML = '<span>⏳</span><span>提取内容中...</span>';
        
        try {
            const data = await extractData();
            console.log('[政府采购] 提取完成:', data['标题'], '内容长度:', data['完整内容'].length);
            
            btn.innerHTML = '<span>⏳</span><span>正在入库...</span>';
            
            const result = await sendToAPI(data);
            
            if (result.success) {
                btn.className = 'success';
                btn.innerHTML = '<span>✅</span><span>入库成功</span>';
                setTimeout(() => { btn.className = ''; btn.innerHTML = '<span>📥</span><span>一键入库</span>'; isProcessing = false; }, 2000);
            } else {
                throw new Error(result.error || '入库失败');
            }
        } catch (e) {
            btn.className = 'error';
            btn.innerHTML = '<span>❌</span><span>入库失败</span>';
            console.error('[政府采购] 错误:', e);
            setTimeout(() => { btn.className = ''; btn.innerHTML = '<span>📥</span><span>一键入库</span>'; isProcessing = false; }, 2000);
        }
    }
    
    function init() {
        console.log('[政府采购] 脚本加载 v2.4');
        if (document.readyState === 'complete') createButton(); else window.addEventListener('load', createButton);
        setTimeout(createButton, 1000);
        setTimeout(createButton, 3000);
        setTimeout(createButton, 5000);
    }
    
    init();
    
})();
