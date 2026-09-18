"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterPrix, type MissionLivreur, type Pagination, type PaiementsLivreur, type ProfilLivreur } from "@/lib/types";
import { BellIcon, LongArrowRightIcon, UserIcon } from "@/components/icons";
import { InterrupteurDisponibilite } from "@/components/space/InterrupteurDisponibilite";
import { useRefetchOnFocus } from "@/lib/useRefetchOnFocus";
import { useCompteARebours } from "@/lib/useCompteARebours";

const DEGRADE_HEADER = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";

type Onglet = "tous" | "en_cours" | "missions" | "disponibles";

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en_cours", label: "En cours" },
  { id: "missions", label: "Missions" },
  { id: "disponibles", label: "Disponibles" },
];

type Badge = { label: string; classe: string };

/**
 * Copié de Cordinateur_App_Web/.../EcranMissionsLivreur.tsx (calculerEtat) —
 * miroir lecture seule que le coordinateur a déjà d'après le même mockup
 * PDG. On y ajoute seulement "en_attente_livreur" (vivier), absent côté
 * coordinateur puisque cette vue-là ne liste que les missions déjà liées à
 * CE livreur — ici la liste mélange aussi le vivier (voir LivraisonController::index()).
 */
function calculerEtat(mission: MissionLivreur, estActive: boolean): { headline: string; badges: Badge[]; gainLabel: "Gain estimé" | "Gain reçu" } {
  const gainLabel = mission.statut_livraison === "livree" || mission.statut_livraison === "echouee" ? "Gain reçu" : "Gain estimé";

  if (mission.statut_livraison === "en_attente_livreur" || mission.statut_livraison === "assignee") {
    return { headline: "Nouvelle mission", badges: [{ label: "Accepter", classe: "bg-green-500 text-white" }], gainLabel };
  }

  if (mission.statut_livraison === "en_cours") {
    if (!estActive) {
      return { headline: "Mission suivante", badges: [{ label: "Déjà Accepté", classe: "bg-orange-100 text-orange-600" }], gainLabel };
    }

    const headline = mission.colis_recupere_le ? "En route pour livraison au client" : "En route pour récupération en boutique";
    const badgeLabel = mission.livraison_demarree_le ? "Livraison en cours" : "En cours";
    return { headline, badges: [{ label: badgeLabel, classe: "bg-[color:var(--brand-blue-end)] text-white" }], gainLabel };
  }

  if (mission.statut_livraison === "livree") {
    if (mission.paiement?.mode_paiement === "especes" && !mission.paiement.date_depot) {
      return { headline: "Livraison terminée", badges: [{ label: "Dépôt non effectué", classe: "bg-rose-100 text-rose-600" }], gainLabel };
    }
    return { headline: "Livraison terminée", badges: [{ label: "Terminée", classe: "bg-green-100 text-green-600" }], gainLabel };
  }

  // echouee
  if (mission.retour_necessaire) {
    const badgeRetour: Badge =
      mission.statut_retour === "effectue"
        ? { label: "Retour effectué", classe: "bg-green-100 text-green-600" }
        : { label: "Retour en cours", classe: "bg-blue-100 text-[color:var(--brand-blue-end)]" };

    return { headline: "Livraison terminée", badges: [{ label: "Commande annulée", classe: "bg-rose-100 text-rose-600" }, badgeRetour], gainLabel };
  }

  return { headline: "Livraison terminée", badges: [{ label: "Échec de livraison", classe: "bg-rose-100 text-rose-600" }], gainLabel };
}

/**
 * Avant récupération (vivier/assignée/en_cours pas encore récupérée) : on
 * montre encore le fournisseur — après (colis_recupere_le posé), le client.
 */
function avantRecuperation(mission: MissionLivreur): boolean {
  return (
    mission.statut_livraison === "en_attente_livreur" ||
    mission.statut_livraison === "assignee" ||
    (mission.statut_livraison === "en_cours" && !mission.colis_recupere_le)
  );
}

function libelleEtape(mission: MissionLivreur): string {
  return avantRecuperation(mission)
    ? `Récupération chez ${mission.nom_fournisseur ?? "le fournisseur"}`
    : `Livraison chez ${mission.nom_client || "le client"}`;
}

