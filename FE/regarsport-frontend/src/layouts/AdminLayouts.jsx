import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Navbar from "../components/admin/Navbar";

export default function AdminLayouts() {
  return (
    <div className="flex min-h-screen bg-[#FAF8F4] text-[#111613] font-sans-body">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto bg-[#FAF8F4]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}