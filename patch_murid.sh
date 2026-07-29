sed -i '/const \[searchQuery, setSearchQuery\] = useState("");/a \
  const fileInputRef = useRef<HTMLInputElement>(null);\n\
  const handleExportTemplate = () => {\n\
    const content = "NISN;NIS;Nama Lengkap;Kelas;Jenis Kelamin (L/P);Tanggal Lahir (YYYY-MM-DD);Password (Default: baujeng(kelas))\\n1234567890;1001;Siswa A;Kelas 1;L;2017-05-20;baujeng1\\n0987654321;1002;Siswa B;Kelas 1;P;2017-08-15;baujeng1";\n\
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });\n\
    const url = URL.createObjectURL(blob);\n\
    const link = document.createElement("a");\n\
    link.href = url;\n\
    link.setAttribute("download", "template_siswa.csv");\n\
    document.body.appendChild(link);\n\
    link.click();\n\
    document.body.removeChild(link);\n\
    showToast("Template Siswa berhasil didownload");\n\
  };\n\
  const handleExportData = () => {\n\
    const header = "NISN;NIS;Nama Lengkap;Kelas;Jenis Kelamin (L/P);Tanggal Lahir (YYYY-MM-DD)";\n\
    const rows = muridList.map(m => `${m.NISN || ""};${m.NIS || ""};${m["Nama Lengkap"] || ""};${m.Kelas || ""};${m["Jenis Kelamin (L/P)"] || ""};${m["Tanggal Lahir (YYYY-MM-DD)"] || ""}`);\n\
    const content = [header, ...rows].join("\\n");\n\
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });\n\
    const url = URL.createObjectURL(blob);\n\
    const link = document.createElement("a");\n\
    link.href = url;\n\
    link.setAttribute("download", "data_siswa.csv");\n\
    document.body.appendChild(link);\n\
    link.click();\n\
    document.body.removeChild(link);\n\
    showToast("Data Siswa berhasil diexport");\n\
  };\n\
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {\n\
    if (e.target.files && e.target.files.length > 0) {\n\
      const reader = new FileReader();\n\
      reader.onload = async (ev) => {\n\
        const text = ev.target?.result;\n\
        if (typeof text === "string") {\n\
          try {\n\
            const res = await fetch("/api/import-master", {\n\
              method: "POST",\n\
              headers: { "Content-Type": "application/json" },\n\
              body: JSON.stringify({ type: "Siswa", data: text }),\n\
            });\n\
            const result = await res.json();\n\
            if (result.success) {\n\
              showToast(result.message, "success");\n\
              fetchMurid();\n\
            } else {\n\
              showToast(result.message, "error");\n\
            }\n\
          } catch (err) {\n\
            showToast("Terjadi kesalahan saat mengimport data", "error");\n\
          }\n\
        }\n\
      };\n\
      reader.readAsText(e.target.files[0]);\n\
    }\n\
  };' src/pages/AdminDashboard.tsx
