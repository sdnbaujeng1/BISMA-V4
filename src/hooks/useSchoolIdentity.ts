import { useState, useEffect } from 'react';

export interface SchoolIdentity {
  schoolName: string;
  headmasterName: string;
  headmasterNIP: string;
  schoolLogo: string;
}

export function useSchoolIdentity() {
  const [identity, setIdentity] = useState<SchoolIdentity>({
    schoolName: "Sekolah",
    headmasterName: "Kepala Sekolah",
    headmasterNIP: "-",
    schoolLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/800px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png"
  });

  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data) {
          const data = result.data;
          const newIdentity = {
            schoolName: data.schoolName || "Sekolah",
            headmasterName: data.headmasterName || "Kepala Sekolah",
            headmasterNIP: data.headmasterNIP || "-",
            schoolLogo: data.logo1x1 || "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/800px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png"
          };
          setIdentity(newIdentity);
          localStorage.setItem('school_identity_data', JSON.stringify(newIdentity));
          
          // Update document title and favicon
          document.title = newIdentity.schoolName;
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = newIdentity.schoolLogo;
        }
      } catch (error) {
        console.error("Failed to fetch school identity", error);
        const stored = localStorage.getItem('school_identity_data');
        if (stored) {
          const data = JSON.parse(stored);
          const mappedData = {
            ...data,
            schoolLogo: data.logo1x1 || data.schoolLogo || "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/800px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png"
          };
          setIdentity(mappedData);
          document.title = mappedData.schoolName || "Sekolah";
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link && mappedData.schoolLogo) {
            link.href = mappedData.schoolLogo;
          }
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
