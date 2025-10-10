import React from 'react';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

interface ThemeColors {
  card: string;
  text: string;
  textSecondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  shadow: string;
}

export const createToastConfig = (colors: ThemeColors, isDark: boolean) => ({
  success: (props: any) => (
    React.createElement(BaseToast, {
      ...props,
      style: {
        borderLeftColor: colors.success,
        backgroundColor: colors.card,
        borderLeftWidth: 4,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.15,
        shadowRadius: 6,
        elevation: 8,
        minHeight: 56,
        borderWidth: isDark ? 1 : 0,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      },
      contentContainerStyle: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flex: 1,
      },
      text1Style: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
      },
      text2Style: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
      },
    })
  ),

  error: (props: any) => (
    React.createElement(ErrorToast, {
      ...props,
      style: {
        borderLeftColor: colors.error,
        backgroundColor: colors.card,
        borderLeftWidth: 4,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.15,
        shadowRadius: 6,
        elevation: 8,
        minHeight: 56,
        borderWidth: isDark ? 1 : 0,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      },
      contentContainerStyle: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flex: 1,
      },
      text1Style: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
      },
      text2Style: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
      },
    })
  ),

  info: (props: any) => (
    React.createElement(BaseToast, {
      ...props,
      style: {
        borderLeftColor: colors.info,
        backgroundColor: colors.card,
        borderLeftWidth: 4,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.15,
        shadowRadius: 6,
        elevation: 8,
        minHeight: 56,
        borderWidth: isDark ? 1 : 0,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      },
      contentContainerStyle: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flex: 1,
      },
      text1Style: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
      },
      text2Style: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
      },
    })
  ),

  warning: (props: any) => (
    React.createElement(BaseToast, {
      ...props,
      style: {
        borderLeftColor: colors.warning,
        backgroundColor: colors.card,
        borderLeftWidth: 4,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.15,
        shadowRadius: 6,
        elevation: 8,
        minHeight: 56,
        borderWidth: isDark ? 1 : 0,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      },
      contentContainerStyle: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flex: 1,
      },
      text1Style: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
      },
      text2Style: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
      },
    })
  ),
});
