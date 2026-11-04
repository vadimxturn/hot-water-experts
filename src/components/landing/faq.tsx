"use client";

import { useState } from "react";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-line rounded-3xl border border-line bg-white">
      {items.map((item, index) => {
        const active = open === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={active}
              onClick={() => setOpen(active ? -1 : index)}
            >
              <span className="text-[15px] font-medium">{item.q}</span>
              <span className="text-slate" aria-hidden>
                {active ? "−" : "+"}
              </span>
            </button>
            {active && <p className="px-5 pb-4 text-sm leading-6 text-slate">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
