# 快速部署指南

## 📋 部署清单

### 一、阿里云准备工作（约5分钟）

1. **创建容器镜像命名空间**
   - 访问：https://cr.console.aliyun.com/cn-hongkong/instances/namespaces
   - 点击「创建命名空间」
   - 输入名称：`zcy`
   - 点击「确定」

2. **获取容器镜像密码**
   - 访问：https://cr.console.aliyun.com/cn-hongkong/instances/credentials
   - 点击「设置固定密码」
   - 设置一个密码（记住这个密码）

3. **获取 AccessKey**
   - 访问：https://ram.console.aliyun.com/manage/ak
   - 点击「创建 AccessKey」
   - 保存 AccessKey ID 和 Secret

---

### 二、GitHub 配置（约3分钟）

1. **推送代码到 GitHub**
   ```bash
   cd /workspace/projects
   git init
   git add .
   git commit -m "feat: 初始化项目"
   git branch -M main
   git remote add origin https://github.com/你的用户名/zcy-app.git
   git push -u origin main
   ```

2. **添加 Secrets**
   - 进入仓库 → Settings → Secrets and variables → Actions
   - 点击「New repository secret」，添加以下4个：

   | 名称 | 值 |
   |------|-----|
   | `ALIYUN_REGISTRY_USERNAME` | 你的阿里云账号（邮箱或手机号） |
   | `ALIYUN_REGISTRY_PASSWORD` | 容器镜像服务设置的固定密码 |
   | `ALIYUN_ACCESS_KEY_ID` | 阿里云 AccessKey ID |
   | `ALIYUN_ACCESS_KEY_SECRET` | 阿里云 AccessKey Secret |

---

### 三、触发部署

**方式1：推送代码自动触发**
```bash
git add .
git commit -m "feat: 更新代码"
git push
```

**方式2：手动触发**
1. 进入 GitHub 仓库
2. 点击「Actions」
3. 选择「Deploy to Aliyun FC」
4. 点击「Run workflow」

---

### 四、获取部署地址

部署完成后（约10分钟），在 Actions 日志末尾找到：

```
### 部署成功! 🎉

**函数访问地址**: https://zcy-api-xxxxx.cn-hongkong.fc.aliyuncs.com
```

---

### 五、更新前端配置

修改 `client/.env`：

```bash
EXPO_PUBLIC_BACKEND_BASE_URL=https://zcy-api-xxxxx.cn-hongkong.fc.aliyuncs.com
```

---

## 🔗 相关文件

| 文件 | 说明 |
|------|------|
| `.github/workflows/deploy.yml` | GitHub Actions 自动化部署配置 |
| `server/Dockerfile` | Docker 镜像构建配置 |
| `server/s.yaml` | 阿里云函数计算配置 |
| `server/CLOUD_DEPLOY.md` | 详细部署文档 |

---

## ⚠️ 常见问题

### Q: 推送镜像失败
确保 `ALIYUN_REGISTRY_PASSWORD` 是容器镜像服务的固定密码，不是阿里云登录密码。

### Q: 部署失败
检查 `ALIYUN_ACCESS_KEY_ID` 和 `ALIYUN_ACCESS_KEY_SECRET` 是否正确。

### Q: 函数超时
编辑 `server/s.yaml`，将 `timeout` 增加到 `300`。

---

## 📊 费用预估

- 函数计算：约 40元/月（有免费额度）
- 容器镜像存储：约 2元/月
- 总计：约 42元/月

实际费用可能更低，因为阿里云函数计算有免费额度。
