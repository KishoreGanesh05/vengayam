# Implementation Plan: Satirical News Website

## Overview

Build a bilingual (English/Tamil) satirical news website using Next.js App Router, MDX content authoring, Tailwind CSS, and TypeScript. The site is statically generated and deployed to Vercel at vengayam.in. Implementation proceeds from project scaffolding through content layer, layout system, article rendering, and finally social/SEO features.

## Tasks

- [x] 1. Set up project structure and configuration
  - [x] 1.1 Initialize Next.js project with TypeScript, Tailwind CSS, and MDX support
    - Run `npx create-next-app` with TypeScript and Tailwind
    - Install dependencies: `@next/mdx` or `next-mdx-remote`, `gray-matter`, `@tailwindcss/typography`, `date-fns`, `fast-check`, `vitest`
    - Configure `next.config.js` for MDX support and image domains
    - Configure `tsconfig.json` path aliases
    - _Requirements: Project scaffolding, dependencies from design_

  - [x] 1.2 Set up Tailwind configuration with typography plugin and Tamil font support
    - Configure `tailwind.config.ts` with custom theme colors for categories
    - Add `@tailwindcss/typography` plugin for prose styling
    - Configure `next/font` for English (Playfair Display or Lora) and Tamil (Noto Sans Tamil) fonts
    - Set up `globals.css` with base styles and Tamil typography utilities
    - _Requirements: Typography, bilingual font support from design_

  - [x] 1.3 Create site configuration and type definitions
    - Create `src/lib/config.ts` with `SiteConfig`, `CategoryConfig`, navigation items
    - Create type definitions for `Article`, `ArticleMeta`, `Language`, `Category`, `ArticleFrontmatter`
    - Define all category configs with English/Tamil labels and accent colors
    - _Requirements: Data models, site configuration from design_

  - [x] 1.4 Create content directory structure with sample articles
    - Create `content/en/` and `content/ta/` directories
    - Add sample English article MDX file with full frontmatter
    - Add sample Tamil article MDX file with full frontmatter
    - Create `public/images/articles/` and `public/images/site/` directories
    - Add placeholder images for sample articles
    - _Requirements: Content structure from design_

- [x] 2. Implement content layer (article loading and parsing)
  - [x] 2.1 Implement frontmatter parsing and validation
    - Create `src/lib/articles.ts` with `parseFrontmatter()` function
    - Validate required fields: title, author, publishedAt, category, excerpt, coverImage, coverImageAlt
    - Enforce constraints: title max 120 chars, excerpt max 300 chars, valid category, valid date
    - Throw descriptive `ValidationError` on invalid frontmatter with filename context
    - _Requirements: Frontmatter validation rules from design_

  - [x] 2.2 Write property tests for frontmatter validation
    - **Property 8: Cover images have alt text (accessibility)**
    - **Property 1: All published articles have valid dates**
    - Use fast-check to generate random frontmatter objects and verify validation logic
    - **Validates: Correctness Properties 1, 8**

  - [x] 2.3 Implement article loading functions
    - Implement `loadAllArticles(language)` — reads MDX files from language directory, parses frontmatter, filters future-dated articles, sorts by publishedAt descending
    - Implement `getArticleBySlug(slug, language)` — loads single article with full MDX content
    - Implement `getArticlesByCategory(category, language)` — filters by category within language
    - Implement `getFeaturedArticles(language)` — returns articles with `featured: true`
    - Implement `getRelatedArticles(currentSlug, category, language, limit)` — returns related articles excluding current
    - Derive slug from filename (strip .mdx extension)
    - _Requirements: Content layer component, algorithmic pseudocode from design_

  - [x] 2.4 Write property tests for article loading
    - **Property 2: Article slugs are unique within a language**
    - **Property 3: Category filtering is exhaustive — all returned articles match category and language**
    - **Property 6: Articles are sorted by date (newest first) within each language**
    - **Property 7: No future-dated articles appear in listings**
    - **Property 9: Language isolation — articles only appear in their language section**
    - **Validates: Correctness Properties 2, 3, 6, 7, 9**

- [x] 3. Checkpoint - Ensure content layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement page layout system
  - [x] 4.1 Create root layout with header and footer
    - Create `src/app/layout.tsx` as the root layout
    - Create `src/components/Header.tsx` with site name, navigation links, and language switcher
    - Create `src/components/Footer.tsx` with site info and social links
    - Apply responsive design with Tailwind
    - _Requirements: Page layout system, navigation from design_

  - [x] 4.2 Create language-specific layout and language switcher
    - Create `src/app/[lang]/layout.tsx` that applies language-specific font and direction
    - Create `src/components/LanguageSwitcher.tsx` to toggle between /en/ and /ta/ routes
    - Create `src/lib/i18n.ts` with UI string translations for nav labels, category names, and common UI text
    - Configure font loading: English serif font for `/en/`, Tamil font for `/ta/`
    - _Requirements: Bilingual support, language switcher from design_

  - [x] 4.3 Create article listing components
    - Create `src/components/ArticleCard.tsx` — displays title, excerpt, category badge, date, cover image
    - Create `src/components/ArticleGrid.tsx` — responsive grid of ArticleCards
    - Create `src/components/FeaturedArticle.tsx` — hero-style display for featured articles
    - Create `src/components/CategoryBadge.tsx` — styled badge with category accent color
    - _Requirements: Article listing UI from design_

