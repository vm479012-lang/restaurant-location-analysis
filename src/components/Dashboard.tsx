'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Restaurant } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { 
  Utensils, MapPin, Star, DollarSign, Search, RotateCcw, 
  Building2, Trophy, Navigation, Lightbulb, Map as MapIcon,
  ChevronLeft, ChevronRight, BarChart3, TrendingUp
} from 'lucide-react';

const Map = dynamic(() => import('./Map'), { ssr: false });

interface DashboardProps {
  initialData: Restaurant[];
}

export default function Dashboard({ initialData }: DashboardProps) {
  // State for filters
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [localityFilter, setLocalityFilter] = useState<string>('All');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [priceRangeFilter, setPriceRangeFilter] = useState<number>(0);
  const [cuisineFilter, setCuisineFilter] = useState<string>('All');
  const [nameFilter, setNameFilter] = useState<string>('');
  
  const [page, setPage] = useState(1);
  const limit = 20;

  // Memoized unique filter options
  const { cities, localities, cuisines } = useMemo(() => {
    const citySet = new Set<string>();
    const locSet = new Set<string>();
    const cuisineSet = new Set<string>();
    
    initialData.forEach(r => {
      if (r.City) citySet.add(r.City);
      if (r.Locality) locSet.add(r.Locality);
      if (r.Cuisines) {
        r.Cuisines.split(',').forEach(c => cuisineSet.add(c.trim()));
      }
    });
    
    return {
      cities: Array.from(citySet).sort(),
      localities: Array.from(locSet).sort(),
      cuisines: Array.from(cuisineSet).sort(),
    };
  }, [initialData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return initialData.filter(r => {
      const matchCity = cityFilter === 'All' || r.City === cityFilter;
      const matchLocality = localityFilter === 'All' || r.Locality === localityFilter;
      const matchRating = r["Aggregate rating"] >= minRatingFilter;
      const matchPrice = priceRangeFilter === 0 || r["Price range"] === priceRangeFilter;
      const matchCuisine = cuisineFilter === 'All' || (r.Cuisines && r.Cuisines.includes(cuisineFilter));
      const matchName = !nameFilter || r["Restaurant Name"].toLowerCase().includes(nameFilter.toLowerCase());
      
      return matchCity && matchLocality && matchRating && matchPrice && matchCuisine && matchName;
    });
  }, [initialData, cityFilter, localityFilter, minRatingFilter, priceRangeFilter, cuisineFilter, nameFilter]);

  // Derived Metrics for KPIs
  const metrics = useMemo(() => {
    const total = filteredData.length;
    const uniqueCities = new Set(filteredData.map(r => r.City)).size;
    const avgRating = total > 0 ? filteredData.reduce((acc, r) => acc + r["Aggregate rating"], 0) / total : 0;
    
    // Most common cuisine
    const cuisineCounts: Record<string, number> = {};
    filteredData.forEach(r => {
      if (r.Cuisines) {
        r.Cuisines.split(',').forEach(c => {
          const cuisine = c.trim();
          cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
        });
      }
    });
    let topCuisine = 'None';
    let maxCuisineCount = 0;
    Object.entries(cuisineCounts).forEach(([cuisine, count]) => {
      if (count > maxCuisineCount) {
        maxCuisineCount = count;
        topCuisine = cuisine;
      }
    });

    const avgCost = total > 0 ? filteredData.reduce((acc, r) => acc + r["Average Cost for two"], 0) / total : 0;

    return { total, uniqueCities, avgRating: avgRating.toFixed(2), topCuisine, avgCost: avgCost.toFixed(0) };
  }, [filteredData]);

  // Chart Data Preparation
  const chartsData = useMemo(() => {
    const cityCounts: Record<string, number> = {};
    const cityRatings: Record<string, { total: number, count: number }> = {};
    const priceCounts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
    const cuisineDistribution: Record<string, number> = {};
    
    filteredData.forEach(r => {
      cityCounts[r.City] = (cityCounts[r.City] || 0) + 1;
      
      if (!cityRatings[r.City]) cityRatings[r.City] = { total: 0, count: 0 };
      cityRatings[r.City].total += r["Aggregate rating"];
      cityRatings[r.City].count += 1;

      if (r["Price range"]) priceCounts[r["Price range"].toString()] = (priceCounts[r["Price range"].toString()] || 0) + 1;

      if (r.Cuisines) {
        r.Cuisines.split(',').slice(0,1).forEach(c => {
          const cuisine = c.trim();
          cuisineDistribution[cuisine] = (cuisineDistribution[cuisine] || 0) + 1;
        });
      }
    });

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, count]) => ({ name, count }));

    const topCitiesRating = Object.entries(cityRatings)
      .filter(([name]) => cityCounts[name] > 5) 
      .map(([name, data]) => ({ name, rating: Number((data.total / data.count).toFixed(2)) }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 7);

    const priceRangeData = Object.entries(priceCounts).map(([range, count]) => ({
      name: `Tier ${range}`,
      count
    })).filter(d => d.count > 0);

    const topCuisinesChart = Object.entries(cuisineDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return { topCities, topCitiesRating, priceRangeData, topCuisinesChart };
  }, [filteredData]);

  const resetFilters = () => {
    setCityFilter('All');
    setLocalityFilter('All');
    setMinRatingFilter(0);
    setPriceRangeFilter(0);
    setCuisineFilter('All');
    setNameFilter('');
    setPage(1);
  };

  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredData.length / limit);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* OVERVIEW SECTION */}
      <section id="overview" className="space-y-6 scroll-mt-24">
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          <Card className="group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+Total</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{metrics.total.toLocaleString()}</h3>
              <p className="text-sm font-medium text-slate-500">Restaurants analyzed</p>
            </CardContent>
          </Card>
          
          <Card className="group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{metrics.uniqueCities.toLocaleString()}</h3>
              <p className="text-sm font-medium text-slate-500">Unique cities</p>
            </CardContent>
          </Card>
          
          <Card className="group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{metrics.avgRating}</h3>
              <p className="text-sm font-medium text-slate-500">Average rating</p>
            </CardContent>
          </Card>
          
          <Card className="group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1 truncate" title={metrics.topCuisine}>{metrics.topCuisine}</h3>
              <p className="text-sm font-medium text-slate-500">Most common cuisine</p>
            </CardContent>
          </Card>
          
          <Card className="group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{metrics.avgCost}</h3>
              <p className="text-sm font-medium text-slate-500">Average cost for two</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="bg-slate-50/50 border-slate-200/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Explore Data
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Showing <span className="text-slate-900 font-bold">{filteredData.length.toLocaleString()}</span> of {initialData.length.toLocaleString()} restaurants
                </p>
              </div>
              <button 
                onClick={resetFilters}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-slate-600 rounded-lg transition-all font-medium shadow-sm active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> Reset Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Restaurant Name</label>
                <input 
                  type="text" 
                  value={nameFilter}
                  onChange={(e) => {setNameFilter(e.target.value); setPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400"
                  placeholder="Search name..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">City</label>
                <select 
                  value={cityFilter}
                  onChange={(e) => {setCityFilter(e.target.value); setLocalityFilter('All'); setPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                >
                  <option value="All">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Locality</label>
                <select 
                  value={localityFilter}
                  onChange={(e) => {setLocalityFilter(e.target.value); setPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  disabled={cityFilter === 'All' && localities.length > 500}
                >
                  <option value="All">All Localities</option>
                  {localities.filter(l => cityFilter === 'All' || initialData.find(r => r.Locality === l && r.City === cityFilter)).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cuisine</label>
                <select 
                  value={cuisineFilter}
                  onChange={(e) => {setCuisineFilter(e.target.value); setPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                >
                  <option value="All">All Cuisines</option>
                  {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Min Rating</label>
                <select 
                  value={minRatingFilter}
                  onChange={(e) => {setMinRatingFilter(Number(e.target.value)); setPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3.0 & Above</option>
                  <option value={4}>4.0 & Above</option>
                  <option value={4.5}>4.5 & Above</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Price Tier</label>
                <select 
                  value={priceRangeFilter}
                  onChange={(e) => {setPriceRangeFilter(Number(e.target.value)); setPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                >
                  <option value={0}>Any Price</option>
                  <option value={1}>Tier 1 (Budget)</option>
                  <option value={2}>Tier 2 (Mid)</option>
                  <option value={3}>Tier 3 (Premium)</option>
                  <option value={4}>Tier 4 (Luxury)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* MAP SECTION */}
      <section id="map" className="scroll-mt-24">
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-blue-600" />
                Geographical Distribution
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">Explore the geographical concentration of restaurants</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              {filteredData.length.toLocaleString()} locations
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Map restaurants={filteredData} />
          </CardContent>
        </Card>
      </section>

      {/* ANALYTICS SECTION */}
      <section id="analytics" className="scroll-mt-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Location & Market Analytics</h2>
          <p className="text-slate-500">Understand restaurant concentration and market patterns.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                Top Cities by Volume
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.topCities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                Highest Rated Cities (Min. 5 locations)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartsData.topCitiesRating} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-4 h-4 text-slate-400" />
                Price Tier Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex justify-center items-center">
              {chartsData.priceRangeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartsData.priceRangeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartsData.priceRangeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-sm">No pricing data available in this view</div>
              )}
            </CardContent>
          </Card>
          
          {/* INSIGHTS SUB-SECTION */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Key Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex gap-4 items-start border border-white/5">
                  <div className="bg-blue-500/20 p-2 rounded-lg mt-0.5">
                    <Building2 className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-100 mb-1">Highest Concentration</h4>
                    <p className="text-sm text-slate-300">
                      <strong className="text-white font-semibold">{chartsData.topCities[0]?.name || 'N/A'}</strong> leads the market with {chartsData.topCities[0]?.count ? ((chartsData.topCities[0].count / metrics.total) * 100).toFixed(1) : 0}% of all mapped restaurants.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex gap-4 items-start border border-white/5">
                  <div className="bg-emerald-500/20 p-2 rounded-lg mt-0.5">
                    <Trophy className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-emerald-100 mb-1">Quality Leader</h4>
                    <p className="text-sm text-slate-300">
                      <strong className="text-white font-semibold">{chartsData.topCitiesRating[0]?.name || 'N/A'}</strong> achieves the highest average customer satisfaction rating ({chartsData.topCitiesRating[0]?.rating || 0}/5).
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex gap-4 items-start border border-white/5">
                  <div className="bg-purple-500/20 p-2 rounded-lg mt-0.5">
                    <Utensils className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-purple-100 mb-1">Cuisine Dominance</h4>
                    <p className="text-sm text-slate-300">
                      The most common culinary offering is <strong className="text-white font-semibold">{metrics.topCuisine}</strong>, shaping the local dining landscape.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TABLE SECTION */}
      <section id="restaurants" className="scroll-mt-24">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
            <div>
              <CardTitle>Restaurant Database</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Detailed view of {filteredData.length.toLocaleString()} records</p>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500">Page {page} of {totalPages}</span>
                <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white border-r border-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700" />
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-white border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Restaurant</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Cuisines</th>
                    <th className="px-6 py-4 font-semibold">Rating</th>
                    <th className="px-6 py-4 font-semibold">Cost (Two)</th>
                    <th className="px-6 py-4 font-semibold text-right">Votes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="w-8 h-8 text-slate-300 mb-3" />
                          <p className="text-base font-medium text-slate-700">No restaurants found</p>
                          <p className="text-sm">Try adjusting your filters to see more results.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((r) => (
                      <tr key={r["Restaurant ID"]} className="bg-white hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{r["Restaurant Name"]}</div>
                          <div className="text-xs text-slate-500 mt-0.5">ID: {r["Restaurant ID"]}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900">{r.City}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[150px]" title={r.Locality}>{r.Locality}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="truncate max-w-[200px] text-slate-600" title={r.Cuisines}>{r.Cuisines}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span 
                              className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold min-w-[2.5rem]" 
                              style={{
                                backgroundColor: r["Rating color"] === 'White' || r["Rating color"] === 'Not rated' ? '#f1f5f9' : `${r["Rating color"]}20`, 
                                color: r["Rating color"] === 'White' || r["Rating color"] === 'Not rated' ? '#64748b' : r["Rating color"]
                              }}
                            >
                              {r["Aggregate rating"]}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400">{r["Rating text"]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-medium">{r.Currency} {r["Average Cost for two"]}</div>
                          <div className="text-xs text-emerald-600 font-semibold tracking-widest">{'$'.repeat(r["Price range"])}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                            {r.Votes.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Mobile-friendly bottom pagination */}
            {totalPages > 1 && (
              <div className="flex sm:hidden items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm disabled:opacity-50 shadow-sm"
                >
                  Prev
                </button>
                <span className="text-xs font-medium text-slate-500">Page {page} / {totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm disabled:opacity-50 shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
