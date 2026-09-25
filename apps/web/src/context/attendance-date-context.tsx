"use client";

import * as React from "react";

interface AttendanceDateContextType {
  activeDate: string; // ISO: YYYY-MM-DD
  activeDayName: string; // SENIN, SELASA, dsb.
  formattedDisplayDate: string; // Contoh: "23 September 2026"
  fullDisplayDate: string; // Contoh: "Rabu, 23 September 2026"
  changeActiveDate: (newDate: string) => void;
  changeDayRelative: (deltaDays: number) => void;
  resetDateToToday: () => void;
}

const AttendanceDateContext = React.createContext<AttendanceDateContextType | undefined>(undefined);

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function getDayName(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return DAY_NAMES[d.getDay()] || "Hari";
}

function formatIndoDate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = MONTH_NAMES[parseInt(parts[1], 10) - 1] || parts[1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
  }
  return isoDate;
}

export function AttendanceDateProvider({ children }: { children: React.ReactNode }) {
  // Default tanggal awal sesuai prototipe
  const [activeDate, setActiveDate] = React.useState<string>("2026-09-23");

  const activeDayName = React.useMemo(() => getDayName(activeDate).toUpperCase(), [activeDate]);
  const formattedDisplayDate = React.useMemo(() => formatIndoDate(activeDate), [activeDate]);
  const fullDisplayDate = React.useMemo(() => `${getDayName(activeDate)}, ${formattedDisplayDate}`, [activeDate, formattedDisplayDate]);

  const changeActiveDate = React.useCallback((newDate: string) => {
    if (!newDate) return;
    setActiveDate(newDate);
  }, []);

  const changeDayRelative = React.useCallback((deltaDays: number) => {
    setActiveDate((prev) => {
      const current = new Date(prev + "T00:00:00");
      current.setDate(current.getDate() + deltaDays);
      return current.toISOString().split("T")[0];
    });
  }, []);

  const resetDateToToday = React.useCallback(() => {
    setActiveDate("2026-09-23");
  }, []);

  return (
    <AttendanceDateContext.Provider
      value={{
        activeDate,
        activeDayName,
        formattedDisplayDate,
        fullDisplayDate,
        changeActiveDate,
        changeDayRelative,
        resetDateToToday,
      }}
    >
      {children}
    </AttendanceDateContext.Provider>
  );
}

export function useAttendanceDate() {
  const context = React.useContext(AttendanceDateContext);
  if (!context) {
    throw new Error("useAttendanceDate must be used within an AttendanceDateProvider");
  }
  return context;
}
