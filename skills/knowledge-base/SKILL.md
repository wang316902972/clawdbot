---
name: knowledge-base
description: 知识库操作工具，支持文档存储、语义搜索、摘要生成和文档管理。调用方式：/knowledge_base 或 /knowledge-base
---

# Knowledge Base

## 概述

此 skill 提供知识库的完整操作接口，支持文档的存储、语义搜索和智能摘要。

**重要提示**：

- 调用时请使用：`/knowledge_base <命令> [参数]` 或 `/knowledge-base <命令> [参数]`
- 搜索通过向量数据库实现，支持语义搜索
- MCP 工具名称：`mcp__knowledge-base__search`, `mcp__knowledge-base__add`, `mcp__knowledge-base__delete`, `mcp__knowledge-base__stats`

## 可用命令

### 搜索文档

```bash
# 语义搜索（最常用）
/knowledge_base search --query "如何配置OpenClaw"
```

### 存储文档

```bash
# 添加文档到知识库
/knowledge_base add --content "文档内容..."
```

### 删除文档

```bash
# 删除指定文档
/knowledge_base delete --content "文档内容..."
```

### 统计信息

```bash
# 获取知识库统计信息
/knowledge_base stats
```

## 使用示例

### 场景1：用户问答

```
# 用户提问：如何配置OpenClaw的定时任务？
/knowledge_base search --query "OpenClaw 定时任务 配置" --top_k 3
```

### 场景2：文档管理

```
# 添加技术文档
/knowledge_base add --content "OpenClaw 配置指南：完整的配置内容..."

# 查看知识库统计
/knowledge_base stats
```

## 技术细节

**搜索引擎**:

- 使用向量嵌入（embedding）技术
- 支持多语言（包括中文）
- 基于 FAISS 向量索引

**数据存储**:

- 向量数据库持久化存储
- 使用 paraphrase-multilingual-MiniLM-L12-v2 模型

**搜索优化**:

- 向量相似度搜索
- 按相关性排序
- 支持 top_k 参数控制返回数量
