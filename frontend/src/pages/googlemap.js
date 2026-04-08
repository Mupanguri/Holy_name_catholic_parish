// GoogleMapComponent.js

import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const GoogleMapComponent = () => {
  const mapContainerStyle = {
    width: '100%',
    height: '400px', // Adjust the height as needed
  };

  const center = {
    lat: 37.7749, // Latitude of San Francisco
    lng: -122.4194, // Longitude of San Francisco
  };

  const markerPosition = {
    lat: 37.7749, // Same latitude as the center
    lng: -122.4194, // Same longitude as the center
  };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12} // Adjust zoom level as needed
      >
        <Marker position={markerPosition} />
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;
