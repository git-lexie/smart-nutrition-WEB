

/**
 * Interface representing the Meal Log structure
 * Consistent with the hybrid schema for IndexedDB to MongoDB sync.
 */
import Dexie, { Table } from 'dexie';
export interface MealLog {
  id?: number;
  local_user_id: string; // Linking to MongoDB User collection
  timestamp: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_items: any[]; // Food items array
  pendingSync: boolean; // Flag used by Service Worker Sync Manager
}

class NutritionDatabase extends Dexie {
  mealLogs!: Table<MealLog>;
  
  constructor() {
    super('SmartNutritionDB');
    this.version(1).stores({
      mealLogs: '++id, local_user_id, timestamp, pendingSync'
    });
  }
}

export const db = new NutritionDatabase();

/**
 * Aliased functions to match your requested import:
 * import { saveOfflineSession, getOfflineSessions, clearSyncedSessions } from '@/lib/db';
 */

// Save logic (aliased as saveOfflineSession)
export const saveOfflineSession = async (data: Omit<MealLog, 'pendingSync'>) => {
  return await db.mealLogs.add({ 
    ...data, 
    pendingSync: true 
  });
};

// Retrieve logic (aliased as getOfflineSessions)
export const getOfflineSessions = async (): Promise<MealLog[]> => {
  return await db.mealLogs.where('pendingSync').equals(1).toArray();
};

// Clear logic (aliased as clearSyncedSessions)
// Note: This removes records to keep the DB clean
export const clearSyncedSessions = async (ids: number[]) => {
  return await db.mealLogs.bulkDelete(ids);
};

// Fallback status updater
export const markAsSynced = async (ids: number[]) => {
  return await db.mealLogs.where('id').anyOf(ids).modify({ pendingSync: false });
};