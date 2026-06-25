# 后端开发

## 技术栈

采用 PocketBase 实现后端认证和接口服务。

## PocketBase 客户端

```typescript
import { pb } from '@/lib/pocketbase';

// pb 实例已配置好 URL（来自 VITE_POCKETBASE_URL 环境变量）
// 默认: http://127.0.0.1:8090
```

## 操作 PocketBase 数据库

- 请使用pocketbase mcp或开发python脚本操作 pocketbase
- 默认管理员账号密码是：admin@example.com/admin12345

## Collection 操作

### 命名规范

Collection 命名以模块名为前缀：`{module}_subPageName`

例如：`examples_posts`, `craftor_collections`

### CRUD 操作示例

```typescript
// 查询列表（支持分页、过滤、排序）
const result = await pb.collection('examples_posts').getList(page, pageSize, {
  filter: 'title ~ "search" && status = "published"',
  sort: '-created',
});

// 创建记录
await pb.collection('examples_posts').create({ title: 'New Post', content: '...', author: '...' });

// 更新记录
await pb.collection('examples_posts').update(recordId, { title: 'Updated' });

// 删除记录
await pb.collection('examples_posts').delete(recordId);

// 查询单条
const record = await pb.collection('examples_posts').getOne(recordId);
```

### 过滤语法

- `field = "value"` - 等于
- `field ~ "value"` - 模糊匹配
- `field != "value"` - 不等于
- `condition1 && condition2` - 与
- `condition1 || condition2` - 或

### 排序

- `field` - 升序
- `-field` - 降序

### 错误处理

```typescript
try {
  // pocketbase 操作
} catch (error: any) {
  if (error.isAbort) return;        // 自动取消的请求，忽略
  if (error.status === 404) {       // collection 不存在
    // 设置空数据
  } else {
    toast.error('操作失败');
  }
}
```

## 创建 Collection

使用 PocketBase MCP 操作创建 collection。Collection schema 可以保存为迁移文件：

```json
// src/modules/{module}/migrations/{module}_xxx.json
[
  {
    "name": "examples_posts",
    "type": "base",
    "fields": [
      { "name": "title", "type": "text", "required": true },
      { "name": "content", "type": "text", "required": true },
      { "name": "status", "type": "select", "required": true,
        "values": ["draft", "published", "archived"] }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": ""
  }
]
```
