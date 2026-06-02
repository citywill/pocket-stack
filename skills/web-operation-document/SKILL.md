---
name: web-operation-document
description: 对网页操作进行自动标注，并生成带有操作截图和详细说明文案的 Markdown 格式操作文档。
---

# Web Operation Document Skill

这个技能通过结合 Chrome DevTools MCP 和 Python 辅助脚本，实现对网页操作的自动化记录、截图标注以及 Markdown 操作文档的自动生成。

## 核心工作流

当你收到“生成 [URL] 的 [功能描述] 操作文档”的任务时，请遵循以下步骤：

1. **初始化项目**：
   - 确定一个项目名称（例如 `baidu_search_doc`）。
   - 运行 `scripts/doc_creator.py init --project [项目名]` 初始化输出目录。

2. **交互记录循环**：
   - **分析操作**：根据用户需求，确定下一步需要点击或输入的元素。
   - **执行前截图**：
     - **重要**：如果用户没有明确提出屏幕分辨率，请调用 `mcp_Chrome_DevTools_MCP_resize_page` 将页面大小设置为 1920*1080。
     - 调用 `mcp_Chrome_DevTools_MCP_take_screenshot` 获取当前页面截图。
   - **获取位置**：通过 `mcp_Chrome_DevTools_MCP_take_snapshot` 获取目标元素的坐标 (x, y, width, height)。
   - **标注与记录**：
     - 调用 `scripts/doc_creator.py add_step` 方法。
     - 传入截图路径、元素坐标、以及**操作说明文案**（如“在搜索框输入‘Trae’，点击搜索”）。
     - 脚本会自动在截图中该元素位置画红框，并记录该步骤。
   - **执行操作**：调用 `mcp_Chrome_DevTools_MCP_click` 或 `mcp_Chrome_DevTools_MCP_fill` 等。
   - **循环**：重复上述步骤直到完成整个操作流程。

3. **生成文档**：
   - 所有步骤完成后，运行 `scripts/doc_creator.py generate_md --project [项目名]`。
   - 脚本将读取所有记录的步骤，生成一个包含操作截图和说明文字的 `README.md` 或 `OPERATIONS.md` 文件。

## 脚本参数说明

- `init`: 初始化项目目录。
- `add_step`: 记录操作步骤。
  - `--project`: 项目目录名。
  - `--screenshot`: 原始截图路径。
  - `--x`, `--y`, `--w`, `--h`: 标注框位置。
  - `--caption`: 操作说明文案。
- `generate_md`: 生成最终的 Markdown 文档。
  - `--project`: 项目目录名。
  - `--title`: (可选) 文档标题。
