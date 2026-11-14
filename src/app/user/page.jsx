"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import TeacherNav from "@/components/TeacherNav";
import CameraCapture from "@/components/CameraCapture";
import { Auth } from "@/lib/auth";
import { Api, formatTimeString, cleanRapatText, formatRapatJudulAktivitas } from "@/lib/api";
import { formatDriveUrl, getAvatarUrl } from "@/lib/drive";
import { getTodayDateStr, getTodayDayName } from "@/lib/mockData";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  BookOpen,
  School,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Timer,
  AlertCircle,
  Sun,
  Moon,
  Briefcase,
  KeyRound,
  Camera,
  Users,
  Search,
  Filter,
  ArrowRight,
  UserPlus
} from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

// --- Helper Fungsi Pembatasan Jam Mengajar & Status Keterlambatan ---
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const cleaned = formatTimeString(timeStr).replace(".", ":");
  const parts = cleaned.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return null;
}

function formatMinutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function evaluateAttendanceTiming(schedule, settings, dateObj = new Date()) {
  const day = dateObj.getDay();
  // Validasi Hari Libur Akhir Pekan (Sabtu & Minggu)
  if (day === 0 || day === 6) {
    const dayName = day === 6 ? "Sabtu" : "Minggu";
    return {
      allowed: false,
      phase: "weekend",
      recordStatus: "Libur",
      badgeText: `⛔ Libur (${dayName})`,
      badgeColor: "#64748b",
      badgeBg: "#f1f5f9",
      badgeBorder: "#cbd5e1",
      message: `Hari ini adalah hari ${dayName} (Akhir Pekan / Libur Sekolah). Kegiatan belajar mengajar libur dan presensi kelas ditutup.`,
      keterangan: "Hari Libur"
    };
  }

  // Jika guru tidak memilih / tidak memiliki jadwal mengajar aktif
  if (!schedule) {
    return {
      allowed: false,
      phase: "no_schedule",
      recordStatus: "Tanpa Jadwal",
      badgeText: "⛔ Tidak Ada Jadwal",
      badgeColor: "#64748b",
      badgeBg: "#f1f5f9",
      badgeBorder: "#cbd5e1",
      message: "Tidak ada sesi jadwal mengajar aktif untuk Anda hari ini. Presensi hanya dibuka untuk sesi jadwal yang terdaftar.",
      keterangan: "Tanpa Jadwal"
    };
  }

  const nowMin = dateObj.getHours() * 60 + dateObj.getMinutes();
  const toleransi = Number(settings?.toleransi_menit ?? 15);
  const currentTimeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  // Mode Sesi Kelas Berdasarkan Jadwal Pelajaran
  const startMin = parseTimeToMinutes(schedule.jam_mulai);
  const endMin = parseTimeToMinutes(schedule.jam_selesai);

  if (startMin === null || endMin === null) {
    return {
      allowed: true,
      phase: "on_time",
      recordStatus: "Hadir",
      badgeText: "🟢 Terjadwal",
      badgeColor: "#065f46",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      message: "Jadwal terverifikasi.",
      keterangan: "Tepat Waktu"
    };
  }

  // 1. Dibuka 15 menit sebelum jam mulai kelas agar guru dapat bersiap di ruang kelas
  const earlyOpenMinutes = 15;
  if (nowMin < startMin - earlyOpenMinutes) {
    const diffBefore = (startMin - earlyOpenMinutes) - nowMin;
    return {
      allowed: false,
      phase: "too_early",
      recordStatus: "Hadir",
      badgeText: `⏳ Dibuka ${formatMinutesToTime(startMin - earlyOpenMinutes)}`,
      badgeColor: "#b45309",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      message: `Sesi kelas ${schedule.kelas} (${schedule.mapel}) dibuka 15 menit sebelum jam mulai (pukul ${formatMinutesToTime(startMin - earlyOpenMinutes)}, jam mulai ${schedule.jam_mulai}). Saat ini pukul ${currentTimeStr} (menunggu ${diffBefore} menit lagi).`,
      keterangan: "Tepat Waktu"
    };
  }

  // 2. Presensi Tepat Waktu (mulai 15 menit sebelum jam mulai hingga batas toleransi)
  if (nowMin <= startMin + toleransi) {
    return {
      allowed: true,
      phase: "on_time",
      recordStatus: "Hadir",
      badgeText: `🟢 Tepat Waktu`,
      badgeColor: "#065f46",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      message: `Sesi kelas ${schedule.kelas} (${schedule.mapel}) sedang berlangsung. Anda melakukan presensi tepat waktu (batas toleransi s/d ${formatMinutesToTime(startMin + toleransi)}).`,
      keterangan: "Tepat Waktu"
    };
  }

  // 3. Melewati batas toleransi tetapi jam kelas masih berlangsung -> Terlambat, presensi tetap dibuka
  if (nowMin <= endMin) {
    const lateMinutes = nowMin - startMin;
    return {
      allowed: true,
      phase: "late",
      recordStatus: "Terlambat",
      badgeText: `🟠 Terlambat (${lateMinutes} mnt)`,
      badgeColor: "#c2410c",
      badgeBg: "#fff7ed",
      badgeBorder: "#fed7aa",
      message: `Peringatan Keterlambatan: Melewati toleransi ${toleransi} menit (jam mulai ${schedule.jam_mulai}, saat ini ${currentTimeStr}). Kehadiran dicatat TERLAMBAT ${lateMinutes} menit.`,
      keterangan: `Terlambat ${lateMinutes} menit`
    };
  }

  // 4. Toleransi tambahan pasca jam selesai kelas (30 menit) untuk menyelesaikan jurnal & bukti mengajar
  const gracePeriodAfterEnd = 30;
  if (nowMin <= endMin + gracePeriodAfterEnd) {
    const lateMinutes = nowMin - startMin;
    return {
      allowed: true,
      phase: "late",
      recordStatus: "Terlambat",
      badgeText: `🟡 Selesai Mengajar`,
      badgeColor: "#d97706",
      badgeBg: "#fffbeb",
      badgeBorder: "#fde68a",
      message: `Jam mengajar kelas ${schedule.kelas} telah usai pukul ${schedule.jam_selesai}. Anda masih dapat merekam bukti presensi/jurnal mengajar sesi ini (terlambat ${lateMinutes} menit).`,
      keterangan: `Selesai Mengajar (Terlambat ${lateMinutes} mnt)`
    };
  }

  // 5. Melewati batas toleransi penutupan (> 30 menit setelah jam selesai)
  return {
    allowed: false,
    phase: "ended",
    recordStatus: "Terlambat",
    badgeText: `⛔ Selesai (${schedule.jam_selesai})`,
    badgeColor: "#475569",
    badgeBg: "#f1f5f9",
    badgeBorder: "#cbd5e1",
    message: `Sesi kelas ${schedule.kelas} (${schedule.mapel}) telah berakhir pada pukul ${schedule.jam_selesai} (saat ini ${currentTimeStr}). Presensi untuk sesi ini sudah ditutup.`,
    keterangan: "Sesi Berakhir"
  };
}

