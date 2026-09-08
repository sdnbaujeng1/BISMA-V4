import { useState, useEffect } from 'react';
import { safeStorage } from '../lib/storage';

export interface SchoolIdentity {
  schoolName: string;
  appName: string;
  headmasterName: string;
  headmasterNIP: string;
  schoolLogo: string;
  logo1x1?: string;
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
    logo1x1: "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
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
            logo1x1: data.logo1x1 || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
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
              logo1x1: data.logo1x1 || data.schoolLogo || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL",
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
