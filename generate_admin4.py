import re

# Read KasihIbuGuru
with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    code = f.read()

# Replace export default
code = code.replace('export default function KasihIbuGuru', 'export default function KasihIbuAdmin')
code = code.replace('import { ArrowLeft, Heart, CheckCircle, XCircle, Clock, Gift, X, BarChart3, Users, Trophy } from \'lucide-react\';', 'import { ArrowLeft, Heart, CheckCircle, XCircle, Clock, Gift, X, BarChart3, Users, Trophy, Save } from \'lucide-react\';')

# Add missing states for config
states_to_add = """
  const [kasihIbuLabel, setKasihIbuLabel] = useState<string>("Kasih Ibu");
"""
code = code.replace('const [pointPrice, setPointPrice] = useState(100);', 'const [pointPrice, setPointPrice] = useState<any>(100);\n' + states_to_add)
code = code.replace('const [activeTab, setActiveTab] = useState<"validasi" | "analisis" | "peringkat">("validasi");', 'const [activeTab, setActiveTab] = useState<"konfigurasi" | "validasi" | "analisis" | "peringkat">("konfigurasi");')

# Extract config logic from Admin backup
with open('/tmp/KasihIbuAdmin.tsx.orig', 'r') as f:
    admin_bak = f.read()

fetch_config_match = re.search(r'(const fetchConfig = async \(\) => {.*?};)\n', admin_bak, re.DOTALL)
fetch_config = fetch_config_match.group(1) if fetch_config_match else ''

save_config_match = re.search(r'(const handleSaveConfig = async \(\) => {.*?};)\n', admin_bak, re.DOTALL)
save_config = save_config_match.group(1) if save_config_match else ''

# Replace fetchConfig in Guru
guru_fetch_config_match = re.search(r'const fetchConfig = async \(\) => \{.*?\};\n', code, re.DOTALL)
if guru_fetch_config_match:
    code = code.replace(guru_fetch_config_match.group(0), fetch_config + '\n\n' + save_config + '\n')
else:
    print("Warning: could not find fetchConfig in Guru")

config_form = """
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Konfigurasi Program
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Atur parameter dan label
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Menu / Program
              </label>
              <input
                type="text"
                value={kasihIbuLabel}
                onChange={(e) => setKasihIbuLabel(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                placeholder="Contoh: Kasih Ibu"
              />
              <p className="text-xs text-slate-500 mt-2">
                Nama ini akan tampil di menu Siswa, Guru, dan Tendik.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Harga per Poin (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  Rp
                </span>
                <input
                  type="number"
                  value={pointPrice}
                  onChange={(e) => setPointPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  placeholder="Contoh: 100"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Nilai acuan saat siswa menukarkan poin dengan Alat Tulis Kantor
                (ATK).
              </p>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Konfigurasi
                </>
              )}
            </button>
          </div>
        </div>
"""

tabs_html = """
      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button onClick={() => setActiveTab("konfigurasi")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "konfigurasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Konfigurasi</button>
        <button onClick={() => setActiveTab("validasi")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "validasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Validasi</button>
"""
code = re.sub(r'<div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">.*?<button onClick={\(\) => setActiveTab\("validasi"\)}.*?</button>', tabs_html, code, flags=re.DOTALL)

konfig_content = f"""
      {{activeTab === "konfigurasi" && (
{config_form}
      )}}
"""
code = code.replace('{activeTab === "validasi" && (', konfig_content + '\n      {activeTab === "validasi" && (')

code = code.replace("const [selectedClass, setSelectedClass] = useState(user?.waliKelas || 'Kelas 1');", "const [selectedClass, setSelectedClass] = useState('Kelas 1');")

code = re.sub(r'<div className="flex items-center gap-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-3 py-1.5 rounded-full text-sm font-bold">.*?</div>', '', code, flags=re.DOTALL)

code = code.replace('Dashboard Wali Kelas', 'Dashboard Admin')
code = code.replace('Wali Kelas: {user?.waliKelas}', 'Mode Admin')

# Fix toast
code = re.sub(r'const \[toast, setToast\].*?null\);', '', code, flags=re.DOTALL)
code = re.sub(r'const showToast =.*?;\n  };\n', '', code, flags=re.DOTALL)
code = re.sub(r'\{toast && \(.*?\}\n', '', code, flags=re.DOTALL)
code = code.replace('export default function KasihIbuAdmin({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {', 'export default function KasihIbuAdmin({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {')

# Remove ArrowLeft and back button completely
code = re.sub(r'<button onClick=\{\(\) => onNavigate\(\'main\'\)\}.*?<ArrowLeft.*?/>\s*</button>', '', code, flags=re.DOTALL)

with open('src/pages/KasihIbuAdmin.tsx', 'w') as f:
    f.write(code)
