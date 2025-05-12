
import mapboxgl from 'mapbox-gl';

// Map style customization function
export const applyMapCustomization = (map: mapboxgl.Map) => {
  map.on('style.load', () => {
    // Continental coloring - Add a layer for each continent with its own color
    const continents = [
      { id: 'north-america', name: 'North America', color: '#4B89DC' },  // Blue
      { id: 'south-america', name: 'South America', color: '#48C774' },  // Green
      { id: 'europe', name: 'Europe', color: '#FFDD57' },                // Yellow
      { id: 'uk', name: 'United Kingdom', color: '#9B59B6' },             // Purple
      { id: 'asia', name: 'Asia', color: '#FF6B6B' },                    // Red
      { id: 'africa', name: 'Africa', color: '#A5673F' },                // Brown
      { id: 'australia', name: 'Australia', color: '#FF8C42' },          // Orange
      { id: 'antarctica', name: 'Antarctica', color: '#F5F5F5' }         // White
    ];

    // First, update water color to blue
    if (map.getLayer('land-layer')) {
      map.removeLayer('land-layer');
    }
    
    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', '#2E86DE');
    }
    
    // Add land base layer
    map.addLayer({
      id: 'land-base',
      type: 'fill',
      source: 'composite',
      'source-layer': 'land',
      paint: {
        'fill-color': '#78D64B',  // Default green land color
        'fill-opacity': 0.3
      }
    }, 'water');
    
    // Add continent filters on top
    // Create a layer for each continent with appropriate filters
    // Note: In a real application, you would use proper GeoJSON data for continent boundaries
    
    // For demonstration purposes (simplified):
    // This would usually be a more complex set of GeoJSON polygons for accurate continent borders
    map.addSource('continents', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    
    // The actual implementation would define proper boundaries for each continent
    // This is where you'd add detailed continent boundary GeoJSON data
    
    // For demonstration, set all land to green (detailed continent boundaries would be needed for a complete solution)
    if (map.getLayer('landcover')) {
      map.setPaintProperty('landcover', 'fill-color', '#8EB814');
    }
  });
};
