import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateOrderInput, type OrderResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";

export function useOrders() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: [api.orders.list.path],
    queryFn: async () => {
      const res = await fetch(api.orders.list.path, { credentials: "include" });
      
      if (res.status === 401) {
        throw new Error("401: Unauthorized");
      }
      
      if (!res.ok) throw new Error("Failed to fetch orders");
      
      const data = await res.json();
      return api.orders.list.responses[200].parse(data);
    },
  });
}

export function useOrder(id: number | null) {
  return useQuery({
    queryKey: [api.orders.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.orders.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch order");
      
      const data = await res.json();
      return api.orders.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const validated = api.orders.create.input.parse(data);
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (res.status === 401) {
        throw new Error("401: Unauthorized");
      }
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.orders.create.responses[400].parse(await res.json());
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create order");
      }

      const responseData = await res.json();
      return api.orders.create.responses[201].parse(responseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        redirectToLogin(toast);
      } else {
        toast({
          title: "Order Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });
}
