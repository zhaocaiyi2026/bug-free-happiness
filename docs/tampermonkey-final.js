// ==UserScript==
// @name         吉林政府采购网 iframe 公告提取
// @namespace    http://tampermonkey.net/
// @version      1.2
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
    const API_BASE = 'https://4dedb0b5-952a-4a4c-a211-0bf5165689d2.dev.coze.site/api/v1';
    
    const btn = document.createElement('button');
    btn.innerText = '📄 提取公告正文';
    btn.style.position = 'fixed';
    btn.style.top = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = 999999;
    btn.style.padding = '12px 24px';
    btn.style.background = '#1677ff';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.fontSize = '14px';
    btn.style.borderRadius = '25px';
    btn.style.cursor = 'pointer';
    document.body.appendChild(btn);

    btn.onclick = async function() {
        try {
            // 核心：读取内嵌网页 iframe 里的公告正文
            let content = '';
            const iframes = document.querySelectorAll('iframe');

            for (let f of iframes) {
                try {
                    const text = f.contentDocument.body.innerText;
                    if (text.length > 500) {
                        content = text;
                        break;
                    }
                } catch(e) {}
            }

            if (!content) {
                alert('未找到正文，请刷新页面再试');
                return;
            }

            // 提取标题
            let title = document.title.split(/[-_|【\[]/)[0].trim();
            
            // 步骤1：入库
            btn.innerText = '⏳ 入库中...';
            
            const result = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: API_BASE + '/csv-import',
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({
                        data: [{
                            '标题': title,
                            '类型': '招标公告',
                            '省份': '吉林省',
                            '发布时间': new Date().toISOString().split('T')[0],
                            '来源': window.location.hostname,
                            '详情链接': window.location.href,
                            '完整内容': content
                        }]
                    }),
                    onload: (res) => resolve(JSON.parse(res.responseText)),
                    onerror: reject
                });
            });

            if (!result.success) {
                throw new Error(result.error || '入库失败');
            }
            
            // 步骤2：格式化（获取最新入库的ID）
            btn.innerText = '⏳ 格式化中...';
            
            // 查询刚入库的数据ID
            const latestBid = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: API_BASE + '/bids?pageSize=1',
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            resolve(data.data[0]);
                        } catch(e) { reject(e); }
                    },
                    onerror: reject
                });
            });
            
            // 调用格式化API
            await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: API_BASE + '/format-bid/' + latestBid.id,
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            if (data.success) resolve(data);
                            else reject(new Error('格式化失败'));
                        } catch(e) { reject(e); }
                    },
                    onerror: reject
                });
            });

            btn.innerText = '✅ 完成！';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.innerText = '📄 提取公告正文';
                btn.style.background = '#1677ff';
            }, 2000);

        } catch (e) {
            btn.innerText = '❌ 失败';
            btn.style.background = '#ef4444';
            setTimeout(() => {
                btn.innerText = '📄 提取公告正文';
                btn.style.background = '#1677ff';
            }, 2000);
            alert('失败：' + e.message);
        }
    };
})();
