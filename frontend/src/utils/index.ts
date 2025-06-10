import { UPLOAD_CONFIG } from "@/constants";
import {
  formatDistanceToNow as formatDistanceToNowDateFns,
  formatRelative as formatRelativeDateFns,
  parseISO,
} from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// ===== DATE UTILITIES =====
export function formatDate(dateString: string, timeZone = "UTC"): string {
  try {
    const date = parseISO(dateString);
    return formatInTimeZone(date, timeZone, "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

export function formatDateTime(dateString: string, timeZone = "UTC"): string {
  try {
    const date = parseISO(dateString);
    return formatInTimeZone(date, timeZone, "MMM d, yyyy, HH:mm");
  } catch (error) {
    console.error("Error formatting date time:", error);
    return "Invalid date";
  }
}

export function formatRelativeTime(
  dateString: string,
  baseDate: Date = new Date()
): string {
  try {
    const date = parseISO(dateString);
    return formatRelativeDateFns(date, baseDate);
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Invalid date";
  }
}

export function formatDistanceToNow(date: string | Date): string {
  try {
    // Always treat string input as UTC, even if no 'Z' is present
    let dateObj: Date;
    if (typeof date === "string") {
      // If the string does not end with 'Z' or a timezone, append 'Z' to treat as UTC
      const iso = /[zZ]|[+-]\\d{2}:?\\d{2}$/.test(date) ? date : date + "Z";
      dateObj = parseISO(iso);
    } else {
      dateObj = date;
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zonedDate = toZonedTime(dateObj, timeZone);
    return formatDistanceToNowDateFns(zonedDate, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

// ===== FILE UTILITIES =====
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(
        UPLOAD_CONFIG.MAX_FILE_SIZE
      )}`,
    };
  }

  // Check file type
  if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Only PDF files are allowed",
    };
  }

  return { valid: true };
}

// ===== STRING UTILITIES =====
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function generateSessionTitle(firstMessage: string): string {
  const maxLength = 40;
  const cleaned = firstMessage.trim().replace(/\s+/g, " ");
  return truncateText(cleaned, maxLength);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ===== VALIDATION UTILITIES =====
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ===== STORAGE UTILITIES =====
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing storage item ${key}:`, error);
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage item ${key}:`, error);
  }
}

// ===== COPY TO CLIPBOARD =====
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

// ===== DEBOUNCE UTILITY =====
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ===== CSS CLASS UTILITIES =====
export function cn(
  ...classes: (string | undefined | null | boolean)[]
): string {
  return classes.filter(Boolean).join(" ");
}
