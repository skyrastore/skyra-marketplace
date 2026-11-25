// Common country dial codes — ordered by SEA priority then popularity.
// Format: flag emoji + name + dial code (ISO E.164 prefix without +).

export type Country = { code: string; dial: string; flag: string; name: string };

export const COUNTRIES: Country[] = [
  { code: "ID", dial: "62",  flag: "🇮🇩", name: "Indonesia" },
  { code: "MY", dial: "60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "SG", dial: "65",  flag: "🇸🇬", name: "Singapore" },
  { code: "TH", dial: "66",  flag: "🇹🇭", name: "Thailand" },
  { code: "PH", dial: "63",  flag: "🇵🇭", name: "Philippines" },
  { code: "VN", dial: "84",  flag: "🇻🇳", name: "Vietnam" },
  { code: "BN", dial: "673", flag: "🇧🇳", name: "Brunei" },
  { code: "KH", dial: "855", flag: "🇰🇭", name: "Cambodia" },
  { code: "LA", dial: "856", flag: "🇱🇦", name: "Laos" },
  { code: "MM", dial: "95",  flag: "🇲🇲", name: "Myanmar" },
  { code: "TL", dial: "670", flag: "🇹🇱", name: "Timor-Leste" },
  // East Asia
  { code: "JP", dial: "81",  flag: "🇯🇵", name: "Japan" },
  { code: "KR", dial: "82",  flag: "🇰🇷", name: "South Korea" },
  { code: "CN", dial: "86",  flag: "🇨🇳", name: "China" },
  { code: "HK", dial: "852", flag: "🇭🇰", name: "Hong Kong" },
  { code: "MO", dial: "853", flag: "🇲🇴", name: "Macao" },
  { code: "TW", dial: "886", flag: "🇹🇼", name: "Taiwan" },
  // South Asia
  { code: "IN", dial: "91",  flag: "🇮🇳", name: "India" },
  { code: "BD", dial: "880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "PK", dial: "92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "LK", dial: "94",  flag: "🇱🇰", name: "Sri Lanka" },
  { code: "NP", dial: "977", flag: "🇳🇵", name: "Nepal" },
  // Middle East
  { code: "AE", dial: "971", flag: "🇦🇪", name: "UAE" },
  { code: "SA", dial: "966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "QA", dial: "974", flag: "🇶🇦", name: "Qatar" },
  { code: "KW", dial: "965", flag: "🇰🇼", name: "Kuwait" },
  { code: "BH", dial: "973", flag: "🇧🇭", name: "Bahrain" },
  { code: "OM", dial: "968", flag: "🇴🇲", name: "Oman" },
  { code: "TR", dial: "90",  flag: "🇹🇷", name: "Turkey" },
  // Oceania
  { code: "AU", dial: "61",  flag: "🇦🇺", name: "Australia" },
  { code: "NZ", dial: "64",  flag: "🇳🇿", name: "New Zealand" },
  // Americas
  { code: "US", dial: "1",   flag: "🇺🇸", name: "United States" },
  { code: "CA", dial: "1",   flag: "🇨🇦", name: "Canada" },
  { code: "MX", dial: "52",  flag: "🇲🇽", name: "Mexico" },
  { code: "BR", dial: "55",  flag: "🇧🇷", name: "Brazil" },
  { code: "AR", dial: "54",  flag: "🇦🇷", name: "Argentina" },
  // Europe
  { code: "GB", dial: "44",  flag: "🇬🇧", name: "United Kingdom" },
  { code: "DE", dial: "49",  flag: "🇩🇪", name: "Germany" },
  { code: "FR", dial: "33",  flag: "🇫🇷", name: "France" },
  { code: "IT", dial: "39",  flag: "🇮🇹", name: "Italy" },
  { code: "ES", dial: "34",  flag: "🇪🇸", name: "Spain" },
  { code: "NL", dial: "31",  flag: "🇳🇱", name: "Netherlands" },
  { code: "RU", dial: "7",   flag: "🇷🇺", name: "Russia" },
  // Africa
  { code: "ZA", dial: "27",  flag: "🇿🇦", name: "South Africa" },
  { code: "EG", dial: "20",  flag: "🇪🇬", name: "Egypt" },
  { code: "NG", dial: "234", flag: "🇳🇬", name: "Nigeria" },
  { code: "KE", dial: "254", flag: "🇰🇪", name: "Kenya" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Indonesia

export function parsePhoneFull(fullPhone: string): { country?: Country; number: string } {
  // Expects "+62812..." format; returns matching Country + bare number
  const digits = fullPhone.replace(/\D/g, "");
  if (!digits) return { number: "" };
  // Try to match longest dial prefix first
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) return { country: c, number: digits.slice(c.dial.length) };
  }
  return { number: digits };
}
