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
  Payment: {
    bookingId: string;
    amount: number;
    description: string;
  };
  // Add other customer screens here
};

export type DriverStackParamList = {
  DriverTabs: undefined;
  VehicleInformation: undefined;
  VehicleDocuments: undefined;
  DriverDocuments: undefined;
  
  // Add other driver screens here
};

export type RootStackParamList = {
  Auth: undefined;
  Customer: undefined;
  Driver: undefined;
};
