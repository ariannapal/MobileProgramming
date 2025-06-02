// utils/fetchDettagliSerie.ts

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
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYWMxMzU4NjY3ZjcyODgzNWRhZjk2YjAxZDZkODVhMCIsIm5iZiI6MTc0Njc3ODg1MC4zMTcsInN1YiI6IjY4MWRiYWUyM2E2OGExMTcyOTYzYmQxNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I6RbtWrCPo0n0YWNYNfGs0wnAcIrG0n5t4KYh0W7Am4",
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
        piattaforma: piattaforma ?? "", // puoi passarlo dall’esterno
        stato: stato ?? "", // es. “suggerita” o “in corso”
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
  