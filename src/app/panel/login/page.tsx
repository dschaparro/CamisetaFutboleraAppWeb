"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setError(data.error?.message ?? "No se pudo iniciar sesión");
        return;
      }
      router.push("/panel/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-visual">
        <div className="mark-lg">CF</div>
        <h2>Panel administrativo Camiseta Futbolera</h2>
        <p>Gestiona catálogo, inventario, compras a proveedores, pedidos y reportes desde un solo lugar.</p>
        <div className="login-feat">
          <div>Control de inventario y compras bajo pedido</div>
          <div>Trazabilidad de ventas, envíos y margen real</div>
          <div>Roles con permisos propios: Administrador, Vendedor, Bodega y Marketing</div>
        </div>
      </div>
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={onSubmit}>
          <div className="eyebrow">Acceso restringido</div>
          <h1>Ingresa a tu panel</h1>
          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-gold btn-block" style={{ padding: 13, marginTop: 12 }} disabled={pending}>
            {pending ? "Verificando…" : "Iniciar sesión"}
          </button>
          <p className="login-note">
            Este panel es de uso interno. Cada persona ve solo los módulos de su rol, que define el
            Administrador en «Usuarios y roles».
          </p>
        </form>
      </div>
    </div>
  );
}
