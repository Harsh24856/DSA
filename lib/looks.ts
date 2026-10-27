// Theme Studio looks. Photo themes use free Unsplash photos (Unsplash License) and credit the photographer.
export type Fx = "petals" | "stars" | "rain";
export type Look = {
  id: string; name: string; blurb: string;
  photo?: { src: string; author: string; page: string };
  fx?: Fx;
};
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=75`;

export const LOOKS: Look[] = [
  { id: "classic", name: "Classic", blurb: "Your palette, light or dark" },
  { id: "neon", name: "Tokyo Neon", blurb: "Rain on neon streets", fx: "rain", photo: { src: u("photo-1601042879364-f3947d3f9c16"), author: "Valentin Beauvais", page: "https://unsplash.com/photos/yVUQlyRlJSw" } },
  { id: "sakura", name: "Sakura Canal", blurb: "Cherry blossom season", fx: "petals", photo: { src: u("photo-1524413840807-0c3cb6fa808d"), author: "Sora Sagano", page: "https://unsplash.com/photos/8sOZJ8JF0S8" } },
  { id: "fuji", name: "Fuji Dawn", blurb: "Pagoda at sunrise", photo: { src: u("photo-1542640244-7e672d6cef4e"), author: "Tianshu Liu", page: "https://unsplash.com/photos/aqZ3UAjs_M4" } },
  { id: "torii", name: "Torii Path", blurb: "A thousand gates", fx: "petals", photo: { src: u("photo-1724063029533-9dd0b5a8c645"), author: "Tyler Zhang", page: "https://unsplash.com/photos/eNlyuSJuf2k" } },
  { id: "stars", name: "Starry Peak", blurb: "Night sky over the snow", fx: "stars", photo: { src: u("photo-1519681393784-d120267933ba"), author: "Benjamin Voros", page: "https://unsplash.com/photos/phIFdC6lA4E" } },
  { id: "pinksky", name: "Pink Sky", blurb: "Soft clouds, light mode", photo: { src: u("photo-1560803262-95a9de00a057"), author: "Andrea Ferrario", page: "https://unsplash.com/photos/3WgPZbsDSkE" } },
  { id: "paper", name: "Vintage Paper", blurb: "Kraft paper, iron-gall ink" },
  { id: "blueprint", name: "Blueprint", blurb: "Grid paper, drafting blue" },
  { id: "terminal", name: "Terminal", blurb: "Monospace, phosphor green" },
];
export const lookById = (id: string) => LOOKS.find((l) => l.id === id) ?? LOOKS[0];
