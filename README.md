# Restaurant Location Intelligence
## live at: https://restaurant-location-analysis-zgif.vercel.app/
## Description
A professional location-based analysis dashboard of restaurants, built for the Cognifyz internship task. This interactive dashboard analyzes a dataset of 9,551 restaurants, providing key performance indicators, dynamic filtering, interactive maps, and insightful charts.

## Features
- **KPI Dashboard**: Highlights total restaurants, cities, average ratings, and most common cuisines.
- **Interactive Map**: Built with React-Leaflet and marker clustering to visualize thousands of restaurant locations without performance degradation.
- **Dynamic Filters**: Filter by City, Locality, Minimum Rating, Price Range, and Cuisine. All charts and maps update in real-time.
- **Data Visualization**: Uses Recharts to show Top Cities, Cuisine Distribution, and Price Tier breakdowns.
- **Paginated Data Table**: Displays raw data efficiently with quick search capabilities.
- **Automatic Insights**: Auto-generates key observations based on the current filtered data view.

## Technologies
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, shadcn/ui inspired components
- **Icons**: Lucide React
- **Charts**: Recharts
- **Maps**: React-Leaflet, Leaflet MarkerCluster
- **Data Processing**: CSV-Parser (Server-side processing)

## Dataset Information
The dataset (`Dataset.csv`) contains 9,551 records with information such as Restaurant Name, City, Locality, Coordinates (Latitude/Longitude), Cuisines, Average Cost, Price Range, and Ratings. It is loaded server-side and passed to the client dashboard.

## Installation Steps
1. Clone the repository
2. Ensure you have Node.js 18+ installed.
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

## Local Run Command
Start the development server:
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000)

## Production Build Command
To create an optimized production build:
```bash
npm run build
```

## Vercel Deployment Instructions
1. Push the code to a GitHub repository.
2. Sign in to Vercel and click "Add New Project".
3. Import the repository.
4. Leave all build settings as default (Framework Preset: Next.js).
5. Click "Deploy". The dataset is bundled automatically via the Next.js build process.
