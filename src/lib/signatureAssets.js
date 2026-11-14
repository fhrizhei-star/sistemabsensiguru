/**
 * Sample SVG Assets for Official Digital Signatures and Madrasah Seals
 * Transparent, realistic, and compliant with Indonesian government official document aesthetics.
 */

// Sample Signature of Kepala Madrasah (Handwritten ink flourish)
export const DEFAULT_SAMPLE_TTD = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" width="240" height="100">
  <path d="M 20 65 Q 45 20, 60 55 T 85 45 Q 110 15, 120 70 Q 130 85, 150 40 T 175 60 Q 190 25, 215 50" 
        fill="none" stroke="#0f172a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 40 45 Q 80 80, 195 62" 
        fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M 75 35 Q 90 20, 105 38" 
        fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M 170 50 Q 190 75, 220 70" 
        fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round"/>
</svg>
`)}`;

// Sample Official Circular Seal/Stamp of Madrasah (Kemenag Style, Deep Indigo Blue)
export const DEFAULT_SAMPLE_STEMPEL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Outer circle -->
  <circle cx="100" cy="100" r="92" fill="none" stroke="#1d4ed8" stroke-width="3.5" stroke-dasharray="1 0" />
  <!-- Inner circle -->
  <circle cx="100" cy="100" r="82" fill="none" stroke="#1d4ed8" stroke-width="1.8" />
  <!-- Center circle -->
  <circle cx="100" cy="100" r="54" fill="none" stroke="#1d4ed8" stroke-width="1.8" />
  
  <!-- Curved text top: KEMENTERIAN AGAMA -->
  <path id="curveTop" d="M 25 100 A 75 75 0 0 1 175 100" fill="none"/>
  <text fill="#1d4ed8" font-size="11.5" font-family="'Arial', 'Helvetica', sans-serif" font-weight="900" letter-spacing="2.2">
    <textPath href="#curveTop" startOffset="50%" text-anchor="middle">
      KEMENTERIAN AGAMA
    </textPath>
  </text>

  <!-- Curved text bottom: KABUPATEN GOWA -->
  <path id="curveBottom" d="M 175 100 A 75 75 0 0 1 25 100" fill="none"/>
  <text fill="#1d4ed8" font-size="11" font-family="'Arial', 'Helvetica', sans-serif" font-weight="900" letter-spacing="2.2">
    <textPath href="#curveBottom" startOffset="50%" text-anchor="middle">
      KABUPATEN GOWA
    </textPath>
  </text>

  <!-- Center Stars & School Name -->
  <text x="100" y="88" fill="#1d4ed8" font-size="9" font-family="'Arial', sans-serif" font-weight="800" text-anchor="middle" letter-spacing="1">
    ★ MTsN GOWA ★
  </text>
  <line x1="56" y1="94" x2="144" y2="94" stroke="#1d4ed8" stroke-width="1.2" />
  <text x="100" y="108" fill="#1d4ed8" font-size="12" font-family="'Arial Black', sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1.5">
    RESMI
  </text>
  <line x1="56" y1="114" x2="144" y2="114" stroke="#1d4ed8" stroke-width="1.2" />
  <text x="100" y="126" fill="#1d4ed8" font-size="8" font-family="'Arial', sans-serif" font-weight="700" text-anchor="middle" letter-spacing="0.8">
    TERAKREDITASI A
  </text>
</svg>
`)}`;

