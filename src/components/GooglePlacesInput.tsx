import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@/constants';

interface GooglePlacesInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: any) => void;
  icon?: 'pickup' | 'dropoff';
  showCurrentLocation?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export const GooglePlacesInput: React.FC<GooglePlacesInputProps> = ({
  placeholder,
  value,
  onChange,
  onPlaceSelect,
  icon,
  showCurrentLocation = false,
}) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:in&types=geocode|establishment&location=12.9716,77.5946&radius=50000`
      );

      const data = await response.json();

      if (data.status === 'OK') {
        setPredictions(data.predictions.slice(0, 5)); // Limit to 5 results
        setShowPredictions(true);
      } else if (data.status === 'ZERO_RESULTS') {
        setPredictions([]);
        setShowPredictions(false);
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        console.error('Places API quota exceeded');
        Alert.alert('Error', 'Search quota exceeded. Please try again later.');
        setPredictions([]);
        setShowPredictions(false);
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('Places API request denied');
        Alert.alert('Error', 'Location search is currently unavailable.');
        setPredictions([]);
        setShowPredictions(false);
      } else {
        console.error('Places API error:', data.status);
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Network Error', 'Unable to search locations. Please check your internet connection.');
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    console.log('Place selected:', prediction.description);
    try {
      // Get place details
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_MAPS_API_KEY}&fields=geometry,formatted_address`
      );

      const detailsData = await detailsResponse.json();

      if (detailsData.status === 'OK') {
        const place = {
          description: prediction.description,
          geometry: {
            location: {
              lat: detailsData.result.geometry.location.lat,
              lng: detailsData.result.geometry.location.lng,
            },
          },
          formatted_address: detailsData.result.formatted_address,
        };

        console.log('Place details fetched successfully:', place);
        console.log('GooglePlacesInput: Calling onPlaceSelect with:', place);
        onPlaceSelect(place);
        console.log('GooglePlacesInput: Calling onChange with:', prediction.description);
        onChange(prediction.description);
        setShowPredictions(false);
        inputRef.current?.blur();
        console.log('GooglePlacesInput: Place selection completed successfully');
      } else {
        console.error('Place details API error:', detailsData.status);
        // Don't update input or coordinates when API fails
        // Reset input to previous value to avoid confusion
        onChange(prediction.description);
        Alert.alert('Error', 'Unable to load location details. Please try selecting a different location or check your internet connection.');
        // Keep predictions visible so user can try again
      }
    } catch (error) {
      console.error('Place details error:', error);
      // Don't update input or coordinates when network fails
      // Reset input to previous value to avoid confusion
      onChange(prediction.description);
      Alert.alert('Network Error', 'Failed to get location details. Please check your connection and try again.');
      // Keep predictions visible so user can try again
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use current location. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const address = data.results[0].formatted_address;

        // Create place object similar to Google Places API response
        const place = {
          description: address,
          geometry: {
            location: {
              lat: latitude,
              lng: longitude,
            },
          },
          formatted_address: address,
        };

        onPlaceSelect(place);
        onChange(address);
        setShowPredictions(false);
        inputRef.current?.blur();
      } else {
        Alert.alert('Error', 'Unable to get address for your current location. Please try again.');
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleTextChange = (text: string) => {
    onChange(text);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300); // 300ms debounce
  };

  const getIcon = () => {
    switch (icon) {
      case 'pickup':
        return <MaterialIcons name="location-on" size={18} color="#64748b" />;
      case 'dropoff':
        return <MaterialIcons name="flag" size={18} color="#64748b" />;
      default:
        return <MaterialIcons name="location-on" size={18} color="#64748b" />;
    }
  };


  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.inputContainer}>
        <View style={styles.inputIcon}>
          {getIcon()}
        </View>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={placeholder}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding predictions to allow selection
            setTimeout(() => setShowPredictions(false), 200);
          }}
        />
        {isLoading && <Text style={styles.loadingText}>...</Text>}
        {value.length > 0 && !isLoading && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              console.log('GooglePlacesInput: Clear button pressed');
              onChange('');
              setPredictions([]);
              setShowPredictions(false);
              inputRef.current?.focus();
            }}
          >
            <MaterialIcons name="clear" size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {showPredictions && predictions.length > 0 && (
        <ScrollView
          style={styles.predictionsContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          pointerEvents="auto"
        >
          {predictions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={styles.predictionItem}
              onPress={() => {
                console.log('TouchableOpacity pressed for:', item.description);
                handlePlaceSelect(item);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.predictionMainText}>{item.structured_formatting.main_text}</Text>
              <Text style={styles.predictionSecondaryText}>{item.structured_formatting.secondary_text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showCurrentLocation && (
        <TouchableOpacity
          style={[styles.currentLocationButton, isGettingLocation && styles.currentLocationButtonDisabled]}
          onPress={getCurrentLocation}
          disabled={isGettingLocation}
        >
          <View style={styles.currentLocationContent}>
            <MaterialIcons
              name={isGettingLocation ? "location-searching" : "my-location"}
              size={16}
              color={isGettingLocation ? "#64748b" : "#2563eb"}
            />
            {/* <Text style={[styles.currentLocationText, isGettingLocation && styles.currentLocationTextDisabled]}>
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Text> */}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    width: '100%',
    gap: 4,
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    width: '100%',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  predictionsContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 50,
    zIndex: 9999,
    maxHeight: 240,
  },
  predictionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  predictionMainText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
  },
  predictionSecondaryText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  currentLocationButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  currentLocationButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  currentLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  currentLocationTextDisabled: {
    color: '#64748b',
  },
});