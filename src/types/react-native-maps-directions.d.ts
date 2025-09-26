declare module 'react-native-maps-directions' {
  import { Component } from 'react';
  import { LatLng } from 'react-native-maps';

  interface MapViewDirectionsProps {
      origin: LatLng;
      destination: LatLng;
      apikey: string;
      strokeWidth?: number;
      strokeColor?: string;
      mode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
      waypoints?: LatLng[];
      onStart?: (params: any) => void;
      onReady?: (result: any) => void;
      onError?: (errorMessage: string) => void;
      resetOnChange?: boolean;
      optimizeWaypoints?: boolean;
      splitWaypoints?: boolean;
      directionsServiceBaseUrl?: string;
      region?: string;
      precision?: string;
      timePrecision?: string;
    }

  export default class MapViewDirections extends Component<MapViewDirectionsProps> {}
}