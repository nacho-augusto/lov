// "Qué es el trail" definition + club values, used by all directions.

export const trailDefinition = {
  title: "Qué es el trail running",
  lead: "Correr por montaña. Fuera del asfalto, por senderos, crestas y veredas, sumando kilómetros y desnivel donde la naturaleza manda.",
  body: "No medimos solo el ritmo: medimos el desnivel, la cabeza en las cuestas y las cimas que coronamos juntos. Del nivel del mar a los dos mil metros, la montaña no perdona, pero siempre recompensa.",
};

export interface Value {
  id: string;
  title: string;
  desc: string;
}

export const values: Value[] = [
  {
    id: "esfuerzo",
    title: "Esfuerzo",
    desc: "Cada cima se gana paso a paso. Aquí se viene a sufrir un poco y a disfrutar mucho.",
  },
  {
    id: "montana",
    title: "Respeto a la montaña",
    desc: "Pisamos sin dejar huella. La sierra es nuestra casa y la cuidamos como tal.",
  },
  {
    id: "comunidad",
    title: "Comunidad",
    desc: "Vertinianos y vertinianas: salimos en grupo, esperamos arriba y bajamos juntos.",
  },
  {
    id: "aventura",
    title: "Aventura",
    desc: "Salidas nocturnas, cumbres nuevas y planes que empiezan con un «¿y si…?».",
  },
];
