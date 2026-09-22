"use client";

import { useState } from "react";

const CHAT_REPLIES = [
  "Esta referencia tiene un corte ajustado (fit jugador). Si en otras marcas usas M, te recomiendo pedir talla L para que quede más cómoda. ¿Quieres que te muestre la guía de tallas completa?",
  "El estampado del dorsal se aplica antes del envío y no tiene costo adicional — solo escribe el nombre y número que quieres en el campo de personalización.",
  "El parche de liga (por ejemplo LaLiga o Champions League) se puede agregar junto con el dorsal, sin costo extra sobre el precio mostrado.",
  "Todas nuestras camisetas se consiguen bajo pedido con el proveedor, por eso la entrega estimada es de 1 a 2 días hábiles en Bogotá.",
];

type Msg = { from: "bot" | "user"; text: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "¡Hola! Soy el asistente de Camiseta Futbolera. ¿En qué te puedo ayudar con esta camiseta?" },
  ]);
  const [text, setText] = useState("");

  const send = () => {
    const value = text.trim();
    if (!value) return;
    setMessages((m) => [...m, { from: "user", text: value }]);
    setText("");
    setTimeout(() => {
      const reply = CHAT_REPLIES[Math.floor(Math.random() * CHAT_REPLIES.length)];
      setMessages((m) => [...m, { from: "bot", text: reply }]);
    }, 650);
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)}>
        💬 Asistente IA
      </button>
      <div className={`chat-panel${open ? " open" : ""}`}>
        <div className="chat-head">
          <span className="dot" />
          <div>
            <b>Asistente Camiseta Futbolera</b>
            <span>En línea · impulsado por IA (API de Claude)</span>
          </div>
        </div>
        <div className="chat-body">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.from}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            placeholder="Escribe tu pregunta..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send}>➤</button>
        </div>
      </div>
    </>
  );
}
