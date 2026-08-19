import { getRestaurantData } from '@/lib/data';
import Dashboard from '@/components/Dashboard';
import { Database, Activity, Map, LayoutDashboard, PieChart, UtensilsCrossed } from 'lucide-react';

export const metadata = {
  title: 'Location Intelligence | Cognifyz Analytics',
  description: 'Premium Location-based Analysis of Restaurants for Cognifyz.',
}

export default async function Home() {
  const data = await getRestaurantData();

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">Cognifyz Analytics</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#overview" className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4"/> Overview</a>
            <a href="#map" className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><Map className="w-4 h-4"/> Map</a>
            <a href="#analytics" className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><PieChart className="w-4 h-4"/> Analytics</a>
            <a href="#restaurants" className="hover:text-blue-600 transition-colors flex items-center gap-1.5"><UtensilsCrossed className="w-4 h-4"/> Restaurants</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-slate-950 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-indigo-900/40" />
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 blur-3xl">
            <div className="aspect-square h-[600px] rounded-full bg-gradient-to-tr from-blue-600 to-purple-600" />
          </div>
        </div>
        
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-6">
            <Database className="w-3.5 h-3.5" />
            Cognifyz • Data Analytics
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
            Restaurant Location <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Intelligence</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed">
            Explore restaurant distribution, ratings, cuisines, and pricing across cities and localities in a premium analytics experience.
          </p>
          
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-2xl">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-slate-200 font-medium">{data.length.toLocaleString()} restaurants analyzed</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 -mt-16 relative z-10">
        <Dashboard initialData={data} />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start mb-6 md:mb-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Restaurant Location Intelligence</h3>
                <p className="text-sm text-slate-500 mt-1">Location-based Analysis • Cognifyz Internship Project</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2 text-sm text-slate-500">
              <p>Dataset: {data.length.toLocaleString()} Records</p>
              <p>Built with Next.js, Tailwind CSS & Recharts</p>
              <p>&copy; {new Date().getFullYear()} Cognifyz Analytics. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