/** "Fais le dépôt : Xh:MMm:SSs" — formatage propre à cet écran, voir useCompteARebours (partagé). */
function formaterCompteARebours(compte: ReturnType<typeof useCompteARebours>): string | null {
  if (!compte) return null;
  if (compte.expire) return "Délai dépassé";
  return `${compte.h}h:${String(compte.m).padStart(2, "0")}m:${String(compte.s).padStart(2, "0")}s`;
}

/** Mission active en premier, puis nouvelles missions, puis suivantes, puis terminées. */
function prioriteCarte(mission: MissionLivreur, estActive: boolean): number {
  if (mission.statut_livraison === "en_attente_livreur" || mission.statut_livraison === "assignee") return 2;
  if (mission.statut_livraison === "en_cours") return estActive ? 1 : 3;
  return 4;
}

function CarteMission({ mission, estActive, onAccepter, chargementAction }: {
  mission: MissionLivreur;
  estActive: boolean;
  onAccepter: (endpoint: string) => void;
  chargementAction: boolean;
}) {
  const { headline, badges, gainLabel } = calculerEtat(mission, estActive);
  const nouvelleMission = mission.statut_livraison === "en_attente_livreur" || mission.statut_livraison === "assignee";
  const compteARebours = useCompteARebours(
    mission.statut_livraison === "livree" && mission.paiement?.mode_paiement === "especes" && !mission.paiement.date_depot
      ? mission.paiement.date_limite_depot
      : null
  );

  return (
    <div
      className={`rounded-[18px] bg-white p-3 ${nouvelleMission ? "border-2 border-orange-400" : ""}`}
      style={{ boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-sm font-bold ${nouvelleMission ? "text-orange-600" : "text-brand-ink"}`}>{headline}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {badges.map((badge) =>
            nouvelleMission ? (
              <button
                key={badge.label}
                type="button"
                disabled={chargementAction}
                onClick={() => onAccepter(mission.statut_livraison === "en_attente_livreur" ? `/livraisons/${mission.id}/affecter` : `/livraisons/${mission.id}/accepter`)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold disabled:opacity-60 ${badge.classe}`}
              >
                {badge.label}
              </button>
            ) : (
              <span key={badge.label} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.classe}`}>
                {badge.label}
              </span>
            )
          )}
        </div>
      </div>

      <Link href={`/mission/${mission.id}`} className="mt-2 flex items-center gap-3">
        <Image src="/images/carton-mission.png" alt="" width={83} height={83} className="h-[64px] w-[64px] shrink-0 object-contain" />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-xs text-brand-muted">
            <UserIcon className="h-3 w-3 shrink-0" /> {libelleEtape(mission)}
          </p>
          <p className="mt-0.5 truncate text-xs text-brand-muted">
            Lieu : {(avantRecuperation(mission) ? mission.zone_fournisseur : mission.zone_destination) ?? "—"}
          </p>
          {compteARebours ? (
            <p className="mt-0.5 truncate text-xs font-semibold text-rose-600">Fais le dépôt : {formaterCompteARebours(compteARebours)}</p>
          ) : null}
        </div>

        {mission.statut_livraison === "en_cours" && estActive ? (
          <LongArrowRightIcon className="h-4 w-10 shrink-0" style={{ color: "rgba(0, 0, 0, 0.36)" }} />
        ) : (
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-brand-muted">{gainLabel}</p>
            <p className="text-sm font-extrabold text-[color:var(--brand-blue-end)]">{formaterPrix(mission.frais_livraison)} F</p>
          </div>
        )}
      </Link>
    </div>
  );
}

function CarteStat({ valeur, label, puce, sousLabel }: { valeur: string; label: string; puce?: string; sousLabel?: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-white p-3 text-center" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
      {sousLabel ? <p className="truncate text-[9px] font-bold text-orange-500">{sousLabel}</p> : null}
      {puce ? (
        <span className={`mx-auto mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-base font-extrabold ${puce}`}>{valeur}</span>
      ) : (
        <p className="mt-0.5 text-lg font-extrabold text-[color:var(--brand-blue-end)]">{valeur}</p>
      )}
      <p className="mt-1.5 text-[10px] font-semibold leading-tight text-brand-muted">{label}</p>
    </div>
  );
}

function filtreOnglet(mission: MissionLivreur, onglet: Onglet): boolean {
  if (onglet === "en_cours") return mission.statut_livraison === "en_cours";
  if (onglet === "missions") return mission.statut_livraison === "livree" || mission.statut_livraison === "echouee";
  if (onglet === "disponibles") return mission.statut_livraison === "en_attente_livreur" || mission.statut_livraison === "assignee";
  return true;
}

/**
 * "Space" — écran d'accueil de l'app Livreur. Combine profil + disponibilité
 * (GET/PATCH /moi/disponibilite), statistiques (dérivées de GET /livraisons
 * + GET /moi/paiements) et la liste filtrable des missions.
 */
export function EcranMissions() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<MissionLivreur[] | null>(null);
  const [paiements, setPaiements] = useState<PaiementsLivreur | null>(null);
  const [profil, setProfil] = useState<ProfilLivreur | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [chargementDispo, setChargementDispo] = useState(false);
  const [chargementAction, setChargementAction] = useState(false);
  const [notificationsNonLues, setNotificationsNonLues] = useState(false);

  function recharger() {
    if (!token) return;
    apiFetch<Pagination<MissionLivreur>>("/livraisons?per_page=50", { token }).then((page) => setMissions(page.data));
  }

  function rechargerTout() {
    if (!token) return;
    Promise.all([
      apiFetch<Pagination<MissionLivreur>>("/livraisons?per_page=50", { token }),
      apiFetch<PaiementsLivreur>("/moi/paiements", { token }),
      apiFetch<ProfilLivreur>("/moi/profil", { token }),
      apiFetch<Pagination<{ lu: boolean }>>("/moi/notifications", { token }),
    ])
      .then(([missionsPage, paiementsData, profilData, notificationsPage]) => {
        setMissions(missionsPage.data);
        setPaiements(paiementsData);
        setProfil(profilData);
        setNotificationsNonLues(notificationsPage.data.some((n) => !n.lu));
      })
      .catch(() => setMissions((m) => m ?? []));
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    Promise.all([
      apiFetch<Pagination<MissionLivreur>>("/livraisons?per_page=50", { token }),
      apiFetch<PaiementsLivreur>("/moi/paiements", { token }),
      apiFetch<ProfilLivreur>("/moi/profil", { token }),
      apiFetch<Pagination<{ lu: boolean }>>("/moi/notifications", { token }),
    ])
      .then(([missionsPage, paiementsData, profilData, notificationsPage]) => {
        if (annule) return;
        setMissions(missionsPage.data);
        setPaiements(paiementsData);
        setProfil(profilData);
        setNotificationsNonLues(notificationsPage.data.some((n) => !n.lu));
      })
      .catch(() => {
        if (!annule) setMissions([]);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  // Sans ça, revenir sur "Space" via le bouton précédent après avoir changé
  // le statut d'une mission ailleurs peut réafficher un instantané figé
  // (bfcache) au lieu des vraies données — voir useRefetchOnFocus.
  useRefetchOnFocus(rechargerTout);

  const idMissionActive = useMemo(() => {
    if (!missions) return null;
    const missionsEnCours = missions
      .filter((m) => m.statut_livraison === "en_cours")
      .sort((a, b) => (a.date_livraison_prevue ?? "").localeCompare(b.date_livraison_prevue ?? ""));
    return missionsEnCours[0]?.id ?? null;
  }, [missions]);

  const missionsTriees = useMemo(() => {
    if (!missions) return null;
    return [...missions].sort((a, b) => prioriteCarte(a, a.id === idMissionActive) - prioriteCarte(b, b.id === idMissionActive));
  }, [missions, idMissionActive]);

  const missionsFiltrees = missionsTriees?.filter((m) => filtreOnglet(m, onglet)) ?? null;

  const missionsRecues = missions?.filter((m) => m.statut_livraison !== "en_attente_livreur").length ?? null;
  const missionsLivrees = missions?.filter((m) => m.statut_livraison === "livree").length ?? null;

  async function onBasculerDisponibilite(valeur: boolean) {
    if (!token || chargementDispo) return;
    setChargementDispo(true);
    setProfil((p) => (p ? { ...p, disponible: valeur } : p));
    try {
      await apiFetch("/moi/disponibilite", { method: "PATCH", token, body: { disponible: valeur } });
    } catch {
      setProfil((p) => (p ? { ...p, disponible: !valeur } : p));
    } finally {
      setChargementDispo(false);
    }
  }

  async function onAccepter(endpoint: string) {
    if (!token || chargementAction) return;
    setChargementAction(true);
    try {
      await apiFetch(endpoint, { method: "POST", token });
      recharger();
    } catch (e) {
      console.error(e instanceof ApiRequestError ? e.message : e);
    } finally {
      setChargementAction(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="relative shrink-0" style={{ height: 184 }}>
        {/* Peinte AVANT le dégradé bleu (qui la recouvre en partie) — même
            technique que "Mes paiements" : le blanc n'apparaît que là où le
            bleu ne la couvre pas, sans avoir besoin d'un container séparé. */}
        <div
          className="absolute inset-x-0"
          style={{ top: -121, height: 425, background: "rgba(255, 255, 255, 1)", boxShadow: "0px 12px 12px 0px rgba(0, 0, 0, 0.08)" }}
        />
        <div className="absolute inset-x-0" style={{ top: -121, height: 305, borderRadius: 30, background: DEGRADE_HEADER }} />

        <div className="absolute left-4 flex items-center gap-3" style={{ top: 20 }}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 ring-2 ring-white/40">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">Bonjour, 👋</p>
            <p className="text-lg font-extrabold leading-tight text-white">{user?.prenom ? `${user.prenom} ${user.nom}` : user?.nom}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/notifications")}
          aria-label="Notifications"
          className="absolute flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[color:var(--brand-blue-end)]"
          style={{ top: 20, right: 16 }}
        >
          <BellIcon className="h-4.5 w-4.5" />
          {notificationsNonLues ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /> : null}
        </button>

        <div
          className="absolute flex items-center gap-2.5 px-3"
          style={{
            top: 94,
            left: 31,
            width: 349,
            height: 26,
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.29)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${profil?.disponible ? "bg-emerald-400" : "bg-white/50"}`} />
          <p className="flex-1 text-xs font-semibold text-white">{profil?.disponible ? "En ligne" : "Hors ligne"}</p>
        </div>
        <div className="absolute" style={{ top: 98, left: 340 }}>
          <InterrupteurDisponibilite
            variante="clair"
            taille="petite"
            actif={profil?.disponible ?? false}
            chargement={chargementDispo || !profil}
            onChange={onBasculerDisponibilite}
          />
        </div>
      </div>

      {/* Cartes stats flottantes et indépendantes — se posent à moitié sur le
          header, avec le bleu qui reste visible dans leurs interstices. */}
      <div className="relative z-10 -mt-[42px] flex gap-3 px-4">
        <CarteStat valeur={missionsRecues !== null ? String(missionsRecues) : "—"} label="Missions Totale Reçu" puce="bg-orange-100 text-orange-600" />
        <CarteStat valeur={missionsLivrees !== null ? String(missionsLivrees) : "—"} label="Missions Livrée" puce="bg-emerald-100 text-emerald-600" />
        <CarteStat
          valeur={paiements ? `${formaterPrix(paiements.solde_total)}` : "—"}
          label="Argent total reçu"
          sousLabel={paiements ? `${formaterPrix(paiements.gains_non_deposes)} FCFA Disponible` : undefined}
        />
      </div>

      {/* Le fond blanc vient du panneau posé derrière le header (ci-dessus) —
          plus besoin d'un container dédié ici. */}
      <div className="relative z-10 flex gap-1 overflow-x-auto px-4 pb-2 pt-3">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              onglet === o.id ? "bg-[color:var(--brand-blue-end)] text-white" : "text-brand-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-8">
        {missionsFiltrees === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : missionsFiltrees.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune mission dans cette catégorie.</p>
        ) : (
          missionsFiltrees.map((mission) => (
            <CarteMission
              key={mission.id}
              mission={mission}
              estActive={mission.id === idMissionActive}
              onAccepter={onAccepter}
              chargementAction={chargementAction}
            />
          ))
        )}
      </div>
    </div>
  );
}
