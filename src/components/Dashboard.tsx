'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Restaurant } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { Utensils, MapPin, Star, DollarSign, Search, FilterX, Building2 } from 'lucide-react';

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
    // Top 10 cities by restaurant count
    const cityCounts: Record<string, number> = {};
    const cityRatings: Record<string, { total: number, count: number }> = {};
    const priceCounts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
    
    filteredData.forEach(r => {
      cityCounts[r.City] = (cityCounts[r.City] || 0) + 1;
      
      if (!cityRatings[r.City]) cityRatings[r.City] = { total: 0, count: 0 };
      cityRatings[r.City].total += r["Aggregate rating"];
      cityRatings[r.City].count += 1;

      if (r["Price range"]) priceCounts[r["Price range"].toString()] = (priceCounts[r["Price range"].toString()] || 0) + 1;
    });

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topCitiesRating = Object.entries(cityRatings)
      .filter(([name]) => cityCounts[name] > 5) // Only cities with >5 restaurants for fair avg
      .map(([name, data]) => ({ name, rating: Number((data.total / data.count).toFixed(2)) }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    const priceRangeData = Object.entries(priceCounts).map(([range, count]) => ({
      name: `Level ${range}`,
      count
    }));

    return { topCities, topCitiesRating, priceRangeData };
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Filters Section */}
      <Card className="bg-slate-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FilterX className="w-5 h-5 text-slate-500" />
              Filter Dashboard
            </h2>
            <button 
              onClick={resetFilters}
              className="text-sm px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors font-medium"
            >
              Reset Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Search Name</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={nameFilter}
                  onChange={(e) => {setNameFilter(e.target.value); setPage(1);}}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Restaurant name..."
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">City</label>
              <select 
                value={cityFilter}
                onChange={(e) => {setCityFilter(e.target.value); setPage(1);}}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="All">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Locality</label>
              <select 
                value={localityFilter}
                onChange={(e) => {setLocalityFilter(e.target.value); setPage(1);}}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="All">All Localities</option>
                {localities.filter(l => cityFilter === 'All' || initialData.find(r => r.Locality === l && r.City === cityFilter)).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Cuisine</label>
              <select 
                value={cuisineFilter}
                onChange={(e) => {setCuisineFilter(e.target.value); setPage(1);}}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="All">All Cuisines</option>
                {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Min Rating</label>
              <select 
                value={minRatingFilter}
                onChange={(e) => {setMinRatingFilter(Number(e.target.value)); setPage(1);}}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3.0 & Above</option>
                <option value={4}>4.0 & Above</option>
                <option value={4.5}>4.5 & Above</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Price Range</label>
              <select 
                value={priceRangeFilter}
                onChange={(e) => {setPriceRangeFilter(Number(e.target.value)); setPage(1);}}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value={0}>Any Price</option>
                <option value={1}>1 - Budget ($)</option>
                <option value={2}>2 - Mid-range ($$)</option>
                <option value={3}>3 - Premium ($$$)</option>
                <option value={4}>4 - Luxury ($$$$)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Utensils className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Restaurants</p>
              <h3 className="text-2xl font-bold">{metrics.total.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><Building2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Cities</p>
              <h3 className="text-2xl font-bold">{metrics.uniqueCities.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><Star className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Rating</p>
              <h3 className="text-2xl font-bold">{metrics.avgRating}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><MapPin className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Top Cuisine</p>
              <h3 className="text-lg font-bold truncate max-w-[120px]" title={metrics.topCuisine}>{metrics.topCuisine}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-lg"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Cost</p>
              <h3 className="text-2xl font-bold">{metrics.avgCost}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Section */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Restaurant Map</CardTitle>
        </CardHeader>
        <CardContent>
          <Map restaurants={filteredData} />
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Cities by Restaurant Count</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.topCities} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Cities by Avg Rating (Min 5 restaurants)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartsData.topCitiesRating} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={3} dot={{r: 5}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Range Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex justify-center items-center">
            {chartsData.priceRangeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.priceRangeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartsData.priceRangeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500">No data available</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-white">Key Data Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Total Analyzed</span>
                <span className="font-semibold">{metrics.total.toLocaleString()} Restaurants</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Most Common Price Tier</span>
                <span className="font-semibold">
                  {chartsData.priceRangeData.sort((a,b) => b.count - a.count)[0]?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Top Rated City</span>
                <span className="font-semibold">{chartsData.topCitiesRating[0]?.name || 'N/A'} ({chartsData.topCitiesRating[0]?.rating || 0})</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Most Dominant Cuisine</span>
                <span className="font-semibold">{metrics.topCuisine}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-slate-400">Concentration Observation</span>
                <span className="font-semibold text-right max-w-[200px]">
                  {chartsData.topCities[0]?.name || 'N/A'} contains {chartsData.topCities[0]?.count ? ((chartsData.topCities[0].count / metrics.total) * 100).toFixed(1) : 0}% of all restaurants in this view.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Restaurant Data ({filteredData.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Locality</th>
                  <th className="px-4 py-3">Cuisines</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Votes</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No restaurants found matching your criteria.</td>
                  </tr>
                ) : (
                  paginatedData.map((r) => (
                    <tr key={r["Restaurant ID"]} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{r["Restaurant Name"]}</td>
                      <td className="px-4 py-3">{r.City}</td>
                      <td className="px-4 py-3 truncate max-w-[150px]" title={r.Locality}>{r.Locality}</td>
                      <td className="px-4 py-3 truncate max-w-[200px]" title={r.Cuisines}>{r.Cuisines}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{backgroundColor: `${r["Rating color"]}20`, color: r["Rating color"] === 'White' ? '#000' : r["Rating color"]}}>
                          {r["Aggregate rating"]}
                        </span>
                      </td>
                      <td className="px-4 py-3">{'$'.repeat(r["Price range"])}</td>
                      <td className="px-4 py-3">{r.Currency} {r["Average Cost for two"]}</td>
                      <td className="px-4 py-3">{r.Votes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, filteredData.length)} of {filteredData.length} Entries
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-slate-50"
                >
                  Previous
                </button>
                <div className="flex items-center px-2 text-sm font-medium">
                  Page {page} of {totalPages}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
