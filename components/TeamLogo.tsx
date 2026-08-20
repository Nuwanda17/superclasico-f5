"use client";

import Image from "next/image";
import { useState } from "react";

interface TeamLogoProps {
  team: "cerro" | "olimpia";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = { sm: "h-9 w-9", md: "h-14 w-14", lg: "h-24 w-24", xl: "h-24 w-24 sm:h-40 sm:w-40" };

export function TeamLogo({ team, size = "md", className = "" }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const isCerro = team === "cerro";
  const src = isCerro ? "/logos/cerro-porteno.png" : "/logos/olimpia.png";
  const label = isCerro ? "Cerro Porteño" : "Olimpia";
  return (
    <div className={`relative shrink-0 ${SIZE_CLASSES[size]} ${className}`}>
      {!failed ? (
        <Image src={src} alt={`Logo de ${label}`} fill sizes={size === "xl" ? "160px" : size === "lg" ? "96px" : "56px"} className="object-contain" onError={() => setFailed(true)} priority={size === "xl"} />
      ) : (
        <div role="img" aria-label={`Identificador de ${label}`} className={`grid h-full w-full place-items-center rounded-full border-[3px] font-display text-2xl shadow-lg ${isCerro ? "border-[#ef3340] bg-[#123f91] text-white" : "border-white bg-[#11141a] text-white"}`}>
          {isCerro ? "C" : "O"}
        </div>
      )}
    </div>
  );
}
