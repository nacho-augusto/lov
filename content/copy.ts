// Headline & section copy (es-ES). Shared across the three directions;
// each direction may pick a different hero line for its tone.

export const heroLines = {
  cumbreNocturna: {
    eyebrow: "C.D. La Otra Vertiente · Trail Running · Málaga",
    title: "Corremos por la otra vertiente",
    subtitle: "La que no se ve desde la playa. Del mar a los 2.000, donde acaba el asfalto empieza la montaña.",
  },
  curvasDeNivel: {
    eyebrow: "Club deportivo de montaña · Rincón de la Victoria",
    title: "La otra vertiente",
    subtitle: "Trail running en la Axarquía. Senderos de caliza, piernas de acero y cada cima como excusa para volver.",
  },
  vertice: {
    eyebrow: "TRAIL · MÁLAGA · 36.71°N 4.27°W",
    title: "VÉRTICE",
    subtitle: "Cada cumbre, un dato. Del nivel del mar a los 2.069 m de La Maroma, leemos la montaña en kilómetros y desnivel.",
  },
} as const;

export const sections = {
  about: {
    eyebrow: "Sobre el club",
    title: "Somos vertinianos",
    paragraphs: [
      "C.D. La Otra Vertiente nace en la Axarquía, en Rincón de la Victoria, de unas ganas muy simples: salir a la montaña en grupo y no parar de sumar kilómetros y cimas.",
      "Entrenamos por las sierras del Mediterráneo malagueño —Almijara, Tejeda, Montes de Málaga— y nos escapamos a coronar La Maroma, a correr la Alpujarra o a terminar una ultra. Lo importante no es el ritmo: es disfrutar la subida y esperarse arriba.",
      "Si te gusta el barro, las crestas y los amaneceres desde una cumbre, ya eres de los nuestros.",
    ],
  },
  peaks: {
    eyebrow: "El mapa",
    title: "Las cumbres de Málaga",
    subtitle: "Del techo de la provincia a los balcones sobre el mar. Estas son las montañas que pisamos.",
  },
  trail: {
    eyebrow: "Nuestra forma de correr",
    title: "Qué es el trail",
  },
  gallery: {
    eyebrow: "El club en la montaña",
    title: "Kilómetros, barro y cima",
    subtitle: "Salidas, cresteos y líneas de meta. Así es La Otra Vertiente.",
  },
  join: {
    eyebrow: "Únete",
    title: "Súbete a la otra vertiente",
    subtitle: "Salimos cada semana. No importa tu ritmo: importa que quieras subir.",
    cta: "Escríbenos",
    secondaryCta: "Síguenos en Instagram",
    trainingNote: "Entrenamientos de grupo entre semana y salidas de montaña los fines de semana.",
  },
} as const;

// Short rotating phrases for kinetic type / marquees.
export const marquee = [
  "Pisa el techo de Málaga",
  "Del mar a los 2.000",
  "Barro, cresta y amanecer",
  "Sube. Mira atrás. Sigue.",
  "La sierra no perdona, pero recompensa",
  "Donde crece el pinsapo, nacen los kilómetros",
] as const;
