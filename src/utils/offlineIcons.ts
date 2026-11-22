/**
 * Icon Iconify dùng trong app, nhúng sẵn vào bundle để hiển thị cả khi mất mạng (OF-14).
 *
 * @iconify/react mặc định tải SVG từ api.iconify.design lúc chạy; Service Worker không cache
 * domain đó nên offline không có icon (vd. mũi tên mở nhánh trong modal Chọn chỉ tiêu).
 * Dữ liệu dưới đây là SVG gốc lấy từ chính Iconify (bộ mdi + bi) nên hình hiển thị y hệt bản online.
 *
 * Thêm icon mới: lấy JSON từ https://api.iconify.design/<prefix>.json?icons=<tên> rồi bổ sung vào đây.
 */
import { addCollection, type IconifyJSON } from "@iconify/react";

const mdi: IconifyJSON = {
  "prefix": "mdi",
  "width": 24,
  "height": 24,
  "icons": {
    "cellphone-arrow-down": {
      "body": "<path fill=\"currentColor\" d=\"M17 1H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2m0 18H7V5h10zm-1-6h-3V8h-2v5H8l4 4z\"/>"
    },
    "check": {
      "body": "<path fill=\"currentColor\" d=\"M21 7L9 19l-5.5-5.5l1.41-1.41L9 16.17L19.59 5.59z\"/>"
    },
    "chevron-down": {
      "body": "<path fill=\"currentColor\" d=\"M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z\"/>"
    },
    "chevron-right": {
      "body": "<path fill=\"currentColor\" d=\"M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6z\"/>"
    },
    "clipboard-check-outline": {
      "body": "<path fill=\"currentColor\" d=\"M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-7 0a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1M7 7h10V5h2v14H5V5h2zm.5 6.5L9 12l2 2l4.5-4.5L17 11l-6 6z\"/>"
    },
    "close": {
      "body": "<path fill=\"currentColor\" d=\"M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z\"/>"
    },
    "flask-empty-outline": {
      "body": "<path fill=\"currentColor\" d=\"M5 19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1c0-.21-.07-.41-.18-.57L13 8.35V4h-2v4.35L5.18 18.43c-.11.16-.18.36-.18.57m1 3a3 3 0 0 1-3-3c0-.6.18-1.16.5-1.63L9 7.81V6a1 1 0 0 1-1-1V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1v1.81l5.5 9.56c.32.47.5 1.03.5 1.63a3 3 0 0 1-3 3z\"/>"
    },
    "flask-outline": {
      "body": "<path fill=\"currentColor\" d=\"M5 19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1c0-.21-.07-.41-.18-.57L13 8.35V4h-2v4.35L5.18 18.43c-.11.16-.18.36-.18.57m1 3a3 3 0 0 1-3-3c0-.6.18-1.16.5-1.63L9 7.81V6a1 1 0 0 1-1-1V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1v1.81l5.5 9.56c.32.47.5 1.03.5 1.63a3 3 0 0 1-3 3zm7-6l1.34-1.34L16.27 18H7.73l2.66-4.61zm-.5-4a.5.5 0 0 1 .5.5a.5.5 0 0 1-.5.5a.5.5 0 0 1-.5-.5a.5.5 0 0 1 .5-.5\"/>"
    },
    "office-building": {
      "body": "<path fill=\"currentColor\" d=\"M5 3v18h6v-3.5h2V21h6V3zm2 2h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm8 0h2v2h-2z\"/>"
    },
    "send": {
      "body": "<path fill=\"currentColor\" d=\"m2 21l21-9L2 3v7l15 2l-15 2z\"/>"
    },
    "unfold-more-horizontal": {
      "body": "<path fill=\"currentColor\" d=\"M12 18.17L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15M12 5.83L15.17 9l1.41-1.41L12 3L7.41 7.59L8.83 9z\"/>"
    }
  }
};

const bi: IconifyJSON = {
  "prefix": "bi",
  "icons": {
    "send": {
      "body": "<path fill=\"currentColor\" d=\"M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z\"/>"
    }
  }
};

export function registerOfflineIcons(): void {
  addCollection(mdi);
  addCollection(bi);
}
