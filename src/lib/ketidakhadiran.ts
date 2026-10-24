export interface AbsentStudent {
  nama: string;
  keterangan: string; // 'Sakit' | 'Izin' | 'Alpa' | 'Dispensasi' | string
}

/**
 * Universal parser for Ketidakhadiran data across all legacy and current formats.
 * Handles:
 * - JSON string or parsed array of:
 *   - [{ type: 'Sakit', students: ['Name 1', 'Name 2'] }, ...] (standard BISMA format)
 *   - [{ nama: 'Name 1', keterangan: 'Sakit' }, ...]
 *   - [{ student: 'Name 1', type: 'Sakit' }, ...]
 *   - [{ name: 'Name 1', status: 'Sakit' }, ...]
 *   - ['Name 1 (Sakit)', 'Name 2 (Izin)']
 * - Object format: { Sakit: ['Name 1'], Izin: ['Name 2'] }
 * - Plain string: "Name 1 (Sakit), Name 2 (Izin)"
 */
export function parseKetidakhadiran(raw: any): AbsentStudent[] {
  if (!raw || raw === 'Nihil' || raw === '[]' || raw === 'null' || raw === '-') {
    return [];
  }

  let data = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'Nihil' || trimmed === '[]' || trimmed === 'null' || trimmed === '-') {
      return [];
    }

    try {
      data = JSON.parse(trimmed);
    } catch {
      // Plain string parsing fallback: e.g. "Bisma (Sakit), Eriko (Alpa)"
      const parts = trimmed.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
      return parts.map(part => {
        const match = part.match(/^(.*?)\s*[\(\[]([^\)\]]+)[\)\]]$/);
        if (match) {
          return { nama: match[1].trim(), keterangan: normalizeStatus(match[2].trim()) };
        }
        return { nama: part, keterangan: 'Tidak Hadir' };
      });
    }
  }

  const result: AbsentStudent[] = [];

  if (Array.isArray(data)) {
    data.forEach((item: any) => {
      if (!item) return;

      // Format 1: { type: 'Sakit', students: ['Name 1', 'Name 2'] }
      if (item.students && Array.isArray(item.students)) {
        const type = normalizeStatus(item.type || item.keterangan || item.status || 'Tidak Hadir');
        item.students.forEach((name: any) => {
          if (typeof name === 'string' && name.trim()) {
            result.push({ nama: name.trim(), keterangan: type });
          } else if (name && typeof name === 'object') {
            const studentName = name.nama || name.name || name.student || '';
            const studentKet = normalizeStatus(name.keterangan || name.type || name.status || type);
            if (studentName.trim()) {
              result.push({ nama: studentName.trim(), keterangan: studentKet });
            }
          }
        });
      }
      // Format 2: { nama: 'Name 1', keterangan: 'Sakit' } or { student: '...', type: '...' }
      else if (item.nama || item.name || item.student || item.siswa) {
        const studentName = item.nama || item.name || item.student || item.siswa;
        const ket = normalizeStatus(item.keterangan || item.type || item.status || 'Tidak Hadir');
        if (typeof studentName === 'string' && studentName.trim()) {
          result.push({ nama: studentName.trim(), keterangan: ket });
        }
      }
      // Format 3: simple string inside array: "Name 1 (Sakit)" or "Name 1"
      else if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && trimmed !== 'Nihil' && trimmed !== '[]') {
          const match = trimmed.match(/^(.*?)\s*[\(\[]([^\)\]]+)[\)\]]$/);
          if (match) {
            result.push({ nama: match[1].trim(), keterangan: normalizeStatus(match[2].trim()) });
          } else {
            result.push({ nama: trimmed, keterangan: 'Tidak Hadir' });
          }
        }
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    // Format 4: Object map { Sakit: ['Name 1'], Izin: ['Name 2'] }
    Object.keys(data).forEach(key => {
      const val = data[key];
      const type = normalizeStatus(key);
      if (Array.isArray(val)) {
        val.forEach((name: any) => {
          if (typeof name === 'string' && name.trim()) {
            result.push({ nama: name.trim(), keterangan: type });
          }
        });
      } else if (typeof val === 'string' && val.trim()) {
        result.push({ nama: val.trim(), keterangan: type });
      }
    });
  }

  return result;
}

export function normalizeStatus(rawStatus: string): string {
  const s = (rawStatus || '').trim().toLowerCase();
  if (s === 's' || s.includes('sakit')) return 'Sakit';
  if (s === 'i' || s.includes('izin') || s.includes('ijin')) return 'Izin';
  if (s === 'a' || s.includes('alpa') || s.includes('alpha') || s.includes('tanpa')) return 'Alpa';
  if (s === 'd' || s.includes('dispensasi') || s.includes('dispen')) return 'Dispensasi';
  return rawStatus.trim() || 'Tidak Hadir';
}

export function getStatusBadgeStyle(keterangan: string): { bg: string; text: string; border: string; printText: string } {
  const norm = normalizeStatus(keterangan);
  switch (norm) {
    case 'Sakit':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        printText: 'text-emerald-800 font-semibold'
      };
    case 'Izin':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        printText: 'text-amber-800 font-semibold'
      };
    case 'Alpa':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        printText: 'text-rose-800 font-bold'
      };
    case 'Dispensasi':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        printText: 'text-purple-800 font-semibold'
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        printText: 'text-slate-800 font-medium'
      };
  }
}
