export const parseSqlDatetimeAsUtc = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const raw = String(value).trim();

  // SQL DATETIME mặc định SQLite trả về dạng "YYYY-MM-DD HH:MM:SS"
  // Trong trường hợp này, ta cần hiểu đó là thời gian UTC, rồi convert về local.
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)) {
    return new Date(raw.replace(' ', 'T') + 'Z');
  }

  // Dạng chỉ ngày
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T00:00:00Z`);
  }

  // Dạng ISO có timezone hoặc offset: dùng trực tiếp
  return new Date(raw);
};

export const formatDateTimeVN = (value) => {
  const date = parseSqlDatetimeAsUtc(value);
  if (!date || Number.isNaN(date.getTime())) {
    return String(value || '');
  }
  return date.toLocaleString('vi-VN');
};
