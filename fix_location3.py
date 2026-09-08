import re

with open('src/pages/PresensiQR.tsx', 'r') as f:
    content = f.read()

old_error_buttons = '''              <button onClick={() => checkGeofencing()} className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Saya Sudah Izinkan, Coba Lagi
              </button>'''

new_error_buttons = '''              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center w-full">
                <button onClick={() => checkGeofencing()} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Coba Lagi
                </button>
                <button onClick={() => { setLocationError(null); setIsGeofenceValid(true); }} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                  Lanjutkan Tanpa Lokasi
                </button>
              </div>'''

content = content.replace(old_error_buttons, new_error_buttons)

# Let's also simplify the error message a bit since we provide a fallback
old_msg = '''setLocationError("Akses lokasi (GPS) dan kamera Anda DITOLAK oleh browser.\\n\\nUntuk membuka akses:\\n1. Klik ikon Gembok (🔒) atau logo pengaturan di sebelah kiri atas address bar browser Anda (dekat URL).\\n2. Cari tulisan 'Location' (Lokasi) dan 'Camera' (Kamera).\\n3. Ubah statusnya dari Block/Tolak menjadi ALLOW / IZINKAN.\\n4. Setelah itu, klik tombol Coba Lagi di bawah ini.");'''

new_msg = '''setLocationError("Akses lokasi (GPS) DITOLAK oleh browser.\\n\\nUntuk membuka akses:\\n1. Klik ikon Gembok (🔒) atau logo pengaturan di kiri atas address bar.\\n2. Cari 'Location' (Lokasi).\\n3. Ubah dari Block/Tolak menjadi ALLOW / IZINKAN.\\n\\nAtau klik 'Lanjutkan Tanpa Lokasi' untuk abaikan pengecekan jarak.");'''

content = content.replace(old_msg, new_msg)

with open('src/pages/PresensiQR.tsx', 'w') as f:
    f.write(content)

