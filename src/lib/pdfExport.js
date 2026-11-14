/**
 * Utilitas Export Dokumen LKB Resmi ke format PDF Langsung
 * Menggunakan html2pdf.js yang dimuat dinamis di browser (100% aman SSR Next.js)
 * Dilengkapi penomoran halaman dinamis dan footer resmi
 */

function loadHtml2PdfLibrary() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.html2pdf) return Promise.resolve(window.html2pdf);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("html2pdf-bundle-script");
    if (existing) {
      if (window.html2pdf) return resolve(window.html2pdf);
      existing.addEventListener("load", () => resolve(window.html2pdf));
      existing.addEventListener("error", () => reject(new Error("Gagal memuat library PDF")));
      return;
    }

    const script = document.createElement("script");
    script.id = "html2pdf-bundle-script";
    script.src = "/vendor/html2pdf.bundle.min.js";
    script.async = true;
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => {
      // Fallback ke CDN jika diperlukan
      const cdnScript = document.createElement("script");
      cdnScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      cdnScript.onload = () => resolve(window.html2pdf);
      cdnScript.onerror = () => reject(new Error("Gagal memuat library pembuat PDF"));
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  });
}

export async function exportLkbToPdf({
  elementId = "official-lkb-individual-print-area",
  namaASN = "ASN",
  satkerASN = "PENDIS",
  bulan = "Bulan",
  tahun = "2026",
  fileName = ""
}) {
  if (typeof window === "undefined") return false;

  let element = document.getElementById(elementId);
  if (!element) {
    element = document.querySelector("#official-lkb-individual-print-area");
  }
  if (!element) {
    throw new Error(`Elemen dokumen cetak tidak ditemukan.`);
  }

  const html2pdf = await loadHtml2PdfLibrary();
  if (!html2pdf) {
    throw new Error("Library pembuat PDF tidak tersedia.");
  }

  // Bersihkan dan tentukan nama berkas (default: LKB_[Nama]_[Bulan]_[Tahun].pdf)
  const cleanName = String(namaASN || "ASN")
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .replace(/_+/g, "_");
  const cleanBulan = String(bulan || "").trim().replace(/[^a-zA-Z0-9]/g, "_");
  const cleanTahun = String(tahun || "").trim();
  const outputFileName = fileName && fileName.trim()
    ? (fileName.endsWith(".pdf") ? fileName.trim() : `${fileName.trim()}.pdf`)
    : `LKB_${cleanName}_${cleanBulan}_${cleanTahun}.pdf`;

  // Jika elemen berada dalam kontainer cetak tersembunyi (offscreen left: -9999px),
  // posisikan sementara di viewport (z-index negatif) agar browser GPU merender seluruh bitmap gambar
  const printContainer = element.closest(".lkb-print-container");
  const prevContainerInline = printContainer ? printContainer.getAttribute("style") : null;
  if (printContainer) {
    printContainer.style.setProperty("position", "fixed", "important");
    printContainer.style.setProperty("left", "0px", "important");
    printContainer.style.setProperty("top", "0px", "important");
    printContainer.style.setProperty("opacity", "1", "important");
    printContainer.style.setProperty("z-index", "-9999", "important");
    printContainer.style.setProperty("display", "block", "important");
  }

  // Pastikan seluruh elemen gambar (logo sekolah, kemenag, stempel, TTE, & foto evident) telah selesai dimuat
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (!img.crossOrigin && img.src && !img.src.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 800);
      });
    })
  );

  // Sembunyikan footer pratinjau statis selama proses PDF agar tidak dobel dengan footer halaman dinamis jsPDF
  const screenFooters = element.querySelectorAll(".lkb-screen-footer");
  screenFooters.forEach((el) => {
    el.style.display = "none";
  });

  const opt = {
    margin: [10, 10, 14, 10], // margin [top, right, bottom, left] dalam mm (bottom 14mm untuk garis & footer)
    filename: outputFileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      letterRendering: true,
      logging: false,
      scrollY: 0,
      backgroundColor: "#ffffff"
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] }
  };

  try {
    await html2pdf()
      .set(opt)
      .from(element)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          // Garis horizontal pemisah sebelum footer (Warna tegas dan jelas)
          pdf.setDrawColor(51, 65, 85); // Slate-700
          pdf.setLineWidth(0.45);
          pdf.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);

          pdf.setFontSize(8.5);
          pdf.setTextColor(51, 65, 85); // Slate-700

          // Footer Kiri: "nama user - satker"
          const leftText = `${namaASN} - ${satkerASN}`;
          pdf.text(leftText, 10, pageHeight - 6);

          // Footer Kanan: "Halaman X dari Y"
          const rightText = `Halaman ${i} dari ${totalPages}`;
          const textWidth = (pdf.getStringUnitWidth(rightText) * 8.5) / pdf.internal.scaleFactor;
          pdf.text(rightText, pageWidth - 10 - textWidth, pageHeight - 6);
        }
      })
      .save();
  } finally {
    screenFooters.forEach((el) => {
      el.style.display = "";
    });
    if (printContainer) {
      if (prevContainerInline) {
        printContainer.setAttribute("style", prevContainerInline);
      } else {
        printContainer.removeAttribute("style");
      }
    }
  }

  return true;
}
