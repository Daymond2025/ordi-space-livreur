"use client";

import { useState } from "react";
import { BicycleIcon, CarIcon, CheckIcon, CloseIcon, MotoIcon, TricycleIcon } from "@/components/icons";
import type { TypeVehiculeLivreur } from "@/lib/types";

const OPTIONS: { valeur: TypeVehiculeLivreur; label: string; icone: React.ReactNode }[] = [
  { valeur: "moto", label: "Moto", icone: <MotoIcon className="h-6 w-6" /> },
  { valeur: "voiture", label: "Voiture", icone: <CarIcon className="h-6 w-6" /> },
  { valeur: "tricycle", label: "Tricycle", icone: <TricycleIcon className="h-6 w-6" /> },
  { valeur: "velo", label: "Vélo", icone: <BicycleIcon className="h-6 w-6" /> },
];

type Props = {
  valeurActuelle: string | null;
  chargement: boolean;
  onValider: (valeur: TypeVehiculeLivreur) => void;
  onFermer: () => void;
};

/**
 * Feuille de sélection du type de véhicule (Livreur::type_vehicule) — aucun
 * mockup fourni pour cette fenêtre, gabarit maison cohérent avec le reste de
 * l'app (fond blanc arrondi, accent bleu de marque).
 */
export function SelecteurVehicule({ valeurActuelle, chargement, onValider, onFermer }: Props) {
  const [selection, setSelection] = useState<TypeVehiculeLivreur>((valeurActuelle as TypeVehiculeLivreur) ?? "moto");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div
        className="w-full max-w-xl rounded-t-[28px] bg-white px-5 pb-6 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-brand-line" />
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-extrabold text-brand-ink">Type de véhicule</p>
          <button type="button" onClick={onFermer} aria-label="Fermer" className="text-brand-muted">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {OPTIONS.map((option) => {
            const actif = selection === option.valeur;
            return (
              <button
                key={option.valeur}
                type="button"
                onClick={() => setSelection(option.valeur)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  actif ? "border-[color:var(--brand-blue-end)] bg-blue-50" : "border-brand-line bg-white"
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${actif ? "bg-white text-[color:var(--brand-blue-end)]" : "bg-[#f2f5fa] text-brand-muted"}`}>
                  {option.icone}
                </span>
                <span className="flex-1 text-sm font-bold capitalize text-brand-ink">{option.label}</span>
                {actif ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-blue-end)] text-white">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={chargement}
          onClick={() => onValider(selection)}
          className="bg-gradient-brand-blue mt-5 h-12 w-full rounded-full text-sm font-extrabold text-white transition-opacity disabled:opacity-60"
        >
          {chargement ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
