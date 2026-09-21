"use client";

import { CartIcon } from "@/components/icons";

/**
 * Panier flottant + bascule "Mode client" — persistants au-dessus du contenu
 * scrollable, ancrés juste au-dessus de la barre de navigation (voir
 * mockup). Vivent dans le layout (pas dans chaque écran) pour rester
 * visibles quel que soit le défilement, sur toutes les pages de la Boutique.
 */
export function SuperpositionBoutique() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
      <div className="relative px-4 pb-3">
        <button
          type="button"
          className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[10px] font-bold text-white"
        >
          Mode client
        </button>

        <button
          type="button"
          aria-label="Panier"
          className="pointer-events-auto absolute bottom-2 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40"
        >
          <CartIcon className="h-6 w-6" />
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white ring-2 ring-white">
            3
          </span>
        </button>
      </div>
    </div>
  );
}
