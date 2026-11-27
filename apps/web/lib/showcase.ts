/**
 * True when the showcase folder app/(showcase) exists: the For Developers page, Admin Login,
 * the admin demo and the teacher demo. next.config.ts detects the folder at build time, so a
 * copy of the repo without it builds the main site with no links to missing pages.
 */
export const SHOWCASE = process.env.NEXT_PUBLIC_SHOWCASE === "1";
