sed -i '/const \[users, setUsers\] = useState<any\[\]>(\[\]);/a \
  const fileInputRef = useRef<HTMLInputElement>(null);\n\
  const handleExportTemplate = () => {\n\
    const content = "NIP;Nama Lengkap;Mata Pelajaran (Pisahkan dengan koma jika > 1);Wali Kelas (Opsional);Password\\n198xxxx;Guru A;Matematika,IPA;Kelas 5;baujeng@1";\n\
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });\n\
    const url = URL.createObjectURL(blob);\n\
    const link = document.createElement("a");\n\
    link.href = url;\n\
    link.setAttribute("download", "template_guru.csv");\n\
    document.body.appendChild(link);\n\
    link.click();\n\
    document.body.removeChild(link);\n\
    showToast("Template Guru berhasil didownload");\n\
  };\n\
  const handleExportData = () => {\n\
    const header = "NIP;Nama Lengkap;Role";\n\
    const rows = users.map(u => `${u.nip || ""};${u.nama || ""};${u.role || ""}`);\n\
    const content = [header, ...rows].join("\\n");\n\
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });\n\
    const url = URL.createObjectURL(blob);\n\
    const link = document.createElement("a");\n\
    link.href = url;\n\
    link.setAttribute("download", "data_users.csv");\n\
    document.body.appendChild(link);\n\
    link.click();\n\
    document.body.removeChild(link);\n\
    showToast("Data User berhasil diexport");\n\
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
              body: JSON.stringify({ type: "Guru", data: text }),\n\
            });\n\
            const result = await res.json();\n\
            if (result.success) {\n\
              showToast(result.message, "success");\n\
              fetchUsers();\n\
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
