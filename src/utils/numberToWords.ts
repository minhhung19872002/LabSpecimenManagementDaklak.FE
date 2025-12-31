// Vietnamese number to words converter
const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];

function readTwoDigits(num: number): string {
  if (num < 10) return units[num];
  if (num < 20) {
    const unit = num % 10;
    if (unit === 0) return 'mười';
    if (unit === 5) return 'mười lăm';
    return 'mười ' + units[unit];
  }
  const ten = Math.floor(num / 10);
  const unit = num % 10;
  if (unit === 0) return tens[ten];
  if (unit === 1) return tens[ten] + ' mốt';
  if (unit === 5) return tens[ten] + ' lăm';
  return tens[ten] + ' ' + units[unit];
}

function readThreeDigits(num: number): string {
  if (num < 100) return readTwoDigits(num);
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  if (remainder === 0) return units[hundred] + ' trăm';
  if (remainder < 10) return units[hundred] + ' trăm lẻ ' + units[remainder];
  return units[hundred] + ' trăm ' + readTwoDigits(remainder);
}

export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'không đồng';
  if (num < 0) return 'âm ' + numberToVietnameseWords(-num);

  // Round to integer
  num = Math.round(num);

  const parts: string[] = [];

  // Billions (tỷ)
  if (num >= 1000000000) {
    const billions = Math.floor(num / 1000000000);
    parts.push(readThreeDigits(billions) + ' tỷ');
    num %= 1000000000;
  }

  // Millions (triệu)
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    parts.push(readThreeDigits(millions) + ' triệu');
    num %= 1000000;
  }

  // Thousands (nghìn/ngàn)
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    parts.push(readThreeDigits(thousands) + ' nghìn');
    num %= 1000;
  }

  // Hundreds and below
  if (num > 0) {
    parts.push(readThreeDigits(num));
  }

  // Capitalize first letter
  const result = parts.join(' ').trim() + ' đồng';
  return result.charAt(0).toUpperCase() + result.slice(1);
}