- [x] 5. Implement article rendering and pages
  - [x] 5.1 Create MDX components and article renderer
    - Create `src/components/mdx/PullQuote.tsx` for styled pull quotes
    - Create `src/components/mdx/index.tsx` as MDX component registry (h1, h2, p, blockquote, img, PullQuote)
    - Style with newspaper typography — clean serif headings, readable body text
    - Handle responsive images with Next.js Image component
    - _Requirements: Article renderer component from design_

  - [x] 5.2 Create article detail page
    - Create `src/app/[lang]/articles/[slug]/page.tsx`
    - Implement `generateStaticParams` to pre-render all article pages
    - Display article metadata: title, subtitle, author, date, category
    - Render MDX body with custom components
    - Show related articles at bottom
    - _Requirements: Article page, static path generation from design_

  - [x] 5.3 Create homepage and category pages
    - Create `src/app/[lang]/page.tsx` — language homepage with featured articles hero and recent articles grid
    - Create `src/app/[lang]/category/[category]/page.tsx` — category listing page with filtered articles
    - Create `src/app/page.tsx` — root page that redirects to default language or shows language selector
    - Implement `generateStaticParams` for category pages
    - _Requirements: Homepage, category pages, URL structure from design_

  - [x] 5.4 Write unit tests for page rendering
    - Test homepage renders featured articles
    - Test category page filters correctly
    - Test article page renders MDX content
    - **Property 4: Featured articles appear on language homepage**
    - **Validates: Correctness Property 4**

- [x] 6. Checkpoint - Ensure pages render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement social sharing and SEO
  - [x] 7.1 Create social share buttons component
    - Create `src/components/ShareButtons.tsx` with Twitter/X, Facebook, LinkedIn, and copy-link buttons
    - Implement `generateShareUrl()` utility in `src/lib/utils.ts`
    - Add copy-to-clipboard functionality
    - Ensure accessible button labels
    - Integrate share buttons into article detail page
    - _Requirements: Social sharing component from design_

  - [x] 7.2 Write property tests for share URL generation
    - **Property 5: Share URLs are valid for all platforms**
    - Use fast-check to generate random valid URLs and titles, verify output is valid URL
    - **Validates: Correctness Property 5**

  - [x] 7.3 Implement SEO metadata and structured data
    - Add Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:type`) to article pages
    - Add `hreflang` alternate links between English and Tamil versions
    - Generate `sitemap.xml` in `src/app/sitemap.ts`
    - Generate RSS feed at `/en/feed.xml` and `/ta/feed.xml`
    - Set Content Security Policy headers in `next.config.js`
    - _Requirements: SEO, sitemap, RSS, security from design_

  - [x] 7.4 Write unit tests for SEO metadata
    - **Property 10: URL structure includes language prefix**
    - Test sitemap includes all published articles
    - Test RSS feed generates valid XML
    - **Validates: Correctness Property 10**

- [x] 8. Final wiring and deployment configuration
  - [x] 8.1 Wire all components together and verify build
    - Ensure all pages use consistent layout with header, footer, language switcher
    - Verify navigation links work across all pages
    - Verify language switching preserves current page context where possible
    - Run `next build` to verify full static generation succeeds
    - _Requirements: Integration, build pipeline from design_

  - [x] 8.2 Configure Vercel deployment
    - Create/verify `vercel.json` if custom configuration needed
    - Configure domain settings documentation for vengayam.in
    - Set up build command and output directory
    - Verify static export works with all routes
    - _Requirements: Vercel deployment from design_

- [x] 9. Final checkpoint - Ensure all tests pass and build succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific design components and requirements for traceability
- Checkpoints ensure incremental validation at content layer, page rendering, and final integration
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The site uses TypeScript throughout — all components, utilities, and configurations are type-safe
- Tamil font files should be subsetted for performance as noted in design

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4"] },
    { "id": 5, "tasks": ["4.1", "4.2"] },
    { "id": 6, "tasks": ["4.3", "5.1"] },
    { "id": 7, "tasks": ["5.2", "5.3"] },
    { "id": 8, "tasks": ["5.4"] },
    { "id": 9, "tasks": ["7.1", "7.3"] },
    { "id": 10, "tasks": ["7.2", "7.4"] },
    { "id": 11, "tasks": ["8.1"] },
    { "id": 12, "tasks": ["8.2"] }
  ]
}
```
