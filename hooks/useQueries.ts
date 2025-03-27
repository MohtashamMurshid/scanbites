import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@clerk/clerk-expo";

// Types
export type FoodScan = {
  id: string;
  foodName: string;
  calories: string;
  caloriesNum: number;
  protein: string;
  proteinNum: number;
  carbs: string;
  carbsNum: number;
  fat: string;
  fatNum: number;
  imageUrl: string;
  timestamp: Timestamp;
  scanDate: string;
  allergens?: string[];
  isConsumed?: boolean;
  ingredients?: string[];
  additionalInfo?: string;
  healthTips?: string;
  personalizedRecommendation?: string;
};

export type UserPreferences = {
  dietaryPreferences: Record<number, string | string[]>;
  completedAt: string;
};

// Queries
export const useRecentScans = (limitCount?: number) => {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["recentScans", userId],
    queryFn: async () => {
      if (!userId) return [];

      const scansRef = collection(db, "nutritionData");
      const q = query(
        scansRef,
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        ...(limitCount ? [limit(limitCount)] : [])
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FoodScan[];
    },
    enabled: !!userId,
  });
};

export const useConsumedScans = () => {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["consumedScans", userId],
    queryFn: async () => {
      if (!userId) return [];

      const scansRef = collection(db, "nutritionData");
      const q = query(
        scansRef,
        where("userId", "==", userId),
        where("isConsumed", "==", true),
        orderBy("timestamp", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FoodScan[];
    },
    enabled: !!userId,
  });
};

export const useFoodDetail = (id: string) => {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["foodDetail", id],
    queryFn: async () => {
      if (!id) throw new Error("Food ID is required");

      const docRef = doc(db, "nutritionData", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Food not found");
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as FoodScan;
    },
    enabled: !!id && !!userId,
  });
};

export const useUserPreferences = () => {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["userPreferences", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const docRef = doc(db, "userPreferences", userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data() as UserPreferences;
    },
    enabled: !!userId,
  });
};

// Mutations
export const useMarkAsConsumed = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const docRef = doc(db, "nutritionData", id);
      await updateDoc(docRef, {
        isConsumed: true,
        consumedAt: Timestamp.now(),
      });
      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["recentScans", userId] });
      queryClient.invalidateQueries({ queryKey: ["consumedScans", userId] });
    },
  });
};

export const useDeleteScans = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        const docRef = doc(db, "nutritionData", id);
        batch.delete(docRef);
      });
      await batch.commit();
      return ids;
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["recentScans", userId] });
      queryClient.invalidateQueries({ queryKey: ["consumedScans", userId] });
    },
  });
};
