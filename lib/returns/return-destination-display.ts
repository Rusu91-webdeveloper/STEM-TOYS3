import { COMPANY_LEGAL } from "@/lib/config/company-legal";

export interface ReturnDestination {
  target: "COMPANY" | "SUPPLIER" | "NONE";
  recipient: string;
  address: string;
  authorizationNumber?: string;
  arriveBy?: string;
}

export const COMPANY_RETURN_DESTINATION: ReturnDestination = {
  target: "COMPANY",
  recipient: `TechTots — ${COMPANY_LEGAL.name}`,
  address: COMPANY_LEGAL.address,
};

export function destinationInstruction(destination: ReturnDestination): string {
  if (destination.target === "NONE") return "Produs digital: nu expedia nimic.";
  const expiry = destination.arriveBy
    ? ` Coletul trebuie să ajungă până la ${new Date(destination.arriveBy).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}. Dacă nu mai poate ajunge la timp, contactează TechTots înainte de expediere; preluăm returul la adresa companiei.`
    : "";
  const authorization = destination.authorizationNumber
    ? ` Referință furnizor: ${destination.authorizationNumber}.`
    : "";
  return `Destinație: ${destination.recipient}, ${destination.address}.${authorization}${expiry}`;
}
