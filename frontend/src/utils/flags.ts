// ISO-3166-1-alpha-2 Codes für alle Teams im Turnier — daraus werden die
// Flaggen-Emojis automatisch erzeugt (Regional Indicator Symbols).
const COUNTRY_CODES: Record<string, string> = {
  'Algeria': 'DZ',
  'Argentina': 'AR',
  'Australia': 'AU',
  'Austria': 'AT',
  'Belgium': 'BE',
  'Bosnia and Herzegovina': 'BA',
  'Brazil': 'BR',
  'Canada': 'CA',
  'Cape Verde': 'CV',
  'Colombia': 'CO',
  'Croatia': 'HR',
  'Curaçao': 'CW',
  'Czech Republic': 'CZ',
  'DR Congo': 'CD',
  'Ecuador': 'EC',
  'Egypt': 'EG',
  'France': 'FR',
  'Germany': 'DE',
  'Ghana': 'GH',
  'Haiti': 'HT',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Ivory Coast': 'CI',
  'Japan': 'JP',
  'Jordan': 'JO',
  'Mexico': 'MX',
  'Morocco': 'MA',
  'Netherlands': 'NL',
  'New Zealand': 'NZ',
  'Norway': 'NO',
  'Panama': 'PA',
  'Paraguay': 'PY',
  'Portugal': 'PT',
  'Qatar': 'QA',
  'Saudi Arabia': 'SA',
  'Senegal': 'SN',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'Spain': 'ES',
  'Sweden': 'SE',
  'Switzerland': 'CH',
  'Tunisia': 'TN',
  'Turkey': 'TR',
  'United States': 'US',
  'Uruguay': 'UY',
  'Uzbekistan': 'UZ',
};

// England & Schottland haben keinen ISO-Ländercode — eigene Flaggen-Sequenzen (Subdivision-Flags)
const SPECIAL_FLAGS: Record<string, string> = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
};

function codeToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

// Liefert das Flaggen-Emoji für einen Team-Namen — oder '' wenn unbekannt (z.B. "TBD")
export function getFlag(team: string): string {
  if (SPECIAL_FLAGS[team]) return SPECIAL_FLAGS[team];
  const code = COUNTRY_CODES[team];
  return code ? codeToFlag(code) : '';
}

// Team-Name mit vorangestellter Flagge — fällt sauber auf den reinen Namen zurück (z.B. "TBD")
export function teamLabel(team: string): string {
  const flag = getFlag(team);
  return flag ? `${flag} ${team}` : team;
}
