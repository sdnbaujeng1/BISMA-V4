sed -i '/const handleExportTemplate = () => {/i \
  const handleExportData = () => {\n\
    const header = "hari;kelas;guru;jam;mapel";\n\
    const rows = scheduleData.map(s => `${s.hari || ""};${s.kelas || ""};${s.guru || ""};${s.jam || ""};${s.mapel || ""}`);\n\
    const content = [header, ...rows].join("\\n");\n\
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });\n\
    const url = URL.createObjectURL(blob);\n\
    const link = document.createElement("a");\n\
    link.href = url;\n\
    link.setAttribute("download", "data_jadwal_pelajaran.csv");\n\
    document.body.appendChild(link);\n\
    link.click();\n\
    document.body.removeChild(link);\n\
    showToast("Data Jadwal berhasil diexport");\n\
  };' src/pages/AdminDashboard.tsx
