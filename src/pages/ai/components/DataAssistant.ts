import { pb } from '@/lib/pocketbase';

export interface CollectionSchema {
  id: string;
  name: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
  }[];
}

export class DataAssistantService {
  /**
   * 获取所有可见集合的 Schema
   */
  async getAvailableCollections(): Promise<CollectionSchema[]> {
    try {
      // 这里的 collections.list 可能受权限限制，如果是普通用户可能只能看到部分
      // 在 PocketBase 中，普通用户通常无法通过 API 直接获取所有 collection 的 schema
      // 除非我们在后台通过 Admin SDK 暴露一个接口，或者在这里硬编码一些常用业务集合

      // 方案 A: 尝试通过 API 获取 (通常需要 Admin 权限)
      // 方案 B: 根据业务需求硬编码主要业务表

      const businessCollections = ['tasks', 'crm_companies', 'users'];
      const schemas: CollectionSchema[] = [];

      for (const name of businessCollections) {
        try {
          // 尝试获取一个记录来推断结构，或者如果 pb_schemas 可用则更好
          // 实际上 PocketBase 的 Web API 并不直接暴露完整 schema 给普通用户
          // 我们这里通过模拟或尝试获取元数据
          const list = await pb.collection(name).getList(1, 1);
          if (list.items.length > 0) {
            const item = list.items[0];
            const fields = Object.keys(item)
              .filter(k => !['id', 'created', 'updated', 'collectionId', 'collectionName', 'expand'].includes(k))
              .map(k => ({
                name: k,
                type: typeof (item as any)[k],
                required: false
              }));

            schemas.push({
              id: name,
              name: name,
              fields: fields
            });
          }
        } catch (e) {
          console.warn(`Could not fetch schema for ${name}`, e);
        }
      }

      return schemas;
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  /**
   * 执行查询
   */
  async queryData(collectionName: string, options: { filter?: string, sort?: string, limit?: number } = {}) {
    try {
      const result = await pb.collection(collectionName).getList(1, options.limit || 10, {
        filter: options.filter,
        sort: options.sort,
      });
      return result.items;
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * 构建系统提示词
   */
  async buildSystemPrompt(): Promise<string> {
    const schemas = await this.getAvailableCollections();

    let prompt = `You are a helpful AI Data Assistant for PocketBase.
You have access to the following data collections and their structures:

`;

    schemas.forEach(s => {
      prompt += `- Collection: ${s.name}\n`;
      prompt += `  Fields: ${s.fields.map(f => `${f.name} (${f.type})`).join(', ')}\n`;
    });

    prompt += `
When users ask about data, you should:
1. Identify if you need to query the database.
2. If you need data, you can ask for it by outputting a special command block:
   [QUERY: {"collection": "collection_name", "filter": "filter_expression", "sort": "-created", "limit": 10}]
   Filter syntax is PocketBase filter syntax (e.g., status = "todo" && priority > 1).

3. After you receive the data (it will be provided in the next turn), answer the user's question based on that data.
4. If you already have enough information or if the user is just chatting, respond normally.

Example:
User: "How many pending tasks do I have?"
Assistant: [QUERY: {"collection": "tasks", "filter": "status = 'pending'"}]
`;

    return prompt;
  }
}

export const dataAssistant = new DataAssistantService();
