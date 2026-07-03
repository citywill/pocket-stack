import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pocketbase = path.join(root, ".pocketbase", "pocketbase.exe");

// 启动 PocketBase
const pb = spawn(pocketbase, ["serve"], {
  stdio: "inherit",
  cwd: root,
  shell: true,
});

// 启动 Vite
const vite = spawn("npx", ["vite"], {
  stdio: "inherit",
  cwd: root,
  shell: true,
});

function cleanup() {
  pb.kill();
  vite.kill();
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
