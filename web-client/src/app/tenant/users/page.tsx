"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tenant/staff?tab=permissions");
  }, [router]);

  return (
    <div className="py-24 text-center space-y-3">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
      <p className="text-xs font-bold text-slate-500">Redirecting to Users & RBAC Permissions in Staff Management...</p>
    </div>
  );
}
