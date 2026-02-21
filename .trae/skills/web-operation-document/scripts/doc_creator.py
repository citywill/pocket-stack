import json
import os
from PIL import Image, ImageDraw, ImageFont

class DocCreator:
    def __init__(self, project_name):
        self.project_name = project_name
        # 统一存放在 .temp 目录下，避免污染根目录
        self.output_dir = os.path.join(os.getcwd(), ".temp", project_name)
        self.screenshots_dir = os.path.join(self.output_dir, "screenshots")
        self.processed_dir = os.path.join(self.output_dir, "processed")
        self.data_file = os.path.join(self.output_dir, "data.json")
        self.steps = []
        
        for d in [self.screenshots_dir, self.processed_dir]:
            if not os.path.exists(d):
                os.makedirs(d, exist_ok=True)
        
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    self.steps = json.load(f)
            except Exception:
                pass

    def add_step(self, screenshot_path, x, y, w, h, caption):
        """
        记录一个步骤并处理图片（标注红框）
        """
        step_idx = len(self.steps)
        processed_filename = f"step_{step_idx:03d}.png"
        processed_path = os.path.join(self.processed_dir, processed_filename)
        
        # 1. 标注图片 (仅画红框，不加底部字幕，因为文档中会有文字说明)
        self._annotate_image(screenshot_path, x, y, w, h, processed_path)
        
        # 2. 记录数据
        self.steps.append({
            "original": screenshot_path,
            "processed": processed_path,
            "relative_processed": f"processed/{processed_filename}",
            "rect": [x, y, w, h],
            "caption": caption
        })
        self._save_data()
        return processed_path

    def _annotate_image(self, img_path, x, y, w, h, save_path):
        with Image.open(img_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            draw = ImageDraw.Draw(img)
            
            # 画红框
            if w > 0 and h > 0:
                for i in range(5):
                    draw.rectangle([x-i, y-i, x+w+i, y+h+i], outline="red")
            
            img.save(save_path)

    def _save_data(self):
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.steps, f, ensure_ascii=False, indent=2)

    def generate_md(self, title=None):
        """生成 Markdown 文档"""
        if not self.steps:
            print("No steps to generate document.")
            return
        
        md_title = title or f"{self.project_name} 操作流程文档"
        lines = [f"# {md_title}\n"]
        lines.append(f"本文档由 web-operation-document 技能自动生成。\n")
        
        for i, step in enumerate(self.steps):
            lines.append(f"## 步骤 {i+1}")
            lines.append(f"{step['caption']}\n")
            # 使用相对路径，方便在 Markdown 中查看
            lines.append(f"![步骤 {i+1}]({step['relative_processed']})\n")
            lines.append("---")
        
        output_path = os.path.join(self.output_dir, "OPERATIONS.md")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(lines))
        
        print(f"Document generated at {output_path}")
        return output_path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Web Operation Document Helper")
    parser.add_argument("action", choices=["init", "add_step", "generate_md"], help="Action to perform")
    parser.add_argument("--project", required=True, help="Project name")
    parser.add_argument("--screenshot", help="Original screenshot path")
    parser.add_argument("--x", type=int, default=0, help="Element X")
    parser.add_argument("--y", type=int, default=0, help="Element Y")
    parser.add_argument("--w", type=int, default=0, help="Element Width")
    parser.add_argument("--h", type=int, default=0, help="Element Height")
    parser.add_argument("--caption", help="Caption text")
    parser.add_argument("--title", help="Document title")
    
    args = parser.parse_args()
    
    creator = DocCreator(args.project)
    
    if args.action == "init":
        print(f"Project {args.project} initialized at {creator.output_dir}")
    elif args.action == "add_step":
        path = creator.add_step(args.screenshot, args.x, args.y, args.w, args.h, args.caption)
        print(f"Step added. Processed image at {path}")
    elif args.action == "generate_md":
        path = creator.generate_md(args.title)
