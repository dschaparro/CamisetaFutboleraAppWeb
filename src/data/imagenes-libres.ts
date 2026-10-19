/**
 * Fotos de Wikimedia Commons con licencia libre (CC BY / CC BY-SA), usadas como
 * imágenes iniciales de productos, ligas y banners mientras no haya fotos propias.
 * Las licencias exigen dar crédito al autor: por eso cada una lleva su crédito,
 * que la tienda muestra junto a la imagen.
 */
export type ImagenLibre = { url: string; autor: string; licencia: string; pagina: string };

const c = (archivo: string) => `https://commons.wikimedia.org/wiki/File:${archivo}`;

export const IMAGENES_LIBRES = {
  camisetaReal: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Beckham_shirt_Real_Madrid.jpg/1920px-Beckham_shirt_Real_Madrid.jpg", autor: "Chris Brown", licencia: "CC BY 2.0", pagina: c("Beckham_shirt_Real_Madrid.jpg") },
  camisetaBarca: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Barcauniform2016-17.jpg/1920px-Barcauniform2016-17.jpg", autor: "1234chinchin", licencia: "CC BY-SA 4.0", pagina: c("Barcauniform2016-17.jpg") },
  camisetaCity: { url: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Mancity2018-19.jpg", autor: "MattGrünewald", licencia: "CC BY-SA 4.0", pagina: c("Mancity2018-19.jpg") },
  camisetaPsg: { url: "https://upload.wikimedia.org/wikipedia/commons/d/df/Psg-2008-2009-away-shirt.jpg", autor: "Strologoff", licencia: "CC BY-SA 3.0", pagina: c("Psg-2008-2009-away-shirt.jpg") },
  millonariosCampin: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Millonarios_vs_Nacional_El_Campin_2016.jpg/1920px-Millonarios_vs_Nacional_El_Campin_2016.jpg", autor: "Futbolero", licencia: "CC BY-SA 4.0", pagina: c("Millonarios_vs_Nacional_El_Campin_2016.jpg") },
  hinchadaVerde: { url: "https://upload.wikimedia.org/wikipedia/commons/0/07/Hinchadaverde.JPG", autor: "Eduardozer", licencia: "CC BY-SA 3.0", pagina: c("Hinchadaverde.JPG") },
  colombiaEstadio: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Colombia_Mai.jpg/1920px-Colombia_Mai.jpg", autor: "Baiji", licencia: "CC BY-SA 4.0", pagina: c("Colombia_Mai.jpg") },
  allianzArena: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/20200228_Allianz_Arena_02.jpg/1920px-20200228_Allianz_Arena_02.jpg", autor: "Flocci Nivis", licencia: "CC BY 4.0", pagina: c("20200228_Allianz_Arena_02.jpg") },
  bernabeuInterior: { url: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Estadio_Santiago_Bernab%C3%A9u_Madrid.jpg", autor: "Zoser", licencia: "CC BY 4.0", pagina: c("Estadio_Santiago_Bernabéu_Madrid.jpg") },
  bernabeuExterior: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Real_Madrid%27s_Santiago_Bernab%C3%A9u_Stadium%2C_Madrid%2C_Spain_%28Ank_Kumar%29_01.jpg/1920px-Real_Madrid%27s_Santiago_Bernab%C3%A9u_Stadium%2C_Madrid%2C_Spain_%28Ank_Kumar%29_01.jpg", autor: "Ank Kumar", licencia: "CC BY-SA 4.0", pagina: c("Real_Madrid's_Santiago_Bernabéu_Stadium,_Madrid,_Spain_(Ank_Kumar)_01.jpg") },
  etihad: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Etihad_Stadium%2C_Manchester_City_Football_Club_%28Ank_Kumar%2C_Infosys%29_03.jpg/1920px-Etihad_Stadium%2C_Manchester_City_Football_Club_%28Ank_Kumar%2C_Infosys%29_03.jpg", autor: "Ank Kumar", licencia: "CC BY-SA 4.0", pagina: c("Etihad_Stadium,_Manchester_City_Football_Club_(Ank_Kumar,_Infosys)_03.jpg") },
  parcPrinces: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/PSG-Celtic_Glasgow_Parc_des_Princes_06.jpg/1920px-PSG-Celtic_Glasgow_Parc_des_Princes_06.jpg", autor: "Zakarie Faibis", licencia: "CC BY-SA 4.0", pagina: c("PSG-Celtic_Glasgow_Parc_des_Princes_06.jpg") },
  atanasio: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Atanasio_Girardot-Atl%C3%A9tico_Nacional-Fortaleza.jpg/1920px-Atanasio_Girardot-Atl%C3%A9tico_Nacional-Fortaleza.jpg", autor: "User34790", licencia: "CC BY-SA 4.0", pagina: c("Atanasio_Girardot-Atlético_Nacional-Fortaleza.jpg") },
  campinCampeones: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Campeones._Estadio_El_Camp%C3%ADn._Bogota.jpg/1920px-Campeones._Estadio_El_Camp%C3%ADn._Bogota.jpg", autor: "Inspired photo", licencia: "CC BY-SA 4.0", pagina: c("Campeones._Estadio_El_Campín._Bogota.jpg") },
  feriaCamisetas: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Association_football_jerseys_in_the_Feria_de_Trist%C3%A1n_Narvaja_in_2024_01.jpg/1920px-Association_football_jerseys_in_the_Feria_de_Trist%C3%A1n_Narvaja_in_2024_01.jpg", autor: "NaBUru38", licencia: "CC BY-SA 4.0", pagina: c("Association_football_jerseys_in_the_Feria_de_Tristán_Narvaja_in_2024_01.jpg") },
  museoJuventus: { url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Juventus_Museum_-_Shirts_of_Gaetano_Scirea_and_Alex_Del_Piero.jpg/1920px-Juventus_Museum_-_Shirts_of_Gaetano_Scirea_and_Alex_Del_Piero.jpg", autor: "forzaq8", licencia: "CC BY 2.0", pagina: c("Juventus_Museum_-_Shirts_of_Gaetano_Scirea_and_Alex_Del_Piero.jpg") },
} satisfies Record<string, ImagenLibre>;

/**
 * Escudos de los clubes (Wikimedia). Varios son de dominio público; los de
 * Real Madrid, Barcelona y Manchester City están en Wikipedia como uso legítimo:
 * son MARCAS REGISTRADAS de sus clubes. Sirven para el prototipo; para vender
 * de verdad hay que contar con licencia o usar los que provea el proveedor oficial.
 */
export const ESCUDOS: Record<string, string> = {
  "RM-27T": "https://thumb.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/500px-Real_Madrid_CF.svg.png",
  "FCB-27V": "https://thumb.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/500px-FC_Barcelona_%28crest%29.svg.png",
  "MCI-27T": "https://thumb.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/500px-Manchester_City_FC_badge.svg.png",
  "PSG-27T": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Paris_Saint-Germain_F.C._logo_%28free_version%29.svg/500px-Paris_Saint-Germain_F.C._logo_%28free_version%29.svg.png",
  "BAY-99R": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/500px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png",
  "MFC-26T": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Escudo_de_Millonarios_F%C3%BAtbol_Club.svg/500px-Escudo_de_Millonarios_F%C3%BAtbol_Club.svg.png",
  "ATN-26T": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Escudo_de_Atl%C3%A9tico_Nacional.png",
  "SEL-27L": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/FCF-Logo-2023.svg/500px-FCF-Logo-2023.svg.png",
};

/** Crédito listo para mostrar, ej. «Foto: Zoser · CC BY 4.0 · Wikimedia Commons». */
export function creditoDe(url: string): { texto: string; pagina: string } | null {
  const img = Object.values(IMAGENES_LIBRES).find((i) => i.url === url);
  return img ? { texto: `Foto: ${img.autor} · ${img.licencia} · Wikimedia Commons`, pagina: img.pagina } : null;
}
