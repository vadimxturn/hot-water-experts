"use client";

import { useState } from "react";

export function TextMeButton() {
  const [note, setNote] = useState("");
  return (
    <div className="text-center">
      <button
        type="button"
        className="text-[15px] font-medium text-blue"
        onClick={() => setNote("Texts are not sent from this page. A confirmation is saved on the booking.")}
      >
        Text me the details
      </button>
      {note ? <p className="mt-2 text-xs text-slate">{note}</p> : null}
    </div>
  );
}
