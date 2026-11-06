"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { photoSlots } from "@/config/business";
import { lookupZip, type ZipLookup } from "@/config/service-area";
import {
  canContinue,
  emptyDraft,
  firstOpenSlot,
  leadPatch,
  quoteInput,
  resolvedTier,
  takePhotos,
  windowOnDay,
  type DaySlot,
  type FunnelDraft,
} from "@/lib/funnel/model";
import { quoteFor, type QuoteResult } from "@/lib/pricing";
import type { PricePackage, TierKey } from "@/lib/types";
import { bookLeadAction, createLeadAction, updateLeadAction } from "@/server/actions";

export interface FunnelProps {
  priceBook: PricePackage[];
  confirmedOnSite: boolean;
  deposit: number;
  earliest: string;
  days: DaySlot[];
  jurisdictions: { id: string; name: string }[];
}

export interface FunnelController {
  draft: FunnelDraft;
  patch: (partial: Partial<FunnelDraft>) => void;
  quote: QuoteResult;
  place: ZipLookup | null;
  jurisdictionName?: string;
  deposit: number;
  confirmedOnSite: boolean;
  days: DaySlot[];
  canContinue: boolean;
  tier: TierKey;
  goNext: () => void;
  goBack: () => void;
  goTo: (step: number) => void;
  addPhotos: (files: FileList | File[]) => void;
  removePhoto: (slot: string) => void;
  selectDate: (date: string) => void;
  selectWindow: (window: string) => void;
  setTier: (tier: TierKey) => void;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function useFunnel(props: FunnelProps): FunnelController {
  const router = useRouter();
  const lock = useRef(false);
  const [draft, setDraft] = useState<FunnelDraft>(() => ({
    ...emptyDraft(),
    ...firstOpenSlot(props.days, props.earliest),
  }));
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const quote = useMemo(
    () => quoteFor({ priceBook: props.priceBook, priceConfirmedOnSite: props.confirmedOnSite }, quoteInput(draft)),
    [props.priceBook, props.confirmedOnSite, draft],
  );
  const tier = resolvedTier(draft, quote);
  const place = draft.zip.length === 5 ? lookupZip(draft.zip) : null;
  const jurisdictionName = place?.jurisdictionId
    ? props.jurisdictions.find((row) => row.id === place.jurisdictionId)?.name
    : undefined;
  const slotIds = photoSlots.map((slot) => slot.id);

  function patch(partial: Partial<FunnelDraft>) {
    setDraft((current) => ({
      ...current,
      ...partial,
      error: "error" in partial ? partial.error : undefined,
    }));
  }

  async function persist(next: FunnelDraft) {
    let leadId = next.leadId;
    if (!leadId) {
      const created = await createLeadAction({ zip: next.zip });
      leadId = created.id;
    }
    await updateLeadAction(leadId, leadPatch({ ...next, leadId }));
    return leadId;
  }

  async function go(nextStep: number, extra: Partial<FunnelDraft> = {}) {
    if (lock.current) return;
    lock.current = true;
    const current = draftRef.current;
    setDraft((row) => ({ ...row, busy: true, error: undefined }));
    try {
      const merged: FunnelDraft = { ...current, ...extra, step: nextStep, busy: false, error: undefined };
      const leadId = await persist(merged);
      setDraft({ ...merged, leadId });
    } catch (error) {
      setDraft((row) => ({ ...row, busy: false, error: message(error) }));
    } finally {
      lock.current = false;
    }
  }

  async function finish() {
    if (lock.current) return;
    lock.current = true;
    const current = draftRef.current;
    setDraft((row) => ({ ...row, busy: true, error: undefined }));
    try {
      const chosen = resolvedTier(current, quote);
      const merged: FunnelDraft = { ...current, tier: chosen, step: 7, busy: false, error: undefined };
      const leadId = await persist(merged);
      await bookLeadAction(leadId, {
        name: current.name.trim(),
        email: current.email.trim(),
        phone: current.phone.trim(),
        smsConsent: current.smsConsent,
        depositAck: current.depositAck,
        tier: chosen,
        installDate: current.installDate,
        window: current.window,
      });
      router.push(`/thank-you?lead=${leadId}`);
    } catch (error) {
      lock.current = false;
      setDraft((row) => ({ ...row, busy: false, error: message(error) }));
    }
  }

  function goNext() {
    const current = draftRef.current;
    if (current.busy || !canContinue(current)) return;
    if (current.step >= 6) {
      void finish();
      return;
    }
    const extra: Partial<FunnelDraft> = {};
    if (current.step === 5 && !current.tier) extra.tier = resolvedTier(current, quote);
    void go(current.step + 1, extra);
  }

  function goBack() {
    const current = draftRef.current;
    if (current.step <= 1 || current.busy) return;
    setDraft((row) => ({ ...row, step: Math.max(1, row.step - 1), error: undefined }));
  }

  function goTo(step: number) {
    const current = draftRef.current;
    if (step < 1 || step >= current.step || current.busy) return;
    setDraft((row) => ({ ...row, step, error: undefined }));
  }

  function addPhotos(files: FileList | File[]) {
    const incoming = Array.from(files).map((file) => ({ name: file.name, type: file.type, size: file.size }));
    setDraft((current) => {
      const result = takePhotos(current.photos, incoming, slotIds);
      return { ...current, photos: result.photos, error: result.error };
    });
  }

  function removePhoto(slot: string) {
    setDraft((current) => {
      const names = current.photos.filter((photo) => photo.slot !== slot).map((photo) => photo.name);
      return {
        ...current,
        photos: names.map((name, index) => ({ slot: slotIds[index], name })),
        error: undefined,
      };
    });
  }

  function selectDate(date: string) {
    const day = props.days.find((item) => item.date === date);
    patch({ installDate: date, window: windowOnDay(day, draftRef.current.window) });
  }

  function selectWindow(window: string) {
    patch({ window });
  }

  function setTier(next: TierKey) {
    patch({ tier: next });
  }

  return {
    draft,
    patch,
    quote,
    place,
    jurisdictionName,
    deposit: props.deposit,
    confirmedOnSite: props.confirmedOnSite,
    days: props.days,
    canContinue: canContinue(draft),
    tier,
    goNext,
    goBack,
    goTo,
    addPhotos,
    removePhoto,
    selectDate,
    selectWindow,
    setTier,
  };
}
