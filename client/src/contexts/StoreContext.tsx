import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { setCurrentStoreId } from "@/lib/queryClient";
import type { Store } from "@shared/schema";

interface StoreContextType {
  currentStore: Store | null;
  stores: Store[];
  setCurrentStore: (store: Store) => void;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);

  // Fetch all stores
  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ['/api/stores'],
  });

  // Set the first store as default when stores are loaded
  useEffect(() => {
    if (stores.length > 0 && !currentStore) {
      const savedStoreId = localStorage.getItem('currentStoreId');
      const savedStore = stores.find((store: Store) => store.id === savedStoreId);
      setCurrentStore(savedStore || stores[0]);
    }
  }, [stores, currentStore]);

  // Save current store to localStorage and sync with queryClient
  useEffect(() => {
    if (currentStore) {
      localStorage.setItem('currentStoreId', currentStore.id);
      setCurrentStoreId(currentStore.id);
    } else {
      setCurrentStoreId(null);
    }
  }, [currentStore]);

  const handleSetCurrentStore = (store: Store) => {
    setCurrentStore(store);
    // Immediately sync with queryClient to ensure API calls include the new storeId
    setCurrentStoreId(store.id);
  };

  return (
    <StoreContext.Provider 
      value={{ 
        currentStore, 
        stores, 
        setCurrentStore: handleSetCurrentStore, 
        isLoading 
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}