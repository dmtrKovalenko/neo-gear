import * as HoverCard from "@radix-ui/react-hover-card";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface HelpContent {
  title: string;
  content: ReactNode;
}

interface InfoHoverCardProps {
  content: HelpContent;
  children: ReactNode;
}

export function InfoHoverCard({ content, children }: InfoHoverCardProps) {
  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="z-10000"
          side="right"
          align="start"
          sideOffset={12}
        >
          <motion.div
            className="border-border bg-secondary w-80 rounded-lg border p-4 shadow-xl"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
          >
            <h3 className="text-ink-primary mb-3 font-mono text-sm font-bold">
              {content.title}
            </h3>

            <div className="text-ink-primary/70 space-y-3 font-mono text-xs leading-relaxed">
              {content.content}
            </div>

            <HoverCard.Arrow className="fill-border" />
          </motion.div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
