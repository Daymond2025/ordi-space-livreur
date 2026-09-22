"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterPrix, type MissionLivreur, type SuiviEntree } from "@/lib/types";
import { useRefetchOnFocus } from "@/lib/useRefetchOnFocus";
import { CheckCircleIcon, ChevronLeftIcon, ImageIcon, MapIcon, PhoneFilledIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { TimelineSuivi } from "@/components/mission/TimelineSuivi";
import { EcranNouvelleMission } from "./EcranNouvelleMission";
import { EcranItineraireRecuperation } from "./EcranItineraireRecuperation";
import { EcranCommencerLivraison } from "./EcranCommencerLivraison";
import { EcranSuiviLivraison } from "./EcranSuiviLivraison";
import { EcranModePaiement } from "./EcranModePaiement";
import { lienWebSur } from "@/lib/liens";

/**
 * Détail d'une mission — chaîne d'écrans pilotée par de vrais statuts
 * persistés côté serveur (colis_recupere_le → livraison_demarree_le →
 * arrivee_le → paiement confirmé), chacun avec son propre endpoint
 * (recuperer/demarrer-livraison/arriver). Le paiement confirmé (webhook Wave
 * ou secours manuel) marque lui-même la mission "livree" côté backend (voir
 * Livraison::marquerLivree()) : aucune étape photo séparée dans ce parcours.
 * Itinéraire client uniquement pour cette passe (voir Adresse::lien_maps) :
 * pas de lien maps fournisseur tant que l'app Fournisseur n'existe pas.
 */
export function EcranMissionDetail({ livraisonId }: { livraisonId: number }) {
  const { token } = useAuth();
  const router = useRouter();

  const [mission, setMission] = useState<MissionLivreur | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<"information" | "suivi">("information");
  const [suivi, setSuivi] = useState<SuiviEntree[] | null>(null);

  function recharger() {
    if (!token) return Promise.resolve();
    return apiFetch<MissionLivreur>(`/livraisons/${livraisonId}`, { token }).then(setMission);
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<MissionLivreur>(`/livraisons/${livraisonId}`, { token })
      .then((data) => {
        if (!annule) setMission(data);
      })
      .catch(() => {
        if (!annule) setMission(null);
      });

    return () => {
      annule = true;
    };
  }, [token, livraisonId]);

  // Idem qu'EcranMissions : évite qu'un retour arrière depuis un sous-écran
  // affiche un instantané figé (bfcache) au lieu du vrai statut serveur.
  useRefetchOnFocus(recharger);

  useEffect(() => {
    if (!token || !mission || onglet !== "suivi") return;
    let annule = false;

    apiFetch<SuiviEntree[]>(`/commandes/${mission.commande_id}/suivi`, { token })
      .then((data) => {
        if (!annule) setSuivi(data);
      })
      .catch(() => {
        if (!annule) setSuivi([]);
      });

    return () => {
      annule = true;
    };
  }, [token, mission, onglet]);

  async function executer(action: () => Promise<unknown>) {
    setErreur(null);
    setChargement(true);
    try {
      await action();
      await recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Une erreur est survenue, réessayez.");
    } finally {
      setChargement(false);
    }
  }

  if (!mission) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-brand-muted">Chargement…</p>
      </div>
    );
  }

  if (mission.statut_livraison === "en_attente_livreur" || mission.statut_livraison === "assignee") {
    return (
      <EcranNouvelleMission
        mission={mission}
        chargement={chargement}
        onRefuser={() => router.back()}
        onAccepter={() =>
          executer(() =>
            apiFetch(`/livraisons/${livraisonId}/${mission.statut_livraison === "en_attente_livreur" ? "affecter" : "accepter"}`, {
              method: "POST",
              token: token!,
            })
          )
        }
      />
    );
  }

  if (mission.statut_livraison === "en_cours" && !mission.colis_recupere_le) {
    return (
      <EcranItineraireRecuperation
        mission={mission}
        chargement={chargement}
        onColisRecupere={() => executer(() => apiFetch(`/livraisons/${livraisonId}/recuperer`, { method: "POST", token: token! }))}
      />
    );
  }

  if (mission.statut_livraison === "en_cours" && mission.colis_recupere_le && !mission.livraison_demarree_le) {
    return (
      <EcranCommencerLivraison
        mission={mission}
        chargement={chargement}
        onAnnuler={() => router.back()}
        onCommencer={() => executer(() => apiFetch(`/livraisons/${livraisonId}/demarrer-livraison`, { method: "POST", token: token! }))}
      />
    );
  }

  if (mission.statut_livraison === "en_cours" && mission.livraison_demarree_le && !mission.arrivee_le) {
    return (
      <EcranSuiviLivraison
        mission={mission}
        onArrive={() => executer(() => apiFetch(`/livraisons/${livraisonId}/arriver`, { method: "POST", token: token! }))}
      />
    );
  }

  if (mission.statut_livraison === "en_cours" && mission.arrivee_le) {
    return <EcranModePaiement mission={mission} onRetour={() => router.back()} onRetourAccueil={() => router.push("/")} />;
  }

  const telephone = mission.telephone_client;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="bg-gradient-brand-blue shrink-0 rounded-b-[30px] px-4 pb-6 pt-4 text-white">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="mt-3 text-lg font-extrabold">{mission.nom_produit ?? "Mission de livraison"}</p>
        <p className="text-sm text-white/80">Commande n°{mission.commande_id}</p>
      </div>

      <div className="shrink-0 bg-white px-4 pb-1 pt-3">
        <div className="flex rounded-full bg-[#EEF1F6] p-1">
          <button
            type="button"
            onClick={() => setOnglet("information")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
              onglet === "information" ? "bg-gradient-brand-blue text-white" : "text-brand-muted"
            }`}
          >
            Information
          </button>
          <button
            type="button"
            onClick={() => setOnglet("suivi")}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
              onglet === "suivi" ? "bg-gradient-brand-blue text-white" : "text-brand-muted"
            }`}
          >
            Suivi
          </button>
        </div>
      </div>

      {onglet === "suivi" ? (
        <div className="flex-1 bg-[#f6f2ed] px-4 py-4">
          <div className="rounded-[26px] bg-white p-4 shadow-sm shadow-slate-900/5">
            {suivi ? <TimelineSuivi entrees={suivi} /> : <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>}
          </div>
        </div>
      ) : (
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
            {mission.photo ? (
              <Image src={mission.photo} alt="" fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-brand-muted">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-brand-ink">{mission.nom_produit ?? "Produit"}</p>
            <p className="mt-1 text-sm font-extrabold text-[color:var(--brand-blue-end)]">{formaterPrix(mission.frais_livraison)} F livraison</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Fournisseur</p>
          <p className="mt-1.5 text-sm font-bold text-brand-ink">{mission.nom_fournisseur ?? "—"}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
            <PinIcon className="h-3 w-3 shrink-0" /> {mission.zone_fournisseur ?? "—"}
          </p>
          {mission.colis_recupere_le ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-green-600">
              <CheckCircleIcon className="h-3.5 w-3.5" /> Colis récupéré
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Client</p>
          <p className="mt-1.5 text-sm font-bold text-brand-ink">{mission.nom_client}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
            <PinIcon className="h-3 w-3 shrink-0" /> {mission.zone_destination ?? "—"}
          </p>

          {telephone ? (
            <div className="mt-3 flex gap-3">
              <a
                href={`https://wa.me/${telephone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)", border: "1px solid rgba(137, 247, 206, 1)" }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] text-sm font-bold text-white"
              >
                <WhatsappIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`tel:${telephone}`}
                style={{ background: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)" }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] text-sm font-bold text-white"
              >
                <PhoneFilledIcon className="h-3.5 w-3.5" />
                Appeler
              </a>
            </div>
          ) : null}

          {lienWebSur(mission.lien_maps_destination) ? (
            <a
              href={lienWebSur(mission.lien_maps_destination) ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-[12px] border-2 border-[color:var(--brand-blue-end)] text-sm font-bold text-[color:var(--brand-blue-end)]"
            >
              <MapIcon className="h-4 w-4" />
              Itinéraire vers le client
            </a>
          ) : null}
        </div>

        {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}

        {mission.statut_livraison === "livree" ? (
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
            <CheckCircleIcon className="h-5 w-5 shrink-0" /> Livraison terminée.
          </div>
        ) : mission.statut_livraison === "echouee" ? (
          <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-600">Livraison échouée.</div>
        ) : null}
      </div>
      )}
    </div>
  );
}
