import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

// Import services and stores
import { AuthService } from '@/services/supabase/auth';
import { useAppStore, useUser } from '@/stores/appStore';

// Import theme
import { useTheme } from '@/contexts/ThemeContext';

// Import types
import { CustomerTabParamList } from '@/types/navigation';

type HomeScreenNavigationProp = StackNavigationProp<CustomerTabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const user = useUser();
  const { setLoading } = useAppStore();
  const { colors } = useTheme();

  const handleBookRide = () => {
    navigation.navigate('BookRide');
  };

  const handleViewHistory = () => {
    navigation.navigate('RideHistory');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await AuthService.signOut();
            setLoading(false);
          },
        },
      ]
    );
  };

  const quickActions = [
    {
      title: 'Book a Ride',
      subtitle: 'Find and book your next ride',
      icon: 'directions-car',
      iconType: 'MaterialIcons',
      onPress: handleBookRide,
      color: '#f59e0b',
    },
    {
      title: 'Ride History',
      subtitle: 'View your past rides',
      icon: 'history',
      iconType: 'MaterialIcons',
      onPress: handleViewHistory,
      color: '#f59e0b',
    },
    {
      title: 'My Profile',
      subtitle: 'Manage your account',
      icon: 'person',
      iconType: 'MaterialIcons',
      onPress: handleViewProfile,
      color: '#f59e0b',
    },
    {
      title: 'Support',
      subtitle: 'Get help and support',
      icon: 'help',
      iconType: 'MaterialIcons',
      onPress: () => navigation.navigate('Support'),
      color: '#f59e0b',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navigation Bar */}
      {/* <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.text }]}>SDM</Text>
        </View>
        <TouchableOpacity style={[styles.profileButton, { backgroundColor: colors.card }]} onPress={handleViewProfile}>
          <MaterialIcons name="account-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View> */}

      {/* Welcome Header */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name || 'Customer'}</Text>
        </View>
        <TouchableOpacity style={[styles.bookRideButton, { backgroundColor: colors.primary }]} onPress={handleBookRide}>
          <MaterialIcons name="directions-car" size={20} color="#fff" />
          <Text style={styles.bookRideText}>Book a Ride</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Cards */}
      <View style={styles.featureSection}>
        <View style={styles.featureRow}>
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="bolt" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>100% Electric Fleet</Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>Zero-emission rides powered by clean energy</Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="shield" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Safe & Secure</Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>Advanced safety features and verified drivers</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="schedule" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Always On Time</Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>Reliable rides with real-time tracking</Text>
          </View>
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="star" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Premium Experience</Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>5-star rated service and customer support</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={action.onPress}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.primary }]}>
                <MaterialIcons name={action.icon as any} size={24} color="#fff" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Ready to Go Electric? */}
      <View style={[styles.ctaSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.ctaTitle, { color: colors.text }]}>Ready to Go Electric?</Text>
        <Text style={[styles.ctaDescription, { color: colors.textSecondary }]}>
          Join millions of riders who've already made the switch to sustainable mobility
        </Text>
        <TouchableOpacity style={[styles.ctaButton, { backgroundColor: colors.primary }]} onPress={handleBookRide}>
          <Text style={styles.ctaButtonText}>Start Riding Today</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.footerTitle, { color: colors.text }]}>SDM E-Mobility</Text>
        <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>Powering the future of sustainable transportation</Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: colors.textSecondary }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: colors.textSecondary }]}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: colors.textSecondary }]}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={[styles.footerLinkLogout, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  bookRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2dd4bf',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookRideText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  featureSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2dd4bf',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  ctaSection: {
    margin: 20,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2dd4bf',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 8,
  },
  footer: {
    padding: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  footerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    color: '#64748b',
    fontSize: 14,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  footerLinkLogout: {
    color: '#ef4444',
    fontSize: 14,
    marginHorizontal: 8,
    marginVertical: 4,
  },
});