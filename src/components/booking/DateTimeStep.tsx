import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ServiceType } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { GoogleMap } from '@/components/GoogleMap';

interface DateTimeStepProps {
  serviceType: ServiceType;
  isRoundTrip: boolean;
  scheduledDate: Date | undefined;
  scheduledTime: string;
  returnDate: Date | undefined;
  returnTime: string;
  onScheduledDateChange: (date: Date | undefined) => void;
  onScheduledTimeChange: (time: string) => void;
  onReturnDateChange: (date: Date | undefined) => void;
  onReturnTimeChange: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DateTimeStep: React.FC<DateTimeStepProps> = ({
  serviceType,
  isRoundTrip,
  scheduledDate,
  scheduledTime,
  returnDate,
  returnTime,
  onScheduledDateChange,
  onScheduledTimeChange,
  onReturnDateChange,
  onReturnTimeChange,
  onNext,
  onBack,
}) => {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activePicker, setActivePicker] = useState<'scheduled' | 'return'>('scheduled');
  const [tempDate, setTempDate] = useState(new Date());

  // Helper functions for date/time constraints
  const getMinimumDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    return today;
  };

  const getMinimumTimeForDate = (selectedDate: Date) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);

    // If selected date is today, minimum time is 2 hours from now
    if (selectedDateStart.getTime() === today.getTime()) {
      const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

      // Handle midnight wrap-around: if 2 hours from now is tomorrow,
      // then for today we allow all times (since the constraint moves to tomorrow)
      if (minTime.getDate() !== now.getDate()) {
        // 2 hours from now is tomorrow, so for today allow any time
        return new Date(selectedDateStart);
      }

      return minTime;
    }

    // For future dates, allow any time (return start of day)
    return new Date(selectedDateStart);
  };

  const isTimeValid = (selectedTime: Date, selectedDate: Date) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);

    // If selected date is today
    if (selectedDateStart.getTime() === today.getTime()) {
      const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      // If 2 hours from now is tomorrow, then all times today are valid
      if (minTime.getDate() !== now.getDate()) {
        return true;
      }

      // Otherwise, check against the minimum time
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      return selectedDateTime >= minTime;
    }

    // For future dates, all times are valid
    return true;
  };


  // Quick date options
  const quickDateOptions = [
    { label: 'Today', value: 0 },
    { label: 'Tomorrow', value: 1 },
    { label: 'Day After', value: 2 },
  ];

  const handleQuickDateSelect = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);

    // For today, check if we can still schedule within 2 hours
    if (daysFromNow === 0) {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // If it's too late to schedule for today (less than 2 hours left), don't allow
      if (twoHoursFromNow.getDate() !== now.getDate()) {
        alert('Too late to schedule for today. Please select tomorrow or later.');
        return;
      }
    }

    if (activePicker === 'scheduled') {
      onScheduledDateChange(date);
    } else {
      onReturnDateChange(date);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Ensure selected date is not in the past
      const minDate = getMinimumDate();
      if (selectedDate < minDate) {
        alert('Cannot select past dates');
        return;
      }

      if (activePicker === 'scheduled') {
        onScheduledDateChange(selectedDate);
        // If return date exists and is before new pickup date, clear it
        if (returnDate && !validateReturnDate(returnDate, selectedDate)) {
          onReturnDateChange(undefined);
          onReturnTimeChange('');
        }
      } else if (activePicker === 'return' && scheduledDate) {
        // Validate return date is after pickup date
        if (validateReturnDate(selectedDate, scheduledDate)) {
          onReturnDateChange(selectedDate);
        } else {
          alert('Return date must be after pickup date');
        }
      } else {
        onReturnDateChange(selectedDate);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      // Get the selected date for validation
      const selectedDate = activePicker === 'scheduled' ? scheduledDate : returnDate;
      if (!selectedDate) {
        alert('Please select a date first');
        return;
      }

      // Validate time constraints
      if (!isTimeValid(selectedTime, selectedDate)) {
        const minTime = getMinimumTimeForDate(selectedDate);
        const minTimeString = minTime.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        alert(`Please select a time at least 2 hours from now. Minimum time: ${minTimeString}`);
        return;
      }

      const timeString = selectedTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      if (activePicker === 'scheduled') {
        onScheduledTimeChange(timeString);
      } else {
        onReturnTimeChange(timeString);
      }
    }
  };

  const openDatePicker = (picker: 'scheduled' | 'return') => {
    setActivePicker(picker);
    const currentDate = picker === 'scheduled' ? scheduledDate : returnDate;
    const baseDate = picker === 'return' && scheduledDate ? scheduledDate : new Date();
    setTempDate(currentDate || baseDate);
    setShowDatePicker(true);
  };

  const openTimePicker = (picker: 'scheduled' | 'return') => {
    setActivePicker(picker);
    const selectedDate = picker === 'scheduled' ? scheduledDate : returnDate;

    if (!selectedDate) {
      alert('Please select a date first');
      return;
    }

    const currentTime = picker === 'scheduled' ? scheduledTime : returnTime;
    const timeDate = new Date(selectedDate); // Use selected date as base

    if (currentTime) {
      const [hours, minutes] = currentTime.split(':');
      timeDate.setHours(parseInt(hours), parseInt(minutes));
    } else {
      // Set to minimum allowed time if no current time
      const minTime = getMinimumTimeForDate(selectedDate);
      timeDate.setHours(minTime.getHours(), minTime.getMinutes());
    }

    setTempDate(timeDate);
    setShowTimePicker(true);
  };

  const isFormValid = () => {
    const hasScheduledDateTime = scheduledDate && scheduledTime;
    const hasReturnDateTime = !isRoundTrip || (returnDate && returnTime);
    return hasScheduledDateTime && hasReturnDateTime;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return 'Select time';
    // Ensure time is in HH:MM format
    const timeRegex = /^(\d{1,2}):(\d{2})$/;
    const match = time.match(timeRegex);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = match[2];
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${period}`;
    }
    return time;
  };

  // Validation for return date (must be after pickup date)
  const validateReturnDate = (returnDate: Date, pickupDate: Date) => {
    return returnDate >= pickupDate;
  };

  // Check if "Today" option should be disabled
  const isTodayDisabled = () => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return twoHoursFromNow.getDate() !== now.getDate();
  };

  // Get minimum time display for today
  const getTodayMinTimeDisplay = () => {
    if (!isTodayDisabled()) {
      const minTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      return formatTime(minTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }));
    }
    return '';
  };

  return (
    <View >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Schedule Your Ride</Text>
      </View>

      {/* Scheduled Date & Time */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Date & Time</Text>

        {/* Quick Date Selection */}
        <View style={styles.quickDateContainer}>
          {quickDateOptions.map((option) => {
            const isDisabled = option.value === 0 && isTodayDisabled();
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.quickDateButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isDisabled && [styles.quickDateButtonDisabled, { backgroundColor: colors.border, borderColor: colors.borderLight, opacity: 0.6 }],
                  (activePicker === 'scheduled' && scheduledDate?.toDateString() === new Date(Date.now() + option.value * 24 * 60 * 60 * 1000).toDateString()) && [styles.quickDateButtonActive, { borderColor: colors.primary, backgroundColor: colors.primary }]
                ]}
                onPress={() => {
                  if (isDisabled) {
                    alert('Too late to schedule for today. Minimum booking time is 2 hours from now.');
                    return;
                  }
                  setActivePicker('scheduled');
                  handleQuickDateSelect(option.value);
                }}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.quickDateText,
                  { color: colors.textSecondary },
                  isDisabled && [styles.quickDateTextDisabled, { color: colors.textMuted }],
                  (activePicker === 'scheduled' && scheduledDate?.toDateString() === new Date(Date.now() + option.value * 24 * 60 * 60 * 1000).toDateString()) && [styles.quickDateTextActive, { color: colors.surface }]
                ]}>
                  {option.label}
                </Text>
                {option.value === 0 && !isDisabled && (
                  <Text style={[styles.minTimeText, { color: colors.textSecondary }]}>
                    from {getTodayMinTimeDisplay()}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date & Time Selection */}
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => openDatePicker('scheduled')}
          >
            <View style={styles.dateTimeContent}>
              <MaterialIcons name="event" size={20} color={colors.text} />
              <View style={styles.dateTimeTextContainer}>
                <Text style={[styles.dateTimeLabel, { color: colors.textSecondary }]}>Date</Text>
                <Text style={[styles.dateTimeValue, { color: colors.text }]}>
                  {formatDate(scheduledDate)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => openTimePicker('scheduled')}
          >
            <View style={styles.dateTimeContent}>
              <MaterialIcons name="schedule" size={20} color={colors.text} />
              <View style={styles.dateTimeTextContainer}>
                <Text style={[styles.dateTimeLabel, { color: colors.textSecondary }]}>Time</Text>
                <Text style={[styles.dateTimeValue, { color: colors.text }]}>
                  {formatTime(scheduledTime)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Return Date & Time for Round Trip */}
      {isRoundTrip && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Return Date & Time</Text>

          {/* Quick Date Selection for Return */}
          <View style={styles.quickDateContainer}>
            {quickDateOptions.map((option) => {
              const isDisabled = option.value === 0 && isTodayDisabled();
              const returnDateOption = scheduledDate ? new Date(scheduledDate.getTime() + option.value * 24 * 60 * 60 * 1000) : new Date(Date.now() + option.value * 24 * 60 * 60 * 1000);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.quickDateButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isDisabled && [styles.quickDateButtonDisabled, { backgroundColor: colors.border, borderColor: colors.borderLight, opacity: 0.6 }],
                    (activePicker === 'return' && returnDate?.toDateString() === returnDateOption.toDateString()) && [styles.quickDateButtonActive, { borderColor: colors.primary, backgroundColor: colors.primary }]
                  ]}
                  onPress={() => {
                    if (isDisabled) {
                      alert('Cannot select today for return trip due to time constraints.');
                      return;
                    }
                    setActivePicker('return');
                    handleQuickDateSelect(option.value);
                  }}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.quickDateText,
                    { color: colors.textSecondary },
                    isDisabled && [styles.quickDateTextDisabled, { color: colors.textMuted }],
                    (activePicker === 'return' && returnDate?.toDateString() === returnDateOption.toDateString()) && [styles.quickDateTextActive, { color: colors.surface }]
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Return Date & Time Selection */}
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => openDatePicker('return')}
            >
              <View style={styles.dateTimeContent}>
                <MaterialIcons name="event" size={20} color={colors.text} />
                <View style={styles.dateTimeTextContainer}>
                  <Text style={[styles.dateTimeLabel, { color: colors.textSecondary }]}>Return Date</Text>
                  <Text style={[styles.dateTimeValue, { color: colors.text }]}>
                    {formatDate(returnDate)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => openTimePicker('return')}
            >
              <View style={styles.dateTimeContent}>
                <MaterialIcons name="schedule" size={20} color={colors.text} />
                <View style={styles.dateTimeTextContainer}>
                  <Text style={[styles.dateTimeLabel, { color: colors.textSecondary }]}>Return Time</Text>
                  <Text style={[styles.dateTimeValue, { color: colors.text }]}>
                    {formatTime(returnTime)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={getMinimumDate()}
          maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          minuteInterval={30}
          minimumDate={
            (() => {
              const selectedDate = activePicker === 'scheduled' ? scheduledDate : returnDate;
              if (selectedDate) {
                return getMinimumTimeForDate(selectedDate);
              }
              return new Date();
            })()
          }
        />
      )}

      {/* Navigation */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                shadowColor: '#000000'
              }
            ]}
            onPress={onBack}
          >
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.primary },
              !isFormValid() && [styles.nextButtonDisabled, { backgroundColor: colors.border }]
            ]}
            onPress={onNext}
            disabled={!isFormValid()}
          >
            <Text style={[
              styles.nextButtonText,
              { color: colors.surface },
              !isFormValid() && [styles.nextButtonTextDisabled, { color: colors.textMuted }],
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
 
  header: {
    padding: 6,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    color: '#0f172a',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },

  section: {
    paddingHorizontal: 8,
    marginBottom: 12,
    
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickDateContainer: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 24,
  },
  quickDateButton: {
    flex: 1,
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  quickDateButtonActive: {
    backgroundColor: '#3ace9f',
    borderColor: '#3ace9f',
    shadowColor: '#3ace9f',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  quickDateButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f1f5f9',
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Inter-SemiBold',
  },
  quickDateTextActive: {
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
  },
  quickDateTextDisabled: {
    color: '#94a3b8',
  },
  minTimeText: {
    fontSize: 10,
    marginTop: 2,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dateTimeButton: {
    flex: 1,
    padding: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeTextContainer: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 13,
    marginBottom: 4,
    color: '#64748b',
    fontFamily: 'Inter-Medium',
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  dateButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonActive: {
    // Colors applied inline with theme
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateTextActive: {
    // Colors applied inline with theme
  },
  dayText: {
    fontSize: 12,
    marginTop: 2,
  },
  dayTextActive: {
    // Colors applied inline with theme
  },
  timeScrollView: {
    maxHeight: 300,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    width: 80,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeButtonActive: {
    // Colors applied inline with theme
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeTextActive: {
    // Colors applied inline with theme
  },
  modalCancelButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 28,
    paddingBottom: 12,
    
    backgroundColor: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'Inter-SemiBold',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#3ace9f',
    shadowColor: '#3ace9f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0.1,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.2,
  },
  nextButtonTextDisabled: {
    color: '#94a3b8',
  },
});
