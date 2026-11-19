// Numéros mobiles malgaches : 032 / 033 / 034 / 037 / 038 + 7 chiffres,
// saisis en 034 12 345 67, +261 34 12 345 67 ou 261341234567.

const MOBILE = /^(?:\+?261|0)(3[2-478])(\d{7})$/;

/** Renvoie le numéro au format 0341234567, ou null s'il n'est pas valide. */
export function normalizeMgPhone(input: string): string | null {
  const compact = input.replace(/[\s.\-()]/g, "");
  const m = MOBILE.exec(compact);
  return m ? `0${m[1]}${m[2]}` : null;
}

/** Opérateur mobile money correspondant au préfixe. */
export function operatorOf(phone: string): "MVOLA" | "ORANGE_MONEY" | "AIRTEL_MONEY" | null {
  const prefix = phone.slice(0, 3);
  if (prefix === "034" || prefix === "038") return "MVOLA";
  if (prefix === "032" || prefix === "037") return "ORANGE_MONEY";
  if (prefix === "033") return "AIRTEL_MONEY";
  return null;
}
