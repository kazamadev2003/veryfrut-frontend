import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Veryfrut",
    short_name: "Veryfrut",
    description:
      "Plataforma Veryfrut para gestion de pedidos, productos y operaciones comerciales.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8CC63F",
    lang: "es-PE",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "https://res.cloudinary.com/demzflxgq/image/upload/v1770449756/ChatGPT_Image_7_feb_2026_02_25_57_a_ilotbf.svg",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
