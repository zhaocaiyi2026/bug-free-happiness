import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Python脚本路径
const SCRIPT_PATH = path.join(__dirname, '..', '..', 'scripts', 'jilin_spider.py');
// 数据输出目录
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

/**
 * @api {post} /api/v1/python-collect/collect 采集吉林省政府采购网公告
 * @apiParam {String} [mode=auto] 采集模式: auto/browser/http
 * @apiParam {Boolean} [details=false] 是否采集详情页
 * @apiParam {Number} [maxItems=0] 最大采集数量（0表示不限制）
 */
router.post('/collect', async (req, res) => {
  try {
    const { mode = 'auto', details = false, maxItems = 0 } = req.body;

    console.log(`[Python采集API] 开始采集: mode=${mode}, details=${details}, maxItems=${maxItems}`);

    // 构建命令参数
    const args = [SCRIPT_PATH, '--mode', mode];
    if (details) args.push('--details');
    if (maxItems > 0) args.push('--max-items', String(maxItems));

    // 执行Python脚本
    const pythonProcess = spawn('python3', args, {
      cwd: path.join(__dirname, '..', '..'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(`[Python stdout] ${output.trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      console.error(`[Python stderr] ${error.trim()}`);
    });

    // 设置超时（5分钟）
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      res.status(408).json({
        success: false,
        error: '采集超时',
        message: '采集时间超过5分钟，已终止',
      });
    }, 5 * 60 * 1000);

    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        console.error(`[Python采集API] Python进程退出码: ${code}`);
        return res.status(500).json({
          success: false,
          error: '采集过程出错',
          details: stderr || `退出码: ${code}`,
          stdout: stdout.slice(-1000),
        });
      }

      // 解析输出数据
      try {
        // 尝试从stdout中提取JSON数据
        const dataMatch = stdout.match(/\[DATA_OUTPUT\]\n([\s\S]+)/);
        if (dataMatch) {
          const data = JSON.parse(dataMatch[1]);
          return res.json({
            success: true,
            collected: data.length,
            data: data,
            message: `成功采集 ${data.length} 条公告`,
          });
        }

        // 尝试读取保存的JSON文件
        const jsonPath = path.join(DATA_DIR, 'jilin_procurement.json');
        fs.readFile(jsonPath, 'utf-8')
          .then((content) => {
            const data = JSON.parse(content);
            res.json({
              success: true,
              collected: data.length,
              data: data,
              message: `成功采集 ${data.length} 条公告`,
            });
          })
          .catch(() => {
            // 如果是HTTP模式且数据为空，返回提示信息
            if (stdout.includes('HTTP模式无法获取公告列表数据')) {
              res.json({
                success: false,
                error: '需要浏览器环境',
                message: 'HTTP模式无法获取数据，请在有浏览器环境的服务器上运行采集器',
                hint: '安装Playwright: pip install playwright && playwright install chromium',
                stdout: stdout.slice(-500),
              });
            } else {
              res.json({
                success: true,
                collected: 0,
                data: [],
                message: '采集完成，但未获取到数据',
                stdout: stdout.slice(-500),
              });
            }
          });
      } catch (parseError) {
        console.error('[Python采集API] 解析输出失败:', parseError);
        res.status(500).json({
          success: false,
          error: '解析采集结果失败',
          details: String(parseError),
          stdout: stdout.slice(-500),
        });
      }
    });

    pythonProcess.on('error', (error) => {
      clearTimeout(timeout);
      console.error('[Python采集API] 启动Python进程失败:', error);
      res.status(500).json({
        success: false,
        error: '启动采集器失败',
        details: error.message,
      });
    });

  } catch (error) {
    console.error('[Python采集API] 请求处理失败:', error);
    res.status(500).json({
      success: false,
      error: '请求处理失败',
      details: String(error),
    });
  }
});

/**
 * @api {get} /api/v1/python-collect/status 获取采集器状态
 */
router.get('/status', async (req, res) => {
  try {
    // 检查Python环境
    const pythonCheck = spawn('python3', ['--version']);
    let pythonVersion = '';

    pythonCheck.stdout.on('data', (data) => {
      pythonVersion += data.toString();
    });

    pythonCheck.on('close', async (code) => {
      // 检查脚本文件
      let scriptExists = false;
      try {
        await fs.access(SCRIPT_PATH);
        scriptExists = true;
      } catch {
        scriptExists = false;
      }

      // 检查数据文件
      let dataFileExists = false;
      let dataCount = 0;
      try {
        const jsonPath = path.join(DATA_DIR, 'jilin_procurement.json');
        const content = await fs.readFile(jsonPath, 'utf-8');
        const data = JSON.parse(content);
        dataFileExists = true;
        dataCount = Array.isArray(data) ? data.length : 0;
      } catch {
        // 文件不存在
      }

      // 检查Playwright浏览器
      let browserStatus = 'unknown';
      try {
        const browserCheck = spawn('python3', ['-c', 
          'from playwright.sync_api import sync_playwright; import os; p = sync_playwright().start(); print(os.path.exists(p.chromium.executable_path)); p.stop()'
        ]);
        let browserOutput = '';
        browserCheck.stdout.on('data', (data) => { browserOutput += data.toString(); });
        
        await new Promise<void>((resolve) => {
          browserCheck.on('close', () => resolve());
        });
        
        browserStatus = browserOutput.includes('True') ? 'available' : 'not_installed';
      } catch {
        browserStatus = 'not_installed';
      }

      res.json({
        success: true,
        python: {
          installed: code === 0,
          version: pythonVersion.trim(),
        },
        script: {
          exists: scriptExists,
          path: SCRIPT_PATH,
        },
        browser: {
          status: browserStatus,
          message: browserStatus === 'available' 
            ? 'Playwright Chromium已安装' 
            : '需要安装: pip install playwright && playwright install chromium',
        },
        data: {
          exists: dataFileExists,
          count: dataCount,
          path: DATA_DIR,
        },
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '检查状态失败',
      details: String(error),
    });
  }
});

/**
 * @api {get} /api/v1/python-collect/data 获取已采集的数据
 */
router.get('/data', async (req, res) => {
  try {
    const jsonPath = path.join(DATA_DIR, 'jilin_procurement.json');
    const content = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    res.json({
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      data: data,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.json({
        success: true,
        count: 0,
        data: [],
        message: '数据文件不存在，请先执行采集',
      });
    } else {
      res.status(500).json({
        success: false,
        error: '读取数据失败',
        details: String(error),
      });
    }
  }
});

/**
 * @api {post} /api/v1/python-collect/import 导入数据
 * @apiParam {Array} data 要导入的数据数组
 */
router.post('/import', async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: '数据格式错误',
        message: '请提供数组格式的数据',
      });
    }

    // 确保目录存在
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 读取现有数据
    let existingData: any[] = [];
    const jsonPath = path.join(DATA_DIR, 'jilin_procurement.json');
    try {
      const content = await fs.readFile(jsonPath, 'utf-8');
      existingData = JSON.parse(content);
      if (!Array.isArray(existingData)) existingData = [];
    } catch {
      // 文件不存在
    }

    // 合并数据（去重）
    const existingUrls = new Set(existingData.map((item: any) => item.sourceUrl));
    const newItems = data.filter((item: any) => !existingUrls.has(item.sourceUrl));
    const mergedData = [...existingData, ...newItems];

    // 保存
    await fs.writeFile(jsonPath, JSON.stringify(mergedData, null, 2), 'utf-8');

    res.json({
      success: true,
      message: `成功导入 ${newItems.length} 条新数据，总计 ${mergedData.length} 条`,
      imported: newItems.length,
      total: mergedData.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '导入数据失败',
      details: String(error),
    });
  }
});

export default router;
