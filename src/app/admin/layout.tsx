import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Website Management',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0a1628] text-white border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c9a96e] rounded flex items-center justify-center text-[#0a1628] font-bold text-sm">
              B
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Boatwork Admin</h1>
              <p className="text-xs text-gray-400">Template Management</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/admin/website-management" className="text-[#c9a96e] hover:text-white transition-colors">
              Website Management
            </a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
