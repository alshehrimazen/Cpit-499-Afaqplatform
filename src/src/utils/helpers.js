/**
 * Utility helper functions for Afaq Platform
 */

import { VALIDATION } from './constants';

/**
 * Validates an email address
 */
export const isValidEmail = (email) => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Validates a password
 */
export const isValidPassword = (password) => {
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
};

/**
 * Validates a name
 */
export const isValidName = (name) => {
  return (
    name.length >= VALIDATION.NAME_MIN_LENGTH &&
    name.length <= VALIDATION.NAME_MAX_LENGTH
  );
};

/**
 * Formats a date to Arabic locale
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Formats a date to short format
 */
export const formatDateShort = (date) => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Formats time duration in minutes
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }
  
  return `${hours} ساعة و ${remainingMinutes} دقيقة`;
};

/**
 * Calculates percentage
 */
export const calculatePercentage = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Generates a random ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Shuffles an array (Fisher-Yates algorithm)
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Delays execution
 */
export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Truncates text to specified length
 */
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Gets initials from a name
 */
export const getInitials = (name) => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

/**
 * Formats a number with Arabic numerals
 */
export const formatNumberArabic = (num) => {
  return new Intl.NumberFormat('ar-SA').format(num);
};

/**
 * Calculates grade based on score
 */
export const getGrade = (score) => {
  if (score >= 90) return 'ممتاز';
  if (score >= 80) return 'جيد جداً';
  if (score >= 70) return 'جيد';
  if (score >= 60) return 'مقبول';
  return 'ضعيف';
};

/**
 * Gets color class based on score
 */
export const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Gets progress color based on percentage
 */
export const getProgressColor = (percentage) => {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-blue-500';
  if (percentage >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout = null;

  return (...args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;

  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Clamps a number between min and max
 */
export const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

/**
 * Checks if device is mobile
 */
export const isMobile = () => {
  return window.innerWidth < 768;
};

/**
 * Scrolls to top of page
 */
export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

/**
 * Generates a range of numbers
 */
export const range = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Groups array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Calculates average of array of numbers
 */
export const average = (numbers) => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
};

/**
 * Converts seconds to MM:SS format
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Deep clones an object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Checks if two objects are equal
 */
export const isEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};
