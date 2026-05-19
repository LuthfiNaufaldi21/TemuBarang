// ─── colorDetector.js ─────────────────────────────────────────────────────────
// Utilitas AI Vision (client-side) untuk mendeteksi warna dominan dari gambar.
// Menggunakan HTML5 Canvas API untuk menganalisis pixel secara langsung.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Daftar warna referensi beserta nilai RGB-nya.
 * AI akan mencocokkan warna dominan gambar ke warna terdekat di daftar ini.
 */
const COLOR_MAP = [
  { name: "Black", r: 30, g: 30, b: 30 },
  { name: "White", r: 240, g: 240, b: 240 },
  { name: "Silver", r: 180, g: 180, b: 185 },
  { name: "Gray", r: 128, g: 128, b: 128 },
  { name: "Space Gray", r: 90, g: 90, b: 95 },
  { name: "Red", r: 200, g: 40, b: 40 },
  { name: "Blue", r: 40, g: 80, b: 200 },
  { name: "Navy", r: 30, g: 40, b: 80 },
  { name: "Green", r: 40, g: 160, b: 60 },
  { name: "Dark Green", r: 30, g: 80, b: 40 },
  { name: "Yellow", r: 230, g: 210, b: 50 },
  { name: "Gold", r: 200, g: 170, b: 80 },
  { name: "Orange", r: 230, g: 130, b: 40 },
  { name: "Pink", r: 230, g: 130, b: 170 },
  { name: "Purple", r: 130, g: 50, b: 180 },
  { name: "Brown", r: 120, g: 75, b: 45 },
  { name: "Beige", r: 210, g: 195, b: 170 },
  { name: "Maroon", r: 100, g: 30, b: 30 },
];

/**
 * Menghitung jarak Euclidean antara dua warna RGB.
 */
function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Mencocokkan nilai RGB ke nama warna terdekat dari COLOR_MAP.
 */
function matchColorName(r, g, b) {
  let closest = COLOR_MAP[0];
  let minDist = Infinity;

  for (const color of COLOR_MAP) {
    const dist = colorDistance(r, g, b, color.r, color.g, color.b);
    if (dist < minDist) {
      minDist = dist;
      closest = color;
    }
  }

  return closest.name;
}

/**
 * Mendeteksi warna dominan dari gambar.
 * Mengembalikan Promise dengan objek { colorName, rgb, hex }.
 *
 * @param {string} imageSrc - URL gambar atau base64 data URL
 * @returns {Promise<{ colorName: string, rgb: {r,g,b}, hex: string }>}
 */
export function detectDominantColor(imageSrc) {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve({ colorName: "Unknown", rgb: { r: 0, g: 0, b: 0 }, hex: "#000000" });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Sampel kecil untuk performa (40x40 pixel sudah cukup)
        const sampleSize = 40;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        const ctx = canvas.getContext("2d");

        // Gambar ulang ke ukuran kecil agar sampling lebih cepat
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // Kumpulkan semua pixel, abaikan pixel yang terlalu gelap/terang (background)
        // dan fokus ke area tengah gambar (barang biasanya di tengah)
        let totalR = 0, totalG = 0, totalB = 0;
        let count = 0;

        const centerMargin = Math.floor(sampleSize * 0.15); // 15% margin dari tepi

        for (let y = centerMargin; y < sampleSize - centerMargin; y++) {
          for (let x = centerMargin; x < sampleSize - centerMargin; x++) {
            const idx = (y * sampleSize + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const a = pixels[idx + 3];

            // Skip pixel transparan
            if (a < 128) continue;

            // Skip pixel yang terlalu dekat dengan putih murni atau hitam murni
            // (biasanya background)
            const brightness = (r + g + b) / 3;
            if (brightness > 248 || brightness < 8) continue;

            totalR += r;
            totalG += g;
            totalB += b;
            count++;
          }
        }

        if (count === 0) {
          // Fallback: ambil semua pixel
          for (let i = 0; i < pixels.length; i += 4) {
            totalR += pixels[i];
            totalG += pixels[i + 1];
            totalB += pixels[i + 2];
            count++;
          }
        }

        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);

        const colorName = matchColorName(avgR, avgG, avgB);
        const hex = `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`;

        resolve({
          colorName,
          rgb: { r: avgR, g: avgG, b: avgB },
          hex,
        });
      } catch (err) {
        console.warn("[ColorDetector] Canvas analysis failed:", err);
        resolve({ colorName: "Unknown", rgb: { r: 0, g: 0, b: 0 }, hex: "#000000" });
      }
    };

    img.onerror = () => {
      console.warn("[ColorDetector] Image failed to load:", imageSrc?.substring(0, 50));
      resolve({ colorName: "Unknown", rgb: { r: 0, g: 0, b: 0 }, hex: "#000000" });
    };

    img.src = imageSrc;
  });
}

/**
 * Ekstraksi brand dari teks (judul + deskripsi).
 * @param {string} text
 * @returns {string}
 */
export function detectBrand(text) {
  const brands = [
    "apple", "macbook", "iphone", "ipad", "airpods",
    "samsung", "galaxy",
    "sony", "playstation",
    "asus", "rog",
    "acer", "nitro",
    "lenovo", "thinkpad", "ideapad",
    "hp", "pavilion",
    "dell", "inspiron",
    "xiaomi", "redmi", "poco",
    "oppo", "vivo", "realme",
    "nike", "adidas", "puma", "converse", "vans",
    "jbl", "bose", "sennheiser",
    "canon", "nikon", "fujifilm",
    "logitech", "razer",
  ];

  const lowerText = (text || "").toLowerCase();

  // Map alias ke brand utama
  const brandAliases = {
    macbook: "Apple", iphone: "Apple", ipad: "Apple", airpods: "Apple",
    galaxy: "Samsung",
    playstation: "Sony",
    rog: "ASUS",
    nitro: "Acer",
    thinkpad: "Lenovo", ideapad: "Lenovo",
    pavilion: "HP",
    inspiron: "Dell",
    redmi: "Xiaomi", poco: "Xiaomi",
  };

  for (const keyword of brands) {
    if (lowerText.includes(keyword)) {
      // Cek apakah ada alias
      if (brandAliases[keyword]) {
        return brandAliases[keyword];
      }
      // Capitalize
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }

  return "Unknown";
}
