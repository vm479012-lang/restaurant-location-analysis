import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Restaurant } from './types';

export async function getRestaurantData(): Promise<Restaurant[]> {
  const results: Restaurant[] = [];
  const filePath = path.join(process.cwd(), 'public', 'Dataset.csv');

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Convert string values to numbers where appropriate
        results.push({
          "Restaurant ID": Number(data["Restaurant ID"]),
          "Restaurant Name": data["Restaurant Name"],
          "Country Code": Number(data["Country Code"]),
          "City": data["City"],
          "Address": data["Address"],
          "Locality": data["Locality"],
          "Locality Verbose": data["Locality Verbose"],
          "Longitude": Number(data["Longitude"]),
          "Latitude": Number(data["Latitude"]),
          "Cuisines": data["Cuisines"] || "Not specified", // Handling missing cuisines
          "Average Cost for two": Number(data["Average Cost for two"]),
          "Currency": data["Currency"],
          "Has Table booking": data["Has Table booking"],
          "Has Online delivery": data["Has Online delivery"],
          "Is delivering now": data["Is delivering now"],
          "Switch to order menu": data["Switch to order menu"],
          "Price range": Number(data["Price range"]),
          "Aggregate rating": Number(data["Aggregate rating"]),
          "Rating color": data["Rating color"],
          "Rating text": data["Rating text"],
          "Votes": Number(data["Votes"]),
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
