# CODEBASE.md — Dokumentasi Teknis Asep Finance AI

## 0. Cara Membaca Dokumen Ini

Dokumen ini ditulis untuk:
- **Developer Baru/Kontributor** yang ingin berkontribusi pada fitur baru.
- **Code Reviewer** yang memeriksa kualitas dan skalabilitas arsitektur.
- **Maintainer** yang mencari *bottleneck* atau titik rentan pada sistem.

**Cara terbaik membaca dokumen ini:**
- Jika Anda baru pertama melihat *codebase* ini, mulailah dari **Peta Struktur File (Section 1)** dan **Dependency Graph (Section 2)** untuk memahami gambaran besar arsitektur.
- Untuk memahami *core logic* aplikasi, baca dokumentasi `App.tsx`, `services/ai.ts`, dan `store/finance.ts` pada **Section 3**.
- Jika ingin *debug* atau menambahkan fitur spesifik, langsung cari *flow* tersebut pada **Alur Data (Section 5)**.
- Pertimbangkan membaca **FAQ Internal (Section 11)** untuk menjawab pertanyaan arsitektural yang mungkin membingungkan.

**Konvensi Notasi:**
- `→` : Memanggil / import dari / diteruskan ke.
- `←` : Mengembalikan nilai (*return value*).
- `[...]` : Penanda abstrak / entitas logika.

---

## 1. Peta Struktur File

Pohon direktori di bawah ini merangkum struktur dari `/src` sebagai *source code* utama:

```
project/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx                    → [ENTRY] Titik masuk utama React React-DOM.
    ├── App.tsx                     → [CORE] Komponen akar yang mengatur *state* utama dan UI tabs.
    ├── index.css                   → [SHARED] Styling global via TailwindCSS.
    ├── types.ts                    → [TYPE] Deklarasi *interface/type* global TypeScript.
    ├── components/
    │   ├── ChatArea.tsx            → [CORE] Interaksi suara dan teks pengguna dengan AI Asep.
    │   ├── FinancePanel.tsx        → [CORE] Ringkasan saldo dan *chart* Pie laporan keuangan.
    │   ├── ReportView.tsx          → [CORE] Tabel daftar riwayat transaksi lengkap.
    │   ├── Sidebar.tsx             → [CORE] Navigasi menu utama di sisi kiri layar.
    │   └── BillsView.tsx           → [UTIL] (Orphaned) Tampilan khusus tagihan yang saat ini di-*hide*.
    ├── hooks/
    │   └── useSpeech.ts            → [UTIL] *Custom hook* penghubung Web Speech API (STT & TTS).
    ├── lib/
    │   └── utils.ts                → [SHARED] Fungsi utilitas kecil pendukung UI library.
    ├── services/
    │   └── ai.ts                   → [CORE] *Setup* Gemini AI dan deklarasi *Function Calling*.
    └── store/
        └── finance.ts              → [CORE] *State manager* finansial dan *local storage persistance*.
```

---

## 2. Dependency Graph Antar File

Berikut adalah relasi utama saling-silang antar modul:

- **`src/main.tsx`** MENGIMPORT DARI → `App.tsx`, `index.css`
- **`src/App.tsx`** MENGIMPORT DARI → 
    - `components/Sidebar.tsx`
    - `components/ChatArea.tsx`
    - `components/FinancePanel.tsx`
    - `components/ReportView.tsx`
    - `store/finance.ts` (mengambil `useFinance`)
    - `hooks/useSpeech.ts` (mengambil `useSpeech`)
    - `services/ai.ts` (mengambil `initChat`)
    - `types.ts`
