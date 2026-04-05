// ==UserScript==
// @name         吉林政府采购网 iframe 公告提取
// @namespace    http://tampermonkey.net/
// @version      1.1
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
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
            
            // 发送到公网API
            btn.innerText = '⏳ 入库中...';
            
            const result = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://4dedb0b5-952a-4a4c-a211-0bf5165689d2.dev.coze.site/api/v1/csv-import',
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

            if (result.success) {
                btn.innerText = '✅ 入库成功';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.innerText = '📄 提取公告正文';
                    btn.style.background = '#1677ff';
                }, 2000);
            } else {
                throw new Error(result.error || '入库失败');
            }

        } catch (e) {
            btn.innerText = '❌ 入库失败';
            btn.style.background = '#ef4444';
            setTimeout(() => {
                btn.innerText = '📄 提取公告正文';
                btn.style.background = '#1677ff';
            }, 2000);
            alert('失败：' + e.message);
        }
    };
})();
