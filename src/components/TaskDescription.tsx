/** Link public URLs embedded in task instructions without allowing executable schemes. */
export function TaskDescription({ text }: { text: string }) {
  return <>{text.replace(/\$(?=\d)/g, "₹").split(/(https?:\/\/[^\s<>]+)/g).map((part, i) => {
    if (!/^https?:\/\//i.test(part)) return part;
    const url = part.replace(/[.,;!?)]+$/, "");
    return <span key={i}><a href={url} target="_blank" rel="noopener noreferrer" className="underline text-accent break-all">{url}</a>{part.slice(url.length)}</span>;
  })}</>;
}

export function TaskPostLink({ url, platform }: { url: string | null; platform: string }) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline text-accent">Open {platform === "INSTAGRAM" ? "Instagram" : "task"} post ↗</a>;
}
