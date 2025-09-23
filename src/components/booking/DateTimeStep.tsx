import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ServiceType } from '@/types';

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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule Your Ride</Text>
          <Text style={styles.subtitle}>Choose when you want to travel</Text>
        </View>

        {/* Scheduled Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Date & Time</Text>

          {/* Quick Date Selection */}
          <View style={styles.quickDateContainer}>
            {quickDateOptions.map((option) => {
              const isDisabled = option.value === 0 && isTodayDisabled();
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.quickDateButton,
                    isDisabled && styles.quickDateButtonDisabled,
                    (activePicker === 'scheduled' && scheduledDate?.toDateString() === new Date(Date.now() + option.value * 24 * 60 * 60 * 1000).toDateString()) && styles.quickDateButtonActive
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
                    isDisabled && styles.quickDateTextDisabled,
                    (activePicker === 'scheduled' && scheduledDate?.toDateString() === new Date(Date.now() + option.value * 24 * 60 * 60 * 1000).toDateString()) && styles.quickDateTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {option.value === 0 && !isDisabled && (
                    <Text style={styles.minTimeText}>
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
              style={styles.dateTimeButton}
              onPress={() => openDatePicker('scheduled')}
            >
              <View style={styles.dateTimeContent}>
                <MaterialIcons name="event" size={20} color="#3ccfa0" />
                <View style={styles.dateTimeTextContainer}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <Text style={styles.dateTimeValue}>
                    {formatDate(scheduledDate)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => openTimePicker('scheduled')}
            >
              <View style={styles.dateTimeContent}>
                <MaterialIcons name="schedule" size={20} color="#3ccfa0" />
                <View style={styles.dateTimeTextContainer}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <Text style={styles.dateTimeValue}>
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
            <Text style={styles.sectionTitle}>Return Date & Time</Text>

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
                      isDisabled && styles.quickDateButtonDisabled,
                      (activePicker === 'return' && returnDate?.toDateString() === returnDateOption.toDateString()) && styles.quickDateButtonActive
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
                      isDisabled && styles.quickDateTextDisabled,
                      (activePicker === 'return' && returnDate?.toDateString() === returnDateOption.toDateString()) && styles.quickDateTextActive
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
                style={styles.dateTimeButton}
                onPress={() => openDatePicker('return')}
              >
                <View style={styles.dateTimeContent}>
                  <MaterialIcons name="event" size={20} color="#3ccfa0" />
                  <View style={styles.dateTimeTextContainer}>
                    <Text style={styles.dateTimeLabel}>Return Date</Text>
                    <Text style={styles.dateTimeValue}>
                      {formatDate(returnDate)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => openTimePicker('return')}
              >
                <View style={styles.dateTimeContent}>
                  <MaterialIcons name="schedule" size={20} color="#3ccfa0" />
                  <View style={styles.dateTimeTextContainer}>
                    <Text style={styles.dateTimeLabel}>Return Time</Text>
                    <Text style={styles.dateTimeValue}>
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
      </ScrollView>

      {/* Navigation */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
            onPress={onNext}
            disabled={!isFormValid()}
          >
            <Text style={[
              styles.nextButtonText,
              !isFormValid() && styles.nextButtonTextDisabled,
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3ccfa0',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  quickDateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickDateButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  quickDateButtonActive: {
    borderColor: '#3ccfa0',
    backgroundColor: '#ecfdf5',
  },
  quickDateButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  quickDateTextActive: {
    color: '#3ccfa0',
  },
  quickDateTextDisabled: {
    color: '#94a3b8',
  },
  minTimeText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeTextContainer: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
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
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonActive: {
    borderColor: '#3ccfa0',
    backgroundColor: '#ecfdf5',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  dateTextActive: {
    color: '#3ccfa0',
  },
  dayText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  dayTextActive: {
    color: '#3ccfa0',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  timeButtonActive: {
    borderColor: '#3ccfa0',
    backgroundColor: '#ecfdf5',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  timeTextActive: {
    color: '#3ccfa0',
  },
  modalCancelButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  footer: {
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#3ccfa0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  nextButtonTextDisabled: {
    color: '#64748b',
  },
});