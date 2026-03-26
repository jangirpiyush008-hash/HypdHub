"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreatorAuth } from "@/components/auth-provider";

export function AuthenticatedHomeRedirect() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useCreatorAuth();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/deals");
    }
  }, [isAuthenticated, isReady, router]);

  return null;
}
