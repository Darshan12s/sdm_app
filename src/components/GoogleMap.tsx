import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@/constants';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface RouteData {
  distance: string;
  duration: string;
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
}

interface GoogleMapProps {
  pickupLocation?: LocationData | null;
  dropoffLocation?: LocationData | null;
  height?: string | number;
  onRouteUpdate?: (routeData: RouteData) => void;
  interactive?: boolean;
  onPickupChange?: (location: LocationData) => void;
  onDropoffChange?: (location: LocationData) => void;
  activeMarker?: 'pickup' | 'dropoff';
  showLocationButtons?: boolean;
}

const GoogleMapComponent: React.FC<GoogleMapProps> = ({
  pickupLocation,
  dropoffLocation,
  height = '300px',
  onRouteUpdate,
  interactive = false,
  onPickupChange,
  onDropoffChange,
  activeMarker = 'pickup',
  showLocationButtons = false,
}) => {
  // Detect if running on physical device
  const isPhysicalDevice = Platform.OS === 'android' || Platform.OS === 'ios';

  // Try forcing Google Maps provider on physical devices to see if it resolves rendering
  const mapProvider = PROVIDER_GOOGLE;

  const mapRef = useRef<MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [region, setRegion] = useState<any>({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // Debug component lifecycle
  useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);
  const [mapActiveMarker, setMapActiveMarker] = useState<'pickup' | 'dropoff'>(activeMarker);
  const [isMapReady, setIsMapReady] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [mapLoadTimeout, setMapLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mapRenderTimeout, setMapRenderTimeout] = useState<NodeJS.Timeout | null>(null);
  const [useStaticMap, setUseStaticMap] = useState(false);

  // Get current location
  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const locationData: LocationData = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          address: 'Current Location',
        };

        setCurrentLocation(locationData);

        // Update region to show current location
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
      } else {
        // Fallback to Bangalore coordinates if permission denied
        const fallbackRegion = {
          latitude: 12.9716,
          longitude: 77.5946,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
        setRegion(fallbackRegion);
      }
    } catch (error) {
      // Fallback to Bangalore coordinates if location fails
      const fallbackRegion = {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setRegion(fallbackRegion);
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();

    // Set timeout for map loading (30 seconds)
    const timeout = setTimeout(() => {
      if (!isMapReady) {
        setMapLoadError(true);
        setIsLocationLoading(false);
      }
    }, 30000);

    // Also set a failsafe timeout to hide loading after 10 seconds
    const loadingTimeout = setTimeout(() => {
      setIsLocationLoading(false);
      setIsLoading(false);
    }, 10000);

    setMapLoadTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      if (mapRenderTimeout) {
        clearTimeout(mapRenderTimeout);
      }
    };
  }, []);

  // Calculate route when both locations are available
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateRoute();
    } else {
      setRouteCoordinates([]);
    }
  }, [pickupLocation, dropoffLocation]);

  // Force a re-render to ensure markers update when locations change
  useEffect(() => {
    setForceRender(prev => prev + 1);
  }, [pickupLocation, dropoffLocation]);

  // Update region when locations change
  useEffect(() => {
    if (pickupLocation || dropoffLocation) {
      const coordinates: any[] = [];

      if (pickupLocation && typeof pickupLocation.lat === 'number' && typeof pickupLocation.lng === 'number' && !isNaN(pickupLocation.lat) && !isNaN(pickupLocation.lng)) {
        coordinates.push({
          latitude: pickupLocation.lat,
          longitude: pickupLocation.lng,
        });
      }

      if (dropoffLocation && typeof dropoffLocation.lat === 'number' && typeof dropoffLocation.lng === 'number' && !isNaN(dropoffLocation.lat) && !isNaN(dropoffLocation.lng)) {
        coordinates.push({
          latitude: dropoffLocation.lat,
          longitude: dropoffLocation.lng,
        });
      }

      if (coordinates.length > 0) {
        // Calculate center point
        const avgLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
        const avgLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;

        // Calculate appropriate zoom level based on distance
        let latitudeDelta = 0.01;
        let longitudeDelta = 0.01;

        if (coordinates.length > 1) {
          const latDiff = Math.abs(coordinates[0].latitude - coordinates[1].latitude);
          const lngDiff = Math.abs(coordinates[0].longitude - coordinates[1].longitude);
          latitudeDelta = Math.max(latDiff * 1.5, 0.01);
          longitudeDelta = Math.max(lngDiff * 1.5, 0.01);
        }

        const newRegion = {
          latitude: avgLat,
          longitude: avgLng,
          latitudeDelta,
          longitudeDelta,
        };

        setRegion(newRegion);

        // Animate to region if map is ready
        if (mapRef.current) {
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(newRegion, 1000);
            }
          }, 100);
        }

        // Also fit to coordinates if map is ready
        if (mapRef.current) {
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }, 200);
        }
      } else {
        // Reset to default region when no valid coordinates
        const defaultRegion = {
          latitude: 12.9716,
          longitude: 77.5946,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
        setRegion(defaultRegion);

        if (mapRef.current) {
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(defaultRegion, 1000);
            }
          }, 100);
        }
      }
    }
  }, [pickupLocation, dropoffLocation]);

  const calculateRoute = async () => {
    if (!pickupLocation || !dropoffLocation) return;

    setIsLoading(true);
    try {
      const origin = `${pickupLocation.lat},${pickupLocation.lng}`;
      const destination = `${dropoffLocation.lat},${dropoffLocation.lng}`;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&units=metric`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        // Extract route data
        const routeData: RouteData = {
          distance: leg.distance.text,
          duration: leg.duration.text,
          distanceKm: leg.distance.value / 1000, // Convert meters to km
          durationMinutes: Math.round(leg.duration.value / 60), // Convert seconds to minutes
          polyline: route.overview_polyline.points,
        };

        onRouteUpdate?.(routeData);
      } else if (data.status === 'ZERO_RESULTS') {
        console.error('No route found between locations');
        Alert.alert('No Route Found', 'Unable to find a route between these locations. Please try different locations.');
        setRouteCoordinates([]);
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        console.error('Directions API quota exceeded');
        Alert.alert('Service Unavailable', 'Route calculation service is temporarily unavailable. Please try again later.');
        setRouteCoordinates([]);
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('Directions API request denied');
        Alert.alert('Service Error', 'Route calculation service is currently unavailable.');
        setRouteCoordinates([]);
      } else {
        console.error('Directions API error:', data.status);
        Alert.alert('Route Error', 'Unable to calculate route. Please check your locations.');
        setRouteCoordinates([]);
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      Alert.alert('Error', 'Failed to calculate route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Decode Google Maps polyline
  const decodePolyline = (encoded: string) => {
    const points: any[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const handleMapPress = async (event: any) => {
    if (!interactive && !showLocationButtons) return;

    const { coordinate } = event.nativeEvent;
    const location: LocationData = {
      lat: coordinate.latitude,
      lng: coordinate.longitude,
      address: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
    };

    try {
      // Reverse geocode to get address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        location.address = data.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }

    if (mapActiveMarker === 'pickup' && onPickupChange) {
      onPickupChange(location);
    } else if (mapActiveMarker === 'dropoff' && onDropoffChange) {
      onDropoffChange(location);
    }
  };

  const getMapRegion = () => {
    // Always return the current region state, which is initialized with default values
    return region;
  };

  // Removed dynamic key to prevent unnecessary MapView re-mounts
  // Markers should update properly through React's normal re-rendering

  // Show simplified fallback if Google Maps tiles don't load
  if (useStaticMap) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Map View Unavailable</Text>
          <Text style={styles.errorText}>
            The interactive map is not loading properly on this device. This may be due to Google Maps API restrictions for development environments.
          </Text>
          <Text style={styles.errorText}>
            You can still use the location input fields above to set your pickup and drop-off locations.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setUseStaticMap(false);
              setIsMapReady(false);
              // Retry with interactive map
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show error state if map failed to load
  if (mapLoadError) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Map Unavailable</Text>
          <Text style={styles.errorText}>
            {isPhysicalDevice
              ? 'Map functionality may be limited on physical devices. Using default map provider.'
              : 'Unable to load map. Please check your internet connection and try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setMapLoadError(false);
              setIsMapReady(false);
              // Retry loading
              const timeout = setTimeout(() => {
                if (!isMapReady) {
                  setMapLoadError(true);
                }
              }, 30000);
              setMapLoadTimeout(timeout);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        {...(mapProvider ? { provider: mapProvider } : {})}
        style={{
          width: '100%',
          height: typeof height === 'string' ? parseInt(height.replace('px', '')) || 300 : height,
          minHeight: 200, // Ensure minimum height
        }}
        region={region || getMapRegion()}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={interactive || showLocationButtons}
        zoomEnabled={interactive || showLocationButtons}
        scrollEnabled={interactive || showLocationButtons}
        rotateEnabled={interactive || showLocationButtons}
        loadingEnabled={false}
        onMapReady={() => {
          setIsMapReady(true);
          setMapLoadError(false);
          // Clear timeout since map loaded successfully
          if (mapLoadTimeout) {
            clearTimeout(mapLoadTimeout);
            setMapLoadTimeout(null);
          }
          // Force hide loading states as failsafe
          setIsLocationLoading(false);
          setIsLoading(false);

          // Check if map tiles are actually rendering after a delay
          const renderCheckTimeout = setTimeout(() => {
            // On physical devices, if Google Maps tiles don't load due to API restrictions,
            // we should fall back to a static map or alternative
            if (isPhysicalDevice) {
              // If map is still not visible after 10 seconds, show fallback
              setTimeout(() => {
                if (!mapLoadError) {
                  setUseStaticMap(true);
                }
              }, 10000);
            }
          }, 3000);

          setMapRenderTimeout(renderCheckTimeout);
        }}
        onRegionChangeComplete={(newRegion) => {
          // Update region state when user interacts with map
          if (interactive) {
            setRegion(newRegion);
          }
        }}
      >
        {/* Pickup Marker */}
        {pickupLocation && typeof pickupLocation.lat === 'number' && typeof pickupLocation.lng === 'number' && !isNaN(pickupLocation.lat) && !isNaN(pickupLocation.lng) && (
          <Marker
            key={`pickup-${pickupLocation.lat}-${pickupLocation.lng}-${forceRender}`}
            coordinate={{
              latitude: pickupLocation.lat,
              longitude: pickupLocation.lng,
            }}
            title="Pickup Location"
            description={pickupLocation.address || 'Pickup Location'}
            pinColor="green"
          />
        )}

        {/* Dropoff Marker */}
        {dropoffLocation && typeof dropoffLocation.lat === 'number' && typeof dropoffLocation.lng === 'number' && !isNaN(dropoffLocation.lat) && !isNaN(dropoffLocation.lng) && (
          <Marker
            key={`dropoff-${dropoffLocation.lat}-${dropoffLocation.lng}-${forceRender}`}
            coordinate={{
              latitude: dropoffLocation.lat,
              longitude: dropoffLocation.lng,
            }}
            title="Drop-off Location"
            description={dropoffLocation.address || 'Drop-off Location'}
            pinColor="red"
          />
        )}

        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            title="Current Location"
            description="Your current location"
            pinColor="blue"
          />
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2dd4bf" // Teal color from the modern theme
            strokeWidth={5}
            lineDashPattern={[0]}
            lineCap="round"
          />
        )}
      </MapView>

      {/* Loading Indicator */}
      {(() => {
        const shouldShowLoading = isLoading || isLocationLoading;
        return shouldShowLoading ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                {isLocationLoading ? 'Getting your location...' : 'Calculating route...'}
              </Text>
            </View>
          </View>
        ) : null;
      })()}

      {/* Interactive Mode Indicator */}
      {(interactive || showLocationButtons) && (
        <View style={styles.interactiveIndicator}>
          <Text style={styles.interactiveText}>
            Tap map to set {mapActiveMarker === 'pickup' ? 'pickup' : 'drop-off'} location
          </Text>
        </View>
      )}

      {/* Location Picking Buttons */}
      {showLocationButtons && (
        <View style={styles.locationButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.locationButton,
              mapActiveMarker === 'pickup' && styles.locationButtonActive,
            ]}
            onPress={() => setMapActiveMarker('pickup')}
          >
            <Text style={[
              styles.locationButtonText,
              mapActiveMarker === 'pickup' && styles.locationButtonTextActive,
            ]}>
              Set Pickup Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationButton,
              mapActiveMarker === 'dropoff' && styles.locationButtonActive,
            ]}
            onPress={() => setMapActiveMarker('dropoff')}
          >
            <Text style={[
              styles.locationButtonText,
              mapActiveMarker === 'dropoff' && styles.locationButtonTextActive,
            ]}>
              Set Drop-off Location
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#1e293b',
  },
  interactiveIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  interactiveText: {
    fontSize: 12,
    color: '#475569',
  },
  locationButtonsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonActive: {
    borderColor: '#2dd4bf', // Teal color from the modern theme
    backgroundColor: '#f0fdfa', // Very light teal background
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  locationButtonTextActive: {
    color: '#0d9488', // Darker teal for active text
  },
  staticMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  staticMapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  staticMapSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  staticMapWrapper: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  staticMapImage: {
    width: '100%',
    height: '100%',
  },
  staticMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupMarker: {
    top: '40%',
    left: '45%',
  },
  dropoffMarker: {
    top: '50%',
    right: '45%',
  },
  markerText: {
    fontSize: 24,
  },
  switchToInteractiveButton: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  switchToInteractiveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export const GoogleMap = GoogleMapComponent;