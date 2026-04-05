// ==UserScript==
// @name         吉林政府采购网 - 测试版
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  测试脚本是否能正常加载
// @author       Test
// @match        *://*.ggzyzx.jl.gov.cn/*
// @match        *://ggzyzx.jl.gov.cn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== 吉林政府采购网脚本已加载 ===');
    console.log('当前 URL:', window.location.href);
    
    // 创建一个简单的测试按钮
    function createTestButton() {
        // 移除已存在的
        const old = document.getElementById('test-btn');
        if (old) old.remove();
        
        const btn = document.createElement('button');
        btn.id = 'test-btn';
        btn.innerText = '📥 测试按钮';
        btn.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            z-index: 999999;
            background: #4F46E5;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        btn.onclick = function() {
            alert('脚本工作正常！\n\n当前页面: ' + window.location.href);
            console.log('按钮被点击了！');
        };
        
        document.body.appendChild(btn);
        console.log('测试按钮已创建');
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'complete') {
        createTestButton();
    } else {
        window.addEventListener('load', createTestButton);
    }
    
    // 也尝试延迟执行（应对动态加载）
    setTimeout(createTestButton, 1000);
    setTimeout(createTestButton, 3000);
    
})();
