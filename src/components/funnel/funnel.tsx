"use client";

import { DesignerV3Funnel } from "./v3/designer-v3-funnel";
import { useFunnel, type FunnelController, type FunnelProps } from "./use-funnel";

/**
 * Composition root.
 * Saving, pricing, and the deposit stay in useFunnel.
 * Swap DesignerV3Funnel for another design that renders FunnelController.
 */
export function Funnel(props: FunnelProps) {
  const controller = useFunnel(props);
  return <DesignerV3Funnel controller={controller} />;
}

export type { FunnelController, FunnelProps };
