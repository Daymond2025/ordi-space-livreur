"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UserIcon, WalletIcon } from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

const ONGLETS = [
  { href: "/", label: "Space", icone: HomeIcon },
  { href: "/paiements", label: "Payement", icone: WalletIcon },
  { href: "/compte", label: "Compte", icone: UserIcon },
] as const;

function Onglet({
  href,
  label,
  icone: Icone,
  actif,
}: {
  href: string;
  label: string;
  icone: ComponentType<SVGProps<SVGSVGElement>>;
  actif: boolean;
}) {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center gap-1 py-2">
      <Icone className={`h-5 w-5 ${actif ? "text-[color:var(--brand-blue-end)]" : "text-brand-muted"}`} />
      <span className={`text-center text-[10px] font-medium leading-tight ${actif ? "text-[color:var(--brand-blue-end)]" : "text-brand-muted"}`}>
        {label}
      </span>
    </Link>
  );
}

/**
 * Bottom bar de l'app Livreur — 3 onglets (Space / Payement / Compte) d'après
 * le mockup de l'écran d'accueil. Itinéraire et Preuve livraison ne sont plus
 * des destinations dédiées : l'itinéraire est accessible depuis la carte
 * mission (Space) et le détail de mission, la preuve se prend au moment de
 * "Marquer comme livrée" — les routes /itineraire et /preuves restent en
 * place (non retirées) au cas où un futur mockup les réintroduirait.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 flex items-center border-t border-brand-line bg-white px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1">
      {ONGLETS.map((onglet) => (
        <Onglet key={onglet.href} {...onglet} actif={pathname === onglet.href} />
      ))}
    </nav>
  );
}
