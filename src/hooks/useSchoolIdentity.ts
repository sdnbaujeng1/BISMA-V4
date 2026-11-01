import { useState, useEffect } from 'react';
import { safeStorage } from '../lib/storage';

export interface SchoolIdentity {
  schoolName: string;
  appName: string;
  headmasterName: string;
  headmasterNIP: string;
  jabatanKepalaSekolah?: string;
  schoolLogo: string;
  bismaLogoUrl?: string;
  logo1x1?: string;
  logoKabupaten?: string;
  nilaiLogoMode?: 'both' | 'sekolah' | 'kabupaten';
  nilaiLogoSekolah?: string;
  nilaiLogoKabupaten?: string;
  tahunAjaran?: string;
  semester?: string;
  jumlahUlangan?: number;
  nilaiBobotHarian?: number;
  nilaiBobotSts?: number;
  nilaiBobotAsas?: number;
  nilaiTempatRaport?: string;
  nilaiTanggalRaport?: string;
  nilaiRaportTagline?: string;
  nilaiCatatanDefault?: string;
  waliKelasMapping?: Record<string, any>;
  kopHeaderLine1?: string;
  kopHeaderLine2?: string;
  schoolAddress?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  kasihIbuLabel: string;
  sloganText?: string;
  sloganSpeed?: string;
  landingDesc?: string;
}

const DEFAULT_SCHOOL_LOGO = "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL";
const DEFAULT_KAB_LOGO = "/assets/logo-kab-pasuruan.png";
const DEFAULT_CATATAN_RAPORT = "Tetap semangat belajar, tingkatkan terus kedisiplinan, rajin membaca, serta jaga ibadah dan akhlak mulia baik di sekolah maupun di rumah.";

