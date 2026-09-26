"use client";

import * as React from "react";

export type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpa";

export interface StudentAttendance {
  id: string | number;
  name: string;
  nis: string;
  status: AttendanceStatus;
  note?: string;
}

export interface TeachingSession {
  id: string;
  classId: string;
  code: string;
  className: string;
  subject: string;
  room: string;
  jam: string;
  status: "Belum Disubmit" | "Selesai";
  submitTime: string | null;
  topic?: string;
  students: StudentAttendance[];
}

export const INITIAL_SCHEDULE_BY_DAY: Record<string, TeachingSession[]> = {
  Rabu: [
    {
      id: "sess-7a",
      classId: "7a",
      code: "Kelas 7A",
      className: "Kelas 7A - Bahasa Indonesia",
      subject: "Bahasa Indonesia",
      room: "Ruang Kelas 7A (Lantai 2)",
      jam: "07.30 - 09.00 WIB",
      status: "Belum Disubmit",
      submitTime: null,
      topic: "Teks Deskripsi: Menelaah Struktur & Kaidah Kebahasaan",
      students: [
        { id: 101, name: "Aditya Pratama", nis: "20260701", status: "Hadir" },
        { id: 102, name: "Alya Zahra", nis: "20260702", status: "Hadir" },
        { id: 103, name: "Bagas Saputra", nis: "20260703", status: "Hadir" },
        { id: 104, name: "Citra Kirana", nis: "20260704", status: "Hadir" },
        { id: 105, name: "Dimas Anggara", nis: "20260705", status: "Hadir" },
      ],
    },
    {
      id: "sess-7b",
      classId: "7b",
      code: "Kelas 7B",
      className: "Kelas 7B - Bahasa Indonesia",
      subject: "Bahasa Indonesia",
      room: "Ruang Kelas 7B (Lantai 2)",
      jam: "09.15 - 10.45 WIB",
      status: "Belum Disubmit",
      submitTime: null,
      topic: "Menulis Teks Deskripsi Objek Wisata Lokal Karawang",
      students: [
        { id: 106, name: "Ahmad Fauzan", nis: "20260711", status: "Hadir" },
        { id: 107, name: "Bella Safitri", nis: "20260712", status: "Hadir" },
        { id: 108, name: "Candra Wijaya", nis: "20260713", status: "Hadir" },
        { id: 109, name: "Dewi Lestari", nis: "20260714", status: "Hadir" },
      ],
    },
    {
      id: "sess-7c",
      classId: "7c",
      code: "Kelas 7C",
      className: "Kelas 7C - Bahasa Indonesia",
      room: "Ruang Kelas 7C (Lantai 2)",
      subject: "Bahasa Indonesia",
      jam: "11.00 - 12.30 WIB",
      status: "Belum Disubmit",
      submitTime: null,
      topic: "Apresiasi Puisi Rakyat: Pantun & Gurindam",
      students: [
        { id: 110, name: "Farhan Maulana", nis: "20260721", status: "Hadir" },
        { id: 111, name: "Gita Permata", nis: "20260722", status: "Hadir" },
        { id: 112, name: "Hendra Gunawan", nis: "20260723", status: "Hadir" },
        { id: 113, name: "Indah Puspita", nis: "20260724", status: "Hadir" },
      ],
    },
  ],
  Kamis: [
    {
      id: "sess-7d",
      classId: "7d",
      code: "Kelas 7D",
      className: "Kelas 7D - Bahasa Indonesia",
      subject: "Bahasa Indonesia",
      room: "Ruang Kelas 7D (Lantai 2)",
      jam: "08.00 - 09.30 WIB",
      status: "Belum Disubmit",
      submitTime: null,
      topic: "Kaidah Kebahasaan Teks Prosedur",
      students: [
        { id: 114, name: "Joko Widodo", nis: "20260731", status: "Hadir" },
        { id: 115, name: "Kartika Sari", nis: "20260732", status: "Hadir" },
        { id: 116, name: "Lukman Hakim", nis: "20260733", status: "Hadir" },
      ],
    },
    {
      id: "sess-7e",
      classId: "7e",
      code: "Kelas 7E",
      className: "Kelas 7E - Bahasa Indonesia",
      subject: "Bahasa Indonesia",
      room: "Ruang Kelas 7E (Lantai 2)",
      jam: "10.00 - 11.30 WIB",
      status: "Belum Disubmit",
      submitTime: null,
      topic: "Menulis Cerita Fantasi",
      students: [
        { id: 117, name: "Muhammad Rizky", nis: "20260741", status: "Hadir" },
        { id: 118, name: "Nadia Safira", nis: "20260742", status: "Hadir" },
        { id: 119, name: "Oki Setiawan", nis: "20260743", status: "Hadir" },
      ],
    },
  ],
  Jumat: [
    {
      id: "sess-7f",
      classId: "7f",
      code: "Kelas 7F",
      className: "Kelas 7F - Bahasa Indonesia",
      subject: "Bahasa Indonesia",
      room: "Ruang Kelas 7F (Lantai 2)",
      jam: "07.30 - 09.00 WIB",
      status: "Belum Disubmit",
      submitTime: null,
      topic: "Literasi Membaca Fiksi",
      students: [
        { id: 120, name: "Putri Ayu", nis: "20260751", status: "Hadir" },
        { id: 121, name: "Qori Alamsyah", nis: "20260752", status: "Hadir" },
        { id: 122, name: "Rian Hidayat", nis: "20260753", status: "Hadir" },
      ],
    },
  ],
  Senin: [
    {
      id: "sess-8a",
      classId: "8a",
      code: "Kelas 8A",
      className: "Kelas 8A - Bahasa Indonesia",
      subject: "Bahasa Indonesia",
      room: "Ruang Kelas 8A (Lantai 1)",
      jam: "08.00 - 09.30 WIB",
      status: "Belum Disubmit",
      submitTime: null,
      topic: "Teks Berita Eksplanatif",
      students: [
        { id: 201, name: "Salwa Alifa", nis: "20250801", status: "Hadir" },
        { id: 202, name: "Taufik Hidayat", nis: "20250802", status: "Hadir" },
        { id: 203, name: "Umar Bakri", nis: "20250803", status: "Hadir" },
      ],
    },
  ],
  Selasa: [
    {
      id: "sess-8b",
      classId: "8b",
      code: "Kelas 8B",
      className: "Kelas 8B - Bahasa Indonesia",
      subject: "Bahasa Indonesia",
      room: "Ruang Kelas 8B (Lantai 1)",
      jam: "09.30 - 11.00 WIB",
      status: "Belum Disubmit",
      submitTime: null,
      topic: "Iklan, Slogan, dan Poster",
      students: [
        { id: 204, name: "Vina Panduwinata", nis: "20250811", status: "Hadir" },
        { id: 205, name: "Wawan Gunawan", nis: "20250812", status: "Hadir" },
      ],
    },
  ],
};

