// Hardcoded lookup table of cities near common US metros
// Used by the get-nearby-weather tool to fetch comparison weather data

// A single city entry in the lookup table.
export interface NearbyCity {
  name: string;
  state: string;
  lat: number;
  lon: number;
  distance: string; // Human-readable, e.g. "35 mi south"
}

const NEARBY_CITIES: Record<string, NearbyCity[]> = {
  seattle: [
    { name: "Tacoma", state: "WA", lat: 47.2529, lon: -122.4443, distance: "35 mi south" },
    { name: "Bellevue", state: "WA", lat: 47.6101, lon: -122.2015, distance: "10 mi east" },
    { name: "Everett", state: "WA", lat: 47.979, lon: -122.2021, distance: "25 mi north" },
    { name: "Olympia", state: "WA", lat: 47.0379, lon: -122.9007, distance: "60 mi south" },
  ],
  "new york": [
    { name: "Newark", state: "NJ", lat: 40.7357, lon: -74.1724, distance: "10 mi west" },
    { name: "Jersey City", state: "NJ", lat: 40.7178, lon: -74.0431, distance: "5 mi west" },
    { name: "White Plains", state: "NY", lat: 41.034, lon: -73.7629, distance: "25 mi north" },
    { name: "Stamford", state: "CT", lat: 41.0534, lon: -73.5387, distance: "30 mi northeast" },
  ],
  "los angeles": [
    { name: "Pasadena", state: "CA", lat: 34.1478, lon: -118.1445, distance: "15 mi northeast" },
    { name: "Long Beach", state: "CA", lat: 33.7701, lon: -118.1937, distance: "25 mi south" },
    { name: "Santa Monica", state: "CA", lat: 34.0195, lon: -118.4912, distance: "15 mi west" },
    { name: "Burbank", state: "CA", lat: 34.1808, lon: -118.309, distance: "10 mi north" },
  ],
  chicago: [
    { name: "Evanston", state: "IL", lat: 42.045, lon: -87.6877, distance: "14 mi north" },
    { name: "Oak Park", state: "IL", lat: 41.885, lon: -87.7845, distance: "10 mi west" },
    { name: "Gary", state: "IN", lat: 41.5934, lon: -87.3468, distance: "30 mi southeast" },
    { name: "Naperville", state: "IL", lat: 41.7508, lon: -88.1535, distance: "30 mi west" },
  ],
  houston: [
    { name: "The Woodlands", state: "TX", lat: 30.1658, lon: -95.4613, distance: "30 mi north" },
    { name: "Pasadena", state: "TX", lat: 29.6911, lon: -95.2091, distance: "15 mi east" },
    { name: "Sugar Land", state: "TX", lat: 29.6197, lon: -95.6349, distance: "20 mi southwest" },
    { name: "Galveston", state: "TX", lat: 29.3013, lon: -94.7977, distance: "50 mi south" },
  ],
  phoenix: [
    { name: "Scottsdale", state: "AZ", lat: 33.4942, lon: -111.9261, distance: "15 mi east" },
    { name: "Tempe", state: "AZ", lat: 33.4255, lon: -111.94, distance: "10 mi southeast" },
    { name: "Mesa", state: "AZ", lat: 33.4152, lon: -111.8315, distance: "20 mi east" },
    { name: "Chandler", state: "AZ", lat: 33.3062, lon: -111.8413, distance: "20 mi south" },
  ],
  philadelphia: [
    { name: "Camden", state: "NJ", lat: 39.9259, lon: -75.1196, distance: "5 mi east" },
    { name: "Cherry Hill", state: "NJ", lat: 39.9348, lon: -75.0307, distance: "8 mi east" },
    {
      name: "King of Prussia",
      state: "PA",
      lat: 40.1013,
      lon: -75.3836,
      distance: "20 mi northwest",
    },
    { name: "Wilmington", state: "DE", lat: 39.7447, lon: -75.5484, distance: "30 mi southwest" },
  ],
  "san antonio": [
    { name: "New Braunfels", state: "TX", lat: 29.703, lon: -98.1245, distance: "30 mi northeast" },
    { name: "Schertz", state: "TX", lat: 29.5522, lon: -98.2697, distance: "20 mi northeast" },
    { name: "Seguin", state: "TX", lat: 29.5688, lon: -97.9647, distance: "35 mi east" },
    { name: "Boerne", state: "TX", lat: 29.7947, lon: -98.7319, distance: "30 mi northwest" },
  ],
  "san diego": [
    { name: "Chula Vista", state: "CA", lat: 32.6401, lon: -117.0842, distance: "10 mi south" },
    { name: "Carlsbad", state: "CA", lat: 33.1581, lon: -117.3506, distance: "35 mi north" },
    { name: "Oceanside", state: "CA", lat: 33.1959, lon: -117.3795, distance: "40 mi north" },
    { name: "Escondido", state: "CA", lat: 33.1192, lon: -117.0864, distance: "30 mi northeast" },
  ],
  dallas: [
    { name: "Irving", state: "TX", lat: 32.814, lon: -96.9489, distance: "10 mi northwest" },
    { name: "Arlington", state: "TX", lat: 32.7357, lon: -97.1081, distance: "20 mi west" },
    { name: "Plano", state: "TX", lat: 33.0198, lon: -96.6989, distance: "20 mi north" },
    { name: "Fort Worth", state: "TX", lat: 32.7555, lon: -97.3308, distance: "35 mi west" },
  ],
  jacksonville: [
    { name: "Orange Park", state: "FL", lat: 30.1661, lon: -81.7065, distance: "15 mi south" },
    { name: "Fernandina Beach", state: "FL", lat: 30.6697, lon: -81.4626, distance: "35 mi north" },
    {
      name: "St. Augustine",
      state: "FL",
      lat: 29.9012,
      lon: -81.3124,
      distance: "40 mi southeast",
    },
    { name: "Gainesville", state: "FL", lat: 29.6516, lon: -82.3248, distance: "70 mi southwest" },
  ],
  "fort worth": [
    { name: "Arlington", state: "TX", lat: 32.7357, lon: -97.1081, distance: "15 mi east" },
    { name: "Grapevine", state: "TX", lat: 32.9343, lon: -97.0781, distance: "20 mi northeast" },
    { name: "Denton", state: "TX", lat: 33.2148, lon: -97.1331, distance: "35 mi north" },
    { name: "Weatherford", state: "TX", lat: 32.7593, lon: -97.7973, distance: "30 mi west" },
  ],
  "san jose": [
    { name: "Santa Clara", state: "CA", lat: 37.3541, lon: -121.9552, distance: "5 mi northwest" },
    { name: "Sunnyvale", state: "CA", lat: 37.3688, lon: -122.0363, distance: "10 mi northwest" },
    { name: "Fremont", state: "CA", lat: 37.5483, lon: -121.9886, distance: "15 mi north" },
    { name: "Palo Alto", state: "CA", lat: 37.4419, lon: -122.143, distance: "20 mi northwest" },
  ],
  austin: [
    { name: "Round Rock", state: "TX", lat: 30.5083, lon: -97.6789, distance: "20 mi north" },
    { name: "Cedar Park", state: "TX", lat: 30.5052, lon: -97.8203, distance: "20 mi northwest" },
    { name: "Georgetown", state: "TX", lat: 30.6333, lon: -97.677, distance: "30 mi north" },
    { name: "San Marcos", state: "TX", lat: 29.8833, lon: -97.9414, distance: "30 mi south" },
  ],
  charlotte: [
    { name: "Huntersville", state: "NC", lat: 35.4107, lon: -80.8429, distance: "15 mi north" },
    { name: "Concord", state: "NC", lat: 35.4088, lon: -80.5795, distance: "20 mi northeast" },
    { name: "Gastonia", state: "NC", lat: 35.2621, lon: -81.1873, distance: "20 mi west" },
    { name: "Rock Hill", state: "SC", lat: 34.9249, lon: -81.0251, distance: "25 mi south" },
  ],
  columbus: [
    { name: "Westerville", state: "OH", lat: 40.1262, lon: -82.9291, distance: "15 mi northeast" },
    { name: "Dublin", state: "OH", lat: 40.0992, lon: -83.1141, distance: "15 mi northwest" },
    { name: "Lancaster", state: "OH", lat: 39.7137, lon: -82.5993, distance: "30 mi southeast" },
    { name: "Newark", state: "OH", lat: 40.0581, lon: -82.4013, distance: "35 mi east" },
  ],
  "san francisco": [
    { name: "Oakland", state: "CA", lat: 37.8044, lon: -122.2712, distance: "10 mi east" },
    { name: "Berkeley", state: "CA", lat: 37.8715, lon: -122.273, distance: "12 mi northeast" },
    { name: "Daly City", state: "CA", lat: 37.6879, lon: -122.4702, distance: "8 mi south" },
    { name: "San Mateo", state: "CA", lat: 37.563, lon: -122.3255, distance: "20 mi south" },
  ],
  indianapolis: [
    { name: "Carmel", state: "IN", lat: 39.9784, lon: -86.118, distance: "15 mi north" },
    { name: "Fishers", state: "IN", lat: 39.9568, lon: -86.0133, distance: "20 mi northeast" },
    { name: "Greenwood", state: "IN", lat: 39.6137, lon: -86.1067, distance: "15 mi south" },
    { name: "Plainfield", state: "IN", lat: 39.7042, lon: -86.3994, distance: "20 mi west" },
  ],
  washington: [
    { name: "Arlington", state: "VA", lat: 38.8816, lon: -77.091, distance: "5 mi southwest" },
    { name: "Alexandria", state: "VA", lat: 38.8048, lon: -77.0469, distance: "8 mi south" },
    { name: "Bethesda", state: "MD", lat: 38.9847, lon: -77.0947, distance: "10 mi northwest" },
    { name: "Silver Spring", state: "MD", lat: 38.9907, lon: -77.0261, distance: "8 mi north" },
  ],
  boston: [
    { name: "Cambridge", state: "MA", lat: 42.3736, lon: -71.1097, distance: "3 mi northwest" },
    { name: "Somerville", state: "MA", lat: 42.3876, lon: -71.0995, distance: "4 mi northwest" },
    { name: "Quincy", state: "MA", lat: 42.2529, lon: -71.0023, distance: "10 mi south" },
    { name: "Brookline", state: "MA", lat: 42.3318, lon: -71.1212, distance: "5 mi west" },
  ],
  denver: [
    { name: "Aurora", state: "CO", lat: 39.7294, lon: -104.8319, distance: "10 mi east" },
    { name: "Lakewood", state: "CO", lat: 39.7047, lon: -105.0814, distance: "10 mi west" },
    { name: "Westminster", state: "CO", lat: 39.8367, lon: -105.0372, distance: "10 mi north" },
    { name: "Englewood", state: "CO", lat: 39.6478, lon: -104.9878, distance: "10 mi south" },
  ],
  nashville: [
    { name: "Franklin", state: "TN", lat: 35.9251, lon: -86.8689, distance: "20 mi south" },
    { name: "Murfreesboro", state: "TN", lat: 35.8456, lon: -86.3903, distance: "35 mi southeast" },
    { name: "Hendersonville", state: "TN", lat: 36.3048, lon: -86.62, distance: "20 mi northeast" },
    { name: "Brentwood", state: "TN", lat: 36.0331, lon: -86.7828, distance: "10 mi south" },
  ],
};

// The geocoder returns displayNames like "Seattle, Washington" or "New York, New York".
// We extract just the city part (before the comma) and do a direct table lookup.
// Returns an empty array if the city isn't in the table — callers handle that case.
export function getNearbyCities(displayName: string): NearbyCity[] {
  const cityKey = displayName.split(",")[0].toLowerCase();
  return NEARBY_CITIES[cityKey] ?? [];
}
