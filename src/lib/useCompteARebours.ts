"use client";

import { useEffect, useState } from "react";

/**
 * Compte à rebours live (mis à jour chaque seconde) jusqu'à `dateLimiteIso`
 * — copié de Cordinateur_App_Web. Retourne les composantes brutes plutôt
 * qu'une chaîne déjà formatée : chaque écran a son propre format d'affichage
 * (ex. "Xh:MMm:SSs" sur Space, "00:15:09" sur Mes paiements).
 */
export function useCompteARebours(dateLimiteIso: string | null): { h: number; m: number; s: number; expire: boolean } | null {
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    if (!dateLimiteIso) return;
    const id = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(id);
  }, [dateLimiteIso]);

  if (!dateLimiteIso) return null;
  const limite = new Date(dateLimiteIso.replace(" ", "T")).getTime();
  const diff = limite - maintenant;
  if (diff <= 0) return { h: 0, m: 0, s: 0, expire: true };

  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
    expire: false,
  };
}
