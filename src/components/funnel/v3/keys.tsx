"use client";

import { useEffect } from "react";
import type { FunnelController } from "../use-funnel";

const SITUATIONS = ["no_hot_water", "leaking", "getting_old", "upgrading"];
const TYPES = ["gas_tank", "electric_tank", "tankless", "heat_pump"];

export function useDesignerKeys(controller: FunnelController) {
  const { draft, quote, canContinue, goNext, goBack, patch, setTier } = controller;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable));

      if (event.key === "Escape" && draft.step === 6) {
        event.preventDefault();
        goBack();
        return;
      }

      if (event.key === "Enter" && !event.shiftKey && !typing && canContinue && draft.step !== 4) {
        event.preventDefault();
        goNext();
        return;
      }

      if (event.key === "Enter" && !typing && draft.step === 4) {
        event.preventDefault();
        goNext();
        return;
      }

      if (typing) return;

      const index = Number(event.key);
      if (draft.step === 2 && index >= 1 && index <= 4) {
        patch({ situation: SITUATIONS[index - 1] });
      }
      if (draft.step === 3 && (event.key === "s" || event.key === "S")) {
        patch({ currentType: "unknown" });
      }
      if (draft.step === 3 && index >= 1 && index <= 4) {
        patch({ currentType: TYPES[index - 1] });
      }
      if (draft.step === 5 && index >= 1 && index <= quote.tiers.length) {
        setTier(quote.tiers[index - 1].tier);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft.step, quote.tiers, canContinue, goNext, goBack, patch, setTier]);
}
