import { CartProvider } from "@/context/CartContext";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ChatWidget from "@/components/store/ChatWidget";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      {children}
      <Footer />
      <ChatWidget />
    </CartProvider>
  );
}
