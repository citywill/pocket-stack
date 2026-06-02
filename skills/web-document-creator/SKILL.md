---
name: web-document-creator
description: 递归访问网页并自动生成带有截图和描述的 Markdown 说明文档。适用于快速生成网站功能手册、UI 审查报告等。
---

# Web Document Creator Skill

这个技能通过结合 Chrome DevTools MCP 和 Python 辅助脚本，实现对指定网址的深度探索与文档化。

## 核心工作流

当你收到“对 [URL] 进行文档化”的任务时，请遵循以下步骤：

1. **初始化项目**：
   - 运行 `scripts/creator.py` 初始化输出目录（默认名为网址的域名）。
   
2. **递归探索循环**：
   - **Navigate**: 
     - **重要**：必须使用**简体中文**生成当前界面的功能描述。
     - **Record**: 调用 `scripts/creator.py` 中的 `add_page` 方法记录当前状态（确保标题和描述均为中文）。
   - **Capture**: 
     - **重要**：如果用户没有明确提出屏幕分辨率，请调用 `mcp_Chrome_DevTools_MCP_resize_page` 将页面大小设置为 1920*1080。
     - 使用 `mcp_Chrome_DevTools_MCP_take_screenshot` 保存截图到项目的 `screenshots/` 目录。
     - 使用 `mcp_Chrome_DevTools_MCP_take_snapshot` 获取页面结构。
   - **Analyze**:
     - 分析快照，提取所有 `<a>`, `<button>`, 以及具有 `onclick` 属性或 `role="button"` 的元素。
     - 生成当前界面的简短描述。
   - **Record**: 调用 `scripts/creator.py` 中的 `add_page` 方法记录当前状态。
   - **Recurse**:
     - 维护一个 `visited_uids` 集合，避免重复点击。
     - 对每个未点击的可交互元素，执行 `mcp_Chrome_DevTools_MCP_click`。
     - 如果点击导致 URL 变化或出现弹窗，重复 Capture 步骤。
     - 使用 `mcp_Chrome_DevTools_MCP_navigate_page(type="back")` 返回。

3. **生成文档**：
   - 所有页面探索完成后，运行 `scripts/creator.py` 的 `generate_markdown()` 方法生成最终的 `README.md`。

## 注意事项

- **语言要求**：所有生成的文档内容、页面描述、元素说明必须使用**简体中文**。
- **深度限制**：默认递归深度为 3 层，避免陷入无限循环。
- **外部链接**：仅探索同域下的链接。
- **弹窗处理**：点击后若出现 `dialog` 或 `aria-modal="true"`，应优先处理。
- **命名规范**：截图文件名建议使用 `page_id_timestamp.png`。
