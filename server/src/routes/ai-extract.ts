import { Router } from 'express';
import { extractBidInfo, extractWinBidInfo, isServiceAvailable } from '@/services/aliyun-nlp';

const router = Router();

/**
 * 检查阿里云NLP服务状态
 */
router.get('/status', (req, res) => {
  const available = isServiceAvailable();
  res.json({
    success: true,
    data: {
      available,
      message: available ? '阿里云NLP服务已配置' : '阿里云NLP服务未配置，请设置环境变量 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET',
    },
  });
});

/**
 * 抽取招标信息
 * Body参数：
 * - content: string (招标公告文本内容)
 */
router.post('/bid', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供招标公告文本内容 (content)',
      });
    }

    if (!isServiceAvailable()) {
      return res.status(503).json({
        success: false,
        message: '阿里云NLP服务未配置，请设置环境变量 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET',
      });
    }

    const result = await extractBidInfo(content);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('招标信息抽取失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '招标信息抽取失败',
    });
  }
});

/**
 * 抽取中标信息
 * Body参数：
 * - content: string (中标公告文本内容)
 */
router.post('/win-bid', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供中标公告文本内容 (content)',
      });
    }

    if (!isServiceAvailable()) {
      return res.status(503).json({
        success: false,
        message: '阿里云NLP服务未配置，请设置环境变量 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET',
      });
    }

    const result = await extractWinBidInfo(content);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('中标信息抽取失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '中标信息抽取失败',
    });
  }
});

export default router;
