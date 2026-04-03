import { Router } from 'express';
import {
  extractBidInfoFromUrl,
  extractWinBidInfoFromUrl,
  extractBidInfoFromContent,
  extractWinBidInfoFromContent,
  isServiceAvailable,
} from '@/services/doubao-llm';

const router = Router();

/**
 * 检查豆包LLM服务状态
 */
router.get('/status', (req, res) => {
  const available = isServiceAvailable();
  res.json({
    success: true,
    data: {
      available,
      message: available ? '豆包大模型服务已就绪' : '豆包大模型服务不可用',
      model: 'doubao-seed-2-0-lite-260215 / doubao-seed-2-0-pro-260215',
    },
  });
});

/**
 * 从URL提取招标信息
 * Body参数：
 * - url: string (招标公告网页URL)
 * - useProModel?: boolean (是否使用Pro模型，默认false)
 */
router.post('/bid/url', async (req, res) => {
  try {
    const { url, useProModel } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供招标公告网页URL (url)',
      });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'URL格式无效',
      });
    }

    const result = await extractBidInfoFromUrl(url, useProModel);

    if (!result) {
      return res.status(422).json({
        success: false,
        message: '无法从网页中提取招标信息',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[DoubaoExtract] 招标信息提取失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '招标信息提取失败',
    });
  }
});

/**
 * 从URL提取中标信息
 * Body参数：
 * - url: string (中标公告网页URL)
 * - useProModel?: boolean (是否使用Pro模型，默认false)
 */
router.post('/win-bid/url', async (req, res) => {
  try {
    const { url, useProModel } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供中标公告网页URL (url)',
      });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'URL格式无效',
      });
    }

    const result = await extractWinBidInfoFromUrl(url, useProModel);

    if (!result) {
      return res.status(422).json({
        success: false,
        message: '无法从网页中提取中标信息',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[DoubaoExtract] 中标信息提取失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '中标信息提取失败',
    });
  }
});

/**
 * 从文本内容提取招标信息（用于RPA采集后的处理）
 * Body参数：
 * - content: string (招标公告文本内容)
 * - useProModel?: boolean (是否使用Pro模型，默认false)
 */
router.post('/bid/content', async (req, res) => {
  try {
    const { content, useProModel } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供招标公告文本内容 (content)',
      });
    }

    if (content.length < 50) {
      return res.status(400).json({
        success: false,
        message: '内容过短，无法提取有效信息',
      });
    }

    const result = await extractBidInfoFromContent(content, useProModel);

    if (!result) {
      return res.status(422).json({
        success: false,
        message: '无法从内容中提取招标信息',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[DoubaoExtract] 招标信息提取失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '招标信息提取失败',
    });
  }
});

/**
 * 从文本内容提取中标信息（用于RPA采集后的处理）
 * Body参数：
 * - content: string (中标公告文本内容)
 * - useProModel?: boolean (是否使用Pro模型，默认false)
 */
router.post('/win-bid/content', async (req, res) => {
  try {
    const { content, useProModel } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供中标公告文本内容 (content)',
      });
    }

    if (content.length < 50) {
      return res.status(400).json({
        success: false,
        message: '内容过短，无法提取有效信息',
      });
    }

    const result = await extractWinBidInfoFromContent(content, useProModel);

    if (!result) {
      return res.status(422).json({
        success: false,
        message: '无法从内容中提取中标信息',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[DoubaoExtract] 中标信息提取失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '中标信息提取失败',
    });
  }
});

export default router;
