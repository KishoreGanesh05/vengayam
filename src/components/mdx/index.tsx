import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import type { HTMLAttributes, ImgHTMLAttributes } from "react";
import PullQuote from "./PullQuote";

/**
 * MDX Component Registry
 *
 * Maps standard HTML elements and custom components to styled versions
 * appropriate for a newspaper-style article layout.
 *
 * Typography philosophy:
 * - Headings use serif font (Lora) for editorial feel
 * - Body text is clean and readable
 * - Blockquotes styled as indented editorial quotes
 * - Images use Next.js Image for optimization and responsiveness
 */

function H1({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className="font-heading mb-4 mt-8 text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 md:text-4xl lg:text-5xl"
      {...props}
    >
      {children}
    </h1>
  );
}

function H2({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className="font-heading mb-3 mt-8 text-2xl font-bold leading-snug text-gray-900 dark:text-gray-100 md:text-3xl"
      {...props}
    >
      {children}
    </h2>
  );
}

function P({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className="mb-4 text-lg leading-relaxed text-gray-800 dark:text-gray-200"
      {...props}
    >
      {children}
    </p>
  );
}

function Blockquote({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className="my-6 border-l-4 border-gray-900 pl-4 italic text-gray-700 dark:border-gray-100 dark:text-gray-300"
      {...props}
    >
      {children}
    </blockquote>
  );
}

function Img(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, width, height } = props;

  if (!src || typeof src !== "string") return null;

  // Use Next.js Image for optimized, responsive images
  return (
    <figure className="my-6">
      <Image
        src={src}
        alt={alt || ""}
        width={Number(width) || 800}
        height={Number(height) || 450}
        className="h-auto w-full rounded"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
      />
      {alt && (
        <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * The complete set of MDX components used across the site.
 * Import this in the root mdx-components.tsx to register them globally.
 */
export const mdxComponents: MDXComponents = {
  h1: H1,
  h2: H2,
  p: P,
  blockquote: Blockquote,
  img: Img as MDXComponents["img"],
  PullQuote,
};

export { PullQuote };
