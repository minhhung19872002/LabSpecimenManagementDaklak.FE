import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

export interface IconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  spin?: boolean;
  rotate?: number;
}

/**
 * Mapping from Ant Design icon names to Bootstrap Icon names
 * Used for automatic conversion and fallback support
 */
export const AntdToBootstrapIconMap: Record<string, string> = {
  // Actions
  PlusOutlined: "plus-lg",
  MinusOutlined: "dash-lg",
  SearchOutlined: "search",
  EditOutlined: "pencil",
  DeleteOutlined: "trash",
  CloseOutlined: "x-lg",
  CheckOutlined: "check-lg",
  SaveOutlined: "floppy",
  CopyOutlined: "files",
  ScissorOutlined: "scissors",
  ReloadOutlined: "arrow-repeat",
  SyncOutlined: "arrow-repeat",
  UndoOutlined: "arrow-counterclockwise",
  RedoOutlined: "arrow-clockwise",
  SwapOutlined: "arrow-left-right",

  // Status & Alerts
  WarningOutlined: "exclamation-triangle",
  InfoCircleOutlined: "info-circle",
  QuestionCircleOutlined: "question-circle",
  ExclamationCircleOutlined: "exclamation-circle",
  CheckCircleOutlined: "check-circle",
  CloseCircleOutlined: "x-circle",
  CheckCircleFilled: "check-circle-fill",
  CloseCircleFilled: "x-circle-fill",
  ExclamationCircleFilled: "exclamation-circle-fill",
  ClockCircleFilled: "clock-fill",
  StopOutlined: "stop-circle",

  // Time & Calendar
  ClockCircleOutlined: "clock",
  CalendarOutlined: "calendar3",
  HistoryOutlined: "clock-history",
  ScheduleOutlined: "calendar-check",

  // User & People
  UserOutlined: "person",
  TeamOutlined: "people",
  SolutionOutlined: "person-badge",

  // Navigation
  HomeOutlined: "house",
  MenuOutlined: "list",
  MoreOutlined: "three-dots-vertical",
  DownOutlined: "chevron-down",
  UpOutlined: "chevron-up",
  LeftOutlined: "chevron-left",
  RightOutlined: "chevron-right",
  DoubleLeftOutlined: "chevron-double-left",
  DoubleRightOutlined: "chevron-double-right",
  ArrowLeftOutlined: "arrow-left",
  ArrowRightOutlined: "arrow-right",
  ArrowUpOutlined: "arrow-up",
  ArrowDownOutlined: "arrow-down",
  CaretDownOutlined: "caret-down-fill",
  CaretUpOutlined: "caret-up-fill",
  CaretLeftOutlined: "caret-left-fill",
  CaretRightOutlined: "caret-right-fill",

  // Files & Documents
  FileOutlined: "file-earmark",
  FileTextOutlined: "file-earmark-text",
  FileExcelOutlined: "file-earmark-excel",
  FilePdfOutlined: "file-earmark-pdf",
  FileWordOutlined: "file-earmark-word",
  FileImageOutlined: "file-earmark-image",
  FileZipOutlined: "file-earmark-zip",
  FileAddOutlined: "file-earmark-plus",
  FileSearchOutlined: "file-earmark-text",
  FileExclamationOutlined: "file-earmark-x",
  FileUnknownOutlined: "file-earmark-binary",
  FileDoneOutlined: "file-earmark-check",
  FileProtectOutlined: "file-earmark-lock",
  FileSyncOutlined: "file-earmark-arrow-up",
  FolderOutlined: "folder",
  FolderOpenOutlined: "folder2-open",
  FolderAddOutlined: "folder-plus",

  // Communication
  MailOutlined: "envelope",
  PhoneOutlined: "telephone",
  BellOutlined: "bell",
  SendOutlined: "send",

  // Media & Images
  PictureOutlined: "image",
  CameraOutlined: "camera",
  PlayCircleOutlined: "play-circle",
  PauseOutlined: "pause",

  // Tools & Settings
  SettingOutlined: "gear",
  ToolOutlined: "wrench",
  BuildOutlined: "tools",
  KeyOutlined: "key",
  LockOutlined: "lock",
  UnlockOutlined: "unlock",
  SafetyOutlined: "shield-check",
  SafetyCertificateOutlined: "shield-check",
  AuditOutlined: "clipboard-check",

  // View & Display
  EyeOutlined: "eye",
  EyeInvisibleOutlined: "eye-slash",
  FullscreenOutlined: "fullscreen",
  FullscreenExitOutlined: "fullscreen-exit",
  ZoomInOutlined: "zoom-in",
  ZoomOutOutlined: "zoom-out",
  ExpandOutlined: "arrows-angle-expand",
  CompressOutlined: "arrows-angle-contract",
  FilterOutlined: "funnel",
  SortAscendingOutlined: "sort-alpha-down",
  SortDescendingOutlined: "sort-alpha-up",

  // Data & Storage
  DatabaseOutlined: "database",
  CloudOutlined: "cloud",
  DownloadOutlined: "download",
  UploadOutlined: "upload",
  ExportOutlined: "box-arrow-up",
  ImportOutlined: "box-arrow-in-down",
  InboxOutlined: "inbox",

  // Charts & Analytics
  DashboardOutlined: "speedometer2",
  PieChartOutlined: "pie-chart",
  BarChartOutlined: "bar-chart",
  LineChartOutlined: "graph-up",

  // Commerce
  DollarOutlined: "currency-dollar",
  ShoppingCartOutlined: "cart",

  // UI Elements
  AppstoreOutlined: "grid",
  UnorderedListOutlined: "list-ul",
  OrderedListOutlined: "list-ol",
  TableOutlined: "table",
  FormOutlined: "ui-checks",
  CheckSquareOutlined: "check-square",
  BorderOutlined: "square",

  // Text Formatting
  AlignLeftOutlined: "text-left",
  AlignCenterOutlined: "text-center",
  AlignRightOutlined: "text-right",
  BoldOutlined: "type-bold",
  ItalicOutlined: "type-italic",
  UnderlineOutlined: "type-underline",
  StrikethroughOutlined: "type-strikethrough",
  HighlightOutlined: "highlighter",
  FontSizeOutlined: "fonts",
  FontColorsOutlined: "palette",

  // Tech & Devices
  CodeOutlined: "code",
  ApiOutlined: "plug",
  BugOutlined: "bug",
  GlobalOutlined: "globe",
  WifiOutlined: "wifi",
  MobileOutlined: "phone",
  DesktopOutlined: "display",
  LaptopOutlined: "laptop",
  TabletOutlined: "tablet",
  UsbOutlined: "usb-symbol",

  // Special icons
  ExperimentOutlined: "droplet-half", // Lab/specimen icon - droplet represents liquid sample
  QrcodeOutlined: "qr-code",
  BarcodeOutlined: "upc-scan",
  EnvironmentOutlined: "geo-alt",
  LinkOutlined: "link-45deg",
  PrinterOutlined: "printer",
  PrinterFilled: "printer-fill",

  // Misc
  StarOutlined: "star",
  HeartOutlined: "heart",
  FlagOutlined: "flag",
  TagOutlined: "tag",
  TagsOutlined: "tags",
  BookOutlined: "book",
  ReadOutlined: "journal-text",
  GiftOutlined: "gift",
  TrophyOutlined: "trophy",
  ThunderboltOutlined: "lightning",
  FireOutlined: "fire",
  RocketOutlined: "rocket",
  ShopOutlined: "shop",
  ContainerOutlined: "box",

  // Loading
  LoadingOutlined: "arrow-repeat",
  Loading3QuartersOutlined: "arrow-repeat",

  // Auth
  LogoutOutlined: "box-arrow-right",
  LoginOutlined: "box-arrow-in-right",

  // Plus/Minus circles
  PlusCircleOutlined: "plus-circle",
  MinusCircleOutlined: "dash-circle",

  // Clear
  ClearOutlined: "x-lg",
};

