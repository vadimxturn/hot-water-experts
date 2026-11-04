"use client";

import { useState } from "react";
import { rescheduleAction } from "@/server/actions";

export function RescheduleForm({ token }: { token: string }) {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="text-sm text-success">Request sent to the office. They will confirm a new window.</p>;
  return (
    <form
      className="mt-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await rescheduleAction(token, note);
        setSent(true);
      }}
    >
      <label className="text-xs text-slate" htmlFor="note">Ask for a different window</label>
      <textarea id="note" required value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-xl border border-line p-2 text-sm" rows={3} placeholder="A morning later in the week works better." />
      <button className="btn-pill btn-pill-ink mt-2 w-full" type="submit">Send request</button>
    </form>
  );
}
