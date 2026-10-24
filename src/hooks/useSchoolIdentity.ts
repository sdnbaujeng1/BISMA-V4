import { useState, useEffect } from 'react';
import { safeStorage } from '../lib/storage';

export interface SchoolIdentity {
  schoolName: string;
  appName: string;
  headmasterName: string;
  headmasterNIP: string;
  schoolLogo: string;
  bismaLogoUrl?: string;
  logo1x1?: string;
  logoKabupaten?: string;
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

export function useSchoolIdentity() {
  const [identity, setIdentity] = useState<SchoolIdentity>({
    schoolName: "SDN BAUJENG I BEJI",
    appName: "BISMA",
    headmasterName: "AKHMAD NASOR, S.Pd",
    headmasterNIP: "198704082019031001",
    schoolLogo: "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
    bismaLogoUrl: "https://lh3.googleusercontent.com/d/1k2MibT1XHlAWHbFOQo80Cj4Lp5ZMeMLT",
    logo1x1: "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
    logoKabupaten: "/assets/logo-kab-pasuruan.png",
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
    const fetchIdentity = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data) {
          const data = result.data;
          const newIdentity: SchoolIdentity = {
            schoolName: data.schoolName || "SDN BAUJENG I BEJI",
            appName: data.appName || "BISMA",
            headmasterName: data.headmasterName || "AKHMAD NASOR, S.Pd",
            headmasterNIP: data.headmasterNIP || "198704082019031001",
            schoolLogo: data.logo1x1 || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
            bismaLogoUrl: data.bismaLogoUrl || "https://lh3.googleusercontent.com/d/1k2MibT1XHlAWHbFOQo80Cj4Lp5ZMeMLT",
            logo1x1: data.logo1x1 || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
            logoKabupaten: data.logoKabupaten || "/assets/logo-kab-pasuruan.png",
            kopHeaderLine1: data.kopHeaderLine1 || "PEMERINTAH KABUPATEN PASURUAN",
            kopHeaderLine2: data.kopHeaderLine2 || "DINAS PENDIDIKAN",
            schoolAddress: data.schoolAddress || "Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan",
            subdistrict: data.subdistrict || "Kecamatan Beji",
            district: data.district || "Kabupaten Pasuruan",
            province: data.province || "Jawa Timur",
            kasihIbuLabel: data.kasih_ibu_label || data.kasih_ibu_name || "Kasih Ibu",
            sloganText: data.sloganText || "BERMUTU ✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨",
            sloganSpeed: data.sloganSpeed || "3",
            landingDesc: data.landingDesc || "Aplikasi Sistem Informasi dan Manajemen Administrasi"
          };
          setIdentity(newIdentity);
          safeStorage.setItem('school_identity_data', JSON.stringify(newIdentity));
          
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
            const mappedData: SchoolIdentity = {
              schoolName: data.schoolName || "SDN BAUJENG I BEJI",
              appName: data.appName || "BISMA",
              headmasterName: data.headmasterName || "AKHMAD NASOR, S.Pd",
              headmasterNIP: data.headmasterNIP || "198704082019031001",
              schoolLogo: data.logo1x1 || data.schoolLogo || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
              bismaLogoUrl: data.bismaLogoUrl || "https://lh3.googleusercontent.com/d/1k2MibT1XHlAWHbFOQo80Cj4Lp5ZMeMLT",
              logo1x1: data.logo1x1 || data.schoolLogo || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
              logoKabupaten: data.logoKabupaten || "/assets/logo-kab-pasuruan.png",
              kopHeaderLine1: data.kopHeaderLine1 || "PEMERINTAH KABUPATEN PASURUAN",
              kopHeaderLine2: data.kopHeaderLine2 || "DINAS PENDIDIKAN",
              schoolAddress: data.schoolAddress || "Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan",
              subdistrict: data.subdistrict || "Kecamatan Beji",
              district: data.district || "Kabupaten Pasuruan",
              province: data.province || "Jawa Timur",
              kasihIbuLabel: data.kasih_ibu_label || data.kasihIbuLabel || "Kasih Ibu",
              sloganText: data.sloganText || "BERMUTU ✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨",
              sloganSpeed: data.sloganSpeed || "3",
              landingDesc: data.landingDesc || "Aplikasi Sistem Informasi dan Manajemen Administrasi"
            };
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