/**
 * Resolve icon name - converts Ant Design icon names to Bootstrap icon names
 * or keeps bootstrap icon names as-is
 */
const resolveIconName = (name: string): string => {
  // Check if it's an Ant Design icon name
  if (AntdToBootstrapIconMap[name]) {
    return AntdToBootstrapIconMap[name];
  }
  // Remove 'bi-' prefix if present, we'll add it back in the component
  return name.startsWith("bi-") ? name.substring(3) : name;
};

/**
 * Bootstrap Icon wrapper component
 * Usage: <Icon name="plus" /> or <Icon name="bi-plus" />
 * Also accepts Ant Design icon names which will be auto-converted
 *
 * Examples:
 * - <Icon name="plus-lg" /> - Direct Bootstrap icon name
 * - <Icon name="PlusOutlined" /> - Auto-converted from Ant Design
 * - <Icon name="arrow-repeat" spin /> - Spinning icon
 */
const Icon: React.FC<IconProps> = ({ name, className = "", style, onClick, spin = false, rotate }) => {
  const resolvedName = resolveIconName(name);
  const iconClassName = `bi bi-${resolvedName}`;

  const dynamicStyle: React.CSSProperties = {
    ...style,
    ...(spin ? { animation: "spin 1s linear infinite", display: "inline-block" } : {}),
    ...(rotate !== undefined ? { transform: `rotate(${rotate}deg)`, display: "inline-block" } : {}),
  };

  return (
    <i
      className={`${iconClassName} ${className}`.trim()}
      style={dynamicStyle}
      onClick={onClick}
    />
  );
};

