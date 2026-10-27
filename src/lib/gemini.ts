const SOCRATIC_SYSTEM_PROMPT = `Kamu adalah teman membaca santai (reading buddy) yang cerdas dan suportif.
Pengguna sedang membaca buku atau menonton video atau mendengarkan podcast dan menuliskan pemahamannya dalam Bahasa Indonesia.

Tujuan & Format Jawaban:
1. VALIDASI PEMAHAMAN:
   - Konfirmasi dengan singkat apakah poin-poin yang dicatat pengguna sudah benar sesuai konsep buku.
   - Jika ada miskonsepsi, luruskan dengan ramah.

2. UJI PENGETAHUAN (Active Recall - JANGAN BERTANYA DI LUAR SCOPE):
   - JANGAN ajukan pertanyaan spekulatif/opini luas yang mengawang-awang (misal: "seberapa besar risikonya...", "bagaimana dampaknya bagi masa depan...").
   - AJUKAN 1 PERTANYAAN UJI PEMAHAMAN (Active Recall / Quick Quiz) yang BERTUMPU LANGSUNG pada konsep atau mekanisme yang baru saja ditulis pengguna.
   - Tujuannya adalah menguji apakah pengguna benar-benar paham detail "bagaimana mekanisme itu bekerja" atau "apa bedanya komponen A dengan komponen B" dari materi tersebut.
   - Buat pertanyaannya santai dan tidak kaku, seperti sedang kuis santai dengan teman belajar.

3. NADA & PANJANG:
   - Santai, akrab, to-the-point.
   - Ringkas (maksimal 2–3 paragraf pendek).`;
export async function generateSocraticSparring({
  bookTitle,
  bookAuthor,
  entryContent,
  pageNumber,
  previousMessages = [],
  newUserMessage,
}: {
  bookTitle: string;
  bookAuthor?: string | null;
  entryContent: string;
  pageNumber?: string | null;
  previousMessages?: { sender: string; message: string }[];
  newUserMessage?: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "") {
    try {
      // Dynamic import to avoid webpack Gaxios bundling conflict during static compilation
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      // Construct conversational context in Indonesian
      let promptText = `${SOCRATIC_SYSTEM_PROMPT}\n\n`;
      promptText += `Informasi Buku: "${bookTitle}"${bookAuthor ? ` karya ${bookAuthor}` : ""}\n`;
      if (pageNumber) promptText += `Referensi Halaman/Bab: ${pageNumber}\n`;
      promptText += `Catatan Pemahaman Pembaca:\n"""\n${entryContent}\n"""\n\n`;

      if (previousMessages.length > 0) {
        promptText += `Riwayat Obrolan Sebelumnya:\n`;
        for (const msg of previousMessages) {
          promptText += `${msg.sender === "USER" ? "Pembaca" : "Teman Baca"}: ${msg.message}\n`;
        }
        if (newUserMessage) {
          promptText += `Balasan Pembaca: "${newUserMessage}"\n\n`;
          promptText += `Instruksi: Balas tanggapan pembaca dengan santai, perjelas konsep bukunya jika masih ada yang membingungkan, dan teruskan obrolan secara ringan.`;
        }
      } else {
        promptText += `Instruksi: 
      1. Cek apakah catatan pembaca di atas sudah akurat merefleksikan isi/konteks buku "${bookTitle}".
      2. Berikan validasi singkat.
      3. Lemparkan 1 pertanyaan pemantik rasa ingin tahu yang ringan tentang isi buku tersebut.`;
      }

      // Prioritize active models in 2026: gemini-3.5-flash-lite, gemini-3.8-flash, gemini-flash-latest
      const modelCandidates = [
        process.env.GEMINI_MODEL,
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
      ].filter((m): m is string => Boolean(m && m.trim() !== ""));

      for (const model of modelCandidates) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: promptText,
          });

          if (response && response.text && response.text.trim().length > 0) {
            return response.text.trim();
          }
        } catch (mErr: any) {
          console.warn(`Gemini model ${model} failed, trying next candidate:`, mErr?.message || mErr);
        }
      }
    } catch (err: any) {
      console.error("Gemini API error (falling back to built-in Socratic companion):", err?.message || err);
    }
  }

  // Fallback generator in Bahasa Indonesia focused on user content
  return generateOfflineSocraticSparringId(
    bookTitle,
    bookAuthor,
    entryContent,
    pageNumber,
    previousMessages,
    newUserMessage
  );
}

