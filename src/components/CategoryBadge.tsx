import Link from "next/link";
import type { Category, Language } from "@/lib/config";
import { getCategoryLabel } from "@/lib/config";

interface CategoryBadgeProps {
  category: Category;
  language: Language;
  /** If true, renders as a link to the category page */
  linked?: boolean;
}

/**
 * Styled badge displaying a category name with its accent color.
 * Uses CSS custom properties defined in globals.css for category colors.
 */
export default function CategoryBadge({
  category,
  language,
  linked = true,
}: CategoryBadgeProps) {
  const label = getCategoryLabel(category, language);

  const badgeClasses =
    "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white";

  // Use inline style with the CSS custom property for category color
  const style = { backgroundColor: `var(--color-${category})` };

  if (linked) {
    return (
      <Link
        href={`/${language}/category/${category}`}
        className={`${badgeClasses} transition-opacity hover:opacity-80`}
        style={style}
      >
        {label}
      </Link>
    );
  }

  return (
    <span className={badgeClasses} style={style}>
      {label}
    </span>
  );
}
