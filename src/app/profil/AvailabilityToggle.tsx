"use client";

import { useState, useTransition } from "react";
import { setAvailability } from "@/app/actions/profile";
import type { Availability } from "@/lib/types";

export default function AvailabilityToggle({ current }: { current: Availability }) {
  const [value, setValue] = useState(current);
  const [pending, start] = useTransition();
  const employed = value === "employed";

  function flip() {
    const next: Availability = employed ? "available" : "employed";
    setValue(next);
    start(() => setAvailability(next));
  }

  return (
    <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="flex items-center gap-2 font-bold">
          <span aria-hidden="true" className={`size-2.5 rounded-full ${employed ? "bg-employed" : "bg-available"}`} />
          {employed ? "En poste" : "Disponible"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {employed
            ? "Votre portrait est grisé : les recruteurs ne peuvent plus vous contacter en premier."
            : "Les recruteurs peuvent vous contacter."}
        </p>
      </div>
      <button type="button" role="switch" aria-checked={!employed} onClick={flip} disabled={pending} className={employed ? "btn-primary" : "btn-outline"}>
        {employed ? "Je suis à nouveau disponible" : "J'ai trouvé un poste"}
      </button>
    </div>
  );
}
