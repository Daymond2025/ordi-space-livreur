import type { ReactNode } from "react";
import { BottomNavBoutique } from "@/components/boutique/BottomNavBoutique";
import { SuperpositionBoutique } from "@/components/boutique/SuperpositionBoutique";

/**
 * Regroupe les 4 destinations de la barre "Boutique" (Accueil/Catégorie/
 * Ventes/Profil) — seules celles-ci affichent la nav + le panier/"Mode
 * client" flottants. Un détail produit (produits/[id]) sort de ce groupe
 * (pas de bottom nav sur un écran de détail, comme mission/[id] ailleurs).
 */
export default function BoutiqueTabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {children}
        <SuperpositionBoutique />
      </div>
      <BottomNavBoutique />
    </div>
  );
}
