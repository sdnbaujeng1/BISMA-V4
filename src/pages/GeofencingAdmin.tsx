import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Save, MapPin, Users } from 'lucide-react';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: L.LatLngExpression, setPosition: (pos: L.LatLngExpression) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function GeofencingAdmin({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [lat, setLat] = useState<number>(-7.5925);
  const [lng, setLng] = useState<number>(112.7831);
  const [radius, setRadius] = useState<number>(100);
  const [targetRoles, setTargetRoles] = useState<string[]>(['Siswa']);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const roles = ['Guru', 'Tendik', 'Siswa'];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data) {
          if (result.data.geofence_lat) setLat(parseFloat(result.data.geofence_lat));
          if (result.data.geofence_lng) setLng(parseFloat(result.data.geofence_lng));
          if (result.data.geofence_radius) setRadius(parseInt(result.data.geofence_radius));
          if (result.data.geofence_roles) {
            try {
              setTargetRoles(JSON.parse(result.data.geofence_roles));
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error("Failed to fetch geofencing settings", e);
      } finally {
        setIsFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geofence_lat: lat.toString(),
          geofence_lng: lng.toString(),
          geofence_radius: radius.toString(),
          geofence_roles: JSON.stringify(targetRoles)
        })
      });
      
      const data = await res.json();
      if (data.success) {
        showToast('Pengaturan Geofencing berhasil disimpan', 'success');
      } else {
        showToast(data.message || 'Gagal menyimpan pengaturan', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setTargetRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  if (isFetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <MapPin className="w-8 h-8 text-blue-600" />
          Geofencing & Lokasi
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Atur batas wilayah absensi untuk pengguna aplikasi.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" /> Koordinat Lokasi
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Radius (Meter)</label>
                <input 
                  type="number" 
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Jarak maksimal pengguna dapat melakukan absensi.</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Target Role
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Pilih role yang wajib berada di dalam radius saat absensi.</p>
            
            <div className="space-y-3">
              {roles.map(role => (
                <label key={role} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={targetRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <><Save className="w-5 h-5" /> Simpan Pengaturan</>
            )}
          </button>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[500px] flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-2">Preview Peta</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 px-2">Klik pada peta untuk mengubah titik pusat lokasi.</p>
          
          <div className="flex-grow rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0">
            <MapContainer center={[lat, lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker 
                position={[lat, lng]} 
                setPosition={(pos: any) => {
                  setLat(pos.lat);
                  setLng(pos.lng);
                }} 
              />
              <Circle 
                center={[lat, lng]} 
                radius={radius} 
                pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2 }}
              />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