- **`src/components/Sidebar.tsx`** MENGIMPORT DARI → `lib/utils.ts` (`cn`), `types.ts` (`TabType`)
- **`src/components/ChatArea.tsx`** MENGIMPORT DARI → `lib/utils.ts` (`cn`), `types.ts` (`ChatMessage`)
- **`src/components/FinancePanel.tsx`** MENGIMPORT DARI → `lib/utils.ts` (`cn`), `types.ts` (`Transaction`)
- **`src/components/ReportView.tsx`** MENGIMPORT DARI → `types.ts` (`Transaction`)
- **`src/components/BillsView.tsx`** MENGIMPORT DARI → `types.ts` (`Transaction`)
- **`src/store/finance.ts`** MENGIMPORT DARI → `types.ts` (`Transaction`)
- **`src/services/ai.ts`** MENGIMPORT DARI → *Tidak ada import internal (hanya package npm eksternal)*
- **`src/hooks/useSpeech.ts`** MENGIMPORT DARI → *Tidak ada import internal*
- **`src/lib/utils.ts`** MENGIMPORT DARI → *Tidak ada import internal*

**Ringkasan Arsitektur:**
1. **Paling banyak di-import:** `types.ts` dan `lib/utils.ts`. Mereka berfungsi sebagai fondasi struktur data dan gaya.
2. **Paling dependent (bergantung):** `App.tsx` berperan sebagai "God Component" / orkestrator yang mengikat semua UI, *hooks*, dan *services*.
3. **Circular Dependencies:** 
   - **TIDAK ADA.** Arsitektur berbentuk *tree* satu arah turun yang berpusat di `App.tsx`. Ini memudahkan pemeliharaan kode.
4. **Berdiri Sendiri:**
   - `useSpeech.ts`, `ai.ts`, dan `finance.ts` berdiri spesifik untuk tugasnya sendiri tanpa terlalu bergantung pada komponen UI, ini membuat *logic tier* mudah di-*test* independen kelak.

---

## 3. Dokumentasi Per File

### `src/App.tsx`
**Tujuan file ini:** 
Orkestrator utama aplikasi yang menyatukan state antarmuka (`activeTab`), state manajemen data keuangan (`transactions`), *speech hook* (STT/TTS), serta mengirim pesan *prompt/transcript* dari *user* menuju Gemini AI. Ia juga merespons instruksi AI berbentuk *function calls*.

**Diimport oleh:**
- `main.tsx` — untuk di-render ke DOM utama proyek.

**Mengimport dari:**
- `@/components/*` → `Sidebar`, `ChatArea`, `FinancePanel`, dll.
- `@/store/finance` → `useFinance` (logika penyimpanan dan rekap dana).
- `@/hooks/useSpeech` → `useSpeech` (logika rekam mic dan tts).
- `@/services/ai` → `initChat` (menyalakan *session* dengan AI).

**Exports:**
| Nama | Tipe | Deskripsi |
|------|------|-----------|
| `DEFAULT` | `component` | Fungsi React penyusun tata letak *grid* aplikasi. |

**Variabel & State Internal Penting:**
- `messages`: `ChatMessage[]`
  - Menyimpan *history* log percakapan User dan Model AI. 
  - Kapan berubah: Bertambah saat *user speak/type* dan saat AI menjawab/memberikan *error*.
- `chatSession`: `any`
  - Instansiasi objek percakapan Gemini aktif.
  - Kapan berubah: Dibuat 1 kali di `useEffect` awal aplikasi di-_mount_.
- `activeTab`: `TabType`
  - Nilai `'chat' | 'report'`. Mengatur mode apa yang tertampil di layar tengah.

---

### `src/services/ai.ts`
**Tujuan file ini:** 
Menyiapkan parameter dasar LLM Gemini API, memuat *System Instructions* (kepribadian Gintoki/Asep), dan mendeklarasikan struktur skema JSON dari *Tool/Function Calling* yang akan diizinkan untuk di-*invoke* oleh model AI.

**Diimport oleh:**
- `App.tsx` — untuk di-*assign* ke `chatSession`.

**Exports:**
| Nama | Tipe | Deskripsi |
|------|------|-----------|
| `initChat` | `async function` | Melakukan setup API key dan mendefinisikan *personality* sistem ke SDK Gemini. |

