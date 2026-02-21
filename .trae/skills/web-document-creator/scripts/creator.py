import json
import os

class WebDocumentCreator:
    def __init__(self, project_name):
        self.project_name = project_name
        self.output_dir = os.path.join(os.getcwd(), project_name)
        self.screenshots_dir = os.path.join(self.output_dir, "screenshots")
        self.data_file = os.path.join(self.output_dir, "data.json")
        self.pages = {}  # {url_or_id: {title, description, screenshot, links: []}}
        
        if not os.path.exists(self.screenshots_dir):
            os.makedirs(self.screenshots_dir)
        
        # 加载已有数据
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    self.pages = json.load(f)
            except Exception:
                pass

    def add_page(self, page_id, title, description, screenshot_path, links):
        """
        添加一个页面的信息
        :param page_id: 唯一标识符（如 URL 或 标题）
        :param title: 页面标题
        :param description: 页面描述
        :param screenshot_path: 截图的相对路径
        :param links: 可点击元素的列表 [{text, uid, target_id}]
        """
        self.pages[page_id] = {
            "title": title,
            "description": description,
            "screenshot": screenshot_path,
            "links": links
        }
        self._save_data()

    def _save_data(self):
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.pages, f, ensure_ascii=False, indent=2)

    def generate_markdown(self):
        """生成最终的 Markdown 文档"""
        md_content = f"# {self.project_name} 自动化文档\n\n"
        md_content += "本文档由 web-document-creator 自动生成。\n\n"
        
        for page_id, info in self.pages.items():
            md_content += f"## {info['title']}\n\n"
            md_content += f"**描述**: {info['description']}\n\n"
            md_content += f"![{info['title']}]({info['screenshot']})\n\n"
            
            if info['links']:
                md_content += "### 可交互元素\n\n"
                for link in info['links']:
                    md_content += f"- **{link['text']}**: {link.get('description', '点击进入新界面')}\n"
                md_content += "\n"
        
        md_path = os.path.join(self.output_dir, "README.md")
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md_content)
        return md_path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Web Document Creator Helper")
    parser.add_argument("action", choices=["init", "add", "generate"], help="Action to perform")
    parser.add_argument("--project", required=True, help="Project name")
    parser.add_argument("--page_id", help="Page ID")
    parser.add_argument("--title", help="Page Title")
    parser.add_argument("--description", help="Page Description")
    parser.add_argument("--screenshot", help="Screenshot path")
    parser.add_argument("--links", help="JSON string of links")
    
    args = parser.parse_args()
    
    creator = WebDocumentCreator(args.project)
    
    if args.action == "init":
        print(f"Project {args.project} initialized at {creator.output_dir}")
    elif args.action == "add":
        links = json.loads(args.links) if args.links else []
        creator.add_page(args.page_id, args.title, args.description, args.screenshot, links)
        print(f"Page {args.page_id} added.")
    elif args.action == "generate":
        path = creator.generate_markdown()
        print(f"Markdown generated at {path}")
