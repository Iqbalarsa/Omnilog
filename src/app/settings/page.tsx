"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SettingsModal from "@/components/SettingsModal";

export default function SettingsPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/");
  };

  return (
    <div className="py-24 text-center">
      <SettingsModal isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}