**VariabelInternal Penting:**
- `updateExcelFinanceDeclaration`: Skema *tool* yang mengajari AI cara mengekstrak *intent* `pemasukan` & `pengeluaran`.
- `SYSTEM_INSTRUCTION`: Prompt dasar yang mengubah gaya bahasa sang assistant menjadi Asep, beserta logika *prioritas respons*.

---

### `src/store/finance.ts`
**Tujuan file ini:** 
Melakukan orkestrasi mutasi data transaksi pengguna sekaligus memberikan mekanisme persistensi sederhana menggunakan `localStorage` browser, dan mengekspor riwayat itu ke format ekstensi *.xlsx (Excel)*.

**Diimport oleh:**
- `App.tsx` — untuk mengambil daftar transaksi, metode tambah transaksi (`addTransaction`), peringkasan (`getSummary`), dan simpan Excel (`exportToExcel`).

**Exports:**
| Nama | Tipe | Deskripsi |
|------|------|-----------|
| `useFinance` | `hook` | *Custom hook* React pemegang state daftar *transactions*. |

**State Internal:**
- `transactions`: `Transaction[]`. Di-*load* dari localStorage melalui `useEffect` saat di-inisiasi pertama.

---

### `src/hooks/useSpeech.ts`
**Tujuan file ini:** 
Membungkus dan menyederhanakan *Web Speech API* yang biasanya _flaky_ (rendan mati/putus otomatis) pada browser menjadi sebuah `useSpeech` hook. Mengatur rekaman suara (Speech to Text) dan bicara TTS (Speech Synthesis).

**Exports:**
| Nama | Tipe | Deskripsi |
|------|------|-----------|
| `useSpeech` | `hook` | Mengelola `isListening`, `isSpeaking`, `transcript`, start/stop mikrofon, dan fungsi sintesis `speak()`. |

**Gotchas (Edge Case Handling):**
- **Sistem Timeout:** Terdapat logika di `timeoutRef` untuk mengontrol durasi berhentinya (*auto-stop*) dari Mic untuk mengurangi kasus browser *hang* ketika user tidak jadi bicara.

---

## 4. Dokumentasi Per Function / Method / Component

### `handleSendMessage(text: string)`
**File:** `src/App.tsx`

**Apa yang dilakukan:**
Mengirim *prompt* dari *user* (baik via *mic* atau keyboard) ke sistem Gemini, mencegat respons AI jika ia berniat mengeksekusi "function calling" ke sistem keuangan (seperti nulis Excel), mensukseskan perintah itu lokal, lalu mengembalikan hasilnya lagi ke Gemini agar Gemini bisa merangkai pesan suara konfirmasi.

**Parameter:**
| Nama | Tipe | Wajib? | Deskripsi |
|------|------|--------|-----------|
| `text` | `string` | Ya | Input percakapan dari *user*. |

**Alur kerja internal (step by step):**
1. User mengirim `text`. `messages` ditambahkan tipe 'user'.
2. Memanggil metode `chatSession.sendMessage({ message: text })`. 
3. *IF* balasan LLM mengandung struktur `result.functionCalls`:
   - Melakukan iterasi. Jika tujuannya `update_excel_finance`, sistem ekstrak `args.income`/`expense`, lalu panggil _hook_ `addTransaction`.
   - Siapkan respons keberhasilan dalam array `functionResponses` format JSON.
   - Kirim `functionResponses` ini balik ke Gemini dengan `sendMessage()`. (Ini agar Gemini membalas _"Oke duit bos sisa X..."_).
4. Sisa _step_ normal jika tidak ada function: Ambil `result.text`.
5. Update state percakapan (`messages`) ke role `model`.
6. Panggil sistem Web Speech API `speak(replyText)` untuk mengucapkan konfirmasi.
7. *CATCH*: Jika error/limit kuota/API key hilang, update state percakapan ke 'model' dengan notifikasi *error handling*.

