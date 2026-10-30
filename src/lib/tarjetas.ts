/** Utilidades de tarjetas para la pasarela simulada (pago en línea real = Mercado Pago). */

export type MarcaTarjeta = "Visa" | "Mastercard" | "American Express" | "Tarjeta";

export function soloDigitos(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

/** Dígito de control de las tarjetas (algoritmo de Luhn). */
export function luhn(digitos: string): boolean {
  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let d = Number(digitos[digitos.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
  }
  return digitos.length > 0 && suma % 10 === 0;
}

export function marcaTarjeta(digitos: string): MarcaTarjeta {
  if (/^4/.test(digitos)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digitos)) return "Mastercard";
  if (/^3[47]/.test(digitos)) return "American Express";
  return "Tarjeta";
}

/** "MM/AA" vigente a la fecha `hoy`. */
export function vencimientoValido(v: unknown, hoy = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(String(v ?? "").trim());
  if (!m) return false;
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1);
}
