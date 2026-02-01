/**
 * Local Storage Service for Afaq Platform
 * Handles all localStorage operations
 */

import { STORAGE_KEYS } from '../utils/constants';

/**
 * Generic storage get function
 */
const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Generic storage set function
 */
const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
};

/**
 * Generic storage remove function
 */
const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
  }
};

/**
 * Clear all storage
 */
const clearAll = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// User Methods
export const saveUser = (user) => {
  setItem(STORAGE_KEYS.USER, user);
};

export const getUser = () => {
  return getItem(STORAGE_KEYS.USER);
};

export const removeUser = () => {
  removeItem(STORAGE_KEYS.USER);
};

// Study Plans Methods
export const saveStudyPlans = (plans) => {
  setItem(STORAGE_KEYS.STUDY_PLANS, plans);
};

export const getStudyPlans = () => {
  return getItem(STORAGE_KEYS.STUDY_PLANS) || [];
};

export const addStudyPlan = (plan) => {
  const plans = getStudyPlans();
  plans.push(plan);
  saveStudyPlans(plans);
};

export const updateStudyPlan = (planId, updates) => {
  const plans = getStudyPlans();
  const updatedPlans = plans.map((plan) =>
    plan.id === planId ? { ...plan, ...updates } : plan
  );
  saveStudyPlans(updatedPlans);
};

export const deleteStudyPlan = (planId) => {
  const plans = getStudyPlans();
  const filteredPlans = plans.filter((plan) => plan.id !== planId);
  saveStudyPlans(filteredPlans);
};

// Current Plan Methods
export const setCurrentPlan = (planId) => {
  setItem(STORAGE_KEYS.CURRENT_PLAN, planId);
};

export const getCurrentPlan = () => {
  return getItem(STORAGE_KEYS.CURRENT_PLAN);
};

export const removeCurrentPlan = () => {
  removeItem(STORAGE_KEYS.CURRENT_PLAN);
};

// Preferences Methods
export const savePreferences = (preferences) => {
  setItem(STORAGE_KEYS.PREFERENCES, preferences);
};

export const getPreferences = () => {
  return getItem(STORAGE_KEYS.PREFERENCES);
};

export const removePreferences = () => {
  removeItem(STORAGE_KEYS.PREFERENCES);
};

// Theme Methods
export const saveTheme = (theme) => {
  setItem(STORAGE_KEYS.THEME, theme);
};

export const getTheme = () => {
  return getItem(STORAGE_KEYS.THEME) || 'light';
};

// Language Methods
export const saveLanguage = (language) => {
  setItem(STORAGE_KEYS.LANGUAGE, language);
};

export const getLanguage = () => {
  return getItem(STORAGE_KEYS.LANGUAGE) || 'ar';
};

// Clear all app data
export const clearAppData = () => {
  removeUser();
  removeItem(STORAGE_KEYS.STUDY_PLANS);
  removeCurrentPlan();
  removePreferences();
};

export default {
  // User
  saveUser,
  getUser,
  removeUser,
  
  // Study Plans
  saveStudyPlans,
  getStudyPlans,
  addStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
  
  // Current Plan
  setCurrentPlan,
  getCurrentPlan,
  removeCurrentPlan,
  
  // Preferences
  savePreferences,
  getPreferences,
  removePreferences,
  
  // Theme & Language
  saveTheme,
  getTheme,
  saveLanguage,
  getLanguage,
  
  // Utility
  clearAppData,
  clearAll,
};
