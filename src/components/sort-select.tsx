"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORTS } from "@/lib/labels";


/** Menu de tri : met à jour ?tri=… dans l'URL en gardant les autres filtres. */
export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-black/50">Trier par</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          next.set("tri", e.target.value);
          router.push(`${pathname}?${next}`, { scroll: false });
        }}
        className="border border-black/15 bg-white px-3 py-2"
      >
        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </label>
  );
}
