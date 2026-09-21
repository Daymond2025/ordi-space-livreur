"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterAnciennete, formaterPrix, type PaiementsLivreur, type ProfilLivreur, type TypeVehiculeLivreur } from "@/lib/types";
import { CameraIcon, ChevronLeftIcon, ChevronRightIcon, DocumentIcon, HeadsetIcon, PencilIcon, ShieldIcon, UserIcon } from "@/components/icons";
import { InterrupteurDisponibilite } from "@/components/space/InterrupteurDisponibilite";
import { SelecteurVehicule } from "@/components/compte/SelecteurVehicule";
import { useRefetchOnFocus } from "@/lib/useRefetchOnFocus";

const DEGRADE_HEADER = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";

function CarteStat({ valeur, label, puce }: { valeur: string; label: string; puce: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5 rounded-[12px] text-center"
      style={{ width: 93, height: 85, background: "rgba(246, 248, 254, 1)", boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${puce}`} />
      <p className="text-base font-extrabold text-brand-ink">{valeur}</p>
      <p className="text-[10px] leading-tight text-brand-muted">{label}</p>
    </div>
  );
}

function LigneMenu({ icone, iconeClasse, label, onClick }: { icone: React.ReactNode; iconeClasse: string; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconeClasse}`}>{icone}</span>
      <span className="flex-1 text-sm font-bold text-brand-ink">{label}</span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
    </button>
  );
}

/**
 * "Mon Profil" — reproduction du mockup fourni. Stats et disponibilité sont
 * réelles (GET /moi/profil, GET /moi/paiements?periode=tout pour un cumul
 * non filtré par semaine — voir MoiController::paiements()). Pas de photo de
 * profil en base (placeholder générique) ; la carte véhicule n'affiche que
 * type_vehicule (générique, ex. "Moto") — aucun champ marque/modèle/plaque
 * n'existe côté backend pour l'instant. Les 3 liens du bas ("Mes documents",
 * "Confidentialité et UGC", "Contactez le service") et le bouton haut-droit
 * ne sont pas encore branchés (aucun écran cible construit). Taper la photo
 * ouvre "Mes infos" (/mes-infos) ; l'appareil photo, lui, change la photo.
 */
export function EcranCompte() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [profil, setProfil] = useState<ProfilLivreur | null>(null);
  const [paiements, setPaiements] = useState<PaiementsLivreur | null>(null);
  const [chargementDispo, setChargementDispo] = useState(false);
  const [chargementPhoto, setChargementPhoto] = useState(false);
  const [selecteurVehiculeOuvert, setSelecteurVehiculeOuvert] = useState(false);
  const [chargementVehicule, setChargementVehicule] = useState(false);
  const inputPhotoRef = useRef<HTMLInputElement>(null);

  function recharger() {
    if (!token) return;
    Promise.all([
      apiFetch<ProfilLivreur>("/moi/profil", { token }),
      apiFetch<PaiementsLivreur>("/moi/paiements?periode=tout", { token }),
    ]).then(([profilData, paiementsData]) => {
      setProfil(profilData);
      setPaiements(paiementsData);
    });
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    Promise.all([
      apiFetch<ProfilLivreur>("/moi/profil", { token }),
      apiFetch<PaiementsLivreur>("/moi/paiements?periode=tout", { token }),
    ])
      .then(([profilData, paiementsData]) => {
        if (annule) return;
        setProfil(profilData);
        setPaiements(paiementsData);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token]);

  useRefetchOnFocus(recharger);

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

  async function onChoisirPhoto(fichier: File | undefined) {
    if (!fichier || !token) return;
    setChargementPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", fichier);
      const utilisateurMisAJour = await apiFetch<{ photo: string | null }>("/moi/profil/photo", { method: "POST", token, body: formData });
      setProfil((p) => (p ? { ...p, photo: utilisateurMisAJour.photo } : p));
    } catch {
      // Silencieux : l'avatar reste inchangé, le livreur peut réessayer.
    } finally {
      setChargementPhoto(false);
      if (inputPhotoRef.current) inputPhotoRef.current.value = "";
    }
  }

  async function onValiderVehicule(valeur: TypeVehiculeLivreur) {
    if (!token) return;
    setChargementVehicule(true);
    try {
      await apiFetch("/moi/vehicule", { method: "PATCH", token, body: { type_vehicule: valeur } });
      setProfil((p) => (p ? { ...p, type_vehicule: valeur } : p));
      setSelecteurVehiculeOuvert(false);
    } catch {
      // Silencieux : la feuille reste ouverte, le livreur peut réessayer.
    } finally {
      setChargementVehicule(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="relative shrink-0" style={{ height: 318 }}>
        <div className="absolute inset-x-0" style={{ top: -121, height: 309, borderRadius: 30, background: DEGRADE_HEADER }} />

        {/* Doit être peinte AVANT l'avatar/le nom (voir plus bas) pour que ceux-ci
            se posent visiblement sur son bord haut, au lieu d'être recouverts. */}
        <div
          className="absolute"
          style={{
            top: 130,
            left: 31,
            right: 29,
            height: 188,
            borderRadius: 30,
            background: "rgba(255, 255, 255, 1)",
            boxShadow: "0px 12px 12px 0px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div className="flex" style={{ paddingTop: 58, paddingLeft: 16, paddingRight: 9, gap: 19 }}>
            <CarteStat valeur={paiements ? String(paiements.missions_validees) : "—"} label="Livraison effectuée" puce="bg-[color:var(--brand-blue-end)]" />
            <CarteStat valeur={paiements ? `${formaterPrix(paiements.solde_total)}F` : "—"} label="Montant reçu" puce="bg-rose-400" />
            <CarteStat valeur={profil ? formaterAnciennete(profil.created_at) : "—"} label="Ancienneté" puce="bg-emerald-400" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Retour"
          className="absolute left-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white"
          style={{ top: 26 }}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="absolute left-16 z-10 text-lg font-extrabold text-white" style={{ top: 32 }}>
          Mon Profil
        </p>

        <div
          className="absolute z-10"
          style={{
            top: 26,
            right: 18,
            width: 52,
            height: 50.375,
            borderRadius: 11,
            background: "rgba(255, 255, 255, 0.46)",
            border: "1px solid rgba(255, 255, 255, 0.72)",
          }}
        >
          <button
            type="button"
            aria-label="Boutique"
            onClick={() => router.push("/boutique")}
            className="absolute"
            style={{ top: 5, left: 6, width: 40, height: 40 }}
          >
            <Image src="/images/boutique.png" alt="" width={40} height={40} className="brightness-0 invert" />
          </button>
          <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="Voir mes infos"
          onClick={() => router.push("/mes-infos")}
          onKeyDown={(e) => {
            if (e.key === "Enter") router.push("/mes-infos");
          }}
          className="absolute z-10 cursor-pointer overflow-hidden"
          style={{
            top: 72,
            left: 57,
            width: 81,
            height: 81,
            borderRadius: 20,
            background: "linear-gradient(white, white) padding-box, linear-gradient(90deg, #0077FF 0%, #00BFFF 100%) border-box",
            border: "1px solid transparent",
            boxShadow: "0px 12px 12px 1px rgba(0, 119, 255, 0.3)",
          }}
        >
          <div
            className="absolute flex items-center justify-center overflow-hidden bg-[#F5F7FA] text-brand-muted"
            style={{ top: 7, left: 4, width: 73, height: 74, borderRadius: 17 }}
          >
            {profil?.photo ? (
              <Image src={profil.photo} alt="" width={73} height={74} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-9 w-9" />
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputPhotoRef.current?.click();
            }}
            disabled={chargementPhoto}
            aria-label="Modifier la photo de profil"
            className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--brand-blue-end)] text-white ring-2 ring-white disabled:opacity-60"
            style={{ bottom: 2, right: 2 }}
          >
            <CameraIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <input
          ref={inputPhotoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChoisirPhoto(e.target.files?.[0])}
        />

        <div className="absolute z-10 text-white" style={{ top: 80, left: 152, right: 16 }}>
          <p className="truncate text-lg font-extrabold leading-tight">{user?.prenom ? `${user.prenom} ${user.nom}` : user?.nom}</p>
          <p className="mt-1 text-sm text-white/85">{profil?.telephone ?? ""}</p>
        </div>
      </div>

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-[22px] bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
          <span className="h-4 w-4 rounded-full bg-emerald-500" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-brand-ink">Disponibilité</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-emerald-600">
            {profil?.disponible ? "En ligne" : "Hors ligne"} • Je peux recevoir des missions
          </p>
        </div>
        <InterrupteurDisponibilite
          variante="clair"
          actif={profil?.disponible ?? false}
          chargement={chargementDispo || !profil}
          onChange={onBasculerDisponibilite}
        />
      </div>

      <button
        type="button"
        onClick={() => setSelecteurVehiculeOuvert(true)}
        className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-[22px] bg-white p-4 text-left"
        style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <Image src="/images/moto.png" alt="" width={31} height={31} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold capitalize text-brand-ink">{profil?.type_vehicule ?? "Véhicule"}</p>
          <p className="mt-0.5 text-xs text-brand-muted">{profil?.type_vehicule ? "Véhicule enregistré" : "Définir mon véhicule"}</p>
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
      </button>

      <div className="mx-4 mt-4 divide-y divide-brand-line rounded-[22px] bg-white px-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <LigneMenu
          icone={<PencilIcon className="h-4.5 w-4.5" />}
          iconeClasse="bg-blue-50 text-[color:var(--brand-blue-end)]"
          label="Modifier mon profil"
          onClick={() => router.push("/modifier-profil")}
        />
        <LigneMenu icone={<DocumentIcon className="h-4.5 w-4.5" />} iconeClasse="bg-blue-50 text-[color:var(--brand-blue-end)]" label="Mes documents" />
        <LigneMenu icone={<ShieldIcon className="h-4.5 w-4.5" />} iconeClasse="bg-indigo-50 text-indigo-500" label="Confidentialité et UGC" />
        <LigneMenu icone={<HeadsetIcon className="h-4.5 w-4.5" />} iconeClasse="bg-amber-50 text-amber-500" label="Contactez le service" />
      </div>

      <div className="px-4 pb-6 pt-6">
        <button
          type="button"
          onClick={() => logout()}
          className="h-12 w-full rounded-full bg-black text-xs font-extrabold uppercase tracking-wide text-white"
        >
          Déconnexion
        </button>
      </div>

      {selecteurVehiculeOuvert ? (
        <SelecteurVehicule
          valeurActuelle={profil?.type_vehicule ?? null}
          chargement={chargementVehicule}
          onValider={onValiderVehicule}
          onFermer={() => setSelecteurVehiculeOuvert(false)}
        />
      ) : null}
    </div>
  );
}