**Edge cases & gotcha:**
- **Race Condition API Key:** Tanpa adanya pengecekan ekstrak dari enviroment variable yang akurat di `App.tsx`, kode `429` (Quota Terlampaui) ditangkap dengan balasan sarkas (custom catch).

---

### `addTransaction(t)`
**File:** `src/store/finance.ts`

**Apa yang dilakukan:**
Menambahkan *record* finansial baru ke dalam _state_ array React dan bersamaan langsung _flush_ menyimpannya ke `localStorage`.

**Return value:**
- Tipe: Objek `Transaction` yang telah ditambahkan `id` UUID-nya.

**Alur kerja internal (step by step):**
1. Menerima objek yang berisi format finansial murni (tanggal, kategori, rincian, idr keluaran/masukan) selain `id`.
2. Melakukan *destructure/spread* lalu menambahkan identitas *unique string* via `crypto.randomUUID()`.
3. Array di-_concat_. State internal diubah. Data kemudian diparsing menjadi JSON String untuk di-set di parameter Storage lokal.

---

## 5. Alur Data (Data Flow)

### Flow: Mencatat Pengeluaran Baru via Suara
[Trigger: User klik `Microphone` dan berbicara: "Jajan sosis 40 ribu"]
↓
[Hook: `useSpeech.ts`]
└── Web Speech API terus menerjemahkan suara ke teks (`transcript`). Teks berhenti jika jeda bicara > 3.5 detik (terpicu dari timeoutRef).
↓
[Component: `App.tsx`]
└── `useEffect` mendeteksi isListening menjadi `false` dengan `transcript` memiliki nilai.
└── Mengeksekusi: `handleSendMessage(transcript)`
↓
[Service: `ai.ts` via `chatSession.sendMessage`]
└── Gemini API mencocokkan kata dengan prompt Gintoki, menyadari ada aksi uang di mode 2.
└── Return Payload: `{ functionCalls: [{ name: 'update_excel_finance', args: { expense: 40000, category: 'Makan dan Minum', description: 'Jajan sosis' } }] }`
↓
[Component: `App.tsx` (didalam `handleSendMessage` blok pengolahan `functionCalls`)]
└── Mengekstrak args. Memanggil `addTransaction()` dari context _hook_
↓
[Hook: `store/finance.ts`]
└── Mutasi state array `transactions` sehingga component `FinancePanel.tsx` (PieChart) & `ReportView.tsx` re-render memperbarui grafik.
└── Simpan ke Local Storage browser.
↓
[Kembali ke `App.tsx`]
└── Mengirim laporan status _"Transaksi Terekam sukses"_ ke API Gemini.
└── Gemini menjawab balik dalam bentuk bahasa natural sarkastis (contoh: "Kere lu bos").
└── Menambahkan teks ke log obrolan UI dan Panggil `speak(replyText)`.
↓
[Result: State Sinkron, Teks Tampil, Suara Muncul, Grafik Berubah]

---

## 6. Shared Components & Utilities — Panduan Pemakaian

### `lib/utils.ts → cn()`

**Kenapa ia di-shared (bukan di-inline)?**
Di TaildwindCSS, melakukan kondisional rendering class sering berbenturan. Fungsi ini menggabungkan `clsx` (manipulasi kondisional logika) dan `tailwind-merge` (resolve _class conflict_) pada tingkat root proyek.

**Cara Pakai:**
```tsx
import { cn } from '../lib/utils';
<div className={cn("p-4 rounded", isListening ? "bg-red-500" : "bg-blue-500", customClassFromProps)} />
```

**Yang TIDAK boleh dilakukan saat memakainya:**
Tidak perlu menggunakannya buat string Tailwind utuh yang bersifat statik tanpa _conditional statement_, murni cukup buang _cycle_ memori.

---

## 7. State Management — Peta State Global

