export type AuthStackParamList = {
  Login: undefined;
  OTPVerification: { phoneNumber: string };
  ForgotPassword: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  BookRide: undefined;
  RideHistory: undefined;
  Profile: undefined;
  Support: undefined;
};

export type DriverTabParamList = {
  DriverHome: undefined;
  AvailableRides: undefined;
  ActiveRide: undefined;
  Earnings: undefined;
  DriverProfile: undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: undefined;
  RideHistory: undefined;
  Payment: {
    bookingId: string;
    amount: number;
    description: string;
  };
  TripDetails: { bookingId: string };
  TrackRide: { bookingId: string; driverId: string; vehicleId: string };
  ReviewModal: { bookingId: string; driverId: string; driverName: string };
  Settings: undefined;
  PaymentMethods: undefined;
  BillingHistory: undefined;
  BookingFAQ: undefined;
  PaymentFAQ: undefined;
  AccountFAQ: undefined;
  SafetyFAQ: undefined;
  TechnicalFAQ: undefined;
  // Add other customer screens here
};

export type DriverStackParamList = {
  DriverTabs: { screen?: string; params?: any };
  VehicleInformation: undefined;
  VehicleDocuments: undefined;
  DriverDocuments: undefined;
  Settings: undefined;
  Notifications: undefined;
  TermsConditions: undefined;
  PaymentMethods: undefined;
  BillingHistory: undefined;
  Support: undefined;
  RideDetails: { booking: import('./index').Booking };

  // Add other driver screens here
};

export type RootStackParamList = {
  Auth: undefined;
  Customer: undefined;
  Driver: undefined;
};

  
