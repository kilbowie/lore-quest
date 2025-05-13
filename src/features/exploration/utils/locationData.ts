
import { Location } from "../types";

// This file provides a central location for accessing location data
// It will be imported by components that need to access all locations

export const locations: Location[] = [];

// In a real application, this would either:
// 1. Load locations from an API
// 2. Import them from a local data source
// 3. Be populated dynamically

// For now this is just a placeholder to fix the error
// The actual locations are loaded and managed by MapComponent
