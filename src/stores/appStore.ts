import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Customer, Driver, Booking, NotificationData, Location, AppState } from '../types';

interface AppStore extends AppState {
  // Authentication actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;

  // Loading state
  setLoading: (isLoading: boolean) => void;

  // Booking actions
  setCurrentBooking: (booking: Booking | null) => void;
  updateBookingStatus: (status: Booking['status']) => void;

  // Location actions
  setLocation: (location: Location | null) => void;
  updateLocation: (location: Partial<Location>) => void;

  // Notification actions
  addNotification: (notification: NotificationData) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;

  // Online status
  setOnlineStatus: (isOnline: boolean) => void;

  // Theme actions
  setIsDarkMode: (isDarkMode: boolean) => void;
  toggleTheme: () => void;

  // Utility actions
  reset: () => void;
}

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  currentBooking: null,
  notifications: [],
  location: null,
  isOnline: true,
  isDarkMode: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        currentBooking: null,
        notifications: [],
        isDarkMode: false,
      }),

      setLoading: (isLoading) => set({ isLoading }),

      setCurrentBooking: (booking) => set({ currentBooking: booking }),

      updateBookingStatus: (status) => {
        const currentBooking = get().currentBooking;
        if (currentBooking) {
          set({
            currentBooking: {
              ...currentBooking,
              status,
            },
          });
        }
      },

      setLocation: (location) => set({ location }),

      updateLocation: (locationUpdate) => {
        const currentLocation = get().location;
        if (currentLocation) {
          set({
            location: {
              ...currentLocation,
              ...locationUpdate,
            },
          });
        } else if (locationUpdate.latitude !== undefined && locationUpdate.longitude !== undefined) {
          set({ location: locationUpdate as Location });
        }
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
        }));
      },

      markNotificationAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          ),
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      setOnlineStatus: (isOnline) => set({ isOnline }),

      setIsDarkMode: (isDarkMode) => set({ isDarkMode }),

      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      reset: () => set(initialState),
    }),
    {
      name: 'sdm-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        notifications: state.notifications,
        location: state.location,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);

// Selectors for computed values
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useCurrentBooking = () => useAppStore((state) => state.currentBooking);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useLocation = () => useAppStore((state) => state.location);
export const useIsOnline = () => useAppStore((state) => state.isOnline);
export const useIsDarkMode = () => useAppStore((state) => state.isDarkMode);
export const useThemeActions = () => useAppStore((state) => ({
  setDarkMode: state.setIsDarkMode,
  toggleTheme: state.toggleTheme,
}));

// Type guards
export const isCustomer = (user: User | null): user is Customer => {
  return user?.role === 'customer';
};

export const isDriver = (user: User | null): user is Driver => {
  return user?.role === 'driver';
};

// Computed selectors
export const useUnreadNotificationsCount = () => {
  return useAppStore((state) =>
    state.notifications.filter((notification) => !notification.is_read).length
  );
};

export const useUserRole = () => {
  return useAppStore((state) => state.user?.role || null);
};

export const useIsCustomer = () => {
  const user = useUser();
  return isCustomer(user);
};

export const useIsDriver = () => {
  const user = useUser();
  return isDriver(user);
};