export function useSchoolIdentity() {
  const [identity, setIdentity] = useState<SchoolIdentity>({
    schoolName: "SDN BAUJENG I BEJI",
    appName: "BISMA",
    headmasterName: "AKHMAD NASOR, S.Pd",
    headmasterNIP: "198704082019031001",
    jabatanKepalaSekolah: "Kepala SDN BAUJENG I BEJI",
    schoolLogo: DEFAULT_SCHOOL_LOGO,
    bismaLogoUrl: "https://lh3.googleusercontent.com/d/1k2MibT1XHlAWHbFOQo80Cj4Lp5ZMeMLT",
    logo1x1: DEFAULT_SCHOOL_LOGO,
    logoKabupaten: DEFAULT_KAB_LOGO,
    nilaiLogoMode: 'both',
    nilaiLogoSekolah: DEFAULT_SCHOOL_LOGO,
    nilaiLogoKabupaten: DEFAULT_KAB_LOGO,
    tahunAjaran: "2024/2025",
    semester: "Ganjil",
    jumlahUlangan: 3,
    nilaiBobotHarian: 50,
    nilaiBobotSts: 25,
    nilaiBobotAsas: 25,
    nilaiTempatRaport: "Beji",
    nilaiTanggalRaport: "",
    nilaiRaportTagline: "BERMUTU - Beriman, Ramah, Mandiri, Unggul dan Tangguh",
    nilaiCatatanDefault: DEFAULT_CATATAN_RAPORT,
    waliKelasMapping: {},
    kopHeaderLine1: "PEMERINTAH KABUPATEN PASURUAN",
    kopHeaderLine2: "DINAS PENDIDIKAN",
    schoolAddress: "Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan",
    subdistrict: "Kecamatan Beji",
    district: "Kabupaten Pasuruan",
    province: "Jawa Timur",
    kasihIbuLabel: "Kasih Ibu",
    sloganText: "BERMUTU ✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨",
    sloganSpeed: "3",
    landingDesc: "Aplikasi Sistem Informasi dan Manajemen Administrasi"
  });

  useEffect(() => {
    const mapSettingsToIdentity = (data: any): SchoolIdentity => {
      const resolvedSchoolName = data.schoolName && data.schoolName !== "Sekolah" ? data.schoolName : "SDN BAUJENG I BEJI";
      const resolvedSchoolLogo = data.nilaiLogoSekolah || data.logo1x1 || data.schoolLogo || DEFAULT_SCHOOL_LOGO;
      const resolvedKabLogo = data.nilaiLogoKabupaten || data.logoKabupaten || DEFAULT_KAB_LOGO;
      const resolvedTahun = data.nilaiTahunAktif || data.tahunAjaran || data.tahunPelajaranAktif || data.bisma_academicYear || "2024/2025";
      const resolvedSemester = data.nilaiSemesterAktif || data.semester || data.semesterAktif || "Ganjil";

      let parsedWkMap: Record<string, any> = {};
      if (data.wali_kelas_mapping) {
        try {
          parsedWkMap = typeof data.wali_kelas_mapping === 'string'
            ? JSON.parse(data.wali_kelas_mapping)
            : data.wali_kelas_mapping;
        } catch (e) {}
      }

      return {
        schoolName: resolvedSchoolName,
        appName: data.appName || "BISMA",
        headmasterName: data.headmasterName && data.headmasterName !== "Drs. H. Ahmad" ? data.headmasterName : "AKHMAD NASOR, S.Pd",
        headmasterNIP: data.headmasterNIP && data.headmasterNIP !== "196001011980031001" ? data.headmasterNIP : "198704082019031001",
        jabatanKepalaSekolah: data.jabatanKepalaSekolah || `Kepala ${resolvedSchoolName}`,
        schoolLogo: resolvedSchoolLogo,
        bismaLogoUrl: data.bismaLogoUrl || "https://lh3.googleusercontent.com/d/1k2MibT1XHlAWHbFOQo80Cj4Lp5ZMeMLT",
        logo1x1: resolvedSchoolLogo,
        logoKabupaten: resolvedKabLogo,
        nilaiLogoMode: (data.nilaiLogoMode as 'both' | 'sekolah' | 'kabupaten') || 'both',
        nilaiLogoSekolah: resolvedSchoolLogo,
        nilaiLogoKabupaten: resolvedKabLogo,
        tahunAjaran: resolvedTahun,
        semester: resolvedSemester,
        jumlahUlangan: data.jumlahUlangan ? parseInt(data.jumlahUlangan, 10) || 3 : 3,
        nilaiBobotHarian: data.nilaiBobotHarian ? Number(data.nilaiBobotHarian) : 50,
        nilaiBobotSts: data.nilaiBobotSts ? Number(data.nilaiBobotSts) : 25,
        nilaiBobotAsas: data.nilaiBobotAsas ? Number(data.nilaiBobotAsas) : 25,
        nilaiTempatRaport: data.nilaiTempatRaport || "Beji",
        nilaiTanggalRaport: data.nilaiTanggalRaport || "",
        nilaiRaportTagline: data.nilaiRaportTagline || data.sloganText || "BERMUTU - Beriman, Ramah, Mandiri, Unggul dan Tangguh",
        nilaiCatatanDefault: data.nilaiCatatanDefault || DEFAULT_CATATAN_RAPORT,
        waliKelasMapping: parsedWkMap,
        kopHeaderLine1: data.kopHeaderLine1 || "PEMERINTAH KABUPATEN PASURUAN",
        kopHeaderLine2: data.kopHeaderLine2 || "DINAS PENDIDIKAN",
        schoolAddress: data.schoolAddress || "Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan",
        subdistrict: data.subdistrict || "Kecamatan Beji",
        district: data.district || "Kabupaten Pasuruan",
        province: data.province || "Jawa Timur",
        kasihIbuLabel: data.kasih_ibu_label || data.kasih_ibu_name || data.kasihIbuLabel || "Kasih Ibu",
        sloganText: data.sloganText || "BERMUTU ✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨",
        sloganSpeed: data.sloganSpeed || "3",
        landingDesc: data.landingDesc || "Aplikasi Sistem Informasi dan Manajemen Administrasi"
      };
    };

    const fetchIdentity = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data) {
          const newIdentity = mapSettingsToIdentity(result.data);
          setIdentity(newIdentity);
          safeStorage.setItem('school_identity_data', JSON.stringify({ ...result.data, ...newIdentity }));
          
          // Update document title and favicon
          document.title = `${newIdentity.appName} - ${newIdentity.schoolName}`;
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          if (newIdentity.schoolLogo) {
            link.href = newIdentity.schoolLogo;
          }
        }
      } catch (error) {
        console.error("Failed to fetch school identity", error);
        const stored = safeStorage.getItem('school_identity_data');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            const mappedData = mapSettingsToIdentity(data);
            setIdentity(mappedData);
            document.title = `${mappedData.appName} - ${mappedData.schoolName}`;
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (link && mappedData.schoolLogo) {
              link.href = mappedData.schoolLogo;
            }
          } catch(e) {}
        }
      }
    };

    fetchIdentity();

    const handleUpdate = () => {
      fetchIdentity();
    };

    window.addEventListener('school-identity-update', handleUpdate);
    return () => window.removeEventListener('school-identity-update', handleUpdate);
  }, []);

  return identity;
}

