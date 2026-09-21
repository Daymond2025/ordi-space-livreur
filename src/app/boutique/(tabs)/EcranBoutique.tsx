"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, type Pagination } from "@/lib/types";
import type { ResumePortefeuille } from "@/lib/portefeuille";
import { formaterMontantPoints } from "@/lib/ventesBoutique";
import { categorieBoutique, LIBELLE_ETAT_PRODUIT, resumerSpecs, type ProduitBoutique } from "@/lib/produitsBoutique";
import { BellIcon, ChevronLeftIcon, ChevronRightIcon, ImageIcon, WalletIcon } from "@/components/icons";
import { PopupLienAffilie } from "@/components/boutique/PopupLienAffilie";

const DEGRADE_HEADER = "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)";
const COULEUR_BOUTON_VENDRE = "rgba(255, 151, 0, 1)";

const CATEGORIES = [
  { id: "tout", label: "Tout" },
  { id: "ordinateurs", label: "Ordinateurs" },
  { id: "accessoires", label: "Accessoires" },
  { id: "logiciels", label: "Logiciels" },
] as const;

function CarteProduitBoutique({
  produit,
  chargement,
  onVendre,
  onOuvrir,
}: {
  produit: ProduitBoutique;
  chargement: boolean;
  onVendre: () => void;
  onOuvrir: () => void;
}) {
  const specs = resumerSpecs(produit);
  const image = produit.images[0]?.url_image;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
      <button type="button" onClick={onOuvrir} className="relative h-28 w-full text-left">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- domaine backend dynamique (dev/prod), pas de config next/image nécessaire ici
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#F2F5FA] text-brand-muted">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        {produit.etat_produit ? (
          <span className="absolute left-2 top-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
            {LIBELLE_ETAT_PRODUIT[produit.etat_produit]}
          </span>
        ) : null}
        {produit.pourcentage_reduction ? (
          <span className="absolute right-2 top-2 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
            -{produit.pourcentage_reduction}%
          </span>
        ) : null}
      </button>

      <div className="flex flex-col gap-1.5 p-2.5">
        <button type="button" onClick={onOuvrir} className="text-left">
          <p className="line-clamp-2 text-xs font-extrabold leading-tight text-brand-ink">{produit.nom_produit}</p>
        </button>

        {specs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specs.map((spec) => (
              <span key={spec} className="rounded bg-[#F2F5FA] px-1.5 py-0.5 text-[9px] font-semibold text-brand-muted">
                {spec}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-baseline gap-1.5">
          <p className="text-sm font-extrabold text-brand-ink">
            {produit.prix_vente ? `${formaterPrix(produit.prix_vente)} CFA` : "Prix à venir"}
          </p>
          {produit.prix_barre ? (
            <p className="text-[10px] text-brand-muted line-through">{formaterPrix(produit.prix_barre)}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-2 py-1">
          <span className="text-[9px] font-bold text-amber-700">Commission</span>
          <span className="text-xs font-extrabold text-amber-700">
            {produit.commission_revente ? `${formaterPrix(produit.commission_revente)} CFA` : "—"}
          </span>
        </div>

        <button
          type="button"
          onClick={onVendre}
          disabled={chargement}
          className="mt-0.5 w-full text-[11px] font-extrabold text-white disabled:opacity-60"
          style={{ height: 30, borderRadius: 5, background: COULEUR_BOUTON_VENDRE }}
        >
          {chargement ? "…" : "Vendre ce produit"}
        </button>
      </div>
    </div>
  );
}

/**
 * "Boutique" — accessible depuis l'icône boutique de "Mon Profil". Le
 * livreur revend de vrais produits publiés par Fournisseur/Coordinateur/
 * Admin (GET /produits, public) en échange de la commission renseignée sur
 * chaque produit (`commission_revente`) — seuls les produits où ce champ est
 * renseigné apparaissent ici, les autres ne sont pas ouverts à la revente.
 * "Vendre ce produit" génère le lien affilié réel
 * (POST /boutique/produits/{id}/lien) et l'affiche dans une pop-up
 * Copier/Partager ; taper la carte ouvre le détail produit.
 */
export function EcranBoutique() {
  const router = useRouter();
  const { token } = useAuth();
  const [categorie, setCategorie] = useState<(typeof CATEGORIES)[number]["id"]>("tout");
  const [produits, setProduits] = useState<ProduitBoutique[] | null>(null);
  const [chargementCarteId, setChargementCarteId] = useState<number | null>(null);
  const [lienActif, setLienActif] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumePortefeuille | null>(null);

  // Commission disponible de l'en-tête : le même solde que sur "Portefeuille".
  useEffect(() => {
    if (!token) return;
    let annule = false;
    apiFetch<ResumePortefeuille>("/boutique/portefeuille", { token })
      .then((soldes) => {
        if (!annule) setResume(soldes);
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [token]);

  useEffect(() => {
    apiFetch<Pagination<ProduitBoutique>>("/produits?per_page=50", { token: token ?? undefined })
      .then((page) => setProduits(page.data.filter((p) => p.commission_revente !== null)))
      .catch(() => setProduits([]));
  }, [token]);

  async function onVendre(produit: ProduitBoutique) {
    if (!token || chargementCarteId) return;
    setChargementCarteId(produit.id);
    try {
      const reponse = await apiFetch<{ code: string; url: string }>(`/boutique/produits/${produit.id}/lien`, {
        method: "POST",
        token,
      });
      setLienActif(reponse.url);
    } catch {
      // Silencieux : le livreur peut simplement retenter.
    } finally {
      setChargementCarteId(null);
    }
  }

  const produitsFiltres = produits?.filter((p) => categorie === "tout" || categorieBoutique(p.categorie?.nom_categorie) === categorie);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="relative shrink-0 pb-4 pt-5" style={{ background: DEGRADE_HEADER, borderRadius: "0 0 30px 30px" }}>
        <div className="flex items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => router.push("/notifications")}
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white"
          >
            <BellIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-2 flex flex-col items-center">
          <p className="text-xs font-semibold text-white/80">Commission disponible</p>
          <p className="mt-0.5 text-[28px] font-extrabold leading-tight text-white">{formaterMontantPoints(resume?.disponible ?? 0)} FCFA</p>
          <button
            type="button"
            onClick={() => router.push("/boutique/portefeuille")}
            className="mt-3 flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white"
          >
            <WalletIcon className="h-4 w-4" />
            Voir mon portefeuille
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mx-6 mt-4 h-px bg-white/25" />

        <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategorie(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                categorie === cat.id ? "bg-white text-[color:var(--brand-blue-end)]" : "bg-white/20 text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {produitsFiltres === null || produitsFiltres === undefined ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : produitsFiltres.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun produit à revendre dans cette catégorie.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-24 pt-4">
          {produitsFiltres.map((produit) => (
            <CarteProduitBoutique
              key={produit.id}
              produit={produit}
              chargement={chargementCarteId === produit.id}
              onVendre={() => onVendre(produit)}
              onOuvrir={() => router.push(`/boutique/produits/${produit.id}`)}
            />
          ))}
        </div>
      )}

      {lienActif ? <PopupLienAffilie url={lienActif} onFermer={() => setLienActif(null)} /> : null}
    </div>
  );
}
