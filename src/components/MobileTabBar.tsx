import { motion } from "framer-motion";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": {
        name?: string;
        class?: string;
      };
    }
  }
}

export type MobileTab = "config" | "preview";

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

interface TabButtonProps {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, icon, isActive, onClick }: TabButtonProps) {
  return (
    <motion.button
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 transition-all ${
        isActive
          ? "bg-primary-500/20 text-primary-400 font-medium"
          : "text-ink-muted hover:text-ink-primary"
      }`}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <ion-icon name={icon} class="text-lg" />
      <span className="font-mono text-sm font-medium">{label}</span>
    </motion.button>
  );
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div className="fixed right-4 bottom-4 left-4 z-50">
      <div className="border-border bg-secondary/95 flex items-center justify-around rounded-2xl border p-2 shadow-2xl backdrop-blur-xl">
        <TabButton
          label="Config"
          icon="settings-outline"
          isActive={activeTab === "config"}
          onClick={() => onTabChange("config")}
        />

        <TabButton
          label="Preview"
          icon="cube-outline"
          isActive={activeTab === "preview"}
          onClick={() => onTabChange("preview")}
        />
      </div>
    </div>
  );
}
