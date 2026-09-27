// Ngôn ngữ viết caption: tiếng Việt, tiếng Anh và các nước châu Âu có nhiều tiệm nail người Việt.
// name: tên tiếng Anh để dặn AI; market: thị trường để AI dùng đúng giọng địa phương.

export type CaptionLang = { id: string; label: string; vi: string; name: string; market: string; popular?: boolean };

export const CAPTION_LANGS: CaptionLang[] = [
  { id: "vi", label: "Tiếng Việt", vi: "Tiếng Việt", name: "Vietnamese", market: "Vietnamese customers", popular: true },
  { id: "en-us", label: "English (US)", vi: "Anh – Mỹ", name: "American English", market: "the United States", popular: true },
  { id: "en-gb", label: "English (UK)", vi: "Anh – Anh", name: "British English", market: "the United Kingdom and Ireland", popular: true },
  { id: "de", label: "Deutsch", vi: "Đức", name: "German", market: "Germany, Austria and Switzerland", popular: true },
  { id: "cs", label: "Čeština", vi: "Séc", name: "Czech", market: "the Czech Republic", popular: true },
  { id: "fr", label: "Français", vi: "Pháp", name: "French", market: "France and Belgium", popular: true },
  { id: "pl", label: "Polski", vi: "Ba Lan", name: "Polish", market: "Poland", popular: true },
  { id: "sk", label: "Slovenčina", vi: "Slovakia", name: "Slovak", market: "Slovakia" },
  { id: "nl", label: "Nederlands", vi: "Hà Lan", name: "Dutch", market: "the Netherlands and Belgium" },
  { id: "it", label: "Italiano", vi: "Ý", name: "Italian", market: "Italy" },
  { id: "es", label: "Español", vi: "Tây Ban Nha", name: "Spanish (Spain)", market: "Spain" },
  { id: "pt", label: "Português", vi: "Bồ Đào Nha", name: "European Portuguese", market: "Portugal" },
  { id: "hu", label: "Magyar", vi: "Hungary", name: "Hungarian", market: "Hungary" },
  { id: "ro", label: "Română", vi: "Romania", name: "Romanian", market: "Romania" },
  { id: "bg", label: "Български", vi: "Bulgaria", name: "Bulgarian", market: "Bulgaria" },
  { id: "hr", label: "Hrvatski", vi: "Croatia", name: "Croatian", market: "Croatia" },
  { id: "sl", label: "Slovenščina", vi: "Slovenia", name: "Slovenian", market: "Slovenia" },
  { id: "el", label: "Ελληνικά", vi: "Hy Lạp", name: "Greek", market: "Greece and Cyprus" },
  { id: "da", label: "Dansk", vi: "Đan Mạch", name: "Danish", market: "Denmark" },
  { id: "sv", label: "Svenska", vi: "Thuỵ Điển", name: "Swedish", market: "Sweden" },
  { id: "no", label: "Norsk", vi: "Na Uy", name: "Norwegian Bokmål", market: "Norway" },
  { id: "fi", label: "Suomi", vi: "Phần Lan", name: "Finnish", market: "Finland" },
  { id: "lt", label: "Lietuvių", vi: "Litva", name: "Lithuanian", market: "Lithuania" },
  { id: "lv", label: "Latviešu", vi: "Latvia", name: "Latvian", market: "Latvia" },
  { id: "et", label: "Eesti", vi: "Estonia", name: "Estonian", market: "Estonia" },
  { id: "uk", label: "Українська", vi: "Ukraina", name: "Ukrainian", market: "Ukraine" },
  { id: "ru", label: "Русский", vi: "Nga", name: "Russian", market: "Russian-speaking customers" },
];

export const langOf = (id: string) => CAPTION_LANGS.find((l) => l.id === id) ?? CAPTION_LANGS[0];
