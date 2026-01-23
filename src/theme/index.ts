import type { ThemeConfig } from 'antd';

// Design tokens from Figma
export const colors = {
  // Primary colors
  primary: '#096DD9',
  primaryLight: '#1890FF',
  primaryBg: '#E6F7FF',

  // Neutral colors
  white: '#FFFFFF',
  bgPage: '#F0F2F5',
  bgCard: '#FFFFFF',
  border: '#D9D9D9',
  borderLight: '#F0F0F0',

  // Text colors
  textPrimary: 'rgba(0, 0, 0, 0.85)',
  textSecondary: '#595959',
  textMuted: '#8C8C8C',
  textLight: '#67666A',

  // Status colors
  success: '#389E0D',
  successBg: '#F6FFED',
  error: '#CF1322',
  errorBg: '#FFF1F0',
  warning: '#D46B08',
  warningBg: '#FFFBE6',
  purple: '#531DAB',
  purpleBg: '#F9F0FF',

  // Sidebar (Light theme)
  sidebarBg: '#FFFFFF',
  sidebarText: 'rgba(0, 0, 0, 0.85)',
  sidebarIcon: '#8C8C8C',
  sidebarActiveText: '#FFFFFF',
  sidebarActiveBg: '#096DD9',
};

export const typography = {
  fontFamily: "'Roboto', 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyCode: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
};

export const spacing = {
  pagePadding: 24,
  cardPadding: 16,
  gap: 24,
  gapSmall: 16,
  gapLarge: 32,
};

export const radius = {
  card: 16,
  button: 8,
  input: 8,
  menuItem: 8,
  avatar: 41,
  iconContainer: 16,
};

export const shadows = {
  card: '0px 2px 8px rgba(0, 0, 0, 0.08)',
  cardHover: '0px 4px 12px rgba(0, 0, 0, 0.12)',
  dropdown: '0px 2px 8px rgba(0, 0, 0, 0.15)',
  button: '0px 2px 4px rgba(0, 0, 0, 0.08)',
};

// Ant Design Theme Configuration
export const theme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: colors.primary,
    // colorSuccess: colors.success,
    colorError: colors.error,
    colorWarning: colors.warning,
    colorInfo: colors.primary,
    colorBgContainer: colors.bgCard,
    colorBgLayout: colors.bgPage,
    colorBgBase: colors.white,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorBorder: colors.border,
    colorBorderSecondary: colors.borderLight,

    // Typography
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    // Border Radius
    borderRadius: radius.button,
    borderRadiusLG: radius.card,
    borderRadiusSM: 6,

    // Shadows
    boxShadow: shadows.card,
    boxShadowSecondary: shadows.dropdown,

    // Spacing
    padding: spacing.cardPadding,
    paddingLG: spacing.pagePadding,
    margin: spacing.gapSmall,
    marginLG: spacing.gap,
  },
  components: {
    // Layout
    Layout: {
      siderBg: colors.sidebarBg,
      headerBg: colors.white,
      bodyBg: colors.bgPage,
      triggerBg: colors.primary,
      triggerColor: colors.white,
    },
    // Menu (Sidebar)
    Menu: {
      itemBg: 'transparent',
      itemColor: colors.sidebarText,
      itemHoverBg: colors.bgPage,
      itemHoverColor: colors.primary,
      itemSelectedBg: colors.sidebarActiveBg,
      itemSelectedColor: colors.sidebarActiveText,
      itemActiveBg: colors.sidebarActiveBg,
      subMenuItemBg: 'transparent',
      iconSize: 16,
      itemBorderRadius: radius.menuItem,
      itemMarginInline: 0,
      itemPaddingInline: 12,
      itemHeight: 40,
      collapsedIconSize: 16,
      groupTitleColor: colors.textMuted,
    },
    // Card
    Card: {
      borderRadiusLG: radius.card,
      boxShadowTertiary: shadows.card,
      paddingLG: spacing.cardPadding,
    },
    // Button
    Button: {
      borderRadius: radius.button,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      primaryShadow: shadows.button,
    },
    // Input
    Input: {
      borderRadius: radius.input,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
    },
    // Select
    Select: {
      borderRadius: radius.input,
      controlHeight: 40,
    },
    // DatePicker
    DatePicker: {
      borderRadius: radius.input,
      controlHeight: 40,
    },
    // Table
    Table: {
      headerBg: colors.bgPage,
      headerColor: colors.textPrimary,
      rowHoverBg: '#F5FAFF',
      rowSelectedBg: '#EBF5FF',
      rowSelectedHoverBg: '#E1F0FF',
      borderColor: colors.borderLight,
    },
    // Modal
    Modal: {
      borderRadiusLG: radius.card,
    },
    // Drawer
    Drawer: {
      colorBgElevated: colors.white,
    },
    // Tabs
    Tabs: {
      itemSelectedColor: colors.primary,
      itemHoverColor: colors.primaryLight,
      inkBarColor: colors.primary,
    },
    // Tag
    Tag: {
      borderRadiusSM: 4,
    },
    // Avatar
    Avatar: {
      borderRadius: radius.avatar,
    },
    // Statistic
    Statistic: {
      titleFontSize: 16,
      contentFontSize: 30,
    },
  },
};

export default theme;