"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDateHeure, type MissionLivreur, type Pagination } from "@/lib/types";
import { ImageIcon } from "@/components/icons";

/**
 * Historique des preuves de livraison (lecture seule) — les livraisons
 * "livree" de ce livreur, avec la photo prise à la remise du colis.
 */
export function EcranPreuves() {
  const { token } = useAuth();
  const [livraisons, setLivraisons] = useState<MissionLivreur[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<Pagination<MissionLivreur>>("/livraisons?per_page=50", { token })
      .then((page) => {
        if (!annule) setLivraisons(page.data.filter((m) => m.statut_livraison === "livree"));
      })
      .catch(() => {
        if (!annule) setLivraisons([]);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-brand-blue shrink-0 rounded-b-[30px] px-4 pb-6 pt-6 text-white">
        <p className="text-lg font-extrabold">Preuve de livraison</p>
        <p className="mt-1 text-xs text-white/80">Historique des colis remis</p>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
        {livraisons === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : livraisons.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune livraison terminée pour l&apos;instant.</p>
        ) : (
          livraisons.map((livraison) => (
            <div key={livraison.id} className="flex items-center gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
                {livraison.preuve_livraison ? (
                  <Image src={livraison.preuve_livraison} alt="" fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-muted">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-brand-ink">{livraison.nom_produit ?? "Produit"}</p>
                <p className="mt-0.5 truncate text-xs text-brand-muted">{livraison.nom_client}</p>
                {livraison.date_livraison_effective ? (
                  <p className="mt-0.5 text-xs text-brand-muted">{formaterDateHeure(livraison.date_livraison_effective)}</p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
