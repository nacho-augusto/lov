// Gallery manifest. Real photos from the club's Instagram (@cdlaotravertiente),
// curated and downloaded to /public/gallery. Paths are relative to /public.

export interface GalleryImage {
  src: string;
  alt: string;
  /** rough aspect hint for masonry layout */
  tall?: boolean;
}

export const galleryImages: GalleryImage[] = [
  {
    src: "gallery/ig-01.jpg",
    alt: "Corredor del club por un sendero con el Tajo y el Puente Nuevo de Ronda al fondo.",
  },
  {
    src: "gallery/ig-07.jpg",
    alt: "Vertinianos en la cruz de la cumbre del Pico del Cielo con la bandera del club.",
  },
  {
    src: "gallery/ig-02.jpg",
    alt: "Ascendiendo una cresta rocosa entre la niebla en la CxM El Fuerte de Frigiliana.",
  },
  {
    src: "gallery/ig-05.jpg",
    alt: "Sendero de pinar junto a una acequia en las XX Leguas de la Alpujarra.",
  },
  {
    src: "gallery/ig-09.jpg",
    alt: "Meta nocturna de los 101 km de Ronda, desplegando la bandera del club.",
    tall: true,
  },
  {
    src: "gallery/ig-03.jpg",
    alt: "Celebración con los brazos abiertos en lo alto, con la Axarquía al fondo.",
  },
  {
    src: "gallery/ig-06.jpg",
    alt: "Tres corredores por un sendero de bosque entre flores en la Alpujarra.",
  },
  {
    src: "gallery/ig-08.jpg",
    alt: "Finishers de la Oh Meu Deus by UTMB posando con la bandera en el arco de meta.",
  },
  {
    src: "gallery/ig-04.jpg",
    alt: "Corredor en solitario sobre una cima entre la bruma en Frigiliana.",
  },
];
