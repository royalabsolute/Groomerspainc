import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Villa María & Finca María | Portal de Reservas Premium",
  description: "Reserva tu estancia de lujo en Hostal Villa María o Finca María. Disfruta de la mejor hospitalidad con atención premium y comodidades exclusivas.",
};

export default function HospitalityLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
