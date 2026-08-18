import { getRestaurantData } from '@/lib/data';
import Dashboard from '@/components/Dashboard';

export const metadata = {
  title: 'Restaurant Location Intelligence | Cognifyz',
  description: 'Location-based Analysis of Restaurants for Cognifyz internship.',
}

export default async function Home() {
  const data = await getRestaurantData();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Restaurant Location Intelligence
            </h1>
            <p className="text-sm text-slate-500 font-medium">Location-based Analysis of Restaurants</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Dataset Analysis
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard initialData={data} />
      </div>
    </main>
  );
}
