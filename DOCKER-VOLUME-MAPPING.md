# Docker Compose 磁盘映射配置说明

## 概述

本文档说明了 Docker Compose 配置中新增的 `skills` 和 `extensions` 目录磁盘映射功能，实现宿主机与容器间的文件同步，方便动态修改和即时生效。

## 新增功能

### 1. Skills 目录映射

```yaml
- ${CLAWDBOT_SKILLS_DIR:-./skills}:/home/node/clawdbot/skills
```

- **宿主机路径**: `./skills` (可通过环境变量 `CLAWDBOT_SKILLS_DIR` 自定义)
- **容器路径**: `/home/node/clawdbot/skills`
- **作用**: 将宿主机的 skills 目录映射到容器内，修改技能文件后无需重新构建镜像即可生效

### 2. Extensions 目录映射

```yaml
- ${CLAWDBOT_EXTENSIONS_DIR:-./extensions}:/home/node/clawdbot/extensions
```

- **宿主机路径**: `./extensions` (可通过环境变量 `CLAWDBOT_EXTENSIONS_DIR` 自定义)
- **容器路径**: `/home/node/clawdbot/extensions`
- **作用**: 将宿主机的 extensions 目录映射到容器内，修改扩展文件后无需重新构建镜像即可生效

## 环境变量配置

在 `.env.docker` 文件中添加了以下配置项：

```bash
# Skills 目录 (宿主机路径，用于动态加载技能)
CLAWDBOT_SKILLS_DIR=./skills

# Extensions 目录 (宿主机路径，用于动态加载扩展)
CLAWDBOT_EXTENSIONS_DIR=./extensions
```

## 使用场景

### 开发调试

1. **修改技能文件**:
   ```bash
   # 直接在宿主机编辑 skills 目录下的文件
   vim skills/your-skill/SKILL.md
   ```

2. **修改扩展代码**:
   ```bash
   # 直接在宿主机编辑 extensions 目录下的代码
   vim extensions/your-extension/src/index.ts
   ```

3. **即时生效**:
   - 重启容器或重新加载相关服务即可看到修改效果
   - 无需重新构建 Docker 镜像
   - 无需重新启动容器

### 生产部署

生产环境中可以将这些目录指向持久化存储路径：

```bash
CLAWDBOT_SKILLS_DIR=/opt/clawdbot/skills
CLAWDBOT_EXTENSIONS_DIR=/opt/clawdbot/extensions
```

## 优势

1. **快速迭代**: 无需重新构建镜像，修改即刻生效
2. **开发便利**: 可以使用宿主机熟悉的编辑器和工具
3. **版本控制**: 直接在宿主机进行 Git 操作
4. **灵活配置**: 通过环境变量轻松自定义映射路径
5. **生产友好**: 支持持久化存储和自定义部署路径

## 注意事项

1. **权限问题**: 确保容器内进程对映射目录有读写权限
2. **文件同步**: 修改后可能需要重启相关服务或容器才能生效
3. **路径一致性**: 容器内应用应使用容器内路径 (`/home/node/clawdbot/skills`)
4. **性能影响**: 频繁的文件同步可能有轻微性能影响，通常可忽略

## 服务覆盖范围

以下服务已配置目录映射：

- ✅ `clawdbot-gateway` - Gateway 服务
- ✅ `clawdbot-cli` - CLI 服务

## 现有映射

除新增的映射外，还有以下已有映射：

1. **配置目录**: `${CLAWDBOT_CONFIG_DIR}:/home/node/.clawdbot`
2. **工作空间**: `${CLAWDBOT_WORKSPACE_DIR}:/home/node/clawd`

## 验证方法

启动容器后，可以使用以下命令验证映射是否生效：

```bash
# 进入容器
docker-compose exec clawdbot-gateway bash

# 检查 skills 目录
ls -la /home/node/clawdbot/skills

# 检查 extensions 目录
ls -la /home/node/clawdbot/extensions

# 测试文件同步
# 在宿主机创建测试文件
touch skills/test.txt

# 在容器内查看
cat /home/node/clawdbot/skills/test.txt
```

## 完整配置示例

```yaml
services:
  clawdbot-gateway:
    volumes:
      - ${CLAWDBOT_CONFIG_DIR}:/home/node/.clawdbot
      - ${CLAWDBOT_WORKSPACE_DIR}:/home/node/clawd
      # Skills 和 Extensions 目录映射，实现动态修改即时生效
      - ${CLAWDBOT_SKILLS_DIR:-./skills}:/home/node/clawdbot/skills
      - ${CLAWDBOT_EXTENSIONS_DIR:-./extensions}:/home/node/clawdbot/extensions
```

## 相关文档

- [Docker Compose 官方文档 - Volumes](https://docs.docker.com/compose/compose-file/compose-file-v3/#volumes)
- [项目 Docker 部署文档](./DOCKER-README.md)
