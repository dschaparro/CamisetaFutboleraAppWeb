"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [role, setRole] = useState<"Administrador" | "Vendedor">("Administrador");
  const router = useRouter();

  return (
    <div className="login-shell">
      <div className="login-visual">
        <div className="mark-lg">CF</div>
        <h2>Panel administrativo Camiseta Futbolera</h2>
        <p>Gestiona catálogo, inventario, compras a proveedores, pedidos y reportes desde un solo lugar.</p>
        <div className="login-feat">
          <div>Control de inventario y compras bajo pedido</div>
          <div>Trazabilidad de ventas, envíos y margen real</div>
          <div>Roles diferenciados: Administrador y Vendedor</div>
        </div>
      </div>
      <div className="login-form-wrap">
        <div className="login-form">
          <div className="eyebrow">Acceso restringido</div>
          <h1>Ingresa a tu panel</h1>
          <div className="role-toggle">
            <button className={role === "Administrador" ? "active" : ""} onClick={() => setRole("Administrador")}>
              Administrador
            </button>
            <button className={role === "Vendedor" ? "active" : ""} onClick={() => setRole("Vendedor")}>
              Vendedor
            </button>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Correo electrónico</label>
            <input defaultValue="stiven@camisetafutbolera.com" />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Contraseña</label>
            <input type="password" defaultValue="********" />
          </div>
          <div style={{ textAlign: "right", marginBottom: 18 }}>
            <a href="#" style={{ fontSize: ".78rem", color: "var(--blue)" }}>¿Olvidaste tu contraseña?</a>
          </div>
          <button className="btn btn-gold btn-block" style={{ padding: 13 }} onClick={() => router.push("/panel/dashboard")}>
            Iniciar sesión ({role})
          </button>
          <p className="login-note">
            Este panel es de uso interno. Cada acción queda registrada para trazabilidad (RN-08).
            <br />
            <em>Nota: este botón todavía no valida contra Supabase Auth — ver src/lib/supabaseClient.ts.</em>
          </p>
        </div>
      </div>
    </div>
  );
}
