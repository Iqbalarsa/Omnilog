"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?bookId=${id}`);
  }, [id, router]);

  return (
    <div className="py-24 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
      <span className="text-xs font-medium text-muted-theme">
        Loading reading workspace...
      </span>
    </div>
  );
}
