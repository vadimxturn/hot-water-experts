"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addPhotoAction, saveSignatureAction, techStatusAction } from "@/server/actions";

export function OnMyWayButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="btn-pill btn-pill-blue h-12 w-full"
      onClick={async () => {
        setBusy(true);
        let coords: { lat: number; lng: number } | undefined;
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          coords = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
              () => resolve(undefined),
              { timeout: 2500 },
            );
          });
        }
        await techStatusAction(jobId, "en_route", coords);
        router.push(`/tech/jobs/${jobId}/enroute`);
        router.refresh();
      }}
    >
      {busy ? "Sending..." : "On my way"}
    </button>
  );
}

export function StatusButton({ jobId, status, label }: { jobId: string; status: "arrived" | "installing" | "complete"; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-pill btn-pill-blue h-12 w-full"
      onClick={async () => {
        await techStatusAction(jobId, status);
        router.refresh();
        if (status === "complete") router.push("/tech");
      }}
    >
      {label}
    </button>
  );
}

export function PhotoButton({ jobId, category }: { jobId: string; category: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  return (
    <>
      <button type="button" className="text-xs text-blue" onClick={() => input.current?.click()}>Add photo</button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await addPhotoAction(jobId, category, file.name);
          router.refresh();
        }}
      />
    </>
  );
}

export function SignaturePad({ jobId, locked }: { jobId: string; locked: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const drawing = useRef(false);
  const [serial, setSerial] = useState("S-00000-SAMPLE");
  const [note, setNote] = useState("");

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height };
  }

  return (
    <div>
      <label className="text-xs text-slate">Serial number
        <input value={serial} onChange={(event) => setSerial(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm" />
      </label>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span>Customer signature</span>
        <button type="button" className="text-xs text-slate" onClick={() => canvasRef.current?.getContext("2d")?.clearRect(0, 0, 320, 140)}>Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={320}
        height={140}
        className="mt-2 w-full touch-none rounded-xl border border-line bg-white"
        onPointerDown={(event) => {
          drawing.current = true;
          const ctx = canvasRef.current?.getContext("2d");
          if (!ctx) return;
          const p = point(event);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current?.getContext("2d");
          if (!ctx) return;
          const p = point(event);
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#0A0C10";
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={() => { drawing.current = false; }}
      />
      <p className="mt-2 text-[11px] text-slate">I confirm the work was completed and the area was left clean. Sample consent wording. Final text is still to be written.</p>
      {note && <p className="mt-2 text-xs text-danger">{note}</p>}
      <button
        type="button"
        disabled={locked}
        className="btn-pill btn-pill-blue mt-3 h-12 w-full disabled:bg-slate/30"
        onClick={async () => {
          const data = canvasRef.current?.toDataURL("image/png") || "";
          if (!data || data.length < 800) {
            setNote("Add a signature first.");
            return;
          }
          await saveSignatureAction(jobId, data, serial);
          await techStatusAction(jobId, "complete");
          router.push("/tech");
          router.refresh();
        }}
      >
        {locked ? "Photos still needed" : "Mark job done"}
      </button>
      <p className="mt-2 text-center text-[11px] text-slate">Sends the done text and a summary email record. Twilio and email send only when those keys exist.</p>
    </div>
  );
}