interface TeachingSessionsContextType {
  scheduleData: Record<string, TeachingSession[]>;
  getSessionById: (sessionId: string) => TeachingSession | undefined;
  updateStudentStatus: (
    sessionId: string,
    studentId: string | number,
    status: AttendanceStatus
  ) => void;
  updateStudentNote: (
    sessionId: string,
    studentId: string | number,
    note: string
  ) => void;
  markAllPresent: (sessionId: string) => void;
  submitSession: (sessionId: string, topic: string) => void;
  resetAllSessions: () => void;
}

const TeachingSessionsContext = React.createContext<
  TeachingSessionsContextType | undefined
>(undefined);

export function TeachingSessionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scheduleData, setScheduleData] = React.useState<
    Record<string, TeachingSession[]>
  >(INITIAL_SCHEDULE_BY_DAY);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("attendly_teaching_sessions_v1");
      if (saved) {
        setScheduleData(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save to localStorage when state changes
  const saveSchedule = React.useCallback(
    (newData: Record<string, TeachingSession[]>) => {
      setScheduleData(newData);
      try {
        localStorage.setItem(
          "attendly_teaching_sessions_v1",
          JSON.stringify(newData)
        );
      } catch {}
    },
    []
  );

  const getSessionById = React.useCallback(
    (sessionId: string) => {
      for (const day in scheduleData) {
        const found = scheduleData[day].find((s) => s.id === sessionId);
        if (found) return found;
      }
      return undefined;
    },
    [scheduleData]
  );

  const updateStudentStatus = React.useCallback(
    (
      sessionId: string,
      studentId: string | number,
      status: AttendanceStatus
    ) => {
      setScheduleData((prev) => {
        const copy = { ...prev };
        for (const day in copy) {
          copy[day] = copy[day].map((sess) => {
            if (sess.id === sessionId) {
              return {
                ...sess,
                students: sess.students.map((st) =>
                  st.id === studentId ? { ...st, status } : st
                ),
              };
            }
            return sess;
          });
        }
        try {
          localStorage.setItem(
            "attendly_teaching_sessions_v1",
            JSON.stringify(copy)
          );
        } catch {}
        return copy;
      });
    },
    []
  );

  const updateStudentNote = React.useCallback(
    (sessionId: string, studentId: string | number, note: string) => {
      setScheduleData((prev) => {
        const copy = { ...prev };
        for (const day in copy) {
          copy[day] = copy[day].map((sess) => {
            if (sess.id === sessionId) {
              return {
                ...sess,
                students: sess.students.map((st) =>
                  st.id === studentId ? { ...st, note } : st
                ),
              };
            }
            return sess;
          });
        }
        try {
          localStorage.setItem(
            "attendly_teaching_sessions_v1",
            JSON.stringify(copy)
          );
        } catch {}
        return copy;
      });
    },
    []
  );

  const markAllPresent = React.useCallback((sessionId: string) => {
    setScheduleData((prev) => {
      const copy = { ...prev };
      for (const day in copy) {
        copy[day] = copy[day].map((sess) => {
          if (sess.id === sessionId) {
            return {
              ...sess,
              students: sess.students.map((st) => ({
                ...st,
                status: "Hadir" as AttendanceStatus,
              })),
            };
          }
          return sess;
        });
      }
      try {
        localStorage.setItem(
          "attendly_teaching_sessions_v1",
          JSON.stringify(copy)
        );
      } catch {}
      return copy;
    });
  }, []);

  const submitSession = React.useCallback(
    (sessionId: string, topic: string) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")} WIB`;

      setScheduleData((prev) => {
        const copy = { ...prev };
        for (const day in copy) {
          copy[day] = copy[day].map((sess) => {
            if (sess.id === sessionId) {
              return {
                ...sess,
                status: "Selesai" as const,
                submitTime: timeStr,
                topic: topic || sess.topic,
              };
            }
            return sess;
          });
        }
        try {
          localStorage.setItem(
            "attendly_teaching_sessions_v1",
            JSON.stringify(copy)
          );
        } catch {}
        return copy;
      });
    },
    []
  );

  const resetAllSessions = React.useCallback(() => {
    saveSchedule(INITIAL_SCHEDULE_BY_DAY);
  }, [saveSchedule]);

  return (
    <TeachingSessionsContext.Provider
      value={{
        scheduleData,
        getSessionById,
        updateStudentStatus,
        updateStudentNote,
        markAllPresent,
        submitSession,
        resetAllSessions,
      }}
    >
      {children}
    </TeachingSessionsContext.Provider>
  );
}

export function useTeachingSessions() {
  const context = React.useContext(TeachingSessionsContext);
  if (!context) {
    throw new Error(
      "useTeachingSessions must be used within a TeachingSessionsProvider"
    );
  }
  return context;
}
