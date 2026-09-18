import type { ReactNode } from "react";
import { RouteGuard } from "@/components/RouteGuard";

/**
 * Écran détail mission — hors du groupe (shell) volontairement (pas de
 * bottom nav sur un écran de détail plein écran), même habillage "carte
 * centrée" que (shell)/layout.tsx pour rester cohérent en desktop.
 */
export default function MissionLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-[#f2f5fa] md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-hidden md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
        {/* flex + flex-1 (pas juste flex-1) : un enfant qui utilise h-full
            (pourcentage) ne peut pas se fier à une hauteur seulement issue de
            flex-grow (sa "height" CSS reste "auto") — voir EcranMissionDetail
            & consorts, qui utilisent flex-1 plutôt que h-full pour cette
            raison. Nécessaire pour la section flex-1 (carte décorative)
            d'EcranItineraireRecuperation. */}
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </RouteGuard>
  );
}
