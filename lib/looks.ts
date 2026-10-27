// Theme Studio looks. Picture themes: the owner's images in public/themes (web-sized copies) and free
// Unsplash photos (credited). Colours for each live at the end of app/globals.css under data-look="<id>".
export type Fx = "petals" | "stars" | "rain";
export type Look = {
  id: string; name: string; blurb: string;
  group: "Anime" | "Photo" | "Drawn" | "Classic";
  photo?: { full: string; small: string; pos?: string; credit?: { author: string; page: string } };
  light?: boolean;      // light glass + lightening overlay instead of dark
  fx?: Fx; fxColor?: string;
};
const unsplash = (id: string, author: string, page: string) => ({
  full: `https://images.unsplash.com/${id}?auto=format&fit=crop&q=75&w=1920`,
  small: `https://images.unsplash.com/${id}?auto=format&fit=crop&q=70&w=720`,
  credit: { author, page },
});
const local = (name: string, pos?: string) => ({ full: `/themes/${name}.jpg`, small: `/themes/${name}-sm.jpg`, pos });

export const LOOKS: Look[] = [
  { id: "classic", group: "Classic", name: "Classic", blurb: "Your palette, light or dark" },

  { id: "starfall", group: "Anime", name: "Starfall", blurb: "Meteors over the clouds", fx: "stars", photo: local("anime-girl-night", "50% 75%") },
  { id: "frieren", group: "Anime", name: "Frieren", blurb: "Warm sand, quiet journey", light: true, photo: local("frieren-beyond", "72% 50%") },
  { id: "miku", group: "Anime", name: "Miku", blurb: "Cyan, shattered glass", fx: "rain", fxColor: "var(--accent)", photo: local("hatsune-miku", "55% 40%") },
  { id: "crimson", group: "Anime", name: "Crimson Moon", blurb: "Silhouette on a red sky", photo: local("itachi-uchiha-moon", "50% 40%") },
  { id: "maple", group: "Anime", name: "Ink and Maple", blurb: "Ink painting, falling leaves", light: true, fx: "petals", fxColor: "var(--accent)", photo: local("japan-artistic", "50% 40%") },
  { id: "keyblade", group: "Anime", name: "Keyblade", blurb: "Misty white storm", light: true, fx: "petals", fxColor: "#FFFFFF", photo: local("kingdom-hearts", "60% 40%") },
  { id: "mysteries", group: "Anime", name: "Lord of Mysteries", blurb: "A throne in cosmic fog", fx: "stars", photo: local("lord-of-mysteries", "50% 35%") },
  { id: "spidey", group: "Anime", name: "Spider-Man", blurb: "Red suit, grey ink", light: true, photo: local("spider-man", "50% 30%") },

  { id: "neon", group: "Photo", name: "Tokyo Neon", blurb: "Rain on neon streets", fx: "rain", photo: unsplash("photo-1601042879364-f3947d3f9c16", "Valentin Beauvais", "https://unsplash.com/photos/yVUQlyRlJSw") },
  { id: "sakura", group: "Photo", name: "Sakura Canal", blurb: "Cherry blossom season", fx: "petals", photo: unsplash("photo-1524413840807-0c3cb6fa808d", "Sora Sagano", "https://unsplash.com/photos/8sOZJ8JF0S8") },
  { id: "fuji", group: "Photo", name: "Fuji Dawn", blurb: "Pagoda at sunrise", photo: unsplash("photo-1542640244-7e672d6cef4e", "Tianshu Liu", "https://unsplash.com/photos/aqZ3UAjs_M4") },
  { id: "torii", group: "Photo", name: "Torii Path", blurb: "A thousand gates", fx: "petals", photo: unsplash("photo-1724063029533-9dd0b5a8c645", "Tyler Zhang", "https://unsplash.com/photos/eNlyuSJuf2k") },
  { id: "stars", group: "Photo", name: "Starry Peak", blurb: "Night sky over the snow", fx: "stars", photo: unsplash("photo-1519681393784-d120267933ba", "Benjamin Voros", "https://unsplash.com/photos/phIFdC6lA4E") },
  { id: "pinksky", group: "Photo", name: "Pink Sky", blurb: "Soft clouds, light mode", light: true, photo: unsplash("photo-1560803262-95a9de00a057", "Andrea Ferrario", "https://unsplash.com/photos/3WgPZbsDSkE") },

  { id: "paper", group: "Drawn", name: "Vintage Paper", blurb: "Kraft paper, iron-gall ink" },
  { id: "blueprint", group: "Drawn", name: "Blueprint", blurb: "Grid paper, drafting blue" },
  { id: "terminal", group: "Drawn", name: "Terminal", blurb: "Monospace, phosphor green" },
];
export const lookById = (id: string) => LOOKS.find((l) => l.id === id) ?? LOOKS[0];
export const GROUPS = ["Anime", "Photo", "Drawn", "Classic"] as const;
