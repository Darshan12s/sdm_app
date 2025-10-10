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
      icon: 'electric-car',
      iconType: 'MaterialIcons',
      onPress: handleBookRide,
      color: '#3ace9f',
    },
    {
      title: 'Ride History',
      subtitle: 'View your past rides',
      icon: 'history',
      iconType: 'MaterialIcons',
      onPress: handleViewHistory,
      color: '#3ace9f',
    },
    {
      title: 'My Profile',
      subtitle: 'Manage your account',
      icon: 'person',
      iconType: 'MaterialIcons',
      onPress: handleViewProfile,
      color: '#3ace9f',
    },
    {
      title: 'Support',
      subtitle: 'Get help and support',
      icon: 'help',
      iconType: 'MaterialIcons',
      onPress: () => navigation.navigate('Support'),
      color: '#3ace9f',
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
       <View style={[styles.header, { backgroundColor: colors.surface }]}>
         <View style={styles.headerContent}>
           <View style={styles.welcomeSection}>
             <View style={styles.welcomeBadge}>
              
               <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome back,</Text>
             </View>
             <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{user?.full_name || 'Customer'}</Text>
           </View>
           <TouchableOpacity style={[styles.bookRideButton, { backgroundColor: '#3ace9f' }]} onPress={handleBookRide}>
             <View style={styles.buttonContent}>
               <MaterialIcons name="electric-car" size={18} color="#fff" />
               <Text style={styles.bookRideText}>Book Electric Ride</Text>
               <View style={styles.buttonAccent}>
                 <MaterialIcons name="bolt" size={14} color="#3ace9f" />
               </View>
             </View>
           </TouchableOpacity>
         </View>
       </View>

      {/* Feature Cards */}
       <View style={styles.featureSection}>
         <Text style={[styles.sectionBadge, { color: '#3ace9f' }]}> Why Choose SDM?</Text>
         <View style={styles.featureRow}>
           <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <View style={[styles.featureIconContainer, { backgroundColor: '#e8f8f0' }]}>
               <MaterialIcons name="bolt" size={28} color="#3ace9f" />
             </View>
             <Text style={[styles.featureTitle, { color: colors.text }]}> 100% Electric Fleet</Text>
             <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>Zero-emission rides powered by clean energy</Text>
           </View>
           <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <View style={[styles.featureIconContainer, { backgroundColor: '#e8f8f0' }]}>
               <MaterialIcons name="security" size={28} color="#3ace9f" />
             </View>
             <Text style={[styles.featureTitle, { color: colors.text }]}> Safe & Secure</Text>
             <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>Advanced safety features and verified drivers</Text>
           </View>
         </View>
         <View style={styles.featureRow}>
           <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <View style={[styles.featureIconContainer, { backgroundColor: '#e8f8f0' }]}>
               <MaterialIcons name="schedule" size={28} color="#3ace9f" />
             </View>
             <Text style={[styles.featureTitle, { color: colors.text }]}> Always On Time</Text>
             <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>Reliable rides with real-time tracking</Text>
           </View>
           <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <View style={[styles.featureIconContainer, { backgroundColor: '#e8f8f0' }]}>
               <MaterialIcons name="stars" size={28} color="#3ace9f" />
             </View>
             <Text style={[styles.featureTitle, { color: colors.text }]}> Premium Experience</Text>
             <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>5-star rated service and customer support</Text>
           </View>
         </View>
       </View>

      {/* Quick Actions */}
       <View style={styles.actionsSection}>
         <Text style={[styles.sectionTitle, { color: colors.text }]}> Quick Actions</Text>
         <View style={styles.actionsGrid}>
           {quickActions.map((action, index) => (
             <TouchableOpacity
               key={index}
               style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
               onPress={action.onPress}
             >
               <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                 <MaterialIcons name={action.icon as any} size={26} color="#fff" />
               </View>
               <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
               <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{action.subtitle}</Text>
             </TouchableOpacity>
           ))}
         </View>
       </View>

      {/* Ready to Go Electric? */}
       <View style={[styles.ctaSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
         <View style={styles.ctaHeader}>
           <Text style={[styles.ctaBadge, { color: '#3ace9f' }]}> Sustainable Future</Text>
           <Text style={[styles.ctaTitle, { color: colors.text }]}>Ready to Go Electric?</Text>
         </View>
         <Text style={[styles.ctaDescription, { color: colors.textSecondary }]}>
           Join millions of riders who've already made the switch to sustainable mobility
         </Text>
         <TouchableOpacity style={[styles.ctaButton, { backgroundColor: '#3ace9f' }]} onPress={handleBookRide}>
           <MaterialIcons name="electric-bolt" size={20} color="#fff" />
           <Text style={styles.ctaButtonText}>Start Your Electric Journey</Text>
           <MaterialIcons name="arrow-forward" size={20} color="#fff" />
         </TouchableOpacity>
       </View>

      {/* Footer */}
       <View style={[styles.footer, { backgroundColor: colors.surface }]}>
         <Text style={[styles.footerTitle, { color: colors.text }]}> SDM E-Mobility</Text>
         <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>Powering the future of sustainable transportation</Text>
         {/* <View style={styles.footerLinks}>
           <TouchableOpacity>
             <Text style={[styles.footerLink, { color: colors.textSecondary }]}>🔒 Privacy Policy</Text>
           </TouchableOpacity>
           <TouchableOpacity>
             <Text style={[styles.footerLink, { color: colors.textSecondary }]}>📋 Terms of Service</Text>
           </TouchableOpacity>
           <TouchableOpacity>
             <Text style={[styles.footerLink, { color: colors.textSecondary }]}>🆘 Support</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={handleLogout}>
             <Text style={[styles.footerLinkLogout, { color: colors.error }]}>🚪 Logout</Text>
           </TouchableOpacity>
         </View> */}
       </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
    paddingRight: 20,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeEmoji: {
    fontSize: 22,
    marginRight: 8,
    fontFamily: 'System',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'System',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 0,
    fontFamily: 'System',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  userTagline: {
    marginBottom: 6,
  },
  userSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  userSubtitleHighlight: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  bookRideButton: {
    backgroundColor: '#3ace9f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 140,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonAccent: {
    marginLeft: 6,
  },
  bookRideText: {
    color: '#ffffff',
    fontWeight: '800',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'System',
  },
  featureSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionBadge: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3ace9f',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureCard: {
    width: '48%',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    fontFamily: 'System',
    letterSpacing: 0.1,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    fontFamily: 'System',
    fontWeight: '400',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3ace9f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: 0.1,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    fontFamily: 'System',
    fontWeight: '400',
  },
  ctaSection: {
    margin: 20,
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
  },
  ctaHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3ace9f',
    marginBottom: 8,
    fontFamily: 'System',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  ctaDescription: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 26,
    fontFamily: 'System',
    fontWeight: '400',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3ace9f',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    marginRight: 8,
    fontSize: 16,
    fontFamily: 'System',
  },
  footer: {
    padding: 28,
    alignItems: 'center',
    marginTop: 16,
  },
  footerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  footerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400',
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    color: '#64748b',
    fontSize: 15,
    marginHorizontal: 12,
    marginVertical: 6,
    fontWeight: '500',
    fontFamily: 'System',
  },
  footerLinkLogout: {
    color: '#ef4444',
    fontSize: 15,
    marginHorizontal: 12,
    marginVertical: 6,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
