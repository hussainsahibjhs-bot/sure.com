import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type ProductResponse } from "@shared/routes";

export function useProducts(params?: { search?: string; category?: string; isFeatured?: boolean }) {
  return useQuery({
    queryKey: [api.products.list.path, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.category) searchParams.append("category", params.category);
      if (params?.isFeatured !== undefined) searchParams.append("isFeatured", String(params.isFeatured));
      
      const queryString = searchParams.toString();
      const url = `${api.products.list.path}${queryString ? `?${queryString}` : ''}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      
      const data = await res.json();
      return api.products.list.responses[200].parse(data);
    },
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      
      const data = await res.json();
      return api.products.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}
