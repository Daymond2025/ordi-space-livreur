"use client";

import { formaterPrix, type MissionLivreur } from "@/lib/types";
import { BoxIcon, CheckIcon, CloseIcon } from "@/components/icons";

/**
 * Écran plein-écran "Commencer la livraison au client" — pendant
 * d'EcranNouvelleMission pour la phase suivante (colis déjà récupéré,
 * statut_livraison en_cours). Reproduit le mockup fourni. Trois éléments
 * n'ont pas de donnée réelle et restent décoratifs, comme sur
 * EcranNouvelleMission :
 * - "Distance Estimé" : pas de géolocalisation/coordonnées.
 * - La barre de progression et "Expire dans 59 Minutes" : aucun délai
 *   d'expiration n'existe côté backend pour cette étape (date_livraison_prevue
 *   a un sens différent — date de livraison prévue au client, pas un délai
 *   d'acceptation) — pas de donnée fiable à afficher ici non plus.
 */
export function EcranCommencerLivraison({
  mission,
  chargement,
  onCommencer,
  onAnnuler,
}: {
  mission: MissionLivreur;
  chargement: boolean;
  onCommencer: () => void;
  onAnnuler: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex shrink-0 flex-col items-center bg-[#0A0E27] px-6 pb-8 pt-12">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[color:var(--brand-blue-end)]/15">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[color:var(--brand-blue-end)]/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand-blue-end)]">
              <BoxIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-lg font-extrabold leading-snug text-white">
          Commencer la livraison
          <br />
          au client
        </p>

        <div className="mt-6 h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-[color:var(--brand-blue-end)] to-[color:var(--brand-blue-start)]" />
        </div>
        <p className="mt-2 text-xs font-semibold text-white/70">Expire dans 59 Minutes</p>
      </div>

      <div className="relative -mt-4 flex flex-1 flex-col rounded-t-[2rem] bg-white px-6 pb-6 pt-4">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-brand-line" />

        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl bg-blue-50 p-3">
            <p className="text-xs text-brand-muted">Gain estimé</p>
            <p className="mt-1 text-lg font-extrabold text-[color:var(--brand-blue-end)]">{formaterPrix(mission.frais_livraison)} FCFA</p>
          </div>
          <div className="flex-1 rounded-2xl bg-[#F5F7FA] p-3">
            <p className="text-xs text-brand-muted">Distance Estimé</p>
            <p className="mt-1 text-lg font-extrabold text-brand-ink">—</p>
          </div>
        </div>

        <div className="my-4 h-px bg-brand-line" />

        <div className="flex flex-col">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-0.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-[color:var(--brand-blue-end)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-blue-end)]" />
              </span>
              <span className="my-1 w-px flex-1 bg-brand-line" />
            </div>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pb-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">Point de récupération</p>
                <p className="mt-0.5 text-sm font-bold text-brand-ink">{mission.nom_fournisseur ?? "Fournisseur"}</p>
                <p className="mt-0.5 text-xs text-brand-muted">{mission.zone_fournisseur ?? "—"}</p>
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">Livraison</p>
              <p className="mt-0.5 text-sm font-bold text-brand-ink">{mission.zone_destination ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className="my-4 h-px bg-brand-line" />

        <div className="mt-auto flex gap-2">
          <button
            type="button"
            disabled={chargement}
            onClick={onAnnuler}
            className="flex h-[44px] flex-[100] items-center justify-center gap-1.5 rounded-[13px] text-sm font-bold disabled:opacity-60"
            style={{ background: "rgba(255, 218, 214, 1)", border: "1px solid rgba(255, 0, 0, 1)", color: "rgba(220, 38, 38, 1)" }}
          >
            <CloseIcon className="h-3.5 w-3.5" />
            Annuler
          </button>
          <button
            type="button"
            disabled={chargement}
            onClick={onCommencer}
            className="flex h-[44px] flex-[216] items-center justify-center gap-1.5 rounded-[13px] text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)" }}
          >
            <CheckIcon className="h-3.5 w-3.5" />
            {chargement ? "Veuillez patienter…" : "Commencer la livraison"}
          </button>
        </div>
      </div>
    </div>
  );
}
