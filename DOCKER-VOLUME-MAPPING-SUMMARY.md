# Docker Compose 磁盘映射配置 - 修改总结

## 修改内容

### 1. docker-compose.yml

为 `clawdbot-gateway` 和 `clawdbot-cli` 两个服务添加了以下磁盘映射：

```yaml
volumes:
  # ... 原有映射 ...
  # Skills 和 Extensions 目录映射，实现动态修改即时生效
  - ${CLAWDBOT_SKILLS_DIR:-./skills}:/home/node/clawdbot/skills
  - ${CLAWDBOT_EXTENSIONS_DIR:-./extensions}:/home/node/clawdbot/extensions
```

**特点**:
- 使用环境变量支持自定义路径
- 提供默认值（`./skills` 和 `./extensions`）
- 两个服务都已配置，确保一致性

### 2. .env.docker

新增环境变量配置：

```bash
# Skills 目录 (宿主机路径，用于动态加载技能)
CLAWDBOT_SKILLS_DIR=./skills

# Extensions 目录 (宿主机路径，用于动态加载扩展)
CLAWDBOT_EXTENSIONS_DIR=./extensions
```

### 3. 新增文档

创建了详细的配置说明文档：
- `DOCKER-VOLUME-MAPPING.md` - 完整的配置说明和使用指南
- `test-volume-mapping.sh` - 磁盘映射验证脚本

## 验证结果

运行 `./test-volume-mapping.sh` 的输出：

```
✓ Skills 目录存在: ./skills
  包含 52 个项目
✓ Extensions 目录存在: ./extensions
  包含 30 个项目
```

## 使用方式

### 开发环境

默认配置即可使用，直接编辑 `./skills` 和 `./extensions` 目录：

```bash
# 启动容器
docker compose up -d

# 修改技能文件
vim skills/your-skill/SKILL.md

# 修改扩展代码
vim extensions/your-extension/src/index.ts

# 重启相关服务使修改生效
docker compose restart clawdbot-gateway
```

### 生产环境

可在 `.env.docker` 中自定义路径：

```bash
# 指向持久化存储目录
CLAWDBOT_SKILLS_DIR=/opt/clawdbot/skills
CLAWDBOT_EXTENSIONS_DIR=/opt/clawdbot/extensions
```

## 优势

1. **即时生效**: 修改文件后无需重新构建镜像
2. **开发便利**: 使用宿主机熟悉的编辑器和工具
3. **版本控制**: 直接在宿主机进行 Git 操作
4. **灵活配置**: 通过环境变量自定义路径
5. **生产友好**: 支持持久化存储

## 文件清单

修改的文件：
- ✏️ `docker-compose.yml` - 添加两个新的 volume 映射
- ✏️ `.env.docker` - 添加两个新的环境变量配置

新增的文件：
- 📄 `DOCKER-VOLUME-MAPPING.md` - 详细配置文档
- 🔧 `test-volume-mapping.sh` - 验证测试脚本
- 📝 `DOCKER-VOLUME-MAPPING-SUMMARY.md` - 本总结文档

## 容器内路径

映射后的容器内路径：
- Skills: `/home/node/clawdbot/skills`
- Extensions: `/home/node/clawdbot/extensions`

## 测试验证

验证映射是否生效：

```bash
# 进入容器
docker compose exec clawdbot-gateway bash

# 检查 skills 目录
ls -la /home/node/clawdbot/skills

# 检查 extensions 目录
ls -la /home/node/clawdbot/extensions

# 测试文件同步（在宿主机执行）
touch skills/test.txt

# 在容器内验证
cat /home/node/clawdbot/skills/test.txt
```

## 注意事项

1. **权限**: 确保容器内进程对映射目录有读写权限
2. **生效**: 修改后可能需要重启服务或容器
3. **路径**: 容器内应用使用容器内路径（`/home/node/clawdbot/...`）
4. **性能**: 频繁文件同步可能有轻微性能影响，通常可忽略

## 相关文档

- [Docker Volume Mapping 详细说明](./DOCKER-VOLUME-MAPPING.md)
- [Docker 部署文档](./DOCKER-README.md)
- [环境变量配置](./.env.docker)
