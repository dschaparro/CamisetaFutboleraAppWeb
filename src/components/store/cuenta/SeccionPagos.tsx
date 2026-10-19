"use client";

import { useState, type FormEvent } from "react";
import s from "@/components/store/cuenta.module.css";
import { Aviso, Campo, llamar, type Campos } from "@/components/store/cuenta/comun";
import { MAX_TARJETAS, type PerfilCliente, type TarjetaGuardada } from "@/modules/identidad/domain/perfil-tipos";

const VACIO = { numero: "", vencimiento: "", titular: "" };

function formatoNumero(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function formatoVence(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

const ICONO: Record<TarjetaGuardada["marca"], string> = { Visa: "VISA", Mastercard: "MC", "American Express": "AMEX", Tarjeta: "💳" };

export default function SeccionPagos({ tarjetas, nombreCliente, onPerfil }: { tarjetas: TarjetaGuardada[]; nombreCliente: string; onPerfil: (p: PerfilCliente) => void }) {
  const [agregando, setAgregando] = useState(false);
  const [form, setForm] = useState({ ...VACIO, titular: nombreCliente.toUpperCase() });
  const [campos, setCampos] = useState<Campos>({});
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [borrar, setBorrar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function ejecutar(url: string, method: "POST" | "PATCH" | "DELETE", body: unknown, exito: string) {
    setOcupado(true);
    const r = await llamar<{ perfil: PerfilCliente }>(url, method, body);
    setOcupado(false);
    if (!r.ok) {
      setCampos(r.campos);
      if (Object.keys(r.campos).length === 0) setAviso({ ok: false, texto: r.mensaje });
      return false;
    }
    onPerfil(r.datos.perfil);
    setAviso({ ok: true, texto: exito });
    return true;
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (await ejecutar("/api/cuenta/tarjetas", "POST", form, "Tarjeta guardada.")) {
      setAgregando(false);
      setForm({ ...VACIO, titular: nombreCliente.toUpperCase() });
      setCampos({});
    }
  }

  return (
    <div className={s.seccion}>
      <div className={s.seccionCabecera}>
        <h2 className={s.seccionTitulo}>Formas de pago</h2>
        {!agregando && tarjetas.length < MAX_TARJETAS && (
          <button className="btn btn-gold btn-sm" onClick={() => { setAgregando(true); setAviso(null); }}>
            + Agregar tarjeta
          </button>
        )}
      </div>
      <p className={s.meta}>
        🧪 Modo prueba. Guardamos solo la marca y los últimos 4 dígitos: nunca el número completo ni el CVC. Al pagar con
        una tarjeta guardada solo te pedimos el CVC.
      </p>
      <Aviso aviso={aviso} />

      {agregando && (
        <form className={`card ${s.panelForm}`} onSubmit={guardar} noValidate>
          <h3 className={s.subtitulo}>Nueva tarjeta</h3>
          <div className={s.formGrid}>
            <Campo id="tj-num" label="Número de tarjeta" value={form.numero} error={campos.numero} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" onChange={(e) => setForm({ ...form, numero: formatoNumero(e.target.value) })} ancho />
            <Campo id="tj-vence" label="Vence (MM/AA)" value={form.vencimiento} error={campos.vencimiento} inputMode="numeric" autoComplete="cc-exp" placeholder="12/28" onChange={(e) => setForm({ ...form, vencimiento: formatoVence(e.target.value) })} />
            <Campo id="tj-tit" label="Nombre en la tarjeta" value={form.titular} error={campos.titular} autoComplete="cc-name" onChange={(e) => setForm({ ...form, titular: e.target.value })} />
          </div>
          <p className={s.meta}>Para probar: 5555 5555 5555 4444 (Mastercard) o 4242 4242 4242 4242 (Visa).</p>
          <div className={s.botones}>
            <button className="btn btn-gold" disabled={ocupado}>
              {ocupado ? "Guardando…" : "Guardar tarjeta"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setAgregando(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {tarjetas.length === 0 && !agregando ? (
        <div className={`card ${s.vacio}`}>
          <b>No tienes tarjetas guardadas</b>
          También puedes pagar con PSE, Nequi o contra entrega.
        </div>
      ) : (
        <div className={s.tarjetasGrid}>
          {tarjetas.map((t) => (
            <div key={t.id} className={`card ${s.item} ${t.predeterminada ? s.itemPrincipal : ""}`}>
              <div className={s.itemCabecera}>
                <span className={s.marca}>{ICONO[t.marca]}</span>
                <b>•••• {t.ultimos4}</b>
                {t.predeterminada && <span className="pill pill-ok">Principal</span>}
              </div>
              <p className={s.meta}>
                {t.marca} · vence {t.vencimiento}
                <br />
                {t.titular}
              </p>
              {borrar === t.id ? (
                <div className={s.botones}>
                  <span className={s.meta}>¿Eliminar esta tarjeta?</span>
                  <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} disabled={ocupado} onClick={async () => { await ejecutar(`/api/cuenta/tarjetas/${encodeURIComponent(t.id)}`, "DELETE", undefined, "Tarjeta eliminada."); setBorrar(null); }}>
                    Sí, eliminar
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setBorrar(null)}>
                    No
                  </button>
                </div>
              ) : (
                <div className={s.botones}>
                  {!t.predeterminada && (
                    <button className="btn btn-ghost btn-sm" disabled={ocupado} onClick={() => ejecutar(`/api/cuenta/tarjetas/${encodeURIComponent(t.id)}`, "PATCH", undefined, `La tarjeta •••• ${t.ultimos4} es ahora la principal.`)}>
                      Usar como principal
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setBorrar(t.id)}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
