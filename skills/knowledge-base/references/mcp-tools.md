# Knowledge Base MCP 工具详细说明

## 工具列表

### 1. `mcp__knowledge-base__search`

**功能**: 向量搜索，使用自然语言在向量数据库中查找相关文档内容。

**参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `businesstype` | string | 否 | 环境变量配置 | 业务类型标识符 |
| `query` | string | **是** | - | 搜索查询文本 |
| `top_k` | integer | 否 | 5 | 返回结果数量 (1-50) |

**返回结果格式**:

```json
{
  "relevant_chunks": ["相关文档片段..."],
  "detailed_results": [
    {
      "text": "相关文档片段...",
      "similarity_score": 0.92,
      "match_type": "vector",
      "search_method": "enhanced"
    }
  ],
  "query": "搜索查询",
  "total_found": 5
}
```

---

### 2. `mcp__knowledge-base__add`

**功能**: 将文档内容添加到向量数据库，自动进行文本分块处理。

**参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `businesstype` | string | 否 | 环境变量配置 | 业务类型标识符 |
| `content` | string | **是** | - | 要添加的文档内容 |
| `chunk_size` | integer | 否 | 500 | 文本分块大小（字符数）(50-2000) |
| `chunk_overlap` | integer | 否 | 50 | 分块之间的重叠字符数 (0-500) |

**分块参数说明**:

- `chunk_size`: 控制每个分块的大小，较大的值保留更多上下文
- `chunk_overlap`: 控制分块之间的重叠，有助于保持语义连续性

**返回结果格式**:

```json
{
  "message": "文档处理成功，新增 1 个知识块",
  "total_vectors": 18,
  "chunks_added": 1
}
```

---

### 3. `mcp__knowledge-base__delete`

**功能**: 从向量数据库中删除指定文档。需要提供与添加时相同的内容和分块参数。

**参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `businesstype` | string | 否 | 环境变量配置 | 业务类型标识符 |
| `content` | string | **是** | - | 要删除的文档内容 |
| `chunk_size` | integer | 否 | 500 | 文本分块大小（需与添加时一致）(50-2000) |
| `chunk_overlap` | integer | 否 | 50 | 分块重叠（需与添加时一致）(0-500) |

**重要提示**: `add` 和 `delete` 操作必须使用相同的 `chunk_size` 和 `chunk_overlap` 参数才能正确匹配和删除。

**返回结果格式**:

```json
{
  "success": true,
  "chunks_deleted": 8
}
```

---

### 4. `mcp__knowledge-base__stats`

**功能**: 获取向量数据库的统计信息，包括向量数量、索引类型等。

**参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `businesstype` | string | 否 | 环境变量配置 | 业务类型标识符 |

**返回结果格式**:

```json
{
  "total_vectors": 17,
  "embedding_dim": 384,
  "index_type": "HNSW",
  "model_name": "paraphrase-multilingual-MiniLM-L12-v2",
  "has_unsaved_changes": false,
  "search_optimization_enabled": false,
  "is_trained": true
}
```

---

## 使用注意事项

1. **分块参数一致性**: `add` 和 `delete` 操作必须使用相同的 `chunk_size` 和 `chunk_overlap` 参数
2. **业务类型**: `businesstype` 参数可选，默认使用环境变量配置
3. **分块范围**: `chunk_size` 有效范围 50-2000，`chunk_overlap` 有效范围 0-500
4. **搜索限制**: `top_k` 参数有效范围 1-50
5. **搜索方式**: 使用向量相似度搜索，适合语义查询
