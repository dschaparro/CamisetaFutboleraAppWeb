import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ChatWidget from "@/components/store/ChatWidget";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>
        <div className="store-shell">
          <Header />
          <main id="contenido-principal" className="store-main">
            {children}
          </main>
          <Footer />
        </div>
        <ChatWidget />
      </CartProvider>
    </ToastProvider>
  );
}