### State: `Asep Finance Data Storage`
- **Disimpan di:** `src/store/finance.ts` (*Custom hook*) → *persistance* by Browser's `localStorage` (`asep_finance_data`).
- **Tipe datanya:** `Transaction[]`
- **Nilai awal:** `[]`
- **Siapa yang bisa MENULIS (mutate):**
  - Hanya metode `addTransaction` pada hook `useFinance()`. Yang mana dipicu spesifik oleh *callback tool handler* `handleSendMessage` dalam `App.tsx`.
- **Siapa yang MEMBACA (subscribe):**
  - `App.tsx` merender tabel di tab `ReportView.tsx` saat mengalokasikan data properti.
  - Grafik lingkaran PieChart dari `FinancePanel.tsx` melalui perhitungan helper `getSummary()`.
- **Apa yang terjadi jika state ini corrupt?**
  - Parsing *try/catch* di awal *hook* akan gagal (*fail silently* akibat console.error), dan akan menggagalkan `localStorage` dimuat, transaksi direktur di-inisiasi murni sebagai array kosong.

---

## 8. Side Effects & External Dependencies

| Jenis | Lokasi (file + fungsi) | Target | Kapan dipanggil | Error handling-nya |
|-------|----------------------|--------|-----------------|-------------------|
| API Call LLM | `App.tsx → handleSendMessage` | `POST` ke Gemini API Google. | Saat ada instruksi suara atau submit chat baru. | try/catch, output teks error ke UI & TTS + _alert_ tentang `API_KEY_MISSING` / `429`. |
| Local Storage | `finance.ts → addTransaction` | Browser Storage `asep_finance_data` | Setiap mutasi catatan finansial baru. | Silently fails bila `try/catch` memproses JSON Parse yg malformed. |
| Web API Audio | `useSpeech.ts` | OS Microphone / TTS Synthesizer | Saat menekan logo Mikrofon atau ketika bot menjawab teks. | Di _catch_, mematikan tombol rekam (ubah status state listening/onend). |
| Excel Exporter | `finance.ts → exportToExcel` | Ekspor ke *.xlsx* | Saat mengklik ikon Download di Sidebar/Panel UI | Library eksternal (SheetJS/xlsx) menangani bloknya. |

**External Dependency: `@google/genai`**
Dibutuhkan mutlak untuk memanggil LLM tipe teranyar dengan dukungan SDK native V2. Sangat tersentralisasi di `services/ai.ts`.

---

## 9. Error Handling & Failure Modes

### Error: `API_KEY_MISSING` atau `429 QUOTA EXHAUSED`
- **Terjadi di:** `App.tsx` lewat blok eksekusi API `chatSession.sendMessage`.
- **Penyebab:** Google AI API Key belum didaftarkan di Environment `.env` aplikasi, atau _user_ mencapai *Rate Limit API* (gratisan vs produksi).
- **Bagaimana ditangani:**
  - Kode ditangkap di blok `try/catch`.
  - Diubah menjadi pesan human-friendly *in-character* Gintoki yang memarahi bosnya ("API Key lo bodong boss!").
  - Menyamar dalam *virtual UI state* dengan prefix `[ ... ]` ke dalam obrolan agar _user_ tahu ini pesan darurat dari _system_.
- **Efek ke state:** Sistem batal memperbarui Excel / Catatan finansial karena siklus API diinterupsi.

### Error: `Speech recognition error`
- **Terjadi di:** `useSpeech.ts` pada blok *event listener* `recognition.onerror`.
- **Penyebab:** User menolak akses _Permission Microphone_, atau user bengong tanpa suara (`no-speech`).
- **Bagaimana ditangani:** Bila error beralasan `no-speech` (bengong), abaikan. Bila alasannya hal lain, *reset* mode bool `isListening` ke keadaan false agar UI menghentikan animasi *Recording/Pulse*.

---

## 10. Glossary Internal Project

