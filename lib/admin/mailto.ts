// Builds a mailto: link. Several recipients go in BCC so members don't see each
// other's addresses; one recipient goes in "to".
export function buildMailto(emails: string[], subject: string, body: string) {
  const enc = (v: string) => encodeURIComponent(v).replace(/%0A/g, "%0D%0A"); // CRLF line breaks per RFC 6068
  const parts = [`subject=${enc(subject)}`, `body=${enc(body)}`];
  if (emails.length > 1) parts.unshift(`bcc=${emails.map(encodeURIComponent).join(",")}`);
  return `mailto:${emails.length === 1 ? encodeURIComponent(emails[0]) : ""}?${parts.join("&")}`;
}
