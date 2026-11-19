/** Questions fréquentes en accordéon natif (<details>) : accessible, sans JavaScript. */
export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <details key={item.q} className="group rounded-2xl bg-surface p-5 open:pb-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {item.q}
            <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-3 text-black/70">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
