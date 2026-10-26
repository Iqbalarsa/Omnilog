"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Mail,
  Palette,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  Laptop,
  Send,
} from "lucide-react";
import { useTheme, ThemeColor, ThemeMode } from "@/context/ThemeContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const {
    themeMode,
    themeColor,
    customColor1,
    customColor2,
    customColor3,
    setThemeMode,
    setThemeColor,
    setCustomColor1,
    setCustomColor2,
    setCustomColor3,
  } = useTheme();

  const [hexInput1, setHexInput1] = useState(customColor1 || "#5865F2");
  const [hexInput2, setHexInput2] = useState(customColor2 || "#34A853");
  const [hexInput3, setHexInput3] = useState(customColor3 || "#8B5CF6");

  useEffect(() => {
    if (customColor1) setHexInput1(customColor1);
  }, [customColor1]);

  useEffect(() => {
    if (customColor2) setHexInput2(customColor2);
  }, [customColor2]);

  useEffect(() => {
    if (customColor3) setHexInput3(customColor3);
  }, [customColor3]);

  const [reminderEmail, setReminderEmail] = useState("iqbalarsa99@gmail.com");
  const [reminderTime, setReminderTime] = useState("20:30");
  const [isReminderActive, setIsReminderActive] = useState(true);

  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [hasRealSmtp, setHasRealSmtp] = useState(false);
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/preferences")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            if (data.reminderEmail) setReminderEmail(data.reminderEmail);
            if (data.reminderTime) setReminderTime(data.reminderTime);
            if (data.isReminderActive !== undefined)
              setIsReminderActive(data.isReminderActive);
            if (data.smtpUser) setSmtpUser(data.smtpUser);
            if (data.hasRealSmtp !== undefined) setHasRealSmtp(data.hasRealSmtp);
          }
        })
        .catch((err) => console.error("Preferences load error:", err));
    }
  }, [isOpen]);

  // Mount effect for SSR-safe portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderEmail: reminderEmail.trim(),
          reminderTime,
          isReminderActive,
          themeMode,
          themeColor,
          customColor1: hexInput1.startsWith("#") ? hexInput1 : `#${hexInput1}`,
          customColor2: hexInput2.startsWith("#") ? hexInput2 : `#${hexInput2}`,
          customColor3: hexInput3.startsWith("#") ? hexInput3 : `#${hexInput3}`,
          smtpUser: smtpUser.trim() || undefined,
          smtpPass: smtpPass.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await res.json();
      if (data.hasRealSmtp !== undefined) setHasRealSmtp(data.hasRealSmtp);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestReminder = async () => {
    if (!reminderEmail || !reminderEmail.includes("@")) {
      setTestResult({
        success: false,
        message: "Please enter a valid email address first.",
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/reminder/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reminderEmail.trim() }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Network error sending test",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-3xl border border-white/80 dark:border-white/[0.1] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-subtle-theme">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-main">Preferences</h2>
            <p className="text-xs text-muted-theme mt-0.5">
              Customize reading reminders and appearance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-theme hover:text-accent-theme hover:bg-accent-light-theme transition-colors apple-press cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-main">
          {saveSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Preferences saved successfully!
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4" />
              {saveError}
            </div>
          )}

          {/* Theme Mode Segmented Control */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-theme">
              Appearance
            </label>
            <div className="apple-segmented-container w-full p-1">
              {[
                { id: "light" as ThemeMode, label: "Light", icon: Sun },
                { id: "dark" as ThemeMode, label: "Dark", icon: Moon },
                { id: "system" as ThemeMode, label: "System", icon: Laptop },
              ].map((mode) => {
                const Icon = mode.icon;
                const isSelected = themeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setThemeMode(mode.id)}
                    className={`flex-1 py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-surface text-main font-semibold shadow-xs"
                        : "text-muted-theme hover:text-main"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Palette Selector */}
          <div className="space-y-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-theme flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Accent Theme</span>
            </label>
            {/* 6-Card Theme Grid (3 Defaults + 3 Directly Editable Customs) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Apple Blue */}
              <button
                type="button"
                onClick={() => setThemeColor("slate")}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all apple-press cursor-pointer ${
                  themeColor === "slate"
                    ? "border-accent-theme bg-accent-light-theme shadow-2xs"
                    : "border-subtle-theme bg-surface hover:bg-accent-light-theme/30"
                }`}
              >
                <div
                  className="w-4.5 h-4.5 rounded-full shadow-2xs shrink-0"
                  style={{ backgroundColor: "#007AFF" }}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-main text-xs truncate">Apple Blue</div>
                  <div className="text-[10px] text-muted-theme truncate">System Blue</div>
                </div>
              </button>

              {/* 2. Warm Orange */}
              <button
                type="button"
                onClick={() => setThemeColor("amber")}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all apple-press cursor-pointer ${
                  themeColor === "amber"
                    ? "border-accent-theme bg-accent-light-theme shadow-2xs"
                    : "border-subtle-theme bg-surface hover:bg-accent-light-theme/30"
                }`}
              >
                <div
                  className="w-4.5 h-4.5 rounded-full shadow-2xs shrink-0"
                  style={{ backgroundColor: "#FF9F0A" }}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-main text-xs truncate">Warm Orange</div>
                  <div className="text-[10px] text-muted-theme truncate">MacBook Orange</div>
                </div>
              </button>

              {/* 3. Coral Red */}
              <button
                type="button"
                onClick={() => setThemeColor("rose")}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all apple-press cursor-pointer ${
                  themeColor === "rose"
                    ? "border-accent-theme bg-accent-light-theme shadow-2xs"
                    : "border-subtle-theme bg-surface hover:bg-accent-light-theme/30"
                }`}
              >
                <div
                  className="w-4.5 h-4.5 rounded-full shadow-2xs shrink-0"
                  style={{ backgroundColor: "#EA4335" }}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-main text-xs truncate">Coral Red</div>
                  <div className="text-[10px] text-muted-theme truncate">Vibrant Red</div>
                </div>
              </button>

              {/* 4. Custom 1 (Editable inline) */}
              <div
                onClick={() => setThemeColor("custom1")}
                className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  themeColor === "custom1"
                    ? "border-accent-theme bg-accent-light-theme shadow-2xs"
                    : "border-subtle-theme bg-surface hover:bg-accent-light-theme/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="relative w-4.5 h-4.5 rounded-full shadow-2xs shrink-0 border border-black/10 dark:border-white/10 cursor-pointer overflow-hidden"
                      style={{ backgroundColor: hexInput1.startsWith("#") ? hexInput1 : `#${hexInput1}` }}
                      title="Click to pick color"
                    >
                      <input
                        type="color"
                        value={hexInput1.startsWith("#") && hexInput1.length === 7 ? hexInput1 : customColor1}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHexInput1(val);
                          setCustomColor1(val);
                          setThemeColor("custom1");
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -top-2 -left-2 w-9 h-9 cursor-pointer opacity-0"
                      />
                    </div>
                    <span className="font-semibold text-main text-xs">Custom 1</span>
                  </div>
                  {themeColor === "custom1" && (
                    <span className="text-[9px] font-bold text-accent-theme uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>

                <div
                  className="relative flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="absolute left-2 text-[11px] font-mono font-bold text-muted-theme select-none">
                    #
                  </span>
                  <input
                    type="text"
                    value={hexInput1.startsWith("#") ? hexInput1.slice(1) : hexInput1}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                      const formatted = raw ? `#${raw}` : "";
                      setHexInput1(formatted);
                      if (raw.length === 6 || raw.length === 3) {
                        setCustomColor1(formatted);
                        setThemeColor("custom1");
                      }
                    }}
                    placeholder="5865F2"
                    maxLength={6}
                    className="w-full pl-5 pr-2 py-0.5 rounded-lg apple-input text-main text-[11px] uppercase font-mono tracking-wider focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 5. Custom 2 (Editable inline) */}
              <div
                onClick={() => setThemeColor("custom2")}
                className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  themeColor === "custom2"
                    ? "border-accent-theme bg-accent-light-theme shadow-2xs"
                    : "border-subtle-theme bg-surface hover:bg-accent-light-theme/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="relative w-4.5 h-4.5 rounded-full shadow-2xs shrink-0 border border-black/10 dark:border-white/10 cursor-pointer overflow-hidden"
                      style={{ backgroundColor: hexInput2.startsWith("#") ? hexInput2 : `#${hexInput2}` }}
                      title="Click to pick color"
                    >
                      <input
                        type="color"
                        value={hexInput2.startsWith("#") && hexInput2.length === 7 ? hexInput2 : customColor2}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHexInput2(val);
                          setCustomColor2(val);
                          setThemeColor("custom2");
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -top-2 -left-2 w-9 h-9 cursor-pointer opacity-0"
                      />
                    </div>
                    <span className="font-semibold text-main text-xs">Custom 2</span>
                  </div>
                  {themeColor === "custom2" && (
                    <span className="text-[9px] font-bold text-accent-theme uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>

                <div
                  className="relative flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="absolute left-2 text-[11px] font-mono font-bold text-muted-theme select-none">
                    #
                  </span>
                  <input
                    type="text"
                    value={hexInput2.startsWith("#") ? hexInput2.slice(1) : hexInput2}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                      const formatted = raw ? `#${raw}` : "";
                      setHexInput2(formatted);
                      if (raw.length === 6 || raw.length === 3) {
                        setCustomColor2(formatted);
                        setThemeColor("custom2");
                      }
                    }}
                    placeholder="34A853"
                    maxLength={6}
                    className="w-full pl-5 pr-2 py-0.5 rounded-lg apple-input text-main text-[11px] uppercase font-mono tracking-wider focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 6. Custom 3 (Editable inline) */}
              <div
                onClick={() => setThemeColor("custom3")}
                className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  themeColor === "custom3"
                    ? "border-accent-theme bg-accent-light-theme shadow-2xs"
                    : "border-subtle-theme bg-surface hover:bg-accent-light-theme/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="relative w-4.5 h-4.5 rounded-full shadow-2xs shrink-0 border border-black/10 dark:border-white/10 cursor-pointer overflow-hidden"
                      style={{ backgroundColor: hexInput3.startsWith("#") ? hexInput3 : `#${hexInput3}` }}
                      title="Click to pick color"
                    >
                      <input
                        type="color"
                        value={hexInput3.startsWith("#") && hexInput3.length === 7 ? hexInput3 : customColor3}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHexInput3(val);
                          setCustomColor3(val);
                          setThemeColor("custom3");
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -top-2 -left-2 w-9 h-9 cursor-pointer opacity-0"
                      />
                    </div>
                    <span className="font-semibold text-main text-xs">Custom 3</span>
                  </div>
                  {themeColor === "custom3" && (
                    <span className="text-[9px] font-bold text-accent-theme uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>

                <div
                  className="relative flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="absolute left-2 text-[11px] font-mono font-bold text-muted-theme select-none">
                    #
                  </span>
                  <input
                    type="text"
                    value={hexInput3.startsWith("#") ? hexInput3.slice(1) : hexInput3}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                      const formatted = raw ? `#${raw}` : "";
                      setHexInput3(formatted);
                      if (raw.length === 6 || raw.length === 3) {
                        setCustomColor3(formatted);
                        setThemeColor("custom3");
                      }
                    }}
                    placeholder="8B5CF6"
                    maxLength={6}
                    className="w-full pl-5 pr-2 py-0.5 rounded-lg apple-input text-main text-[11px] uppercase font-mono tracking-wider focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-subtle-theme my-2" />

          {/* Email Reading Accountability Reminders */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-main text-xs flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-accent-theme" />
                  <span>Daily Reading Reminders</span>
                </h3>
                <p className="text-[11px] text-muted-theme mt-0.5">
                  Automated email prompt to maintain your streak
                </p>
              </div>

              {/* iOS Style Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReminderActive}
                  onChange={(e) => setIsReminderActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 dark:bg-white/[0.15] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34c759]"></div>
              </label>
            </div>

            <div className="space-y-3.5 bg-zinc-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.value)}
                  placeholder="e.g. iqbalarsa99@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                  Reminder Time (Daily)
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                />
              </div>

              {/* Optional SMTP Live Sender Configuration */}
              <div className="pt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                  className="text-[11px] font-semibold text-accent-theme hover:underline flex items-center justify-between w-full py-1 cursor-pointer"
                >
                  <span>
                    {showSmtpConfig ? "▾ Hide SMTP Sender Settings" : "▸ Configure Sender Gmail & App Password (for Live Inbox Delivery)"}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    hasRealSmtp
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}>
                    {hasRealSmtp ? "Live SMTP Active" : "Local Simulation Mode"}
                  </span>
                </button>

                {showSmtpConfig && (
                  <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] space-y-2.5 animate-in fade-in duration-150">
                    <p className="text-[11px] text-muted-theme leading-relaxed">
                      To receive live emails directly in your inbox, enter your Gmail and a free 16-character <strong>Google App Password</strong> (generated from <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-accent-theme underline">Google Account &gt; Security &gt; App Passwords</a>).
                    </p>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-theme uppercase tracking-wider mb-0.5">
                        Sender Gmail (EMAIL_SERVER_USER)
                      </label>
                      <input
                        type="email"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="your-gmail@gmail.com"
                        className="w-full px-3 py-1.5 rounded-lg apple-input text-main text-xs focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-theme uppercase tracking-wider mb-0.5">
                        Google App Password (EMAIL_SERVER_PASSWORD)
                      </label>
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="16-character app password (e.g. abcd efgh ijkl mnop)"
                        className="w-full px-3 py-1.5 rounded-lg apple-input text-main text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Test Email Button */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSendTestReminder}
                  disabled={isSendingTest}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface hover:bg-accent-light-theme hover:text-accent-tint hover:border-accent-border-theme border border-subtle-theme text-xs font-medium text-main transition-all apple-press cursor-pointer disabled:opacity-50 self-start"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Test...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-accent-theme" />
                      <span>Send Instant Test Email</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      testResult.isRealDelivery
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        : testResult.success
                        ? "bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    }`}
                  >
                    {testResult.isRealDelivery ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    ) : testResult.success ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle-theme">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-theme hover:bg-accent-light-theme hover:text-accent-tint transition-colors apple-press"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-accent-theme hover:bg-accent-hover-theme text-white font-medium text-xs shadow-xs transition-all apple-press cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
