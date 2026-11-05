"use client";

import type { FunnelController } from "../use-funnel";
import { DepositStep } from "./deposit-step";
import { useDesignerKeys } from "./keys";
import { PhotosStep } from "./photos-step";
import { PriceStep } from "./price-step";
import { SituationStep } from "./situation-step";
import { FunnelShell } from "./shell";
import { TypeStep } from "./type-step";
import { ZipStep } from "./zip-step";

const TIPS: { text: string; keys: boolean }[] = [
  { text: "Tip: type your ZIP, then press Enter to continue", keys: true },
  { text: "Keyboard: 1 No hot water · 2 Leaking · 3 Getting old · 4 Upgrading", keys: true },
  { text: "Keyboard: 1 Gas tank · 2 Electric tank · 3 Tankless · 4 Heat pump · S Skip", keys: true },
  { text: "Tip: clear, well-lit shots of the data plate give the tightest estimate.", keys: false },
  { text: "Why a range: photo findings and on-site adders (vent, gas line, expansion tank) can move the total.", keys: false },
  { text: "Press Enter to pay. Esc returns to your estimate.", keys: true },
];

export function DesignerV3Funnel({ controller }: { controller: FunnelController }) {
  useDesignerKeys(controller);
  const step = controller.draft.step;
  const tip = TIPS[step - 1];

  return (
    <FunnelShell
      step={step}
      onStep={(next) => controller.goTo(next)}
      tip={tip?.text}
      tipIsKeys={tip?.keys}
    >
      {controller.draft.error ? (
        <p role="alert" className="mb-3 text-center text-sm text-danger">{controller.draft.error}</p>
      ) : null}
      {step === 1 && (
        <ZipStep
          zip={controller.draft.zip}
          deposit={controller.deposit}
          place={controller.place}
          jurisdictionName={controller.jurisdictionName}
          canContinue={controller.canContinue}
          busy={Boolean(controller.draft.busy)}
          onZip={(zip) => controller.patch({ zip })}
          onContinue={controller.goNext}
        />
      )}
      {step === 2 && (
        <SituationStep
          value={controller.draft.situation}
          canContinue={controller.canContinue}
          busy={Boolean(controller.draft.busy)}
          onChange={(situation) => controller.patch({ situation })}
          onContinue={controller.goNext}
        />
      )}
      {step === 3 && (
        <TypeStep
          value={controller.draft.currentType}
          canContinue={controller.canContinue}
          busy={Boolean(controller.draft.busy)}
          onChange={(currentType) => controller.patch({ currentType })}
          onSkip={() => controller.patch({ currentType: "unknown" })}
          onContinue={controller.goNext}
        />
      )}
      {step === 4 && (
        <PhotosStep
          photos={controller.draft.photos}
          onAdd={controller.addPhotos}
          onRemove={controller.removePhoto}
          onContinue={controller.goNext}
        />
      )}
      {step === 5 && (
        <PriceStep
          quote={controller.quote}
          tier={controller.tier}
          unknown={!controller.draft.currentType || controller.draft.currentType === "unknown"}
          confirmedOnSite={controller.confirmedOnSite}
          busy={Boolean(controller.draft.busy)}
          onTier={controller.setTier}
          onContinue={controller.goNext}
        />
      )}
      {step === 6 && (
        <DepositStep
          deposit={controller.deposit}
          name={controller.draft.name}
          email={controller.draft.email}
          phone={controller.draft.phone}
          smsConsent={controller.draft.smsConsent}
          depositAck={controller.draft.depositAck}
          installDate={controller.draft.installDate}
          window={controller.draft.window}
          days={controller.days}
          busy={Boolean(controller.draft.busy)}
          canContinue={controller.canContinue}
          onName={(name) => controller.patch({ name })}
          onEmail={(email) => controller.patch({ email })}
          onPhone={(phone) => controller.patch({ phone })}
          onSms={(smsConsent) => controller.patch({ smsConsent })}
          onAck={(depositAck) => controller.patch({ depositAck })}
          onDate={controller.selectDate}
          onWindow={controller.selectWindow}
          onContinue={controller.goNext}
        />
      )}
    </FunnelShell>
  );
}
