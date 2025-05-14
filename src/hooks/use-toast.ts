
import { useToast as useShadcnToast } from "@/components/ui/use-toast";

export { toast } from "@/components/ui/use-toast";

// Re-export useToast hook from shadcn/ui
export const useToast = () => {
  return useShadcnToast();
};
