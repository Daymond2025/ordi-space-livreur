"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { ChevronLeftIcon, PhoneFilledIcon, PinIcon, TruckIcon } from "@/components/icons";
import type { MissionLivreur } from "@/lib/types";

const DEGRADE_HEADER = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";
const DEGRADE_LIVREUR = "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)";

/**
 * Fond de carte décoratif — même limite que FondCarteDecoratif
 * (EcranItineraireRecuperation) : pas de tracking GPS ni de lien_maps
 * fournisseur pour cette v1.
 */
function FondCarteDecoratif() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#E4EBF5]">
      <svg viewBox="0 0 402 420" className="absolute inset-0 h-full w-full text-[#C7D3E3]" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M0 90h402M0 220h402M70 0v420M300 0v130M300 130h102" />
        <path d="M150 130 250 130 250 260" />
      </svg>

      <svg viewBox="0 0 402 420" className="absolute inset-0 h-full w-full text-[color:var(--brand-blue-end)]" fill="none">
        <path d="M150 130 Q210 190 240 230 T280 300" strokeWidth={3} strokeLinecap="round" strokeDasharray="2 10" stroke="currentColor" />
      </svg>

      <div className="absolute" style={{ top: "27%", left: "35%" }}>
        <span className="flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-brand-line bg-white shadow-md">
          <PinIcon className="h-4 w-4 text-brand-ink" />
        </span>
      </div>

      <div className="absolute" style={{ top: "71%", left: "68%" }}>
        <span
          className="flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg"
          style={{ background: DEGRADE_HEADER }}
        >
          <TruckIcon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

/**
 * "Retour en cours" — le livreur ramène le produit au fournisseur après une
 * commande annulée (Livraison::retour_necessaire, statut_retour "en_cours").
 * "Colis Retourné" appelle POST /livraisons/{id}/retourner (seul point
 * d'écriture de statut_retour "effectue") puis ramène à l'accueil. Carte
 * décorative, mêmes limites que EcranItineraireRecuperation.
 */
export function EcranRetourFournisseur({
  mission,
  onRetour,
  onRetourAccueil,
}: {
  mission: MissionLivreur;
  onRetour: () => void;
  onRetourAccueil: () => void;
}) {
  const { token } = useAuth();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onColisRetourne() {
    if (!token || chargement) return;
    setErreur(null);
    setChargement(true);
    try {
      await apiFetch(`/livraisons/${mission.id}/retourner`, { method: "POST", token });
      onRetourAccueil();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de confirmer le retour. Réessayez.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative z-10 flex shrink-0 items-center gap-3 px-4 py-3 text-white" style={{ background: DEGRADE_HEADER }}>
        <button
          type="button"
          onClick={onRetour}
          aria-label="Retour"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="flex-1 text-center text-sm font-extrabold">Retour en cours</p>
        <div className="h-9 w-9 shrink-0" />
      </div>

      <div className="relative flex-1">
        <FondCarteDecoratif />
      </div>

      <div
        className="relative z-10 mx-[22px] mb-6 mt-4 shrink-0 rounded-[27px] bg-white px-5 pb-5 pt-4"
        style={{ boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-brand-muted">Récupération chez</p>
          <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: DEGRADE_HEADER }}>
            En Route
          </span>
        </div>

        <div className="mt-2 flex items-start gap-3 rounded-2xl bg-[#F5F7FA] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand-orange text-xs font-bold text-white">
            {mission.nom_fournisseur?.slice(0, 2).toUpperCase() ?? "FR"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-brand-ink">{mission.nom_fournisseur ?? "Fournisseur"}</p>
            <p className="mt-0.5 flex items-start gap-1 text-xs text-brand-muted">
              <PinIcon className="mt-0.5 h-3 w-3 shrink-0" />
              <span>Lieu : {mission.zone_fournisseur ?? "—"}</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-brand-muted">Distance : —</span>
          <span className="font-bold text-[color:var(--brand-blue-end)]">Arrivée dans —</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF1F6]">
          <div className="h-full w-1/2 rounded-full" style={{ background: DEGRADE_HEADER }} />
        </div>

        {erreur ? <p className="mt-3 text-center text-xs text-rose-500">{erreur}</p> : null}

        <div className="mt-4 flex gap-3">
          {mission.telephone_fournisseur ? (
            <a
              href={`tel:${mission.telephone_fournisseur}`}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white"
              style={{ background: DEGRADE_HEADER }}
            >
              <PhoneFilledIcon className="h-3.5 w-3.5" />
              Appelle
            </a>
          ) : null}

          <button
            type="button"
            disabled={chargement}
            onClick={onColisRetourne}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: DEGRADE_LIVREUR }}
          >
            {chargement ? "Veuillez patienter…" : "Colis Retourné"}
          </button>
        </div>
      </div>
    </div>
  );
}