// Add global CSS for spin animation
if (typeof document !== 'undefined') {
  const styleId = 'bootstrap-icon-spin-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default Icon;

/**
 * Helper function to create an icon element with consistent API
 * Useful when you need to pass icon as a prop to Ant Design components
 */
export const createIcon = (name: string, props?: Omit<IconProps, 'name'>): React.ReactElement => {
  return <Icon name={name} {...props} />;
};

// Pre-built icon components for common use cases
// These can be used as drop-in replacements for Ant Design icons

export const PlusOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="plus-lg" {...props} />;
export const MinusOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="dash-lg" {...props} />;
export const SearchOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="search" {...props} />;
export const EditOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="pencil" {...props} />;
export const DeleteOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="trash" {...props} />;
export const CloseOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="x-lg" {...props} />;
export const CheckOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="check-lg" {...props} />;
export const SaveOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="floppy" {...props} />;
export const ReloadOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-repeat" {...props} />;
export const SyncOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-repeat" spin {...props} />;
export const LoadingOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-repeat" spin {...props} />;

export const WarningOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="exclamation-triangle" {...props} />;
export const InfoCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="info-circle" {...props} />;
export const QuestionCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="question-circle" {...props} />;
export const ExclamationCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="exclamation-circle" {...props} />;
export const CheckCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="check-circle" {...props} />;
export const CloseCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="x-circle" {...props} />;
export const CheckCircleFilled: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="check-circle-fill" {...props} />;
export const CloseCircleFilled: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="x-circle-fill" {...props} />;
export const ClockCircleFilled: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="clock-fill" {...props} />;
export const StopOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="stop-circle" {...props} />;

export const ClockCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="clock" {...props} />;
export const CalendarOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="calendar3" {...props} />;
export const HistoryOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="clock-history" {...props} />;
export const ScheduleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="calendar-check" {...props} />;

export const UserOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="person" {...props} />;
export const TeamOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="people" {...props} />;
export const SolutionOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="person-badge" {...props} />;

export const HomeOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="house" {...props} />;
export const MenuOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="list" {...props} />;
export const MoreOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="three-dots-vertical" {...props} />;
export const DownOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-down" {...props} />;
export const UpOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-up" {...props} />;
export const LeftOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-left" {...props} />;
export const RightOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-right" {...props} />;
export const DoubleLeftOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-double-left" {...props} />;
export const DoubleRightOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chevron-double-right" {...props} />;
export const ArrowLeftOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-left" {...props} />;
export const ArrowRightOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-right" {...props} />;
export const ArrowUpOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-up" {...props} />;
export const ArrowDownOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-down" {...props} />;
export const CaretDownOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="caret-down-fill" {...props} />;
export const CaretUpOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="caret-up-fill" {...props} />;
export const CaretLeftOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="caret-left-fill" {...props} />;
export const CaretRightOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="caret-right-fill" {...props} />;

export const FileOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark" {...props} />;
export const FileTextOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-text" {...props} />;
export const FileExcelOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-excel" {...props} />;
export const FilePdfOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-pdf" {...props} />;
export const FileWordOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-word" {...props} />;
export const FileImageOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-image" {...props} />;
export const FileZipOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-zip" {...props} />;
export const FileAddOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-plus" {...props} />;
export const FileSearchOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-text" {...props} />;
export const FileExclamationOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-x" {...props} />;
export const FileUnknownOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-binary" {...props} />;
export const FileDoneOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-check" {...props} />;
export const FileProtectOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-lock" {...props} />;
export const FileSyncOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="file-earmark-arrow-up" {...props} />;
export const FolderOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="folder" {...props} />;
export const FolderOpenOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="folder2-open" {...props} />;
export const FolderAddOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="folder-plus" {...props} />;

export const MailOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="envelope" {...props} />;
export const PhoneOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="telephone" {...props} />;
export const BellOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="bell" {...props} />;
export const SendOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="send" {...props} />;
export const MessageOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="chat-dots" {...props} />;

export const PictureOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="image" {...props} />;
export const CameraOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="camera" {...props} />;
export const PlayCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="play-circle" {...props} />;
export const PauseOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="pause" {...props} />;

export const SettingOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="gear" {...props} />;
export const ToolOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="wrench" {...props} />;
export const BuildOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="tools" {...props} />;
export const KeyOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="key" {...props} />;
export const LockOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="lock" {...props} />;
export const UnlockOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="unlock" {...props} />;
export const SafetyOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="shield-check" {...props} />;
export const SafetyCertificateOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="shield-check" {...props} />;
export const AuditOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="clipboard-check" {...props} />;

export const EyeOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="eye" {...props} />;
export const EyeInvisibleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="eye-slash" {...props} />;
export const FullscreenOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="fullscreen" {...props} />;
export const FullscreenExitOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="fullscreen-exit" {...props} />;
export const ZoomInOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="zoom-in" {...props} />;
export const ZoomOutOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="zoom-out" {...props} />;
export const ExpandOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrows-angle-expand" {...props} />;
export const CompressOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrows-angle-contract" {...props} />;
export const FilterOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="funnel" {...props} />;
export const SortAscendingOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="sort-alpha-down" {...props} />;
export const SortDescendingOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="sort-alpha-up" {...props} />;

export const DatabaseOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="database" {...props} />;
export const CloudOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="cloud" {...props} />;
export const DownloadOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="download" {...props} />;
export const UploadOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="upload" {...props} />;
export const ExportOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="box-arrow-up" {...props} />;
export const ImportOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="box-arrow-in-down" {...props} />;
export const InboxOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="inbox" {...props} />;

export const DashboardOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="speedometer2" {...props} />;
export const PieChartOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="pie-chart" {...props} />;
export const BarChartOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="bar-chart" {...props} />;
export const LineChartOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="graph-up" {...props} />;

export const DollarOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="currency-dollar" {...props} />;
export const ShoppingCartOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="cart" {...props} />;

export const AppstoreOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="grid" {...props} />;
export const UnorderedListOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="list-ul" {...props} />;
export const OrderedListOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="list-ol" {...props} />;
export const TableOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="table" {...props} />;
export const FormOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="ui-checks" {...props} />;
export const CheckSquareOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="check-square" {...props} />;
export const BorderOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="square" {...props} />;

export const AlignLeftOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="text-left" {...props} />;
export const AlignCenterOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="text-center" {...props} />;
export const AlignRightOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="text-right" {...props} />;
export const BoldOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="type-bold" {...props} />;
export const ItalicOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="type-italic" {...props} />;
export const UnderlineOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="type-underline" {...props} />;
export const StrikethroughOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="type-strikethrough" {...props} />;
export const HighlightOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="highlighter" {...props} />;
export const FontSizeOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="fonts" {...props} />;
export const FontColorsOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="palette" {...props} />;

export const CodeOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="code" {...props} />;
export const ApiOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="plug" {...props} />;
export const BugOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="bug" {...props} />;
export const GlobalOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="globe" {...props} />;
export const WifiOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="wifi" {...props} />;
export const MobileOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="phone" {...props} />;
export const DesktopOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="display" {...props} />;
export const LaptopOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="laptop" {...props} />;
export const TabletOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="tablet" {...props} />;
export const UsbOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="usb-symbol" {...props} />;

export const ExperimentOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="droplet-half" {...props} />;
export const QrcodeOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="qr-code" {...props} />;
export const BarcodeOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="upc-scan" {...props} />;
export const EnvironmentOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="geo-alt" {...props} />;
export const LinkOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="link-45deg" {...props} />;
export const PrinterOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="printer" {...props} />;
export const PrinterFilled: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="printer-fill" {...props} />;

export const StarOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="star" {...props} />;
export const HeartOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="heart" {...props} />;
export const FlagOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="flag" {...props} />;
export const TagOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="tag" {...props} />;
export const TagsOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="tags" {...props} />;
export const BookOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="book" {...props} />;
export const ReadOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="journal-text" {...props} />;
export const GiftOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="gift" {...props} />;
export const TrophyOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="trophy" {...props} />;
export const ThunderboltOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="lightning" {...props} />;
export const FireOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="fire" {...props} />;
export const RocketOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="rocket" {...props} />;
export const ShopOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="shop" {...props} />;
export const ContainerOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="box" {...props} />;

export const LogoutOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="box-arrow-right" {...props} />;
export const LoginOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="box-arrow-in-right" {...props} />;

export const PlusCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="plus-circle" {...props} />;
export const MinusCircleOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="dash-circle" {...props} />;

export const ClearOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="x-lg" {...props} />;
export const CopyOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="files" {...props} />;
export const ScissorOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="scissors" {...props} />;
export const SwapOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-left-right" {...props} />;
export const UndoOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-counterclockwise" {...props} />;
export const RedoOutlined: React.FC<Omit<IconProps, 'name'>> = (props) => <Icon name="arrow-clockwise" {...props} />;

// Export commonly used icon names as constants for easy reference
export const IconNames = {
  // Actions
  PLUS: "plus",
  PLUS_LG: "plus-lg",
  PLUS_CIRCLE: "plus-circle",
  MINUS: "dash",
  MINUS_CIRCLE: "dash-circle",
  SEARCH: "search",
  EDIT: "pencil",
  PENCIL_SQUARE: "pencil-square",
  DELETE: "trash",
  TRASH: "trash",
  TRASH_FILL: "trash-fill",
  CLOSE: "x",
  X: "x",
  X_LG: "x-lg",
  CHECK: "check",
  CHECK_LG: "check-lg",
  CHECK_CIRCLE: "check-circle",
  CHECK_CIRCLE_FILL: "check-circle-fill",
  X_CIRCLE: "x-circle",
  X_CIRCLE_FILL: "x-circle-fill",

  // Alerts & Status
  WARNING: "exclamation-triangle",
  EXCLAMATION_TRIANGLE: "exclamation-triangle",
  EXCLAMATION_TRIANGLE_FILL: "exclamation-triangle-fill",
  INFO: "info-circle",
  INFO_CIRCLE: "info-circle",
  INFO_CIRCLE_FILL: "info-circle-fill",
  QUESTION: "question-circle",
  QUESTION_CIRCLE: "question-circle",
  EXCLAMATION_CIRCLE: "exclamation-circle",
  EXCLAMATION_CIRCLE_FILL: "exclamation-circle-fill",

  // Time & Calendar
  CLOCK: "clock",
  CLOCK_FILL: "clock-fill",
  CLOCK_HISTORY: "clock-history",
  CALENDAR: "calendar",
  CALENDAR_DATE: "calendar-date",
  CALENDAR_EVENT: "calendar-event",
  CALENDAR_CHECK: "calendar-check",

  // User & People
  PERSON: "person",
  PERSON_FILL: "person-fill",
  PERSON_CIRCLE: "person-circle",
  PEOPLE: "people",
  PEOPLE_FILL: "people-fill",
  PERSON_PLUS: "person-plus",
  PERSON_DASH: "person-dash",
  PERSON_CHECK: "person-check",
  PERSON_X: "person-x",

  // Navigation
  HOUSE: "house",
  HOUSE_FILL: "house-fill",
  CHEVRON_DOWN: "chevron-down",
  CHEVRON_UP: "chevron-up",
  CHEVRON_LEFT: "chevron-left",
  CHEVRON_RIGHT: "chevron-right",
  CHEVRON_DOUBLE_LEFT: "chevron-double-left",
  CHEVRON_DOUBLE_RIGHT: "chevron-double-right",
  ARROW_LEFT: "arrow-left",
  ARROW_RIGHT: "arrow-right",
  ARROW_UP: "arrow-up",
  ARROW_DOWN: "arrow-down",
  ARROW_CLOCKWISE: "arrow-clockwise",
  ARROW_COUNTERCLOCKWISE: "arrow-counterclockwise",
  ARROW_REPEAT: "arrow-repeat",
  CARET_DOWN: "caret-down-fill",
  CARET_UP: "caret-up-fill",
  CARET_LEFT: "caret-left-fill",
  CARET_RIGHT: "caret-right-fill",

  // Files & Documents
  FILE: "file-earmark",
  FILE_TEXT: "file-earmark-text",
  FILE_EXCEL: "file-earmark-excel",
  FILE_PDF: "file-earmark-pdf",
  FILE_WORD: "file-earmark-word",
  FILE_IMAGE: "file-earmark-image",
  FILE_ZIP: "file-earmark-zip",
  FILE_PLUS: "file-earmark-plus",
  FILE_CHECK: "file-earmark-check",
  FILE_X: "file-earmark-x",
  FILE_LOCK: "file-earmark-lock",
  FOLDER: "folder",
  FOLDER_FILL: "folder-fill",
  FOLDER_PLUS: "folder-plus",

  // Communication
  ENVELOPE: "envelope",
  ENVELOPE_FILL: "envelope-fill",
  TELEPHONE: "telephone",
  TELEPHONE_FILL: "telephone-fill",
  CHAT: "chat",
  CHAT_DOTS: "chat-dots",
  BELL: "bell",
  BELL_FILL: "bell-fill",
  SEND: "send",
  SEND_FILL: "send-fill",

  // Media & Images
  IMAGE: "image",
  IMAGE_FILL: "image-fill",
  CAMERA: "camera",
  CAMERA_FILL: "camera-fill",
  PLAY: "play",
  PLAY_CIRCLE: "play-circle",
  PLAY_FILL: "play-fill",
  PAUSE: "pause",
  PAUSE_FILL: "pause-fill",
  STOP: "stop",
  STOP_CIRCLE: "stop-circle",
  STOP_FILL: "stop-fill",

  // Tools & Settings
  GEAR: "gear",
  GEAR_FILL: "gear-fill",
  SLIDERS: "sliders",
  TOOLS: "tools",
  WRENCH: "wrench",
  KEY: "key",
  KEY_FILL: "key-fill",
  LOCK: "lock",
  LOCK_FILL: "lock-fill",
  UNLOCK: "unlock",
  UNLOCK_FILL: "unlock-fill",
  SHIELD_CHECK: "shield-check",

  // View & Display
  EYE: "eye",
  EYE_FILL: "eye-fill",
  EYE_SLASH: "eye-slash",
  EYE_SLASH_FILL: "eye-slash-fill",
  FULLSCREEN: "fullscreen",
  FULLSCREEN_EXIT: "fullscreen-exit",
  ZOOM_IN: "zoom-in",
  ZOOM_OUT: "zoom-out",
  GRID: "grid",
  GRID_FILL: "grid-fill",
  LIST: "list",
  LIST_UL: "list-ul",
  LIST_OL: "list-ol",
  TABLE: "table",

  // Data & Storage
  DATABASE: "database",
  DATABASE_FILL: "database-fill",
  CLOUD: "cloud",
  CLOUD_FILL: "cloud-fill",
  CLOUD_UPLOAD: "cloud-upload",
  CLOUD_DOWNLOAD: "cloud-download",
  DOWNLOAD: "download",
  UPLOAD: "upload",
  BOX_ARROW_UP: "box-arrow-up",
  BOX_ARROW_DOWN: "box-arrow-in-down",
  BOX_ARROW_RIGHT: "box-arrow-right",
  BOX_ARROW_IN_RIGHT: "box-arrow-in-right",

  // Charts & Analytics
  BAR_CHART: "bar-chart",
  BAR_CHART_FILL: "bar-chart-fill",
  PIE_CHART: "pie-chart",
  PIE_CHART_FILL: "pie-chart-fill",
  GRAPH_UP: "graph-up",
  GRAPH_DOWN: "graph-down",
  SPEEDOMETER: "speedometer2",

  // Commerce
  CART: "cart",
  CART_FILL: "cart-fill",
  CURRENCY_DOLLAR: "currency-dollar",
  CASH: "cash",
  CREDIT_CARD: "credit-card",
  RECEIPT: "receipt",

  // Misc
  QR_CODE: "qr-code",
  BARCODE: "upc-scan",
  GEO_ALT: "geo-alt",
  GEO_ALT_FILL: "geo-alt-fill",
  PRINTER: "printer",
  PRINTER_FILL: "printer-fill",
  CLIPBOARD: "clipboard",
  CLIPBOARD_CHECK: "clipboard-check",
  CLIPBOARD_DATA: "clipboard-data",
  SAVE: "floppy",
  SAVE_FILL: "floppy-fill",
  LINK: "link",
  LINK_45DEG: "link-45deg",
  STAR: "star",
  STAR_FILL: "star-fill",
  HEART: "heart",
  HEART_FILL: "heart-fill",
  FLAG: "flag",
  FLAG_FILL: "flag-fill",
  TAG: "tag",
  TAG_FILL: "tag-fill",
  TAGS: "tags",
  TAGS_FILL: "tags-fill",
  GIFT: "gift",
  GIFT_FILL: "gift-fill",
  TROPHY: "trophy",
  TROPHY_FILL: "trophy-fill",
  LIGHTNING: "lightning",
  LIGHTNING_FILL: "lightning-fill",
  FIRE: "fire",
  BOOK: "book",
  JOURNAL_TEXT: "journal-text",
  INBOX: "inbox",
  INBOX_FILL: "inbox-fill",
  BOX: "box",
  SHOP: "shop",
  BUILDING: "building",

  // Tech
  CODE: "code",
  CODE_SLASH: "code-slash",
  BUG: "bug",
  BUG_FILL: "bug-fill",
  PLUG: "plug",
  GLOBE: "globe",
  WIFI: "wifi",
  PHONE: "phone",
  DISPLAY: "display",
  LAPTOP: "laptop",
  TABLET: "tablet",
  USB: "usb-symbol",

  // UI Elements
  THREE_DOTS: "three-dots",
  THREE_DOTS_VERTICAL: "three-dots-vertical",
  FUNNEL: "funnel",
  FUNNEL_FILL: "funnel-fill",
  SORT_ALPHA_DOWN: "sort-alpha-down",
  SORT_ALPHA_UP: "sort-alpha-up",
  SORT_DOWN: "sort-down",
  SORT_UP: "sort-up",
  ARROWS_EXPAND: "arrows-angle-expand",
  ARROWS_CONTRACT: "arrows-angle-contract",
  ARROW_LEFT_RIGHT: "arrow-left-right",

  // Form & Text
  UI_CHECKS: "ui-checks",
  CHECK_SQUARE: "check-square",
  SQUARE: "square",
  CIRCLE: "circle",
  CIRCLE_FILL: "circle-fill",
  TEXT_LEFT: "text-left",
  TEXT_CENTER: "text-center",
  TEXT_RIGHT: "text-right",
  TYPE_BOLD: "type-bold",
  TYPE_ITALIC: "type-italic",
  TYPE_UNDERLINE: "type-underline",
  TYPE_STRIKETHROUGH: "type-strikethrough",
  FONTS: "fonts",
  PALETTE: "palette",
  HIGHLIGHTER: "highlighter",

  // Special
  LOADING: "arrow-repeat", // Use with spin=true
  SYNC: "arrow-repeat", // Use with spin=true
  REFRESH: "arrow-clockwise",
  UNDO: "arrow-counterclockwise",
  REDO: "arrow-clockwise",
  COPY: "files",
  PASTE: "clipboard",
  CUT: "scissors",
  FILTER: "funnel",
  SORT: "sort-down",
  MENU: "list",
  MORE: "three-dots-vertical",
  OPTIONS: "sliders",
  SETTINGS: "gear",
  HOME: "house",
  USER: "person",
  USERS: "people",
  LOGOUT: "box-arrow-right",
  LOGIN: "box-arrow-in-right",
  EXPORT: "box-arrow-up",
  IMPORT: "box-arrow-in-down",
  PRINT: "printer",
  SAVE2: "save", // Alternative save icon
  HELP: "question-circle",
  INFO2: "info-lg",
  SUCCESS: "check-circle",
  ERROR: "x-circle",
  WARNING2: "exclamation-triangle",
} as const;
