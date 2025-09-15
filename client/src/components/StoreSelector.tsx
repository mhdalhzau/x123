import { Store, MapPin, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/contexts/StoreContext";

export function StoreSelector() {
  const { currentStore, stores, setCurrentStore, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <MapPin className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!currentStore || stores.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span className="text-sm">No store selected</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 h-9"
          data-testid="store-selector"
        >
          <MapPin className="h-4 w-4" />
          <span className="font-medium">{currentStore.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            onClick={() => setCurrentStore(store)}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`store-option-${store.id}`}
          >
            <div className="flex flex-col">
              <span className="font-medium">{store.name}</span>
              {store.address && (
                <span className="text-xs text-muted-foreground">
                  {store.address}
                </span>
              )}
            </div>
            {currentStore.id === store.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}