| Istilah | Artinya dalam konteks project ini | Dipakai di file |
|---------|----------------------------------|-----------------|
| `transcript` | Hasil tangkapan *dictate voice* mikrofon user sebelum diposting ke log chat (interim). | `useSpeech.ts`, `App.tsx`, `ChatArea.tsx` |
| `functionCalls` | Instruksi khusus dari Gemini AI berupa kode deklarasi bahwa AI meminta aplikasi frontend untuk menjalankan aksi. | `App.tsx`, `ai.ts` |
| `TTS / Speech Synthesis` | "Text-to-Speech", merubah balasan chat Gintoki menjadi suara yang dapat didengarkan oleh pengguna. | `useSpeech.ts` |

---

## 11. Pertanyaan yang Sering Muncul Saat Baca Kode Ini

- **Kenapa `activeTab` UI State (_Chat_ dan _Report_) dipertahankan di file pusat `App.tsx` dan bukan menggunakan *React-Router-DOM*?**
  → Aplikasi ini sangat ringan (PoC SPA Interface tipe _Single-Page Action_). Menggunakan *routing library* yang ekstensif dirasa redundan atau _overkill_. Dengan state manager *boolean/string match*, komponen non-aktif dapat di-hide dengan `absolute inset-0` secara murni, memastikan tidak hilangnya context render.

- **Kenapa `BillsView.tsx` tidak digunakan lagi (yatim / orphaned)?**
  → Komponen pandangan tagihan ini dihapuskan dari inisiasi Sidebar oleh perintah pemilik/User (penyederhanaan UI), tetapi berkas fisik komponen reaktnya tetap berada di folder. Ini disimpan semata-mata bila esok ia dibutuhkan kembali untuk *tab khusus tagihan & jajan*.

- **Mengapa pengolahan `functionCalls` dari AI memakan alur dua-arah (dikirim lalu diolah lalu *dikirim lagi* ke LLM)?**
  → Gemini AI API *menuntut* agar aplikasi Frontend melaporkan "sukses" atau "gagal" ketika fungsi (seperti mencatat pengeluaran) dipanggil. Hal ini juga membantu agar Gemini mengetahui nilai pengeluaran yang sesungguhnya sudah _masuk ke database_, baru ia dapat memberikan respon verbal terakhir (`replyText`) sesuai format yang benar ke pengguna tanpa "berhalusinasi".

- **Kenapa ada modifikasi batas waktu hening yang cukup agresif (*Auto-stop* 3.5 / 6 detik) pada file `useSpeech.ts`?**
  → Browser _Web Speech API_ terkenal karena masalah memori bocor (memory leak) / hang di mana mode rekaman membiarkan peramban tidak responsif jika _user_ lupa menekan "Stop". Fungsi manual *timer override* menjamin _graceful exit_ ketika terjadi kebisingan tanpa artikulasi yang jelas.

---

## 12. Checklist untuk Developer Baru

Setelah membaca dokumen ini, cobalah pastikan Anda dapat menjawab:

- [ ] File mana yang harus Anda buka untuk memperbaiki cara AI merespons transaksi? *(A: `services/ai.ts` untuk Prompt logic, dan prosesnya di `App.tsx`)*
- [ ] Kalau mau ganti warna dasar diagram keuangan *pie-chart*, ke mana harus memodifikasi array warnanya? *(A: Variable `COLORS` di `FinancePanel.tsx`)*
- [ ] Di mana tempat untuk me-_override_ / mengubah persistensi memori `localStorage` kelak menjadi integrasi SQL/Firebase/MongoDB? *(A: Pada hooks `useFinance` di dalam `store/finance.ts`)*
- [ ] Benarkah `useSpeech.ts` memproses audio _chunk_ pengguna secara remote di Cloud? *(A: SALAH. Aplikasi menggunakan `window.SpeechRecognition` - built in OS API).*

---
*End of Documentation.*
