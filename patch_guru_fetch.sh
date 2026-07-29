sed -i '/fetchConfig();/a \
    fetchAnalysisData();' src/pages/KasihIbuGuru.tsx

sed -i '/const handleValidate/i \
  const fetchAnalysisData = async () => {\
    setAnalysisLoading(true);\
    try {\
      const { data: pointsData } = await supabase.from("kasih_ibu").select("nisn, jenis_kebiasaan, kelas");\
      const { data: users } = await supabase.from("users").select("NISN, \\\"Nama Lengkap\\\"").eq("Role", "Siswa");\
      const uMap: Record<string, string> = {};\
      if (users) {\
        users.forEach((u) => { if (u.NISN) uMap[u.NISN] = u["Nama Lengkap"]; });\
        setUsersMap(uMap);\
      }\
      if (pointsData) {\
        setRawData(pointsData);\
        const classPoints: Record<string, number> = {};\
        pointsData.forEach((entry) => {\
          const habitInfo = HABIT_POINTS[entry.jenis_kebiasaan];\
          if (habitInfo && entry.kelas) {\
            classPoints[entry.kelas] = (classPoints[entry.kelas] || 0) + habitInfo.points;\
          }\
        });\
        const formattedChartData = Object.keys(classPoints).map((cls) => ({ name: cls, total: classPoints[cls] })).sort((a, b) => b.total - a.total);\
        setChartData(formattedChartData);\
        calculateTopStudents("Semua Kelas", pointsData, uMap);\
      }\
    } catch (e) {\
      console.error("Error fetching analysis data", e);\
    } finally {\
      setAnalysisLoading(false);\
    }\
  };\
  \
  const handleBarClick = (data: any) => {\
    const now = new Date().getTime();\
    if (lastClick && lastClick.name === data.name && now - lastClick.time < 500) {\
      setSelectedTopClass(data.name);\
      calculateTopStudents(data.name, rawData, usersMap);\
      setActiveTab("peringkat");\
      setLastClick(null);\
    } else {\
      setLastClick({ name: data.name, time: now });\
    }\
  };\
  \
  const calculateTopStudents = (kelas: string, pointsData = rawData, uMap = usersMap) => {\
    const studentPoints: Record<string, number> = {};\
    pointsData.forEach((entry) => {\
      if ((kelas === "Semua Kelas" || entry.kelas === kelas) && HABIT_POINTS[entry.jenis_kebiasaan]) {\
        const nisn = entry.nisn;\
        if (nisn) {\
          studentPoints[nisn] = (studentPoints[nisn] || 0) + HABIT_POINTS[entry.jenis_kebiasaan].points;\
        }\
      }\
    });\
    const sortedStudents = Object.keys(studentPoints)\
      .map((nisn) => ({\
        nisn,\
        name: uMap[nisn] || `NISN: ${nisn}`,\
        points: studentPoints[nisn],\
      }))\
      .sort((a, b) => b.points - a.points)\
      .slice(0, 10);\
    setTopStudents(sortedStudents);\
  };\
\
  useEffect(() => {\
    calculateTopStudents(selectedTopClass);\
  }, [selectedTopClass]);' src/pages/KasihIbuGuru.tsx
