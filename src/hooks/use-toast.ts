
import { useToast as useShadcnToast, toast as shadcnToast } from "@/components/ui/toast";

// Re-export useToast hook from shadcn/ui
export const useToast = () => {
  return useShadcnToast();
};

// Re-export toast function
export const toast = shadcnToast;
