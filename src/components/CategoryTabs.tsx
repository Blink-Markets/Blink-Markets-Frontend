import { BetCategory, CATEGORIES } from "../types/bet";
import { cn } from "../lib/utils";

interface CategoryTabsProps {
  selected: BetCategory;
  onSelect: (category: BetCategory) => void;
  counts: Record<BetCategory, number>;
}

// Dark exchange category colors — neon accents
const categoryColors: Record<string, { text: string; accent: string }> = {
  All: {
    text: "oklch(93% 0.01 270)",
    accent: "oklch(72% 0.19 195)",
  },
  Sports: {
    text: "oklch(93% 0.01 270)",
    accent: "oklch(72% 0.19 155)",
  },
  Crypto: {
    text: "oklch(93% 0.01 270)",
    accent: "oklch(75% 0.16 85)",
  },
  "E-Sports": {
    text: "oklch(93% 0.01 270)",
    accent: "oklch(68% 0.22 290)",
  },
  Politics: {
    text: "oklch(93% 0.01 270)",
    accent: "oklch(62% 0.22 15)",
  },
  Random: {
    text: "oklch(93% 0.01 270)",
    accent: "oklch(72% 0.2 200)",
  },
};

export function CategoryTabs({
  selected,
  onSelect,
  counts,
}: CategoryTabsProps) {
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-1">
        {CATEGORIES.map((category, index) => {
          const isActive = selected === category.id;
          const count =
            category.id === "All"
              ? Object.values(counts).reduce((a, b) => a + b, 0)
              : counts[category.id] || 0;

          const colors =
            categoryColors[category.label] || categoryColors["All"];

          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 text-sm",
                "transition-all duration-300",
                "border",
                isActive ? "font-semibold" : "font-medium",
              )}
              style={{
                borderRadius: "4px",
                background: isActive ? "oklch(72% 0.19 195)" : "transparent",
                borderColor: isActive
                  ? "oklch(72% 0.19 195)"
                  : "oklch(25% 0.03 270)",
                color: isActive ? "oklch(10% 0.02 270)" : "oklch(65% 0.01 270)",
                boxShadow: isActive
                  ? "0 0 12px oklch(72% 0.19 195 / 0.3)"
                  : "none",
                animationDelay: `${index * 50}ms`,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.color = "oklch(93% 0.01 270)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "oklch(25% 0.03 270)";
                  e.currentTarget.style.color = "oklch(65% 0.01 270)";
                }
              }}
            >
              <span className="text-base">{category.icon}</span>
              <span>{category.label}</span>

              {count > 0 && (
                <span
                  className="ml-0.5 px-2 py-0.5 text-xs font-bold"
                  style={{
                    borderRadius: "2px",
                    background: isActive
                      ? "oklch(10% 0.02 270)"
                      : "oklch(22% 0.03 270)",
                    color: isActive
                      ? "oklch(72% 0.19 195)"
                      : "oklch(55% 0.02 270)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
