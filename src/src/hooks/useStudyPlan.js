/**
 * Custom hook for managing study plans
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getStudyPlans,
  saveStudyPlans,
  addStudyPlan as addPlanToStorage,
  updateStudyPlan as updatePlanInStorage,
  deleteStudyPlan as deletePlanFromStorage,
} from '../services/storage.service';

export const useStudyPlan = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load plans from localStorage on mount
  useEffect(() => {
    try {
      const savedPlans = getStudyPlans();
      setPlans(savedPlans);
    } catch (err) {
      setError('فشل تحميل الخطط الدراسية');
      console.error('Error loading study plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new study plan
  const createPlan = useCallback((plan) => {
    try {
      addPlanToStorage(plan);
      setPlans((prev) => [...prev, plan]);
      return true;
    } catch (err) {
      setError('فشل إنشاء الخطة الدراسية');
      console.error('Error creating study plan:', err);
      return false;
    }
  }, []);

  // Update an existing study plan
  const updatePlan = useCallback((planId, updates) => {
    try {
      updatePlanInStorage(planId, updates);
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === planId ? { ...plan, ...updates } : plan
        )
      );
      return true;
    } catch (err) {
      setError('فشل تحديث الخطة الدراسية');
      console.error('Error updating study plan:', err);
      return false;
    }
  }, []);

  // Delete a study plan
  const deletePlan = useCallback((planId) => {
    try {
      deletePlanFromStorage(planId);
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));
      return true;
    } catch (err) {
      setError('فشل حذف الخطة الدراسية');
      console.error('Error deleting study plan:', err);
      return false;
    }
  }, []);

  // Get a specific plan by ID
  const getPlan = useCallback(
    (planId) => {
      return plans.find((plan) => plan.id === planId);
    },
    [plans]
  );

  // Mark a module as completed
  const completeModule = useCallback(
    (planId, moduleId) => {
      const plan = getPlan(planId);
      if (!plan) return false;

      const updatedModules = [...plan.completedModules];
      if (!updatedModules.includes(moduleId)) {
        updatedModules.push(moduleId);
      }

      // Assuming 5 modules per plan (adjust as needed)
      const completionPercentage = Math.round(
        (updatedModules.length / 5) * 100
      );

      return updatePlan(planId, {
        completedModules: updatedModules,
        completionPercentage,
        status: completionPercentage === 100 ? 'completed' : 'in-progress',
      });
    },
    [getPlan, updatePlan]
  );

  // Add or update quiz score
  const updateQuizScore = useCallback(
    (planId, moduleId, score) => {
      const plan = getPlan(planId);
      if (!plan) return false;

      const updatedScores = {
        ...plan.quizScores,
        [moduleId]: score,
      };

      return updatePlan(planId, {
        quizScores: updatedScores,
      });
    },
    [getPlan, updatePlan]
  );

  // Get average quiz score for a plan
  const getAverageScore = useCallback(
    (planId) => {
      const plan = getPlan(planId);
      if (!plan) return 0;

      const scores = Object.values(plan.quizScores);
      if (scores.length === 0) return 0;

      return Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );
    },
    [getPlan]
  );

  // Get plans by status
  const getPlansByStatus = useCallback(
    (status) => {
      return plans.filter((plan) => plan.status === status);
    },
    [plans]
  );

  // Get plans by level
  const getPlansByLevel = useCallback(
    (level) => {
      return plans.filter((plan) => plan.level === level);
    },
    [plans]
  );

  return {
    plans,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    getPlan,
    completeModule,
    updateQuizScore,
    getAverageScore,
    getPlansByStatus,
    getPlansByLevel,
  };
};
