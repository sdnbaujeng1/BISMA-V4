import ringkasanJson from './ringkasan_prompt_aplikasi.json';

export interface PromptFeatureItem {
  id: string;
  nama: string;
  kategori: string;
  ringkasan_prompt: string;
  input: string[];
  logika_utama: string;
  output: string[];
  aturan_bisnis: string;
}

export interface PromptRoleItem {
  id: string;
  nama: string;
  deskripsi: string;
  fitur: PromptFeatureItem[];
}

export interface PromptSummaryStructure {
  aplikasi: {
    nama: string;
    versi: string;
    institusi: string;
    tanggal_penyusunan: string;
    deskripsi: string;
  };
  roles: PromptRoleItem[];
}

export const ringkasanPromptData: PromptSummaryStructure = ringkasanJson as PromptSummaryStructure;

/**
 * Triggers direct browser download of the prompt summary in JSON format
 */
export function downloadPromptSummaryJson(): void {
  const jsonString = JSON.stringify(ringkasanPromptData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'ringkasan_prompt_aplikasi_bisma.json');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers direct browser download of the prompt summary in JavaScript (.js) format
 */
export function downloadPromptSummaryJs(): void {
  const jsContent = `/**
 * Ringkasan Prompt Rekayasa Sistem Aplikasi BISMA
 * Format: JavaScript Object Module (ESM / CommonJS compatible)
 * Tanggal Unduh: ${new Date().toISOString()}
 */
export const ringkasanPromptAplikasi = ${JSON.stringify(ringkasanPromptData, null, 2)};

export default ringkasanPromptAplikasi;
`;
  const blob = new Blob([jsContent], { type: 'application/javascript;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'ringkasan_prompt_aplikasi_bisma.js');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
