"use client";

import { useRef, useState } from "react";
import { CameraIcon, CheckCircleIcon, ChevronRightIcon } from "@/components/icons";

type Props = {
  label: string;
  sousLabel?: string;
  fichier: File | null;
  onChange: (fichier: File | null) => void;
  erreur?: string;
};

/**
 * Tuile de capture d'un document obligatoire à l'inscription (photo de
 * profil, permis, CNI, carte grise — voir RegisterRequest côté backend).
 * Même gabarit que le bouton photo de "Mon Profil" (EcranCompte.tsx). Aperçu
 * en data: URL (FileReader), pas un object URL "blob:" — la CSP de l'app
 * (voir next.config.ts) n'autorise que 'self'/data:/l'API en img-src.
 */
export function ChampDocument({ label, sousLabel, fichier, onChange, erreur }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [apercu, setApercu] = useState<string | null>(null);

  function onFichierChoisi(nouveauFichier: File | null) {
    onChange(nouveauFichier);

    if (!nouveauFichier) {
      setApercu(null);
      return;
    }

    const lecteur = new FileReader();
    lecteur.onload = () => setApercu(typeof lecteur.result === "string" ? lecteur.result : null);
    lecteur.readAsDataURL(nouveauFichier);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left ${
          erreur ? "border-rose-400" : "border-brand-line"
        }`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5F7FA] text-brand-muted">
          {apercu ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local (object URL), jamais une image distante
            <img src={apercu} alt="" className="h-full w-full object-cover" />
          ) : (
            <CameraIcon className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-ink">{label}</p>
          <p className="truncate text-xs text-brand-muted">{fichier ? fichier.name : sousLabel ?? "Prendre une photo"}</p>
        </div>
        {fichier ? (
          <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFichierChoisi(e.target.files?.[0] ?? null)}
      />
      {erreur ? <p className="mt-1.5 text-xs text-rose-500">{erreur}</p> : null}
    </div>
  );
}
