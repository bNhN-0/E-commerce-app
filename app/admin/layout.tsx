import AdminNavbar from "@/app/components/AdminNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      {/* Sidebar */}
      <AdminNavbar />

      {/* Main content */}
      <div className="flex-1 ml-60 min-h-screen bg-gray-50">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
