# SDM Cab Hailing App

## Overview

This is a React Native/Expo-based cab hailing application similar to Uber/Lyft, designed for mobile and web platforms. The app provides comprehensive booking services including city rides, airport transfers, outstation trips, and hourly rentals.

## Project Architecture

- **Frontend**: React Native with Expo SDK 53
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Maps**: Google Maps API integration
- **Payments**: Razorpay integration
- **State Management**: Zustand store
- **Navigation**: React Navigation (Native Stack, Bottom Tabs)

## Key Features

### Customer Features
- User authentication and profile management
- Real-time ride booking and tracking
- Multiple service types:
  - City rides
  - Airport transfers
  - Outstation trips
  - Hourly rentals
- Vehicle selection (sedan, SUV, premium, hatchback)
- Fare calculation based on distance and time
- Payment processing with Razorpay
- Ride history and billing
- Notifications system

### Driver Features
- Driver authentication and profile management
- Vehicle information and documents management
- Available rides listing
- Active ride tracking
- Earnings tracking
- Ride details and history

### Admin/Vendor Features
- User management
- Vehicle management
- Ride monitoring
- Payment processing
- Support and FAQ sections

## Technology Stack

### Core Dependencies
- **React Native**: 0.79.5
- **Expo**: ~53.0.23
- **React Navigation**: Native Stack, Bottom Tabs, Stack
- **Supabase**: ^2.56.1
- **Zustand**: ^5.0.8
- **NativeWind**: ^4.1.23
- **Tailwind CSS**: ^3.4.17
- **React Native Maps**: ^1.20.1
- **React Native Maps Directions**: ^1.9.0
- **React Native Razorpay**: ^2.3.0
- **Expo Location**: ^18.1.6
- **Expo Notifications**: ^0.31.4
- **Expo Image Picker**: ~16.1.4
- **Expo Document Picker**: ~13.1.6

### Development Tools
- **TypeScript**: ~5.8.3
- **Babel**: ^7.25.2
- **Metro**: Expo Metro Runtime

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
EXPO_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` file
4. Start the development server:
   ```bash
   npm start
   ```

## Running the Application

### Development Mode

```bash
npm start
```

This will start the Expo development server with the following options:
- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

### Production Build

For Android:
```bash
npx expo run:android --variant release
```

For iOS:
```bash
npx expo run:ios --configuration Release
```

## Project Structure

```
/
├── android/                  # Android native code
├── assets/                   # Application assets (icons, images)
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── booking/           # Booking flow components
│   │   ├── GoogleMap.tsx      # Google Maps integration
│   │   ├── GooglePlacesInput.tsx # Location search
│   │   └── ...
│   ├── contexts/             # React context providers
│   ├── hooks/                # Custom React hooks
│   │   ├── useFareCalculation.ts # Fare calculation logic
│   │   ├── usePayment.ts      # Payment handling
│   │   └── ...
│   ├── navigation/           # Navigation setup
│   ├── screens/              # Screen components
│   │   ├── auth/              # Authentication screens
│   │   ├── customer/          # Customer-facing screens
│   │   ├── driver/            # Driver-facing screens
│   │   └── ...
│   ├── services/             # API services
│   │   └── payment/           # Payment services
│   └── constants/            # Application constants
├── .env.example              # Environment variables template
├── app.json                  # Expo configuration
├── package.json              # Project dependencies
├── tailwind.config.js        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Configuration Files

### app.json

Contains Expo configuration including:
- App name and bundle identifier
- Icons and splash screen
- Platform-specific configurations (Android permissions, iOS settings)
- Google Maps API keys
- Build properties

### tailwind.config.js

NativeWind configuration for styling the application with Tailwind CSS classes.

### tsconfig.json

TypeScript configuration with React Native and Expo settings.

## Android Configuration

### Java Version

The project requires Java 17. Use the provided batch script:
```bash
fix-java-version.bat
```

### Android SDK

Run the SDK fix script if needed:
```bash
fix-android-sdk.bat
```

### Build Properties

The project uses:
- compileSdkVersion: 35
- targetSdkVersion: 35
- buildToolsVersion: 35.0.0
- Kotlin version: 1.9.22

## Payment Integration

The app integrates with Razorpay for payment processing. Refer to the following documentation files:
- `PAYMENT_README.md` - General payment setup
- `RAZORPAY_SDK_README.md` - Razorpay SDK integration
- `RAZORPAY_DEBUG_GUIDE.md` - Debugging payment issues

## Java Configuration

Refer to `JAVA_FIX_README.md` for Java version requirements and troubleshooting.

## Deployment

The project is configured for deployment using Expo Application Services (EAS). Check `eas.json` for deployment settings.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is proprietary and licensed to Rankbook Technologies.

## Support

For issues and questions, refer to the FAQ sections in the application or contact support.
