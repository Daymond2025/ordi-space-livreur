"use client";

import { formaterPrix, type MissionLivreur } from "@/lib/types";
import { BoxIcon, CheckIcon, CloseIcon } from "@/components/icons";

/**
 * Écran plein-écran "Nouvelle mission disponible" — affiché à la place de
 * l'écran Information/Suivi tant que la mission n'est pas encore acceptée
 * (en_attente_livreur = vivier, assignee = transmise par le coordinateur).
 * Reproduit le mockup fourni. Deux éléments du mockup n'ont pas de donnée
 * réelle disponible et restent donc décoratifs (voir notes ci-dessous) :
 * - "Distance Estimé" : aucun calcul de distance n'existe (pas de
 *   géolocalisation/coordonnées sur Adresse — décision déjà actée de ne pas
 *   faire de suivi GPS live pour cette v1).
 * - La barre de progression : aucun délai d'expiration d'offre n'existe côté
 *   backend, donc pas de vrai compte à rebours — barre fixe, purement visuelle.
 */
export function EcranNouvelleMission({
  mission,
  chargement,
  onAccepter,
  onRefuser,
}: {
  mission: MissionLivreur;
  chargement: boolean;
  onAccepter: () => void;
  onRefuser: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex shrink-0 flex-col items-center bg-[#0A0E27] px-6 pb-10 pt-12">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[color:var(--brand-blue-end)]/15">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[color:var(--brand-blue-end)]/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand-blue-end)]">
              <BoxIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-lg font-extrabold leading-snug text-white">
          Nouvelle Mission
          <br />
          disponible !
        </p>

        <div className="mt-6 h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-[color:var(--brand-blue-end)] to-[color:var(--brand-blue-start)]" />
        </div>
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
            <div className="min-w-0 flex-1 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">Point de récupération</p>
              <p className="mt-0.5 text-sm font-bold text-brand-ink">{mission.nom_fournisseur ?? "Fournisseur"}</p>
              <p className="mt-0.5 text-xs text-brand-muted">{mission.zone_fournisseur ?? "—"}</p>
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

        {/* Props Figma exactes : Refuser 116×91 / Accepter 229×91, radius 18,
            gap 8 — reproduites via un ratio de flex-grow (116:229). */}
        <div className="mt-auto flex gap-2">
          <button
            type="button"
            disabled={chargement}
            onClick={onRefuser}
            className="flex h-[91px] flex-[116] items-center justify-center gap-2 rounded-[18px] text-sm font-bold disabled:opacity-60"
            style={{ background: "rgba(255, 218, 214, 1)", border: "1px solid rgba(255, 150, 150, 1)", color: "rgba(220, 38, 38, 1)" }}
          >
            <CloseIcon className="h-4 w-4" />
            Refuser
          </button>
          <button
            type="button"
            disabled={chargement}
            onClick={onAccepter}
            className="flex h-[91px] flex-[229] items-center justify-center gap-2 rounded-[18px] text-base font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)" }}
          >
            <span
              className="flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-[15px]"
              style={{ background: "rgba(232, 255, 246, 0.34)" }}
            >
              <CheckIcon className="h-[11px] w-[11px]" />
            </span>
            {chargement ? "Veuillez patienter…" : "Accepter"}
          </button>
        </div>
      </div>
    </div>
  );
}
