import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative border-1 bg-white dark:bg-neutral-950"
        >
          <SunIcon className="h-[1.2rem] w-[1.2rem] dark:hidden" />
          <MoonIcon className="hidden h-[1.2rem] w-[1.2rem] dark:block" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>主题模式</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={theme === "light" ? "bg-accent" : ""}
        >
          <SunIcon className="mr-2 h-4 w-4" />
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent" : ""}
        >
          <MoonIcon className="mr-2 h-4 w-4" />
          深色
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={theme === "system" ? "bg-accent" : ""}
        >
          <ComputerDesktopIcon className="mr-2 h-4 w-4" />
          系统
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>主题颜色</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setColorTheme("blue")}
          className={colorTheme === "blue" ? "bg-accent" : ""}
        >
          <span className="mr-2 h-4 w-4 rounded-full bg-blue-500" />
          蓝色
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setColorTheme("green")}
          className={colorTheme === "green" ? "bg-accent" : ""}
        >
          <span className="mr-2 h-4 w-4 rounded-full bg-green-500" />
          绿色
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setColorTheme("red")}
          className={colorTheme === "red" ? "bg-accent" : ""}
        >
          <span className="mr-2 h-4 w-4 rounded-full bg-red-500" />
          红色
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setColorTheme("gray")}
          className={colorTheme === "gray" ? "bg-accent" : ""}
        >
          <span className="mr-2 h-4 w-4 rounded-full bg-neutral-500" />
          灰度
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}