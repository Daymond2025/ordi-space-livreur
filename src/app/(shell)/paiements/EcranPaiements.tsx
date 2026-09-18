"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterDateRelative, formaterPrix, type MissionPaiement, type PaiementsLivreur } from "@/lib/types";
import { ArrowDownLeftIcon } from "@/components/icons";
import { useRefetchOnFocus } from "@/lib/useRefetchOnFocus";
import { useCompteARebours } from "@/lib/useCompteARebours";

const DEGRADE_HEADER = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";
const DEGRADE_ORANGE = "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)";

/**
 * "Espèce à reverser" — cash COD confirmé mais pas encore reversé à
 * l'entreprise (gains_non_deposes/date_limite_depot_urgente, notion séparée
 * des gains propres du livreur affichés plus haut). "Reverser" dépose tout
 * en une fois (POST /moi/paiements/reverser) — le montant affiché est déjà
 * consolidé, l'action l'est donc aussi.
 */
function CarteEspeceAReverser({
  montant,
  dateLimite,
  onReverse,
}: {
  montant: number;
  dateLimite: string | null;
  onReverse: () => Promise<void>;
}) {
  const compte = useCompteARebours(dateLimite);
  const compteTexte = compte ? (compte.expire ? "00:00:00" : `${String(compte.h).padStart(2, "0")}:${String(compte.m).padStart(2, "0")}:${String(compte.s).padStart(2, "0")}`) : null;
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onClic() {
    if (chargement) return;
    setErreur(null);
    setChargement(true);
    try {
      await onReverse();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de reverser. Réessayez.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <>
      <div
        className="relative z-10 mt-4 flex items-center gap-3 rounded-[18px] px-4"
        style={{ marginLeft: 17, marginRight: 15, height: 71, background: DEGRADE_ORANGE, boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)" }}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white">
          <Image src="/images/especes-reverser.png" alt="" width={26} height={26} />
        </div>
        <div className="min-w-0 flex-1 pr-[95px]">
          <p className="text-sm font-bold text-white">Espèce à reverser</p>
          <p className="text-xl font-extrabold text-white">{formaterPrix(montant)} F</p>
        </div>
        {compteTexte ? <p className="absolute right-4 top-2 text-[10px] text-white/80">{compteTexte}</p> : null}
        <button
          type="button"
          disabled={chargement}
          onClick={onClic}
          className="absolute flex items-center justify-center text-xs font-bold text-white disabled:opacity-60"
          style={{
            top: 32,
            right: 8,
            width: 87,
            height: 28,
            borderRadius: 14,
            background: "rgba(255, 0, 0, 1)",
            border: "3px solid rgba(255, 255, 255, 0.35)",
          }}
        >
          {chargement ? "…" : "Reverser"}
        </button>
      </div>
      {erreur ? <p className="mx-[17px] mt-2 text-center text-xs text-rose-500">{erreur}</p> : null}
    </>
  );
}

function CarteStat({ valeur, label, puce }: { valeur: string; label: string; puce?: string }) {
  return (
    <div
      className="flex h-[115px] w-[115px] shrink-0 flex-col items-center justify-center rounded-[12px] bg-white p-2 text-center"
      style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
    >
      {puce ? (
        <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-base font-extrabold ${puce}`}>{valeur}</span>
      ) : (
        <p className="text-lg font-extrabold text-[color:var(--brand-blue-end)]">{valeur}</p>
      )}
      <p className="mt-1.5 text-[10px] font-semibold leading-tight text-brand-muted">{label}</p>
      <p className="text-[9px] text-brand-muted/70">Cette semaine</p>
    </div>
  );
}

/**
 * Une ligne par mission livrée — gain réel du livreur (commande.frais_livraison),
 * pas l'encaissement client. Aucune ligne de retrait : cette fonctionnalité
 * n'existe pas côté livreur (voir MoiController::paiements()).
 */
function LigneMission({ mission }: { mission: MissionPaiement }) {
  const fournisseur = mission.commande.lignes[0]?.produit?.fournisseur?.adresse_entreprise;
  const destination = mission.adresse?.localite?.nom;
  const lieu = [fournisseur, destination].filter(Boolean).join(" - ") || "—";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        <ArrowDownLeftIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-ink">Livraison validée</p>
        <p className="mt-0.5 truncate text-xs text-brand-muted">{lieu}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-extrabold text-emerald-600">+{formaterPrix(mission.commande.frais_livraison)} F</p>
        <p className="mt-0.5 text-[10px] text-brand-muted">
          {mission.date_livraison_effective ? formaterDateRelative(mission.date_livraison_effective) : "—"}
        </p>
      </div>
    </div>
  );
}

/**
 * "Mes paiements" — deuxième onglet de la barre du bas. Reproduit le
 * mockup fourni. Les gains affichés sont ceux du livreur (frais de livraison
 * sur ses missions livrées), pas l'encaissement client — voir
 * MoiController::paiements(). "SOLDES" = solde_total, un cumul qui ne décroît
 * jamais (aucun retrait n'existe dans l'app). Compteurs et liste filtrés par
 * période (periode=semaine par défaut) ; le sélecteur "Cette semaine" n'est
 * pour l'instant pas cliquable (une seule période).
 */
export function EcranPaiements() {
  const { token } = useAuth();
  const [donnees, setDonnees] = useState<PaiementsLivreur | null>(null);

  function recharger() {
    if (!token) return;
    apiFetch<PaiementsLivreur>("/moi/paiements?per_page=50&periode=semaine", { token }).then(setDonnees);
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<PaiementsLivreur>("/moi/paiements?per_page=50&periode=semaine", { token })
      .then((data) => {
        if (!annule) setDonnees(data);
      })
      .catch(() => {
        if (!annule) setDonnees(null);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  useRefetchOnFocus(recharger);

  // Le container blanc doit s'arrêter juste après la dernière carte réellement
  // affichée : sous la carte "Espèce à reverser" quand il y a du cash à
  // reverser, sinon juste sous les cartes stats — sans ça, l'absence de la
  // carte laisse un grand vide blanc à sa place (hauteur fixe qui ne
  // s'adaptait pas à son affichage conditionnel).
  const aCarteAReverser = Boolean(donnees && donnees.gains_non_deposes > 0);
  const hauteurPanneauBlanc = aCarteAReverser ? 501 : 406;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="relative shrink-0" style={{ height: 184 }}>
        <div
          className="absolute inset-x-0"
          style={{ top: -121, height: hauteurPanneauBlanc, background: "rgba(255, 255, 255, 1)", boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
        />
        <div className="absolute inset-x-0" style={{ top: -121, height: 305, borderRadius: 30, background: DEGRADE_HEADER }} />

        <p className="absolute left-4 text-2xl font-extrabold text-white" style={{ top: 24 }}>
          Mes paiements
        </p>

        <span
          className="absolute flex items-center justify-center text-xs font-semibold text-white"
          style={{
            top: 30,
            right: 21,
            width: 110,
            height: 24,
            borderRadius: 7,
            background: "rgba(255, 255, 255, 0.23)",
            border: "1px solid rgba(255, 255, 255, 1)",
          }}
        >
          Cette semaine
        </span>

        <div
          className="absolute flex items-center justify-between px-4"
          style={{
            top: 69,
            left: 22,
            right: 31,
            height: 49,
            borderRadius: 9,
            background: "rgba(255, 255, 255, 0.29)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-white/80">Soldes</p>
          <p className="text-lg font-extrabold text-white">{donnees ? `${formaterPrix(donnees.solde_total)} F` : "—"}</p>
        </div>
      </div>

      <div className="relative z-10 flex justify-between px-[17px]" style={{ marginTop: 155 - 184 }}>
        <CarteStat valeur={donnees ? String(donnees.missions_recues) : "—"} label="Mission Total reçu" puce="bg-orange-100 text-orange-600" />
        <CarteStat valeur={donnees ? String(donnees.missions_validees) : "—"} label="Mission Total validée" puce="bg-emerald-100 text-emerald-600" />
        <CarteStat valeur={donnees ? formaterPrix(donnees.gains_periode) : "—"} label="Gain total reçu" />
      </div>

      {aCarteAReverser && donnees ? (
        <CarteEspeceAReverser
          montant={donnees.gains_non_deposes}
          dateLimite={donnees.date_limite_depot_urgente}
          onReverse={async () => {
            if (!token) return;
            await apiFetch("/moi/paiements/reverser", { method: "POST", token });
            recharger();
          }}
        />
      ) : null}

      <div className="mx-4 mt-3 h-px bg-brand-line" />

      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-10">
        {donnees === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : donnees.missions.data.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune livraison validée cette semaine.</p>
        ) : (
          donnees.missions.data.map((mission) => <LigneMission key={mission.id} mission={mission} />)
        )}
      </div>
    </div>
  );
}
