"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { cn } from "@/lib/utils";

interface CartButtonProps {
  storeSlug: string;
}

export function CartButton({ storeSlug }: CartButtonProps) {
  const [mounted, setMounted] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const totalItems = getTotalItems();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      href={`/store/${storeSlug}/cart`}
      className={cn(
        "relative w-11 h-11 rounded-xl bg-muted border border-border hover:border-primary/50 hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300",
        mounted && totalItems > 0 && "border-primary/40 text-primary shadow-[0_0_15px_rgba(27,79,216,0.15)]"
      )}
    >
      <ShoppingBag className="h-5 w-5" />
      {mounted && totalItems > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center px-1 border-2 border-white font-numbers animate-pulse">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
