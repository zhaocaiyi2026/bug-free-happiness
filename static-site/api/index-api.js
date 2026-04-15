/**
 * 招采易 - Vercel API
 * 数据采集接口
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozzehptlqruxokgzirj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96emVocHRscXJ1eG9rZ3ppcmoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5NjE4MTkyMCwiZXhwIjoxNzI3NzE3OTIwfQ.gW-8Q9UqEQAQ9QZk5z8QVxJ-7gE9L1M6RmZmD4H_XXk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        return res.json({ status: 'ok', message: '招采易 API 运行中' });
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持 POST 请求' });
    }

    try {
        const { title, content, source_url, type, category } = req.body;
        
        // 验证必填字段
        if (!content || content.length < 100) {
            return res.status(400).json({ error: '内容太短（需要>=100字符）' });
        }
        
        // 从正文中提取发布时间
        let publish_date = new Date().toISOString().split('T')[0];
        const timeMatch = content.match(/发布时间[：:]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
        if (timeMatch) {
            publish_date = timeMatch[1].replace(/\//g, '-');
        }
        
        // 保存到数据库
        const insertData = {
            title: title || source_url || '无标题',
            content: content.substring(0, 50000),
            source_url: source_url || '',
            data_type: type || '招标公告',
            classified_type: category || '',
            publish_date: publish_date,
            source_platform: 'tampermonkey',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('bids')
            .insert(insertData)
            .select('id')
            .single();
        
        if (error) {
            console.error('[数据库错误]', error);
            return res.status(500).json({ error: '保存失败', detail: error.message });
        }
        
        console.log(`[保存成功] ID: ${data.id}`);
        res.json({ success: true, id: data.id });
        
    } catch (error) {
        console.error('[处理失败]', error);
        res.status(500).json({ error: error.message });
    }
}
