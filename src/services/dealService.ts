import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { FinanceComparisonObject } from '../types/finance';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const DEALS_COLLECTION = 'deals';
const LOCAL_STORAGE_KEY = 'vehicle_finance_saved_deals_v2';
const LOCAL_STORAGE_ACTIVE_KEY = 'vehicle_finance_active_deal_v2';

/**
 * Recursively removes any undefined keys from an object before saving to Firestore.
 * Firestore strictly rejects undefined field values.
 */
function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj) return {};
  // JSON.stringify automatically strips any properties with undefined values
  const jsonString = JSON.stringify(obj, (_key, value) => (value === undefined ? undefined : value));
  return JSON.parse(jsonString);
}

function getSafeDocId(carName: string): string {
  const sanitized = (carName || 'deal').replace(/[^a-zA-Z0-9_\-]/g, '_');
  return sanitized.length > 0 ? sanitized : `deal_${Date.now()}`;
}

/**
 * Load saved deals from Firestore or localStorage fallback
 */
export async function loadDeals(): Promise<FinanceComparisonObject[] | null> {
  // Try loading from Firestore first
  try {
    const path = DEALS_COLLECTION;
    const snapshot = await getDocs(collection(db, path));
    if (!snapshot.empty) {
      const deals: FinanceComparisonObject[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as FinanceComparisonObject;
        if (data && data.car_name) {
          deals.push(data);
        }
      });

      if (deals.length > 0) {
        // Also update local storage for offline instant boot
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(deals));
        return deals;
      }
    }
  } catch (error) {
    console.warn('Firestore load warning, falling back to localStorage:', error);
  }

  // Fallback to localStorage
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse localStorage deals:', e);
  }

  return null;
}

/**
 * Save a single deal to Firestore and localStorage
 */
export async function saveDeal(deal: FinanceComparisonObject): Promise<void> {
  // Update localStorage immediately for zero latency
  try {
    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    let dealsArr: FinanceComparisonObject[] = existing ? JSON.parse(existing) : [];
    const idx = dealsArr.findIndex((d) => d.car_name === deal.car_name);
    if (idx >= 0) {
      dealsArr[idx] = deal;
    } else {
      dealsArr.unshift(deal);
    }
    if (deal.isMyCar) {
      dealsArr = dealsArr.map((d) => (d.car_name === deal.car_name ? d : { ...d, isMyCar: false }));
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dealsArr));
  } catch (e) {
    console.warn('localStorage save warning:', e);
  }

  // Persist to Firestore database
  const docId = getSafeDocId(deal.car_name);
  const path = `${DEALS_COLLECTION}/${docId}`;
  try {
    const payload = cleanForFirestore({
      ...deal,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(
      doc(db, DEALS_COLLECTION, docId),
      payload,
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Persist the entire array of saved deals to Firestore & localStorage
 */
export async function saveAllDeals(deals: FinanceComparisonObject[]): Promise<void> {
  // Update localStorage immediately
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(deals));
  } catch (e) {
    console.warn('localStorage saveAll error:', e);
  }

  // Persist batch to Firestore
  try {
    const batch = writeBatch(db);
    deals.forEach((deal) => {
      const docId = getSafeDocId(deal.car_name);
      const docRef = doc(db, DEALS_COLLECTION, docId);
      const payload = cleanForFirestore({
        ...deal,
        updatedAt: new Date().toISOString(),
      });
      batch.set(docRef, payload, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Batch sync to Firestore error:', error);
  }
}

/**
 * Delete a deal from Firestore & localStorage
 */
export async function deleteDeal(carName: string): Promise<void> {
  // Update localStorage
  try {
    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (existing) {
      const dealsArr: FinanceComparisonObject[] = JSON.parse(existing);
      const filtered = dealsArr.filter((d) => d.car_name !== carName);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('localStorage delete error:', e);
  }

  // Delete from Firestore
  const docId = getSafeDocId(carName);
  const path = `${DEALS_COLLECTION}/${docId}`;
  try {
    await deleteDoc(doc(db, DEALS_COLLECTION, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Active Deal local helper
 */
export function saveActiveDealName(carName: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, carName);
  } catch (e) {}
}

export function getActiveDealName(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
  } catch (e) {
    return null;
  }
}