// --- Helper Evaluasi Waktu Presensi Masuk & Pulang Pegawai ---
function evaluatePegawaiTiming(mode, settings, dateObj = new Date()) {
  const day = dateObj.getDay();
  // Validasi Hari Libur Akhir Pekan (Sabtu & Minggu)
  if (day === 0 || day === 6) {
    const dayName = day === 6 ? "Sabtu" : "Minggu";
    return {
      allowed: false,
      phase: "weekend",
      recordStatus: "Libur",
      badgeText: `⛔ Libur (${dayName})`,
      badgeColor: "#64748b",
      badgeBg: "#f1f5f9",
      badgeBorder: "#cbd5e1",
      message: `Hari ini adalah hari ${dayName} (Akhir Pekan). Kantor madrasah tutup dan presensi pegawai dinonaktifkan.`,
      keterangan: "Hari Libur"
    };
  }

  const nowMin = dateObj.getHours() * 60 + dateObj.getMinutes();
  const toleransi = Number(settings?.toleransi_menit ?? 15);
  const currentTimeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (mode === "masuk") {
    const masukMulai = formatTimeString(settings?.jam_masuk_mulai) || "06:30";
    const masukBatas = formatTimeString(settings?.jam_masuk_batas) || "07:15";
    const startMin = parseTimeToMinutes(masukMulai) ?? (6 * 60 + 30);
    const limitMin = parseTimeToMinutes(masukBatas) ?? (7 * 60 + 15);

    if (nowMin < startMin) {
      return {
        allowed: false,
        phase: "too_early",
        recordStatus: "Hadir",
        badgeText: `⏳ Dibuka ${masukMulai}`,
        badgeColor: "#b45309",
        badgeBg: "#fffbeb",
        badgeBorder: "#fde68a",
        message: `Presensi masuk belum dibuka. Presensi dibuka tepat pukul ${masukMulai} (waktu saat ini ${currentTimeStr}).`,
        keterangan: "Tepat Waktu"
      };
    }
    if (nowMin <= limitMin + toleransi) {
      return {
        allowed: true,
        phase: "on_time",
        recordStatus: "Hadir",
        badgeText: "🟢 Tepat Waktu",
        badgeColor: "#065f46",
        badgeBg: "#ecfdf5",
        badgeBorder: "#a7f3d0",
        message: `Presensi masuk tepat waktu (jam batas masuk ${masukBatas}, batas toleransi s/d ${formatMinutesToTime(limitMin + toleransi)}).`,
        keterangan: "Tepat Waktu"
      };
    }
    const diff = nowMin - limitMin;
    return {
      allowed: true,
      phase: "late",
      recordStatus: "Terlambat",
      badgeText: `🟠 Terlambat (${diff} mnt)`,
      badgeColor: "#c2410c",
      badgeBg: "#fff7ed",
      badgeBorder: "#fed7aa",
      message: `Peringatan: Melewati batas masuk ${masukBatas}. Kehadiran tercatat TERLAMBAT ${diff} menit.`,
      keterangan: `Terlambat ${diff} menit`
    };
  } else {
    // mode === "pulang"
    const pulangMulai = formatTimeString(settings?.jam_pulang_mulai) || "15:00";
    const pulangMin = parseTimeToMinutes(pulangMulai) ?? (15 * 60);

    if (nowMin < pulangMin) {
      return {
        allowed: false,
        phase: "too_early",
        recordStatus: "Hadir",
        badgeText: `⏳ Belum Jam Pulang (${pulangMulai})`,
        badgeColor: "#b45309",
        badgeBg: "#fffbeb",
        badgeBorder: "#fde68a",
        message: `Presensi pulang baru dapat dilakukan mulai pukul ${pulangMulai}. Saat ini masih pukul ${currentTimeStr}.`,
        keterangan: "Presensi Pulang Kerja"
      };
    }
    return {
      allowed: true,
      phase: "on_time",
      recordStatus: "Hadir",
      badgeText: "🟢 Waktu Pulang Kantor",
      badgeColor: "#065f46",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      message: `Jam kerja telah selesai (jam kepulangan mulai ${pulangMulai}). Silakan rekam presensi pulang.`,
      keterangan: "Presensi Pulang Kerja"
    };
  }
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [attendanceType, setAttendanceType] = useState("jadwal");
  const [pegawaiMode, setPegawaiMode] = useState("masuk"); // "masuk" | "pulang"
  const [scheduleMode, setScheduleMode] = useState("mandiri"); // "mandiri" | "inval" | "rapat"
  const [selectedRapatAgenda, setSelectedRapatAgenda] = useState("Rapat Dewan Guru & Tenaga Kependidikan");
  const [customRapatAgenda, setCustomRapatAgenda] = useState("");
  const [allTodaySchedules, setAllTodaySchedules] = useState([]);
  const [leavesToday, setLeavesToday] = useState([]);
  const [allAttendanceToday, setAllAttendanceToday] = useState([]);
  const [invalTeacherFilter, setInvalTeacherFilter] = useState("semua");
  const [invalClassFilter, setInvalClassFilter] = useState("semua");
  const [todayRecords, setTodayRecords] = useState([]);
  const [gpsLocation, setGpsLocation] = useState({ lat: 0, lng: 0, string: "Presensi Kamera Device" });
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [nowDate, setNowDate] = useState(new Date());

  // Real-time clock interval (updates every 1 second)
  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Background GPS silent detection (non-blocking)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            string: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
          });
        },
        () => {
          setGpsLocation({ lat: 0, lng: 0, string: "Presensi Kamera Device" });
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    const loadData = async () => {
      const day = getTodayDayName();
      const todayDate = getTodayDateStr();
      try {
        const [setRes, attRes] = await Promise.all([
          Api.request("GET", "getSettings"),
          Api.request("GET", "getAttendance", {
            user_id: user.id || user.nip,
            tanggal: todayDate
          })
        ]);

        if (setRes && setRes.settings) setSettings(setRes.settings);
        if (attRes && attRes.attendance) setTodayRecords(attRes.attendance);

        if (user.role !== "pegawai") {
          const [schedRes, allSchedRes, leavesRes, allAttRes] = await Promise.all([
            Api.request("GET", "getSchedules", {
              hari: day,
              guru_id: user.id || user.nip
            }),
            Api.request("GET", "getSchedules", { hari: day }),
            Api.request("GET", "getLeaves", {}),
            Api.request("GET", "getAttendance", { tanggal: todayDate })
          ]);

          if (allSchedRes && allSchedRes.schedules) {
            setAllTodaySchedules(allSchedRes.schedules);
          }
          if (leavesRes && leavesRes.leaves) {
            setLeavesToday(leavesRes.leaves);
          }
          if (allAttRes && allAttRes.attendance) {
            setAllAttendanceToday(allAttRes.attendance);
          }

          if (schedRes && schedRes.schedules) {
            const teacherSchedules = schedRes.schedules.filter(
              (s) =>
                String(s.guru_id) === String(user.id) ||
                String(s.nip) === String(user.nip) ||
                String(s.guru_id) === String(user.nip)
            );
            setSchedules(teacherSchedules);
            if (teacherSchedules.length > 0) {
              const now = new Date();
              const nowMinutes = now.getHours() * 60 + now.getMinutes();

              // Prioritaskan jadwal yang saat ini sedang aktif berlangsung
              const activeScheduleNow = teacherSchedules.find((s) => {
                const evalTiming = evaluateAttendanceTiming(s, setRes?.settings, now);
                return evalTiming.allowed;
              });

              if (activeScheduleNow) {
                setSelectedSchedule(activeScheduleNow);
              } else {
                // Jika tidak ada yang sedang aktif, cari jadwal terdekat berikutnya hari ini
                const upcoming = teacherSchedules.find((s) => {
                  const sMin = parseTimeToMinutes(s.jam_mulai);
                  return sMin !== null && sMin > nowMinutes;
                });
                setSelectedSchedule(upcoming || teacherSchedules[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Gagal memuat data presensi:", err);
      }

      // Sinkronisasi foto & profil jika baru saja diubah oleh admin
      try {
        const usersRes = await Api.request("GET", "getUsers");
        if (usersRes && usersRes.users) {
          const fresh = usersRes.users.find(
            (u) => u.id === user.id || u.username === user.username || (u.nip && u.nip === user.nip)
          );
          if (fresh && (fresh.foto_url !== user.foto_url || fresh.nama !== user.nama || fresh.role !== user.role)) {
            const updated = { ...user, ...fresh };
            Auth.setCurrentUser(updated);
            setCurrentUser(updated);
          }
        }
      } catch (e) {
        console.warn("Gagal sinkron data user profil:", e);
      }
    };

    loadData();
  }, [router]);

  const isPegawai = currentUser?.role === "pegawai";
  const hasCheckIn = todayRecords.some(r => r.tipe_absen === "masuk" || r.jadwal_id === "MASUK");
  const checkInRecord = todayRecords.find(r => r.tipe_absen === "masuk" || r.jadwal_id === "MASUK");
  const hasCheckOut = todayRecords.some(r => r.tipe_absen === "pulang" || r.jadwal_id === "PULANG");
  const checkOutRecord = todayRecords.find(r => r.tipe_absen === "pulang" || r.jadwal_id === "PULANG");

  // Filter jadwal guru lain hari ini yang dapat digantikan
  const invalSchedules = useMemo(() => {
    if (!currentUser) return [];
    return (allTodaySchedules || []).filter((s) => {
      const isMine =
        String(s.guru_id) === String(currentUser.id) ||
        String(s.nip) === String(currentUser.nip);
      if (isMine) return false;

      if (invalTeacherFilter !== "semua" && s.nama_guru !== invalTeacherFilter) {
        return false;
      }
      if (invalClassFilter !== "semua" && s.kelas !== invalClassFilter) {
        return false;
      }
      return true;
    });
  }, [allTodaySchedules, currentUser, invalTeacherFilter, invalClassFilter]);

  // Daftar nama guru lain hari ini untuk dropdown filter
  const invalTeachersList = useMemo(() => {
    if (!currentUser) return [];
    const others = (allTodaySchedules || []).filter(
      (s) => String(s.guru_id) !== String(currentUser.id) && String(s.nip) !== String(currentUser.nip)
    );
    return Array.from(new Set(others.map((s) => s.nama_guru).filter(Boolean)));
  }, [allTodaySchedules, currentUser]);

  // Daftar kelas hari ini untuk dropdown filter
  const invalClassesList = useMemo(() => {
    return Array.from(new Set((allTodaySchedules || []).map((s) => s.kelas).filter(Boolean)));
  }, [allTodaySchedules]);

  // Cek apakah guru asli berhalangan / izin hari ini
  const getLeaveInfoForSchedule = (schedule) => {
    if (!schedule) return null;
    return (leavesToday || []).find(
      (l) =>
        (String(l.user_id) === String(schedule.guru_id) || String(l.nip) === String(schedule.nip) || l.nama === schedule.nama_guru) &&
        (l.status === "Disetujui" || l.status === "Menunggu Verifikasi" || l.status === "Menunggu")
    );
  };

  // Cek apakah jadwal kelas ini sudah terabsen hari ini
  const getAttendanceForSchedule = (schedule) => {
    if (!schedule) return null;
    return (allAttendanceToday || []).find(
      (a) =>
        String(a.jadwal_id) === String(schedule.id) ||
        (a.kelas === schedule.kelas && a.mapel === schedule.mapel && a.jam_jadwal?.includes(schedule.jam_mulai))
    );
  };

  const isWeekend = nowDate.getDay() === 0 || nowDate.getDay() === 6;
  const isSubstitute = !isPegawai && scheduleMode === "inval" && selectedSchedule;
  const isRapat = !isPegawai && scheduleMode === "rapat";
  const activeSchedule = attendanceType === "jadwal" && !isRapat ? selectedSchedule : null;
  const timingEval = isWeekend
    ? {
      allowed: false,
      phase: "weekend",
      recordStatus: "Libur",
      badgeText: `⛔ Libur (${getTodayDayName()})`,
      badgeColor: "#64748b",
      badgeBg: "#f1f5f9",
      badgeBorder: "#cbd5e1",
      message: `Hari ini adalah hari ${getTodayDayName()} (Akhir Pekan / Libur Sekolah). Kegiatan belajar mengajar libur dan presensi ditutup.`,
      keterangan: "Hari Libur"
    }
    : isPegawai
      ? evaluatePegawaiTiming(pegawaiMode, settings, nowDate)
      : isRapat
        ? {
          allowed: true,
          phase: "on_time",
          recordStatus: "Hadir",
          badgeText: "🟢 Presensi Tugas Kedinasan",
          badgeColor: "#059669",
          badgeBg: "#ecfdf5",
          badgeBorder: "#a7f3d0",
          message: "Presensi rapat dewan guru / tugas dinas bersama dibuka. Jam kelas dialihkan dan tercatat di LKB.",
          keterangan: "Tugas Kedinasan / Rapat Resmi"
        }
        : evaluateAttendanceTiming(activeSchedule, settings, nowDate);

  const handleAttendanceSubmit = async () => {
    setErrorNotice(null);

    // 0. Validasi hari libur akhir pekan
    if (isWeekend) {
      setErrorNotice(`Presensi tidak dapat dilakukan pada hari libur akhir pekan (${getTodayDayName()})!`);
      return;
    }

    // 0b. Validasi guru wajib memiliki sesi jadwal (bukan rapat & bukan pegawai)
    if (!isPegawai && !isRapat && !selectedSchedule) {
      setErrorNotice("Anda tidak memiliki sesi jadwal mengajar aktif untuk dipresensi hari ini!");
      return;
    }

    // 1. Validasi presensi ganda untuk pegawai
    if (isPegawai) {
      if (pegawaiMode === "masuk" && hasCheckIn) {
        setErrorNotice("Bapak/Ibu sudah melakukan presensi masuk hari ini!");
        return;
      }
      if (pegawaiMode === "pulang" && hasCheckOut) {
        setErrorNotice("Bapak/Ibu sudah melakukan presensi pulang hari ini!");
        return;
      }
    }

    // 1b. Validasi presensi ganda untuk rapat dinas
    if (isRapat) {
      const hasRapatToday = todayRecords.some(r => r.tipe_absen === "rapat" || r.jadwal_id === "RAPAT" || r.is_rapat);
      if (hasRapatToday) {
        setErrorNotice("Bapak/Ibu sudah merekam presensi rapat dinas hari ini!");
        return;
      }
    }

    // 2. Validasi jadwal terpilih pada mode guru pengganti
    if (scheduleMode === "inval" && !selectedSchedule) {
      setErrorNotice("Silakan pilih jadwal kelas yang akan Anda gantikan terlebih dahulu!");
      return;
    }

    // 3. Validasi Waktu Sesi Kelas & Aturan Toleransi
    if (!timingEval.allowed) {
      setErrorNotice(timingEval.message);
      return;
    }

    // 4. Validasi Foto Presensi Kamera Device
    if (!capturedPhoto) {
      setErrorNotice("Harap ambil foto bukti presensi langsung menggunakan kamera perangkat terlebih dahulu!");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const jamAbsen = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      const coordStr = gpsLocation?.string || "Presensi Foto Perangkat";

      const effectiveRapatAgenda = selectedRapatAgenda === "Lainnya"
        ? (customRapatAgenda.trim() || "Rapat Dinas Dewan Guru")
        : selectedRapatAgenda;

      const body = isPegawai ? {
        user_id: currentUser.id,
        nama: currentUser.nama || currentUser.username,
        nip: currentUser.nip || "-",
        mapel: currentUser.jabatan || currentUser.mapel || "Staf Tata Usaha",
        tipe_absen: pegawaiMode,
        jadwal_id: pegawaiMode.toUpperCase(),
        kelas: "Kantor / TU",
        jam_jadwal: pegawaiMode === "masuk"
          ? `${formatTimeString(settings?.jam_masuk_mulai) || "06:30"} - ${formatTimeString(settings?.jam_masuk_batas) || "07:15"}`
          : `Pulang (${formatTimeString(settings?.jam_pulang_mulai) || "15:00"})`,
        jam_absen: jamAbsen,
        status: timingEval.recordStatus,
        koordinat: coordStr,
        keterangan: notes ? `${notes} • ${timingEval.keterangan}` : timingEval.keterangan,
        foto: capturedPhoto
      } : isRapat ? {
        user_id: currentUser.id,
        nama: currentUser.nama || currentUser.username,
        nip: currentUser.nip || "-",
        mapel: "Tugas Kedinasan",
        tipe_absen: "rapat",
        jadwal_id: "RAPAT",
        kelas: "Ruang Pertemuan / Rapat",
        jam_jadwal: "Hari Dinas",
        jam_absen: jamAbsen,
        status: "Hadir",
        koordinat: coordStr,
        keterangan: (() => {
          const cleanNote = notes ? cleanRapatText(notes) : "";
          if (cleanNote && cleanNote.toLowerCase() !== effectiveRapatAgenda.toLowerCase()) {
            return `${effectiveRapatAgenda} • ${cleanNote}`;
          }
          return effectiveRapatAgenda;
        })(),
        catatan: (() => {
          const cleanNote = notes ? cleanRapatText(notes) : "";
          if (cleanNote && cleanNote.toLowerCase() !== effectiveRapatAgenda.toLowerCase()) {
            return `Mengikuti kegiatan kedinasan: ${effectiveRapatAgenda} - ${cleanNote}`;
          }
          return `Mengikuti kegiatan kedinasan: ${effectiveRapatAgenda}`;
        })(),
        foto: capturedPhoto,
        is_rapat: true,
        is_pengganti: false
      } : {
        user_id: currentUser.id,
        nama: currentUser.nama || currentUser.username,
        nip: currentUser.nip || "-",
        mapel: selectedSchedule ? selectedSchedule.mapel : (currentUser.mapel || "Umum"),
        tipe_absen: isSubstitute ? "inval" : attendanceType,
        jadwal_id: selectedSchedule ? selectedSchedule.id : null,
        kelas: selectedSchedule ? selectedSchedule.kelas : "Umum",
        jam_jadwal: selectedSchedule
          ? `${selectedSchedule.jam_mulai} - ${selectedSchedule.jam_selesai}`
          : "Harian",
        jam_absen: jamAbsen,
        status: timingEval.recordStatus,
        koordinat: coordStr,
        keterangan: notes
          ? (isSubstitute ? `${notes} • Tugas Guru Pengganti` : `${notes} • ${timingEval.keterangan}`)
          : (isSubstitute ? `Menggantikan ${selectedSchedule.nama_guru} • Tugas Guru Pengganti` : timingEval.keterangan),
        catatan: notes || (isSubstitute ? `Menggantikan ${selectedSchedule.nama_guru} mengajar di kelas ${selectedSchedule.kelas} (${selectedSchedule.mapel})` : ""),
        foto: capturedPhoto,
        is_pengganti: Boolean(isSubstitute),
        guru_asli_id: isSubstitute ? (selectedSchedule.guru_id || selectedSchedule.nip) : null,
        guru_asli_nama: isSubstitute ? selectedSchedule.nama_guru : null
      };

      const res = await Api.request("POST", "recordAttendance", {}, body);
      if (res && res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#059669", "#10b981", "#38bdf8", "#fbbf24"]
        });

        const newRec = res.record || { ...body, id: "ATT" + Date.now(), tanggal: getTodayDateStr() };
        setTodayRecords((prev) => [newRec, ...prev]);
        setAllAttendanceToday((prev) => [newRec, ...prev]);

        setSuccessNotice({
          time: jamAbsen,
          type: isPegawai
            ? `Presensi ${pegawaiMode === "masuk" ? "Masuk" : "Pulang"}`
            : isSubstitute
              ? `Guru Pengganti - Kelas ${selectedSchedule?.kelas} (${selectedSchedule?.nama_guru})`
              : attendanceType === "jadwal"
                ? `Sesi ${selectedSchedule?.kelas}`
                : "Harian",
          coords: coordStr,
          status: timingEval.recordStatus,
          keterangan: timingEval.keterangan
        });

        setNotes("");
        setCapturedPhoto(null);
      } else {
        setErrorNotice(res?.message || "Gagal mencatat absensi.");
      }
    } catch (err) {
      setErrorNotice("Terjadi kesalahan sistem saat menyimpan presensi.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar role="guru" />
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem", width: "100%" }}>
        <TeacherNav />

        {/* Hero Greeting Card with Scaled Responsive Teacher/Staff Portrait */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel identity-hero-card"
        >
          <div className="identity-hero-left">
            <div className="identity-hero-avatar">
              <img
                src={getAvatarUrl(currentUser.foto_url, currentUser.nama || currentUser.username)}
                alt={currentUser.nama || "Guru"}
                referrerPolicy="no-referrer"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = getAvatarUrl("", currentUser.nama || currentUser.username);
                }}
              />
            </div>
            <div className="identity-hero-info">
              <div className="identity-hero-title-row">
                <h1 className="identity-hero-name">
                  Selamat Datang, {currentUser.nama || currentUser.username}
                </h1>
                <span
                  className="identity-hero-badge"
                  style={{
                    background: isPegawai ? "#eff6ff" : "var(--primary-light)",
                    color: isPegawai ? "#0284c7" : "var(--primary)",
                    border: `1px solid ${isPegawai ? "#bae6fd" : "var(--primary-border)"}`
                  }}
                >
                  {isPegawai ? "PEGAWAI AKTIF" : "GURU AKTIF"}
                </span>
              </div>
              <p className="identity-hero-meta">
                NIP: {currentUser.nip || "-"} &bull; {currentUser.jabatan || (isPegawai ? "Staf Tata Usaha" : "Tenaga Pendidik")} &bull;{" "}
                <strong style={{ color: isPegawai ? "#0284c7" : "var(--primary)" }}>{currentUser.mapel || (isPegawai ? "Staf Administrasi" : "Guru")}</strong>
              </p>
              <div style={{ marginTop: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "0.22rem 0.65rem",
                    color: "#4f46e5",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                  }}
                >
                  <KeyRound size={13} /> Ganti Password
                </button>
              </div>
            </div>
          </div>

          <div className="identity-hero-date">
            <Calendar size={18} color="#059669" />
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Hari Ini
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)" }}>
                {getTodayDayName()}, {getTodayDateStr()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Success Modal / Banner */}
        <AnimatePresence>
          {successNotice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              className="glass-panel"
              style={{
                background: "var(--primary-light)",
                border: "1.5px solid var(--primary-border)",
                padding: "1.5rem",
                marginBottom: "1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#065f46" }}>
                    Presensi Berhasil Terverifikasi!
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                    Tercatat pada jam <strong>{successNotice.time} WITA</strong> &bull; Kamera Perangkat Terverifikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessNotice(null)}
                className="btn-neon-primary"
                style={{ fontSize: "0.85rem", padding: "0.6rem 1.2rem" }}
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main 2-Column Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: "1.5rem" }}>
          {/* Column 1: Jadwal Mengajar (Guru) ATAU Status Jam Kerja (Pegawai) */}
          {isPegawai ? (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel"
              style={{
                padding: "clamp(1.15rem, 2.5vw, 1.65rem)",
                display: "flex",
                flexDirection: "column",
                gap: "1.15rem",
                overflow: "hidden",
                minWidth: 0,
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                  <Briefcase size={20} color="#0284c7" style={{ flexShrink: 0 }} />
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                    Presensi Kerja Pegawai Hari Ini
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#0284c7",
                    fontWeight: 700,
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "var(--radius-full)",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  Non-Mengajar
                </span>
              </div>

              {/* 2 Status Cards: Masuk & Pulang (Stack Vertikal Bersih & Responsif) */}
              <div className="pegawai-cards-grid">
                {/* 1. Presensi Masuk */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPegawaiMode("masuk")}
                  className="pegawai-card-box"
                  style={{
                    padding: "1.1rem 1.25rem",
                    cursor: "pointer",
                    background: pegawaiMode === "masuk"
                      ? (hasCheckIn ? "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)" : "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)")
                      : (hasCheckIn ? "#f0fdf4" : "#ffffff"),
                    border: `2px solid ${pegawaiMode === "masuk" ? "#059669" : (hasCheckIn ? "#86efac" : "var(--border-light)")}`,
                    boxShadow: pegawaiMode === "masuk" ? "0 4px 16px rgba(5, 150, 105, 0.15)" : "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: hasCheckIn ? "#dcfce7" : "#fef3c7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Sun size={20} color={hasCheckIn ? "#059669" : "#d97706"} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.98rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          <span>Presensi Masuk</span>
                          {pegawaiMode === "masuk" && (
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "6px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                              Dipilih
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Jam Masuk: <strong>{formatTimeString(settings?.jam_masuk_mulai) || "06:30"} - {formatTimeString(settings?.jam_masuk_batas) || "07:15"}</strong>
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "0.25rem 0.65rem",
                        borderRadius: "999px",
                        background: hasCheckIn ? "#dcfce7" : "#fffbeb",
                        color: hasCheckIn ? "#166534" : "#b45309",
                        border: `1px solid ${hasCheckIn ? "#bbf7d0" : "#fde68a"}`,
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      {hasCheckIn ? "✅ SUDAH ABSEN" : "⏳ BELUM ABSEN"}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {hasCheckIn ? (
                      <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.45rem 0.75rem", color: "#065f46", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem" }}>
                        <span>Tercatat: {checkInRecord?.jam_absen}</span>
                        <span>Status: {checkInRecord?.status}</span>
                      </div>
                    ) : (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "0.45rem 0.75rem", color: "#92400e", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Clock size={14} style={{ flexShrink: 0 }} />
                        <span>Toleransi keterlambatan {settings?.toleransi_menit || 15} menit setelah jam batas masuk.</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* 2. Presensi Pulang */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPegawaiMode("pulang")}
                  className="pegawai-card-box"
                  style={{
                    padding: "1.1rem 1.25rem",
                    cursor: "pointer",
                    background: pegawaiMode === "pulang"
                      ? (hasCheckOut ? "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)" : "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)")
                      : (hasCheckOut ? "#f0fdf4" : "#ffffff"),
                    border: `2px solid ${pegawaiMode === "pulang" ? "#2563eb" : (hasCheckOut ? "#86efac" : "var(--border-light)")}`,
                    boxShadow: pegawaiMode === "pulang" ? "0 4px 16px rgba(37, 99, 235, 0.15)" : "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: hasCheckOut ? "#dcfce7" : "#e0e7ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Moon size={20} color={hasCheckOut ? "#059669" : "#6366f1"} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.98rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          <span>Presensi Pulang</span>
                          {pegawaiMode === "pulang" && (
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "6px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                              Dipilih
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Jam Kepulangan: Mulai Pukul <strong>{formatTimeString(settings?.jam_pulang_mulai) || "15:00"}</strong>
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "0.25rem 0.65rem",
                        borderRadius: "999px",
                        background: hasCheckOut ? "#dcfce7" : "#f1f5f9",
                        color: hasCheckOut ? "#166534" : "#64748b",
                        border: `1px solid ${hasCheckOut ? "#bbf7d0" : "#cbd5e1"}`,
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      {hasCheckOut ? "✅ SUDAH ABSEN" : "⏳ BELUM ABSEN"}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {hasCheckOut ? (
                      <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.45rem 0.75rem", color: "#065f46", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem" }}>
                        <span>Tercatat: {checkOutRecord?.jam_absen}</span>
                        <span>Status: Selesai Tugas</span>
                      </div>
                    ) : (
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.45rem 0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Clock size={14} style={{ flexShrink: 0 }} />
                        <span>Presensi pulang dibuka setelah jam operasional kepulangan sekolah.</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Panduan Pegawai */}
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: "var(--radius-md)",
                  padding: "0.95rem 1.15rem",
                  fontSize: "0.82rem",
                  color: "#0369a1",
                  lineHeight: 1.5,
                  overflow: "hidden"
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0 }} /> Ketentuan Presensi Pegawai
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", wordBreak: "break-word" }}>
                  <div>&bull; Pengajuan surat izin atau dinas luar dapat diisi pada menu <strong>Izin / Cuti</strong>.</div>
                  <div>&bull; Laporan Kinerja Pegawai (LKP) diunggah pada menu <strong>Dokumen LKB</strong>.</div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel"
              style={{
                padding: "clamp(1.15rem, 2.5vw, 1.65rem)",
                display: "flex",
                flexDirection: "column",
                gap: "1.15rem",
                overflow: "hidden",
                minWidth: 0,
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                  {scheduleMode === "mandiri" ? (
                    <BookOpen size={20} color="#059669" style={{ flexShrink: 0 }} />
                  ) : (
                    <Users size={20} color="#0284c7" style={{ flexShrink: 0 }} />
                  )}
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                    {scheduleMode === "mandiri" ? "Jadwal Mengajar Saya" : "Jadwal Guru Pengganti (Gantikan Guru)"}
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: scheduleMode === "mandiri" ? "var(--primary)" : "#0284c7",
                    fontWeight: 700,
                    background: scheduleMode === "mandiri" ? "var(--primary-light)" : "#e0f2fe",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "var(--radius-full)",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  {scheduleMode === "mandiri" ? `${schedules.length} Sesi` : `${invalSchedules.length} Kelas Tersedia`}
                </span>
              </div>

              {/* Tab Switcher: Jadwal Saya vs Guru Pengganti vs Rapat Dinas */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "0.45rem",
                  background: "var(--bg-muted)",
                  padding: "0.3rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)"
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setScheduleMode("mandiri");
                    if (schedules.length > 0) {
                      setSelectedSchedule(schedules[0]);
                      setAttendanceType("jadwal");
                      setNotes("");
                    }
                  }}
                  style={{
                    padding: "0.6rem 0.5rem",
                    borderRadius: "9px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    transition: "all 0.2s ease",
                    background: scheduleMode === "mandiri" ? "#ffffff" : "transparent",
                    color: scheduleMode === "mandiri" ? "#059669" : "var(--text-secondary)",
                    boxShadow: scheduleMode === "mandiri" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none"
                  }}
                >
                  <BookOpen size={16} />
                  <span>Jadwal Saya</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "999px",
                      background: scheduleMode === "mandiri" ? "#ecfdf5" : "#e2e8f0",
                      color: scheduleMode === "mandiri" ? "#059669" : "#64748b"
                    }}
                  >
                    {schedules.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScheduleMode("inval");
                    if (invalSchedules.length > 0) {
                      const first = invalSchedules[0];
                      setSelectedSchedule(first);
                      setAttendanceType("jadwal");
                      setNotes(`Menggantikan ${first.nama_guru} mengajar di kelas ${first.kelas} (${first.mapel})`);
                    }
                  }}
                  style={{
                    padding: "0.6rem 0.5rem",
                    borderRadius: "9px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    transition: "all 0.2s ease",
                    background: scheduleMode === "inval" ? "#ffffff" : "transparent",
                    color: scheduleMode === "inval" ? "#0284c7" : "var(--text-secondary)",
                    boxShadow: scheduleMode === "inval" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none"
                  }}
                >
                  <Users size={16} />
                  <span>Gantikan Guru</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "999px",
                      background: scheduleMode === "inval" ? "#e0f2fe" : "#e2e8f0",
                      color: scheduleMode === "inval" ? "#0369a1" : "#64748b"
                    }}
                  >
                    {invalSchedules.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScheduleMode("rapat");
                    setSelectedSchedule(null);
                    setAttendanceType("rapat");
                    setNotes("");
                  }}
                  style={{
                    padding: "0.6rem 0.5rem",
                    borderRadius: "9px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    transition: "all 0.2s ease",
                    background: scheduleMode === "rapat" ? "#ffffff" : "transparent",
                    color: scheduleMode === "rapat" ? "#7c3aed" : "var(--text-secondary)",
                    boxShadow: scheduleMode === "rapat" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none"
                  }}
                >
                  <Briefcase size={16} />
                  <span>Rapat</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "999px",
                      background: scheduleMode === "rapat" ? "#ede9fe" : "#e2e8f0",
                      color: scheduleMode === "rapat" ? "#7c3aed" : "#64748b"
                    }}
                  >
                    Dinas
                  </span>
                </button>
              </div>

              {/* Mode Guru Pengganti: Panduan & Filter Dropdown */}
              {scheduleMode === "inval" && (
                <>
                  <div
                    style={{
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: "10px",
                      padding: "0.75rem 0.95rem",
                      fontSize: "0.8rem",
                      color: "#0369a1",
                      lineHeight: 1.45,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.55rem"
                    }}
                  >
                    <Users size={17} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong>Fitur Gantikan Guru:</strong> Pilih jadwal rekan guru yang izin atau berhalangan hadir hari ini. Foto dan presensi mengajar Anda akan sah dicatat sebagai bukti kinerja Guru Pengganti dan langsung masuk ke LKB Anda.
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        Filter Guru yang Digantikan:
                      </label>
                      <select
                        value={invalTeacherFilter}
                        onChange={(e) => setInvalTeacherFilter(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.45rem 0.65rem",
                          borderRadius: "8px",
                          border: "1px solid var(--border-light)",
                          background: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--text-main)"
                        }}
                      >
                        <option value="semua">Semua Guru ({invalTeachersList.length})</option>
                        {invalTeachersList.map((tName) => {
                          const isLeave = leavesToday.some(
                            (l) => l.nama === tName || l.nama_guru === tName
                          );
                          return (
                            <option key={tName} value={tName}>
                              {tName} {isLeave ? "🚨 (Izin Hari Ini)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                        Filter Kelas:
                      </label>
                      <select
                        value={invalClassFilter}
                        onChange={(e) => setInvalClassFilter(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.45rem 0.65rem",
                          borderRadius: "8px",
                          border: "1px solid var(--border-light)",
                          background: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--text-main)"
                        }}
                      >
                        <option value="semua">Semua Kelas ({invalClassesList.length})</option>
                        {invalClassesList.map((k) => (
                          <option key={k} value={k}>
                            Kelas {k}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Konten Tab 1: Jadwal Mandiri */}
              {scheduleMode === "mandiri" && (
                <>
                  {isWeekend ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "2.5rem 1.25rem",
                        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                        borderRadius: "var(--radius-md)",
                        border: "1.5px dashed #cbd5e1"
                      }}
                    >
                      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                        <Clock size={24} />
                      </div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.3rem" }}>
                        Hari Libur Akhir Pekan ({getTodayDayName()})
                      </h4>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: "340px", margin: "0 auto", lineHeight: 1.5 }}>
                        Madrasah menerapkan 5 hari sekolah (Senin s/d Jumat). Pada hari Sabtu dan Minggu jadwal mengajar dan presensi diliburkan.
                      </p>
                    </div>
                  ) : schedules.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "2.5rem 1rem",
                        background: "var(--bg-muted)",
                        borderRadius: "var(--radius-md)",
                        border: "1px dashed var(--border-light)"
                      }}
                    >
                      <Clock size={36} color="#94a3b8" style={{ margin: "0 auto 0.75rem" }} />
                      <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        Tidak ada jadwal mengajar pada hari {getTodayDayName()}.
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                        Anda dapat memeriksa tab <strong>Gantikan Guru</strong> jika ingin menggantikan kelas rekan guru yang izin hari ini.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {schedules.map((item) => {
                        const isSelected = selectedSchedule && selectedSchedule.id === item.id && scheduleMode === "mandiri";
                        const itemTiming = evaluateAttendanceTiming(item, settings, nowDate);
                        const isDoneToday = todayRecords.some(
                          (r) =>
                            String(r.jadwal_id) === String(item.id) ||
                            (r.kelas === item.kelas && r.mapel === item.mapel && (r.jam_jadwal?.includes(item.jam_mulai) || !r.jam_jadwal))
                        );

                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => {
                              setSelectedSchedule(item);
                              setAttendanceType("jadwal");
                              setNotes("");
                            }}
                            style={{
                              padding: "1.1rem 1.25rem",
                              borderRadius: "var(--radius-md)",
                              background: isSelected
                                ? "linear-gradient(135deg, #eef2ff 0%, #ecfeff 100%)"
                                : isDoneToday
                                  ? "#f8fafc"
                                  : "#ffffff",
                              border: `1.5px solid ${isSelected ? "#4f46e5" : isDoneToday ? "#cbd5e1" : "var(--border-light)"}`,
                              boxShadow: isSelected ? "0 4px 16px rgba(79, 70, 229, 0.18)" : "var(--shadow-sm)",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.35rem"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: "1.05rem",
                                    color: isSelected ? "#4f46e5" : "var(--text-main)"
                                  }}
                                >
                                  {item.kelas}
                                </span>
                                {isDoneToday && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: 800,
                                      background: "#ecfdf5",
                                      color: "#065f46",
                                      border: "1px solid #a7f3d0",
                                      padding: "0.15rem 0.45rem",
                                      borderRadius: "6px"
                                    }}
                                  >
                                    ✓ Terabsen
                                  </span>
                                )}
                                {!isDoneToday && itemTiming.allowed && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: 800,
                                      background: "#ecfeff",
                                      color: "#0284c7",
                                      border: "1px solid #7dd3fc",
                                      padding: "0.15rem 0.45rem",
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem"
                                    }}
                                  >
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0284c7" }} /> Sesi Aktif
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.82rem",
                                    color: isSelected ? "#4f46e5" : "var(--text-secondary)",
                                    fontWeight: 700,
                                    background: isSelected ? "#ffffff" : "var(--bg-muted)",
                                    padding: "0.2rem 0.55rem",
                                    borderRadius: "6px",
                                    boxShadow: isSelected ? "0 1px 4px rgba(79, 70, 229, 0.15)" : "none"
                                  }}
                                >
                                  {item.jam_mulai} - {item.jam_selesai}
                                </span>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "0.82rem",
                                color: "var(--text-secondary)",
                                marginTop: "0.25rem"
                              }}
                            >
                              <span style={{ fontWeight: 600, color: isSelected ? "#4338ca" : "inherit" }}>
                                {item.mapel} &bull; {item.ruangan}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "6px",
                                  background: itemTiming.badgeBg,
                                  color: itemTiming.badgeColor,
                                  border: `1px solid ${itemTiming.badgeBorder || itemTiming.badgeColor}`
                                }}
                              >
                                {itemTiming.badgeText}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Konten Tab 2: Jadwal Guru Pengganti */}
              {scheduleMode === "inval" && (
                <>
                  {invalSchedules.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "2.5rem 1rem",
                        background: "var(--bg-muted)",
                        borderRadius: "var(--radius-md)",
                        border: "1px dashed var(--border-light)"
                      }}
                    >
                      <Users size={36} color="#94a3b8" style={{ margin: "0 auto 0.75rem" }} />
                      <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                        Tidak ada jadwal mengajar rekan guru yang cocok dengan filter saat ini.
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                        Coba ubah filter guru atau kelas di atas.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {invalSchedules.map((item) => {
                        const isSelected = selectedSchedule && selectedSchedule.id === item.id && scheduleMode === "inval";
                        const itemTiming = evaluateAttendanceTiming(item, settings, nowDate);
                        const leaveInfo = getLeaveInfoForSchedule(item);
                        const attInfo = getAttendanceForSchedule(item);
                        const isDiisiSaya = attInfo && (
                          String(attInfo.user_id) === String(currentUser?.id) ||
                          (currentUser?.nip && String(attInfo.nip) === String(currentUser?.nip))
                        );

                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => {
                              setSelectedSchedule(item);
                              setAttendanceType("jadwal");
                              setNotes(`Menggantikan ${item.nama_guru} mengajar di kelas ${item.kelas} (${item.mapel})`);
                            }}
                            style={{
                              padding: "1.1rem 1.25rem",
                              borderRadius: "var(--radius-md)",
                              background: isSelected
                                ? "linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)"
                                : attInfo
                                  ? "#f8fafc"
                                  : leaveInfo
                                    ? "#fef2f2"
                                    : "#ffffff",
                              border: `1.5px solid ${isSelected
                                ? "#0284c7"
                                : attInfo
                                  ? "#cbd5e1"
                                  : leaveInfo
                                    ? "#fca5a5"
                                    : "var(--border-light)"
                                }`,
                              boxShadow: isSelected ? "0 4px 16px rgba(2, 132, 199, 0.2)" : "var(--shadow-sm)",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                          >
                            {/* Baris 1: Kelas, Ruangan, Jam */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.35rem"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: "1.05rem",
                                    color: isSelected ? "#0369a1" : "var(--text-main)"
                                  }}
                                >
                                  {item.kelas}
                                </span>
                                {itemTiming.allowed && !attInfo && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: 800,
                                      background: "#ecfeff",
                                      color: "#0284c7",
                                      border: "1px solid #7dd3fc",
                                      padding: "0.15rem 0.45rem",
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem"
                                    }}
                                  >
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0284c7" }} /> Sesi Berlangsung
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.82rem",
                                    color: isSelected ? "#0369a1" : "var(--text-secondary)",
                                    fontWeight: 700,
                                    background: isSelected ? "#ffffff" : "var(--bg-muted)",
                                    padding: "0.2rem 0.55rem",
                                    borderRadius: "6px",
                                    boxShadow: isSelected ? "0 1px 4px rgba(2, 132, 199, 0.15)" : "none"
                                  }}
                                >
                                  {item.jam_mulai} - {item.jam_selesai}
                                </span>
                              </div>
                            </div>

                            {/* Baris 2: Mapel & Guru Asli */}
                            <div style={{ fontSize: "0.83rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "0.4rem" }}>
                              {item.mapel} &bull; Ruang: {item.ruangan || "-"}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.45rem" }}>
                              <span style={{ color: "#64748b" }}>Guru Asli:</span>
                              <strong>{item.nama_guru}</strong>
                            </div>

                            {/* Baris 3: Status Penugasan & Izin */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.35rem", paddingTop: "0.35rem", borderTop: "1px dashed var(--border-light)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                                {leaveInfo && (
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 800,
                                      padding: "0.18rem 0.5rem",
                                      borderRadius: "6px",
                                      background: "#fee2e2",
                                      color: "#b91c1c",
                                      border: "1px solid #fca5a5"
                                    }}
                                  >
                                    🚨 Guru Izin ({leaveInfo.tipe})
                                  </span>
                                )}
                                {attInfo ? (
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 800,
                                      padding: "0.18rem 0.5rem",
                                      borderRadius: "6px",
                                      background: isDiisiSaya ? "#ecfdf5" : "#f1f5f9",
                                      color: isDiisiSaya ? "#065f46" : "#475569",
                                      border: `1px solid ${isDiisiSaya ? "#a7f3d0" : "#cbd5e1"}`
                                    }}
                                  >
                                    {isDiisiSaya ? `✓ Telah Anda Gantikan (${attInfo.jam_absen})` : `✓ Digantikan oleh ${attInfo.nama} (${attInfo.jam_absen})`}
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 800,
                                      padding: "0.18rem 0.5rem",
                                      borderRadius: "6px",
                                      background: "#eff6ff",
                                      color: "#1d4ed8",
                                      border: "1px solid #bfdbfe"
                                    }}
                                  >
                                    ⚡ Siap Diisi Guru Pengganti
                                  </span>
                                )}
                              </div>

                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "0.18rem 0.5rem",
                                  borderRadius: "6px",
                                  background: itemTiming.badgeBg,
                                  color: itemTiming.badgeColor,
                                  border: `1px solid ${itemTiming.badgeBorder || itemTiming.badgeColor}`
                                }}
                              >
                                {itemTiming.badgeText}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Konten Tab 3: Rapat Dinas / Tugas Kedinasan Bersama */}
              {scheduleMode === "rapat" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {(() => {
                    const hasRapatToday = todayRecords.some(r => r.tipe_absen === "rapat" || r.jadwal_id === "RAPAT" || r.is_rapat);
                    const rapatRec = todayRecords.find(r => r.tipe_absen === "rapat" || r.jadwal_id === "RAPAT" || r.is_rapat);

                    if (hasRapatToday) {
                      return (
                        <div
                          style={{
                            padding: "1.25rem",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                            border: "1.5px solid #a7f3d0",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.85rem"
                          }}
                        >
                          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#065f46" }}>
                              Presensi Rapat Dinas Hari Ini Telah Terverifikasi!
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "#047857", marginTop: "2px" }}>
                              Agenda: <strong>{cleanRapatText(rapatRec?.keterangan || rapatRec?.catatan) || selectedRapatAgenda}</strong>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                              Tercatat pukul <strong>{formatTimeString(rapatRec?.jam_absen) || rapatRec?.jam_absen} WITA</strong> • Masuk dalam butir laporan LKB bulan ini (Hadir Penuh 100%).
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        style={{
                          padding: "1.25rem",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)",
                          border: "1.5px solid #ddd6fe"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <Briefcase size={20} color="#7c3aed" />
                            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#5b21b6", margin: 0 }}>
                              Agenda Rapat / Tugas Kedinasan Bersama
                            </h4>
                          </div>
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#ede9fe", color: "#6d28d9", border: "1px solid #c4b5fd" }}>
                            Status: Hadir Penuh (100%)
                          </span>
                        </div>

                        <p style={{ fontSize: "0.8rem", color: "#6d28d9", margin: "0 0 1rem 0", lineHeight: 1.45 }}>
                          Gunakan opsi ini saat seluruh guru mengadakan rapat atau kegiatan dinas resmi di sekolah. Jam mengajar Anda hari ini otomatis dialihkan sehingga Anda <strong>tidak alpa</strong> dan presensi langsung terdata dalam <strong>LKB</strong>.
                        </p>

                        <div style={{ marginBottom: "0.85rem" }}>
                          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#4c1d95", marginBottom: "0.35rem" }}>
                            Pilih Topik / Agenda Rapat Hari Ini:
                          </label>
                          <select
                            value={selectedRapatAgenda}
                            onChange={(e) => {
                              setSelectedRapatAgenda(e.target.value);
                            }}
                            className="neon-select"
                            style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.85rem", fontWeight: 700, background: "#ffffff", border: "1.5px solid #c4b5fd" }}
                          >
                            <option value="Rapat Dewan Guru & Tenaga Kependidikan">🏛️ Rapat Dewan Guru & Tenaga Kependidikan</option>
                            <option value="Rapat Koordinasi & Evaluasi Pembelajaran">📊 Rapat Koordinasi & Evaluasi Pembelajaran</option>
                            <option value="Workshop Implementasi Kurikulum Merdeka (IKM)">📚 Workshop Implementasi Kurikulum Merdeka (IKM)</option>
                            <option value="Rapat Penilaian & Kelulusan Peserta Didik">🎓 Rapat Penilaian & Kelulusan Peserta Didik</option>
                            <option value="Upacara / Peringatan Hari Besar Nasional">🇮🇩 Upacara / Peringatan Hari Besar Nasional</option>
                            <option value="Lainnya">✍️ Agenda Lainnya (Ketik Manual)</option>
                          </select>
                        </div>

                        {selectedRapatAgenda === "Lainnya" && (
                          <div style={{ marginBottom: "0.85rem" }}>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#4c1d95", marginBottom: "0.25rem" }}>
                              Tuliskan Nama / Topik Kegiatan:
                            </label>
                            <input
                              type="text"
                              value={customRapatAgenda}
                              onChange={(e) => {
                                setCustomRapatAgenda(e.target.value);
                              }}
                              placeholder="Contoh: Rapat Persiapan Penilaian Akhir Semester..."
                              className="neon-input"
                              style={{ width: "100%", padding: "0.55rem 0.85rem", fontSize: "0.85rem", background: "#ffffff" }}
                            />
                          </div>
                        )}

                        <div style={{ fontSize: "0.76rem", color: "#6b21a8", background: "#ffffff", padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px dashed #c4b5fd" }}>
                          📸 <strong>Langkah Selanjutnya:</strong> Arahkan kamera ke suasana ruang rapat / kegiatan pada panel di samping untuk mengambil foto bukti presensi.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* Column 2: Geofencing & Presensi Action */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel"
            style={{
              padding: "clamp(1.15rem, 2.5vw, 1.65rem)",
              display: "flex",
              flexDirection: "column",
              gap: "1.15rem",
              overflow: "hidden",
              minWidth: 0,
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
                <UserCheck size={20} color={isPegawai ? "#0284c7" : "#4f46e5"} style={{ flexShrink: 0 }} />
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                  {isPegawai ? "Formulir Presensi Pegawai" : "Formulir Presensi Mengajar"}
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: isPegawai ? "#0284c7" : "#4f46e5", fontWeight: 700, background: isPegawai ? "#f0f9ff" : "#eef2ff", padding: "0.3rem 0.65rem", borderRadius: "8px", flexShrink: 0 }}>
                <Clock size={14} />
                <span>{nowDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </div>
            </div>

            {/* Toggle Mode Pegawai: Masuk vs Pulang */}
            {isPegawai && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", background: "var(--bg-muted)", padding: "0.35rem", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
                <button
                  type="button"
                  onClick={() => setPegawaiMode("masuk")}
                  style={{
                    padding: "0.65rem 0.5rem",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "0.86rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    transition: "all 0.2s ease",
                    background: pegawaiMode === "masuk" ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : "transparent",
                    color: pegawaiMode === "masuk" ? "#ffffff" : "var(--text-secondary)",
                    boxShadow: pegawaiMode === "masuk" ? "0 2px 8px rgba(5, 150, 105, 0.25)" : "none"
                  }}
                >
                  <Sun size={17} />
                  <span>Presensi Masuk</span>
                  {hasCheckIn && <span style={{ fontSize: "0.7rem", opacity: 0.9 }}>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setPegawaiMode("pulang")}
                  style={{
                    padding: "0.65rem 0.5rem",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "0.86rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    transition: "all 0.2s ease",
                    background: pegawaiMode === "pulang" ? "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)" : "transparent",
                    color: pegawaiMode === "pulang" ? "#ffffff" : "var(--text-secondary)",
                    boxShadow: pegawaiMode === "pulang" ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none"
                  }}
                >
                  <Moon size={17} />
                  <span>Presensi Pulang</span>
                  {hasCheckOut && <span style={{ fontSize: "0.7rem", opacity: 0.9 }}>✓</span>}
                </button>
              </div>
            )}

            <AnimatePresence>
              {errorNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    background: "var(--danger-light)",
                    border: "1px solid #fecaca",
                    color: "var(--danger)",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>{errorNotice}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Panel Konten Presensi: Ditutup jika Akhir Pekan atau Guru Tanpa Jadwal */}
            {isWeekend ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.75rem 1.5rem",
                  background: "#f8fafc",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px dashed #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.85rem",
                  marginTop: "0.5rem"
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Clock size={28} />
                </div>
                <div style={{ fontSize: "1.12rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Presensi Ditutup (Hari Libur {getTodayDayName()})
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "340px", margin: 0, lineHeight: 1.55 }}>
                  Sistem presensi kelas dan kehadiran hanya aktif pada hari kegiatan belajar mengajar (Senin s/d Jumat). Presensi ditutup pada akhir pekan.
                </p>
              </div>
            ) : !isPegawai && !isRapat && !selectedSchedule ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.75rem 1.5rem",
                  background: "#f8fafc",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px dashed #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.85rem",
                  marginTop: "0.5rem"
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "#fef3c7",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <BookOpen size={28} />
                </div>
                <div style={{ fontSize: "1.12rem", fontWeight: 800, color: "var(--text-main)" }}>
                  Tidak Ada Sesi Mengajar Aktif
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "340px", margin: 0, lineHeight: 1.55 }}>
                  Bapak/Ibu Guru tidak memiliki jadwal mengajar pada hari ini. Jika bertugas menggantikan guru lain, silakan beralih ke tab <strong>Gantikan Guru</strong> atau <strong>Rapat Dinas</strong>.
                </p>
              </div>
            ) : (
              <>
                {/* Kamera Device Langsung untuk Presensi */}
                <CameraCapture
                  capturedPhoto={capturedPhoto}
                  onCapture={(photoData) => setCapturedPhoto(photoData)}
                  onPhotoCaptured={(photoData) => setCapturedPhoto(photoData)}
                  onRetake={() => setCapturedPhoto(null)}
                  user={currentUser}
                  userName={currentUser?.nama || currentUser?.username}
                />

                {/* Banner Mode Guru Pengganti */}
                {!isPegawai && scheduleMode === "inval" && selectedSchedule && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)",
                      border: "1.5px solid #7dd3fc",
                      borderRadius: "var(--radius-md)",
                      padding: "0.85rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: 800, fontSize: "0.88rem", color: "#0369a1" }}>
                        <Users size={16} color="#0284c7" />
                        <span>Mode: Guru Pengganti (Gantikan Guru)</span>
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "6px", background: "#ffffff", color: "#0284c7", border: "1px solid #bae6fd" }}>
                        Kelas {selectedSchedule.kelas}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "var(--text-main)", lineHeight: 1.4 }}>
                      Menggantikan Rekan: <strong>{selectedSchedule.nama_guru}</strong> ({selectedSchedule.mapel})
                    </div>
                    {(() => {
                      const leaveInfo = getLeaveInfoForSchedule(selectedSchedule);
                      if (leaveInfo) {
                        return (
                          <div style={{ fontSize: "0.78rem", color: "#b91c1c", background: "#fef2f2", padding: "0.3rem 0.55rem", borderRadius: "6px", border: "1px solid #fca5a5", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                            <span>Keterangan Izin Guru Asli: {leaveInfo.tipe} {leaveInfo.keterangan ? `(${leaveInfo.keterangan})` : ""}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                {/* Status Validasi Presensi Geofencing & Jam Sesi */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #eef2ff 0%, #ecfeff 100%)",
                    border: "1.5px solid #c7d2fe",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem 1.15rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    boxShadow: "0 2px 10px rgba(99, 102, 241, 0.06)",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.45rem" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: isPegawai ? "#0284c7" : scheduleMode === "rapat" ? "#7c3aed" : "#4f46e5", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {isPegawai
                        ? `Status Presensi ${pegawaiMode === "masuk" ? "Masuk" : "Pulang"}`
                        : scheduleMode === "rapat"
                          ? "Status Presensi Rapat Dinas"
                          : scheduleMode === "inval"
                            ? "Status Sesi Guru Pengganti"
                            : "Status Sesi & Validasi Waktu"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "6px",
                        background: timingEval.badgeBg,
                        color: timingEval.badgeColor,
                        border: `1px solid ${timingEval.badgeBorder || timingEval.badgeColor}`,
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      {timingEval.badgeText}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.92rem", color: "var(--text-main)", fontWeight: 800, wordBreak: "break-word" }}>
                    {isPegawai
                      ? `Presensi ${pegawaiMode === "masuk" ? "Masuk Kantor" : "Kepulangan Kantor"} (${pegawaiMode === "masuk" ? `${formatTimeString(settings?.jam_masuk_mulai) || "06:30"} - ${formatTimeString(settings?.jam_masuk_batas) || "07:15"}` : `Mulai ${formatTimeString(settings?.jam_pulang_mulai) || "15:00"}`})`
                      : scheduleMode === "rapat"
                        ? `🏛️ ${selectedRapatAgenda === "Lainnya" ? (customRapatAgenda || "Rapat Kedinasan") : selectedRapatAgenda}`
                        : scheduleMode === "inval" && selectedSchedule
                          ? `[Guru Pengganti] Kelas ${selectedSchedule.kelas} • ${selectedSchedule.mapel} (Gantikan: ${selectedSchedule.nama_guru})`
                          : selectedSchedule
                            ? `${selectedSchedule.kelas} • ${selectedSchedule.mapel} (${selectedSchedule.jam_mulai} - ${selectedSchedule.jam_selesai})`
                            : "Presensi Kehadiran Harian Sekolah"}
                  </div>

                  {/* Banner Aturan Waktu Sesi */}
                  <div
                    style={{
                      background: timingEval.badgeBg,
                      border: `1px solid ${timingEval.badgeBorder || timingEval.badgeColor}`,
                      borderRadius: "8px",
                      padding: "0.65rem 0.85rem",
                      fontSize: "0.8rem",
                      color: timingEval.badgeColor,
                      lineHeight: 1.35,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem"
                    }}
                  >
                    <Clock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{timingEval.message}</span>
                  </div>
                </div>

                {/* Catatan Tugas Harian (Pegawai) atau Jurnal (Guru) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: "0.4rem"
                    }}
                  >
                    {isPegawai
                      ? "Catatan Aktivitas / Tugas Harian (Opsional)"
                      : scheduleMode === "rapat"
                        ? "Catatan Tambahan Agenda Rapat (Opsional)"
                        : scheduleMode === "inval"
                          ? "Catatan Aktivitas Guru Pengganti"
                          : "Catatan / Materi Pembelajaran (Opsional)"}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      isPegawai
                        ? "Contoh: Mengarsipkan surat masuk & layanan legalisir..."
                        : scheduleMode === "rapat"
                          ? "Contoh: Mengikuti sesi rapat dan pembahasan evaluasi..."
                          : scheduleMode === "inval"
                            ? "Contoh: Menggantikan materi Bab 4 dan mendampingi diskusi kelompok..."
                            : "Contoh: Pembahasan Bab 3 Persamaan Linear..."
                    }
                    className="neon-input"
                  />
                </div>

                {/* Submit Button */}
                {(() => {
                  const invalAttRecord = (!isPegawai && scheduleMode === "inval" && selectedSchedule)
                    ? getAttendanceForSchedule(selectedSchedule)
                    : null;
                  const isAlreadyRecordedByMe = invalAttRecord && (
                    String(invalAttRecord.user_id) === String(currentUser?.id) ||
                    (currentUser?.nip && String(invalAttRecord.nip) === String(currentUser?.nip))
                  );

                  const isScheduleAlreadyRecorded = !isPegawai && selectedSchedule && todayRecords.some(r =>
                    String(r.jadwal_id) === String(selectedSchedule.id) ||
                    (r.kelas === selectedSchedule.kelas && r.mapel === selectedSchedule.mapel && (r.jam_jadwal?.includes(selectedSchedule.jam_mulai) || !r.jam_jadwal))
                  );

                  const hasRapatToday = todayRecords.some(r => r.tipe_absen === "rapat" || r.jadwal_id === "RAPAT" || r.is_rapat);

                  const isAlreadyRecorded = isPegawai
                    ? ((pegawaiMode === "masuk" && hasCheckIn) || (pegawaiMode === "pulang" && hasCheckOut))
                    : scheduleMode === "rapat"
                      ? hasRapatToday
                      : scheduleMode === "inval"
                        ? Boolean(invalAttRecord)
                        : (attendanceType === "jadwal" && isScheduleAlreadyRecorded);

                  const isDisabled = loading || !timingEval.allowed || isAlreadyRecorded || !capturedPhoto;

                  return (
                    <motion.button
                      whileHover={!isDisabled ? { scale: 1.02 } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                      type="button"
                      onClick={handleAttendanceSubmit}
                      disabled={isDisabled}
                      style={{
                        width: "100%",
                        padding: "0.95rem",
                        fontSize: "0.92rem",
                        fontWeight: 800,
                        marginTop: "0.5rem",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s ease",
                        background: isAlreadyRecorded
                          ? "#f1f5f9"
                          : !timingEval.allowed
                            ? timingEval.badgeBg
                            : !capturedPhoto
                              ? "#fef3c7"
                              : scheduleMode === "rapat"
                                ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                                : timingEval.phase === "late"
                                  ? "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)"
                                  : isPegawai && pegawaiMode === "pulang"
                                    ? "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)"
                                    : scheduleMode === "inval"
                                      ? "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)"
                                      : "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
                        color: isAlreadyRecorded
                          ? "#64748b"
                          : !timingEval.allowed
                            ? timingEval.badgeColor
                            : !capturedPhoto
                              ? "#92400e"
                              : "#ffffff",
                        boxShadow: !isDisabled
                          ? scheduleMode === "rapat"
                            ? "0 4px 16px rgba(124, 58, 237, 0.35)"
                            : timingEval.phase === "late"
                              ? "0 4px 16px rgba(234, 88, 12, 0.35)"
                              : scheduleMode === "inval"
                                ? "0 4px 16px rgba(2, 132, 199, 0.35)"
                                : "0 4px 16px rgba(5, 150, 105, 0.35)"
                          : "none"
                      }}
                    >
                      {loading ? (
                        <span>Menyimpan Presensi...</span>
                      ) : isAlreadyRecorded ? (
                        <>
                          <CheckCircle2 size={18} color="#166534" />
                          <span>
                            {isPegawai
                              ? `SUDAH ABSEN ${pegawaiMode.toUpperCase()} HARI INI`
                              : scheduleMode === "rapat"
                                ? "SUDAH PRESENSI RAPAT DINAS HARI INI"
                                : scheduleMode === "inval"
                                  ? isAlreadyRecordedByMe
                                    ? `SUDAH MENGGANTIKAN KELAS ${selectedSchedule?.kelas}`
                                    : `KELAS SUDAH DIISI OLEH ${invalAttRecord?.nama}`
                                  : `SUDAH PRESENSI KELAS ${selectedSchedule?.kelas} HARI INI`}
                          </span>
                        </>
                      ) : !timingEval.allowed ? (
                        <>
                          <Timer size={18} />
                          <span>{timingEval.badgeText} - Presensi Dikunci</span>
                        </>
                      ) : !capturedPhoto ? (
                        <>
                          <Camera size={18} />
                          <span>AMBIL FOTO KAMERA TERLEBIH DAHULU</span>
                        </>
                      ) : scheduleMode === "rapat" ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>KIRIM PRESENSI</span>
                        </>
                      ) : timingEval.phase === "late" ? (
                        <>
                          <AlertTriangle size={18} />
                          <span>
                            {scheduleMode === "inval"
                              ? `KIRIM PRESENSI GURU PENGGANTI (TERLAMBAT)`
                              : `KIRIM PRESENSI ${isPegawai ? pegawaiMode.toUpperCase() : selectedSchedule ? `KELAS ${selectedSchedule.kelas}` : "HARIAN"} (TERLAMBAT)`}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>
                            {scheduleMode === "inval"
                              ? `KIRIM PRESENSI GURU PENGGANTI (TEPAT WAKTU)`
                              : `KIRIM PRESENSI ${isPegawai ? pegawaiMode.toUpperCase() : selectedSchedule ? `KELAS ${selectedSchedule.kelas}` : "HARIAN"} (TEPAT WAKTU)`}
                          </span>
                        </>
                      )}
                    </motion.button>
                  );
                })()}
              </>
            )}
          </motion.div>
        </div>
      </main>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentUser={currentUser}
        onPasswordChanged={(updated) => setCurrentUser(updated)}
      />
    </>
  );
}
