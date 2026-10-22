import {
  IconFolder, IconMicroscope, IconChartBar, IconNotes, IconMessageCircle, IconPalette, IconTrendingUp, IconSettings,
  IconTool, IconBuilding, IconFlask, IconClipboard, IconTarget, IconBulb, IconRocket, IconBooks,
  IconHome, IconWorld, IconRobot, IconBrain
} from "@tabler/icons-react";

export const ICON_MAP: Record<string, any> = {
  "folder": IconFolder,
  "microscope": IconMicroscope,
  "chart-bar": IconChartBar,
  "notes": IconNotes,
  "message-circle": IconMessageCircle,
  "palette": IconPalette,
  "trending-up": IconTrendingUp,
  "settings": IconSettings,
  "tool": IconTool,
  "building": IconBuilding,
  "flask": IconFlask,
  "clipboard": IconClipboard,
  "target": IconTarget,
  "bulb": IconBulb,
  "rocket": IconRocket,
  "books": IconBooks,
  "home": IconHome,
  "world": IconWorld,
  "robot": IconRobot,
  "brain": IconBrain,
  // Backwards compatibility - map old emojis to icon keys
  "📁": IconFolder,
  "🔬": IconMicroscope,
  "📊": IconChartBar,
  "📝": IconNotes,
  "💬": IconMessageCircle,
  "🎨": IconPalette,
  "📈": IconTrendingUp,
  "⚙️": IconSettings,
  "🛠️": IconTool,
  "🏗️": IconBuilding,
  "🧪": IconFlask,
  "📋": IconClipboard,
  "🎯": IconTarget,
  "💡": IconBulb,
  "🚀": IconRocket,
  "📚": IconBooks,
  "🏠": IconHome,
  "🌐": IconWorld,
  "🤖": IconRobot,
  "🧠": IconBrain,
};

export function getWorkspaceIcon(iconName: string, size: number = 20, strokeWidth: number = 2) {
  const IconComponent = ICON_MAP[iconName] || IconFolder;
  return <IconComponent size={size} strokeWidth={strokeWidth} />;
}
