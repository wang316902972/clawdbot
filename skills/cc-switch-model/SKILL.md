---
name: cc-switch-model
description: Claude Code 模型切换工具，支持快速切换默认模型配置。用于：(1) 设置 Claude Code 的默认模型，(2) 查看当前默认模型，(3) 备份和恢复配置，(4) 支持多种模型（haiku/sonnet/opus/glm/minmax等）
---

# CC Switch Model

## 概述

提供便捷的命令行工具来切换 Claude Code 的默认模型，无需手动编辑配置文件。

## 快速开始

```bash
# 切换默认模型
./scripts/switch_model.sh sonnet

# 查看当前模型
./scripts/switch_model.sh --current
```

## 使用方式

### 1. 切换模型

```bash
./scripts/switch_model.sh <模型名称>
```

**支持的模型**:

- `haiku` - 快速、高效
- `sonnet` - 平衡性能（默认推荐）
- `opus` - 最强能力
- `glm-4.7` - GLM-4.7
- `minmax` - MiniMax
- `zai/glm-4.7` - zai GLM-4.7

**示例**:

```bash
# 切换到 sonnet
./scripts/switch_model.sh sonnet

# 切换到 opus
./scripts/switch_model.sh opus

# 切换到 minmax
./scripts/switch_model.sh minmax
```

### 2. 查看当前模型

```bash
./scripts/switch_model.sh --current
# 或
./scripts/switch_model.sh --show
```

### 3. 显示帮助

```bash
./scripts/switch_model.sh --help
```

## 工作原理

脚本会：

1. 验证模型名称是否有效
2. 自动备份当前配置到 `~/.claude/backups/`
3. 更新 `~/.claude/settings.json` 中的 `model` 字段

**配置文件格式**:

```json
{
  "model": "sonnet"
}
```

## 备份管理

每次切换模型时，脚本会自动备份当前配置：

- 备份位置: `~/.claude/backups/settings.json.backup.YYYYMMDD_HHMMSS`
- 可以手动恢复旧版本

## 模型选择建议

| 模型        | 适用场景                         |
| ----------- | -------------------------------- |
| **haiku**   | 快速原型、简单任务、高频调用     |
| **sonnet**  | 日常开发、标准工作流（推荐默认） |
| **opus**    | 复杂分析、深度代码理解           |
| **minmax**  | 速度优先场景                     |
| **glm-4.7** | GLM 模型特定需求                 |

## 全局使用

将脚本添加到 PATH 中的系统路径：

```bash
# 复制到系统路径
sudo cp scripts/switch_model.sh /usr/local/bin/cc-switch

# 添加执行权限
sudo chmod +x /usr/local/bin/cc-switch

# 使用
cc-switch sonnet
cc-switch --current
```

## 集成到工作流

### 在 Shell 中快速切换

在 `~/.zshrc` 或 `~/.bashrc` 中添加别名：

```bash
alias cswitch='/usr/local/bin/cc-switch'
alias csonnet='cswitch sonnet'
alias copus='cswitch opus'
alias chaiku='cswitch haiku'
```

使用：

```bash
copus    # 快速切换到 opus
csonnet  # 切换回 sonnet
```

### 在脚本中调用

```bash
#!/bin/bash
# 在自动化脚本中切换模型
./scripts/switch_model.sh sonnet
claude -p "执行任务"
```

## 故障排查

### 切换后模型未生效

1. **重启 Claude Code 会话**
   - 退出当前会话
   - 重新启动

2. **检查配置文件**

   ```bash
   cat ~/.claude/settings.json
   ```

3. **清除缓存**
   ```bash
   rm -rf ~/.claude/cache
   ```

### 脚本权限错误

```bash
chmod +x scripts/switch_model.sh
```

### 模型名称无效

使用 `--help` 查看支持的模型列表：

```bash
./scripts/switch_model.sh --help
```

## 与其他配置的关系

- **优先级**: `--model` 参数 > `settings.json` > 项目 `.claude.json`
- **适用范围**: `settings.json` 作用于所有 Claude Code 会话
- **项目覆盖**: 项目目录的 `.claude.json` 可以覆盖全局设置

## 示例配置

### 日常开发配置

```bash
# 默认使用 sonnet（平衡性能和成本）
./scripts/switch_model.sh sonnet
```

### 高性能任务配置

```bash
# 临时切换到 opus 处理复杂任务
./scripts/switch_model.sh opus

# 任务完成后切回 sonnet
./scripts/switch_model.sh sonnet
```

### 成本优化配置

```bash
# 使用 haiku 处理大量简单任务
./scripts/switch_model.sh haiku
```
