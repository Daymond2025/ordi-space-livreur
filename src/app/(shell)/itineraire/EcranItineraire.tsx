"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { MissionLivreur, Pagination } from "@/lib/types";
import { MapIcon, PinIcon } from "@/components/icons";

/**
 * Itinéraire point-à-point vers le client de la mission active — pas de
 * tracking GPS live, pas d'itinéraire fournisseur pour cette passe (décision
 * prise avant le début du développement : voir le lien_maps sur Adresse,
 * en attente que l'app Fournisseur permette de renseigner le sien).
 */
export function EcranItineraire() {
  const { token } = useAuth();
  const [missionActive, setMissionActive] = useState<MissionLivreur | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<Pagination<MissionLivreur>>("/livraisons?per_page=50", { token })
      .then((page) => {
        if (annule) return;
        setMissionActive(page.data.find((m) => m.statut_livraison === "en_cours") ?? null);
      })
      .catch(() => {
        if (!annule) setMissionActive(null);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-brand-blue shrink-0 rounded-b-[30px] px-4 pb-6 pt-6 text-white">
        <p className="text-lg font-extrabold">Itinéraire</p>
        <p className="mt-1 text-xs text-white/80">Vers le client de ta mission en cours</p>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6 pt-4">
        {missionActive === undefined ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : missionActive === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune mission en cours pour l&apos;instant.</p>
        ) : (
          <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Destination</p>
            <p className="mt-1.5 text-sm font-bold text-brand-ink">{missionActive.nom_client}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
              <PinIcon className="h-3 w-3 shrink-0" /> {missionActive.zone_destination ?? "—"}
            </p>

            {missionActive.lien_maps_destination ? (
              <a
                href={missionActive.lien_maps_destination}
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-brand-blue mt-4 flex h-12 items-center justify-center gap-2 rounded-[14px] text-sm font-bold text-white"
              >
                <MapIcon className="h-4 w-4" />
                Ouvrir l&apos;itinéraire
              </a>
            ) : (
              <p className="mt-4 text-center text-xs text-brand-muted">Aucun lien d&apos;itinéraire renseigné pour cette adresse.</p>
            )}

            <Link href={`/mission/${missionActive.id}`} className="mt-3 block text-center text-xs font-semibold text-[color:var(--brand-blue-end)]">
              Voir la mission →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
