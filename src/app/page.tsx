import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/config";

/**
 * Root page — redirects to the default language homepage.
 * vengayam.in/ → vengayam.in/en/
 */
export default function RootPage() {
  redirect(`/${siteConfig.defaultLanguage}/`);
}
