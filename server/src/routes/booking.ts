import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// 配置邮件发送器（使用QQ邮箱）
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '', // QQ邮箱授权码
    },
  });
};

/**
 * POST /api/v1/booking
 * 提交标书制作预约
 * Body: { name, phone, company, projectTitle }
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, company, projectTitle } = req.body;

    // 参数验证
    if (!name || !phone || !company) {
      return res.status(400).json({
        success: false,
        message: '请填写完整信息',
      });
    }

    // 检查邮件配置
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('邮件配置缺失');
      // 即使邮件未配置，也返回成功（后续可配置）
      return res.json({
        success: true,
        message: '预约成功（邮件服务待配置）',
      });
    }

    const transporter = createTransporter();

    // 邮件内容
    const mailOptions = {
      from: `"招采易" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // 发送到自己的邮箱
      subject: `【标书制作预约】${name} - ${company}`,
      html: `
        <div style="padding: 20px; background-color: #f5f5f5;">
          <div style="background: white; padding: 24px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563EB; margin-bottom: 20px;">📋 新的标书制作预约</h2>
            <div style="background: #EFF6FF; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <h3 style="color: #1F2937; margin: 0 0 8px 0;">项目信息</h3>
              <p style="color: #374151; margin: 0;">${projectTitle || '未知项目'}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; width: 80px;">姓名</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: 500;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280;">电话</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; font-weight: 500;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #6B7280;">公司</td>
                <td style="padding: 12px 0; color: #1F2937; font-weight: 500;">${company}</td>
              </tr>
            </table>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px; text-align: center;">
              此邮件由招采易系统自动发送
            </p>
          </div>
        </div>
      `,
    };

    // 发送邮件
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: '预约成功，我们会尽快与您联系',
    });
  } catch (error) {
    console.error('发送邮件失败:', error);
    res.status(500).json({
      success: false,
      message: '预约失败，请稍后重试',
    });
  }
});

export default router;
