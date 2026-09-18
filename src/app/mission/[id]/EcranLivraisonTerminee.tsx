"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, CheckIcon } from "@/components/icons";
import { formaterPrix, type MissionLivreur, type RecapitulatifJour } from "@/lib/types";

/**
 * Écran final affiché derrière "Confirmer le paiement" une fois la
 * transaction bien effectuée (paiement confirme, webhook ou secours manuel).
 * Reproduit le mockup fourni. "Gain de cette mission" (mission.frais_livraison),
 * "Livraison aujourd'hui" et "Revenu total du jour" (GET /moi/recapitulatif-jour)
 * sont de vraies données. "Bonus rapidité", "Temps total" et "Distance"
 * restent décoratifs ("—") : aucun suivi GPS/horaire n'existe côté backend
 * (décidé précédemment pour tout ce parcours).
 */
export function EcranLivraisonTerminee({
  mission,
  onRetour,
  onRetourAccueil,
}: {
  mission: MissionLivreur;
  onRetour: () => void;
  onRetourAccueil: () => void;
}) {
  const { token } = useAuth();
  const [recap, setRecap] = useState<RecapitulatifJour | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<RecapitulatifJour>("/moi/recapitulatif-jour", { token })
      .then((data) => {
        if (!annule) setRecap(data);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token]);
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-8 pt-4"
      style={{ background: "linear-gradient(160deg, #EAFBF1 0%, #B8F5C8 100%)" }}
    >
      <button
        type="button"
        onClick={onRetour}
        aria-label="Retour"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/40 text-white"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-emerald-400/20">
          <div
            className="flex h-[68px] w-[68px] items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #16C784 0%, #00BFFF 100%)" }}
          >
            <CheckIcon className="h-7 w-7 text-white" />
          </div>
        </div>

        <p className="mt-4 text-2xl font-extrabold text-emerald-900">Livraison terminée !</p>
        <p className="mt-1 text-base font-semibold text-emerald-500">Excellent travail</p>
      </div>

      <div className="mt-6 flex flex-col items-center rounded-[27px] bg-white px-5 py-6" style={{ boxShadow: "0px 12px 24px 0px rgba(0, 0, 0, 0.06)" }}>
        <p className="text-xs text-brand-muted">Gain de cette mission</p>
        <p className="mt-1 text-4xl font-extrabold" style={{ color: "var(--brand-green-end)" }}>
          +{formaterPrix(mission.frais_livraison)} F
        </p>
        <p className="mt-1 text-xs font-bold text-brand-muted">Bonus rapidité —</p>

        <div className="mt-5 flex w-full gap-2">
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-[#F5F7FA] py-3">
            <p className="text-sm font-extrabold text-brand-ink">—</p>
            <p className="mt-0.5 text-[10px] text-brand-muted">Temps total</p>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-[#F5F7FA] py-3">
            <p className="text-sm font-extrabold text-brand-ink">—</p>
            <p className="mt-0.5 text-[10px] text-brand-muted">Distance</p>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-[#F5F7FA] py-3">
            <p className="text-sm font-extrabold text-brand-ink">{recap ? recap.livraisons_du_jour : "—"}</p>
            <p className="mt-0.5 text-[10px] text-brand-muted">Livraison aujourd&apos;hui</p>
          </div>
        </div>

        <div
          className="mt-4 flex w-full flex-col items-center rounded-2xl px-4 py-3"
          style={{ background: "#EAFBF1", border: "1px solid var(--brand-green-start)" }}
        >
          <p className="text-xs text-brand-muted">Revenu total du jour</p>
          <p className="mt-1 text-lg font-extrabold" style={{ color: "var(--brand-green-end)" }}>
            {recap ? `${formaterPrix(recap.revenu_du_jour)} FCFA` : "—"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetourAccueil}
        className="mt-auto h-14 rounded-full text-base font-bold text-white"
        style={{ background: "linear-gradient(90deg, #0F5F2E 0%, #23E755 100%)" }}
      >
        Retour à l&apos;accueil
      </button>
    </div>
  );
}
