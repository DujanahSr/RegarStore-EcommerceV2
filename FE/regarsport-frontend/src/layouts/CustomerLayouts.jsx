import { Outlet } from "react-router-dom";

import Header from "../components/customer/Header";
import Footer from "../components/customer/Footer";

export default function CustomerLayouts() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F4] text-[#111613] font-sans-body">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}