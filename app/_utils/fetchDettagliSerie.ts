import { TMDB_API_TOKEN } from './tmdb-config';

export type Serie = {
    id: string;
    titolo: string;
    trama?: string;
    genere?: string;
    piattaforma?: string;
    stato?: string;
    stagioni?: number;
    episodi?: number;
    poster_path?: string;
    image?: string;
    rating?: string;
    anno?: string;
    stagioniDettagli?: { stagione: number; episodi: number }[];
  };
  
  export const fetchDettagliSerie = async (
    id: number,
    piattaforma?: string,
    stato?: string,
    genereOverride?: string
  ): Promise<Serie | null> => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?language=it-IT`,
        {
          headers: {
           Authorization: TMDB_API_TOKEN,
            accept: "application/json",
          },
        }
      );
  
      if (!res.ok) throw new Error("Errore nel recupero dettagli serie");
  
      const data = await res.json();
  
      const episodiPerStagione = data.seasons
        .filter((s: any) => s.season_number !== 0)
        .map((s: any) => ({
          stagione: s.season_number,
          episodi: s.episode_count,
        }));
  
      return {
        id: data.id?.toString(),
        titolo: data.name,
        trama: data.overview,
        genere: genereOverride ?? (data.genres?.[0]?.name || ""),
        piattaforma: piattaforma ?? "",
        stato: stato ?? "", 
        stagioni: data.number_of_seasons,
        episodi: data.number_of_episodes,
        poster_path: data.poster_path,
        rating: data.vote_average?.toFixed(1) || "",
        anno: data.first_air_date?.substring(0, 4) || "",
        stagioniDettagli: episodiPerStagione,
      };
    } catch (err) {
      console.error("Errore dettagli serie:", err);
      return null;
    }
  };
  