function generateOfflineSocraticSparringId(
  bookTitle: string,
  bookAuthor?: string | null,
  entryContent?: string,
  pageNumber?: string | null,
  previousMessages: { sender: string; message: string }[] = [],
  newUserMessage?: string
): string {
  // Multiturn reply handling in Indonesian
  if (newUserMessage) {
    const userText = newUserMessage.toLowerCase();
    if (userText.includes("bias") || userText.includes("cepat") || userText.includes("intuisi")) {
      return `Argumen Anda menyentuh batas fleksibilitas kognitif. Jika intuisi memang dibentuk oleh rekaman pola masa lalu, bagaimana Anda memverifikasi bahwa 'pola' yang Anda percayai saat ini tidak sedang menjebak Anda dalam situasi baru yang memiliki aturan main sama sekali berbeda?`;
    }
    if (userText.includes("sistem") || userText.includes("kebiasaan") || userText.includes("disiplin")) {
      return `Poin Anda mengenai ketahanan struktur memang rasional. Namun pertimbangkan ini: ketika lingkungan berubah drastis tanpa peringatan, apakah sistem yang kaku justru menjadi titik kerapuhan terbesar dibandingkan kemampuan adaptasi spontan?`;
    }
    return `Tanggapan Anda mempertajam batas masalah tersebut. Namun jika kita bawa premis Anda ke konsekuensi logis paling ekstrem, apakah pendekatan ini tidak mengabaikan faktor ketidakpastian yang tidak dapat diprediksi oleh ${bookAuthor || "penulis"}? Apa tolak ukur objektif yang Anda gunakan untuk menguji argumen Anda ini?`;
  }

  // Initial Socratic response directly focusing on user entry content
  const content = (entryContent || "").toLowerCase();

  if (content.includes("habit") || content.includes("kebiasaan") || content.includes("sistem") || content.includes("disiplin")) {
    return `Anda menyoroti bahwa pembentukan kebiasaan bertumpu pada arsitektur sistem dan identitas, bukan sekadar tekad. Namun pertimbangkan situasi di mana lingkungan Anda berada di luar kendali dan sangat tidak kondusif: apakah mengandalkan sistem tidak justru berisiko membuat kita rapuh ketika rutinitas tersebut terganggu?`;
  }

  if (content.includes("system 1") || content.includes("system 2") || content.includes("intuisi") || content.includes("bias") || content.includes("berpikir") || content.includes("rasional")) {
    return `Catatan Anda menangkap paradoks utama: bagaimana pikiran bawah sadar (Sistem 1) sering kali mendikte keputusan sebelum nalar rasional (Sistem 2) sempat mempertimbangkannya. Jika demikian, bagaimana Anda dapat membedakan antara 'intuisi yang terasah secara sahih' dengan 'bias emosional yang sekadar dibenarkan secara rasional'?`;
  }

  if (content.includes("kehilangan") || content.includes("loss aversion") || content.includes("risiko") || content.includes("investasi")) {
    return `Anda mengidentifikasi asimetri psikologis antara rasa sakit akibat kehilangan dan kepuasan dari keuntungan. Mengingat kecenderungan evolusioner ini membuat kita enggan mengambil risiko bernilai harapan positif, mekanisme konkret apa yang dapat Anda terapkan agar bias ini tidak menghalangi keputusan strategis jangka panjang Anda?`;
  }

  if (content.includes("cinta") || content.includes("manusia") || content.includes("emosi") || content.includes("empati") || content.includes("kesepian")) {
    return `Refleksi Anda menembus dimensi terdalam dari narasi tersebut: bagaimana kepolosan dan empati sering kali menuntut pengorbanan yang tampak tidak rasional bagi dunia luar. Di mana batas antara kesetiaan yang tulus dan pengorbanan yang justru mengikis keberadaan diri sendiri?`;
  }

  // Direct contextual synthesis
  return `Anda menggarisbawahi gagasan inti dari bahasan tersebut terkait relasi antara pemahaman individu dan konsekuensi nyata. Jika kita menerima pandangan yang Anda catat ini sebagai kebenaran mutlak, apa satu skenario nyata di mana prinsip tersebut justru menghasilkan dampak yang bertolak belakang dengan apa yang Anda harapkan?`;
}
