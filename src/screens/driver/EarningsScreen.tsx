import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { supabase } from '@/services/supabase/client';
import { useUser } from '@/stores/appStore';
import { useTheme } from '@/contexts/ThemeContext';

export default function EarningsScreen() {
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earningsData, setEarningsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useUser();

  useEffect(() => {
    fetchEarnings();
  }, [selectedPeriod, user]);

  const fetchEarnings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const now = new Date();
      let startDate, endDate;

      if (selectedPeriod === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (selectedPeriod === 'week') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else { // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('fare_amount, start_time, end_time, service_type, created_at')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      if (error) throw error;

      const total = bookings.reduce((sum, b) => sum + (b.fare_amount || 0), 0);
      const rides = bookings.length;
      const hours = bookings.reduce((sum, b) => {
        if (b.start_time && b.end_time) {
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);
      const average = rides > 0 ? Math.round(total / rides) : 0;

      let breakdown: Array<{ time: string; amount: number; type: string }> = [];
      if (selectedPeriod === 'today' || selectedPeriod === 'week' || selectedPeriod === 'month') {
        breakdown = bookings.map(b => ({
          time: selectedPeriod === 'today'
            ? new Date(b.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : new Date(b.created_at).toLocaleDateString('en-IN'),
          amount: b.fare_amount || 0,
          type: b.service_type || 'Ride'
        }));
      }

      setEarningsData({
        total,
        rides,
        hours: Math.round(hours * 10) / 10,
        average,
        breakdown
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !earningsData) {
    return (
      <View style={styles(colors).loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles(colors).loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  const currentData = earningsData;

  const handleDownloadDocument = async () => {
    try {
      const periodLabel = getPeriodLabel(selectedPeriod);
      const csvHeader = `Earnings Report - ${periodLabel}\nTotal Earnings: ₹${currentData.total}\n\nTime/Date,Amount,Type\n`;
      const csvData = currentData.breakdown.map((ride: any) =>
        `${ride.time},${ride.amount},${ride.type}`
      ).join('\n');
      const csv = csvHeader + csvData;

      await Share.share({
        message: csv,
        title: `${periodLabel} Earnings Report`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share earnings report');
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles(colors).container}>
      {/* Period Selector */}
      <View style={styles(colors).periodSelector}>
        <View style={styles(colors).periodSelectorRow}>
          {(['today', 'week', 'month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles(colors).periodButton,
                selectedPeriod === period && styles(colors).periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles(colors).periodButtonText,
                selectedPeriod === period && styles(colors).periodButtonTextActive
              ]}>
                {getPeriodLabel(period)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Earnings Summary */}
      <View style={styles(colors).earningsSummary}>
        <Text style={styles(colors).earningsLabel}>Total Earnings</Text>
        <Text style={styles(colors).earningsAmount}>₹{currentData.total.toLocaleString()}</Text>
        <View style={styles(colors).earningsStats}>
          <View style={styles(colors).statItem}>
            <Text style={styles(colors).statValue}>{currentData.rides}</Text>
            <Text style={styles(colors).statLabel}>Rides</Text>
          </View>
          <View style={styles(colors).statItem}>
            <Text style={styles(colors).statValue}>{currentData.hours}h</Text>
            <Text style={styles(colors).statLabel}>Hours</Text>
          </View>
          <View style={styles(colors).statItem}>
            <Text style={styles(colors).statValue}>₹{currentData.average}</Text>
            <Text style={styles(colors).statLabel}>Average</Text>
          </View>
        </View>
      </View>

      {/* Download Document Button */}
      <View style={styles(colors).downloadContainer}>
        <TouchableOpacity
          style={styles(colors).downloadButton}
          onPress={handleDownloadDocument}
        >
          <Text style={styles(colors).downloadButtonText}>Download Document</Text>
        </TouchableOpacity>
      </View>

      {/* Rides Breakdown (for today, week, and month) */}
      {(selectedPeriod === 'today' || selectedPeriod === 'week' || selectedPeriod === 'month') && 'breakdown' in currentData && (
        <View style={styles(colors).ridesSection}>
          <Text style={styles(colors).sectionTitle}>
            {selectedPeriod === 'today' ? "Today's Rides" : selectedPeriod === 'week' ? "This Week's Rides" : "This Month's Rides"}
          </Text>
          {currentData.breakdown.map((ride: any, index: number) => (
            <View key={index} style={styles(colors).rideCard}>
              <View style={styles(colors).rideInfo}>
                <Text style={styles(colors).rideTime}>{ride.time}</Text>
                <Text style={styles(colors).rideType}>{ride.type}</Text>
              </View>
              <Text style={styles(colors).rideAmount}>₹{ride.amount}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weekly/Monthly Summary */}
      {/* {selectedPeriod !== 'today' && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                ₹{(currentData.total / currentData.rides).toFixed(0)}
              </Text>
              <Text style={styles.summaryLabel}>Per Ride</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                ₹{(currentData.total / currentData.hours).toFixed(0)}
              </Text>
              <Text style={styles.summaryLabel}>Per Hour</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {((currentData.hours / (selectedPeriod === 'week' ? 7 : 30)) * 24).toFixed(1)}h
              </Text>
              <Text style={styles.summaryLabel}>Daily Avg</Text>
            </View>
          </View>
        </View>
      )} */}

      {/* Performance Insights */}
      <View style={styles(colors).insightsSection}>
        <Text style={styles(colors).sectionTitle}>Performance Insights</Text>
        <View style={styles(colors).insightsCard}>
          <Text style={styles(colors).insightsTitle}>💡 Tip</Text>
          <Text style={styles(colors).insightsText}>
            You're earning {currentData.average >= 160 ? 'above' : 'below'} average.
            {currentData.average >= 160
              ? ' Keep up the great work!'
              : ' Try accepting more rides during peak hours.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  periodSelector: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  periodSelectorRow: {
    flexDirection: 'row',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.text,
  },
  earningsSummary: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 20,
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  downloadContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  downloadButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  ridesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  rideCard: {
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideInfo: {
    flex: 1,
  },
  rideTime: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  rideType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rideAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  insightsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  insightsCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});