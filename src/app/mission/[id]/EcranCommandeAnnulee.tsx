"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { BoxIcon, ChevronDownIcon } from "@/components/icons";
import type { MissionLivreur } from "@/lib/types";

const DEGRADE_HEADER = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";

const MOTIFS_ANNULATION = [
  "Client ne décroche pas",
  "Client injoignable",
  "Produit non conforme",
  "Client absent à l'adresse",
  "Client a changé d'avis",
  "Adresse introuvable",
  "Autre",
];

/**
 * Feuille "Commande annulée" — ouverte depuis le bouton du même nom sur
 * "Comment paye le client ?". Les deux boutons annulent réellement la
 * commande (POST /livraisons/{id}/annuler, motif requis — réutilise
 * Commande::appliquerChangementStatut() comme côté Coordinateur : restock,
 * commande "annulee", livraison "echouee" + retour_necessaire) ; seule la
 * suite diffère : "Commencer le retour" enchaîne sur EcranRetourFournisseur,
 * "Plus tard" laisse le retour en attente et ramène à l'accueil.
 */
export function EcranCommandeAnnulee({
  mission,
  onFermer,
  onAnnulee,
}: {
  mission: MissionLivreur;
  onFermer: () => void;
  onAnnulee: (destination: "accueil" | "retour") => void;
}) {
  const { token } = useAuth();
  const [motif, setMotif] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onChoisir(destination: "accueil" | "retour") {
    if (!token || !motif || chargement) return;
    setErreur(null);
    setChargement(true);
    try {
      await apiFetch(`/livraisons/${mission.id}/annuler`, { method: "POST", token, body: { motif } });
      onAnnulee(destination);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'annuler la commande. Réessayez.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div
        className="flex h-[750px] w-full max-w-md flex-col items-center rounded-[41px] bg-white px-[35px] pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-12 rounded-full bg-brand-line" />

        <div className="mt-6 flex h-[104px] w-[104px] items-center justify-center rounded-full bg-red-500/15">
          <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-red-600">
            <BoxIcon className="h-7 w-7 text-white" />
          </div>
        </div>

        <p className="mt-4 text-xl font-extrabold text-brand-ink">Commande annulée</p>
        <p className="mt-4 text-center text-sm font-semibold text-brand-muted">Sélectionner les motifs d&apos;annulation</p>

        <div className="relative mt-3 w-full">
          <select
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-brand-line px-4 py-3 text-sm text-brand-ink outline-none"
          >
            <option value="" disabled>
              Sélectionne
            </option>
            {MOTIFS_ANNULATION.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        </div>

        {erreur ? <p className="mt-3 text-center text-xs text-rose-500">{erreur}</p> : null}

        <div className="flex-1" />

        <div className="mb-[120px] flex w-full gap-[15px]">
          <button
            type="button"
            disabled={!motif || chargement}
            onClick={() => onChoisir("accueil")}
            className="h-11 flex-[100] rounded-[13px] text-sm font-bold disabled:opacity-60"
            style={{ background: "rgba(255, 218, 214, 1)", border: "1px solid rgba(255, 0, 0, 1)", color: "rgba(255, 0, 0, 1)" }}
          >
            Plus tard
          </button>
          <button
            type="button"
            disabled={!motif || chargement}
            onClick={() => onChoisir("retour")}
            className="h-11 flex-[216] rounded-[13px] text-sm font-bold text-white disabled:opacity-60"
            style={{ background: DEGRADE_HEADER }}
          >
            {chargement ? "Veuillez patienter…" : "Commencer le retour"}
          </button>
        </div>
      </div>
    </div>
  );
}
