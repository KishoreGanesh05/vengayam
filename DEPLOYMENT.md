# Deployment Guide — Vengayam

This document covers deploying the Vengayam satirical news site to Vercel at **vengayam.in**.

## Overview

Vengayam is a Next.js static site. Vercel handles the build and CDN distribution automatically when connected to the Git repository.

## Prerequisites

- A [Vercel](https://vercel.com) account
- The Git repository hosted on GitHub (or GitLab/Bitbucket)
- Access to DNS settings for `vengayam.in`

## Deploying to Vercel

### Initial Setup

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the repository from GitHub
3. Vercel auto-detects Next.js — no manual configuration needed
4. Click **Deploy**

### Build Settings (auto-detected)

| Setting          | Value         |
|------------------|---------------|
| Framework        | Next.js       |
| Build Command    | `next build`  |
| Output Directory | `.next`       |
| Install Command  | `npm install`  |
| Node.js Version  | 18.x or 20.x |

These are the defaults and should not need manual override.

### Environment Variables

No environment variables are required for the current setup. The site is fully static with no external API calls.

If you add analytics or external services in the future, add their keys in the Vercel dashboard under **Settings → Environment Variables**.

## Custom Domain Configuration (vengayam.in)

### Step 1: Add Domain in Vercel

1. Go to your project in the Vercel dashboard
2. Navigate to **Settings → Domains**
3. Add `vengayam.in`
4. Optionally add `www.vengayam.in` (Vercel will auto-redirect)

### Step 2: Configure DNS

At your domain registrar (where you purchased `vengayam.in`), update DNS records:

**Option A: Using Vercel Nameservers (recommended)**

Set the nameservers to Vercel's:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Option B: Using A/CNAME Records**

If you prefer to keep your existing DNS provider:

| Type  | Name | Value              |
|-------|------|--------------------|
| A     | @    | 76.76.21.21        |
| CNAME | www  | cname.vercel-dns.com |

> Note: Vercel's IP address may change. Check the [Vercel docs](https://vercel.com/docs/projects/domains) for current values.

### Step 3: Verify

After DNS propagation (can take up to 48 hours, usually minutes):
- Visit `https://vengayam.in` — should load your site
- SSL certificate is provisioned automatically by Vercel

## Deployment Workflow

### Automatic Deployments

Every push to the `main` branch triggers a production deployment:

```
Author writes article → git push → Vercel rebuilds → Live on CDN
```

### Preview Deployments

Pushes to non-main branches create preview deployments with unique URLs. Useful for reviewing articles before publishing.

### Manual Redeployment

If needed, trigger a rebuild from the Vercel dashboard:
1. Go to **Deployments** tab
2. Click the three-dot menu on the latest deployment
3. Select **Redeploy**

## Vercel Configuration (vercel.json)

The `vercel.json` file in the project root provides:
- Proper `Content-Type` headers for RSS feeds (`/en/feed.xml`, `/ta/feed.xml`)
- Proper `Content-Type` headers for the sitemap (`/sitemap.xml`)
- Cache-Control headers for feed and sitemap (1 hour)

Security headers (CSP, X-Frame-Options, etc.) are configured in `next.config.ts` and applied to all routes.

## Route Structure

```
/                         → Language selector
/en/                      → English homepage
/ta/                      → Tamil homepage
/en/articles/[slug]       → English article
/ta/articles/[slug]       → Tamil article
/en/category/[category]   → English category page
/ta/category/[category]   → Tamil category page
/en/feed.xml              → English RSS feed
/ta/feed.xml              → Tamil RSS feed
/sitemap.xml              → XML sitemap
```

## Troubleshooting

### Build Fails

- Run `npm run build` locally to reproduce
- Check for missing images referenced in article frontmatter
- Check for invalid frontmatter (missing required fields, invalid dates)

### Domain Not Resolving

- Verify DNS records are correct (check with `dig vengayam.in`)
- Wait for DNS propagation (up to 48 hours)
- Ensure domain is added in Vercel dashboard

### RSS Feed Returns Wrong Content-Type

- The `vercel.json` headers should handle this
- If issues persist, verify the route handler at `src/app/[lang]/feed.xml/route.ts` sets the correct `Content-Type` in the Response headers

## Performance Notes

- All pages are statically generated at build time
- Assets served via Vercel's global CDN
- Images optimized by Next.js Image component (WebP/AVIF)
- Fonts self-hosted via `next/font` (no external font requests)
