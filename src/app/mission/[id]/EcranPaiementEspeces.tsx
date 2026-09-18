"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { CheckIcon, ChevronLeftIcon } from "@/components/icons";
import { formaterPrix, type MissionLivreur, type PaiementResume } from "@/lib/types";
import { EcranLivraisonTerminee } from "./EcranLivraisonTerminee";

const DEGRADE_VERT = "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)";
const DEGRADE_ORANGE = "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)";
const DEGRADE_BLEU = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";

const RAPPELS = ["comptez les billets remis", "vérifiez le montant exact", "rendez la monnaie si nécessaire"];

/**
 * "En Espèces" — écran derrière la carte "En Espèces" de "Comment paye le
 * client ?". "Paiement reçu" encaisse réellement (POST .../paiement,
 * mode_paiement especes) — comme pour Mobile Money, ceci marque aussitôt la
 * mission "livree" côté backend (Livraison::marquerLivree()), le dépôt du
 * cash à l'entreprise étant une étape séparée et déjà suivie ailleurs
 * (onglet Paiements, date_limite_depot 24h). "Déposer maintenant" appelle le
 * dépôt tout de suite (POST /paiements/{id}/deposer) ; "Déposer plus tard"
 * laisse le dépôt en attente. Les deux mènent ensuite au même écran de fin
 * que Mobile Money.
 */
export function EcranPaiementEspeces({
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
  const [paiement, setPaiement] = useState<PaiementResume | null>(null);
  const [confirme, setConfirme] = useState(false);
  const [termine, setTermine] = useState(false);

  async function onPaiementRecu() {
    if (!token || chargement) return;
    setErreur(null);
    setChargement(true);
    try {
      const donnees = await apiFetch<PaiementResume>(`/commandes/${mission.commande_id}/paiement`, {
        method: "POST",
        token,
        body: { mode_paiement: "especes" },
      });
      setPaiement(donnees);
      setConfirme(true);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de confirmer le paiement. Réessayez.");
    } finally {
      setChargement(false);
    }
  }

  async function onDeposerMaintenant() {
    if (!token || !paiement || chargement) return;
    setChargement(true);
    try {
      await apiFetch(`/paiements/${paiement.id}/deposer`, { method: "POST", token });
      setTermine(true);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de confirmer le dépôt. Réessayez.");
    } finally {
      setChargement(false);
    }
  }

  if (termine) {
    return <EcranLivraisonTerminee mission={mission} onRetour={onRetour} onRetourAccueil={onRetourAccueil} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="flex shrink-0 items-center gap-3 rounded-b-[30px] px-4 pb-16 pt-4 text-white" style={{ background: DEGRADE_VERT }}>
        <button
          type="button"
          onClick={onRetour}
          aria-label="Retour"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <p className="text-lg font-extrabold">En Espèces</p>
          <p className="text-xs text-white/80">Encaisser l&apos;argent</p>
        </div>
      </div>

      <div
        className="relative z-10 -mt-14 mx-6 flex h-[187px] flex-col items-center justify-center rounded-[27px] bg-white"
        style={{ boxShadow: "0px 12px 12px 12px rgba(0, 0, 0, 0.05)" }}
      >
        <p className="text-sm text-brand-muted">Montant total à recevoir</p>
        <p className="mt-2 text-4xl font-extrabold text-brand-ink">{formaterPrix(mission.montant_total_a_payer)} F</p>
      </div>

      <div className="mx-6 mt-4 flex flex-col rounded-[27px] bg-white px-5 py-5" style={{ boxShadow: "0px 12px 12px 12px rgba(0, 0, 0, 0.05)" }}>
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.15em] text-brand-muted">Avant de confirmer</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {RAPPELS.map((texte) => (
            <p key={texte} className="flex items-center gap-2 text-sm text-brand-ink">
              <span aria-hidden>✅</span>
              {texte}
            </p>
          ))}
        </div>
      </div>

      {erreur ? <p className="px-6 pt-4 text-center text-xs text-rose-500">{erreur}</p> : null}

      <button
        type="button"
        disabled={chargement}
        onClick={onPaiementRecu}
        className="mx-6 mt-auto mb-8 h-14 rounded-full text-base font-bold text-white disabled:opacity-60"
        style={{ background: DEGRADE_VERT }}
      >
        {chargement ? "Veuillez patienter…" : "Paiement reçu"}
      </button>

      {confirme ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-[21px]">
          <div className="flex w-full max-w-[360px] flex-col items-center rounded-[50px] bg-white px-7 pb-7 pt-9">
            <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-emerald-400/20">
              <div
                className="flex h-[68px] w-[68px] items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg, #16C784 0%, #00BFFF 100%)" }}
              >
                <CheckIcon className="h-7 w-7 text-white" />
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-brand-ink">
              Félicitations, vous avez confirmé à avoir reçu le montant de{" "}
              <span className="font-extrabold text-[color:var(--brand-blue-end)]">{formaterPrix(mission.montant_total_a_payer)}</span>
            </p>

            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3">
              <p className="text-center text-sm font-semibold text-orange-500">
                Trouver un point mobile money pour faire le dépôt et terminer votre mission
              </p>
            </div>

            <div className="mt-5 flex w-full gap-2">
              <button
                type="button"
                disabled={chargement}
                onClick={() => setTermine(true)}
                className="h-11 flex-1 rounded-[13px] text-sm font-bold text-white disabled:opacity-60"
                style={{ background: DEGRADE_ORANGE }}
              >
                Déposer plus tard
              </button>
              <button
                type="button"
                disabled={chargement}
                onClick={onDeposerMaintenant}
                className="h-11 flex-1 rounded-[13px] text-sm font-bold text-white disabled:opacity-60"
                style={{ background: DEGRADE_BLEU }}
              >
                {chargement ? "…" : "Déposer maintenant"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
