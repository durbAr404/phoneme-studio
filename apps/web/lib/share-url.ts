/** Public URL for a share link. Replaced in the in-Claude artifact build, which routes by #name. */
export function shareUrl(id: string): string {
  return `${window.location.origin}/p/${id}`;
}
