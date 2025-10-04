export type Movie = {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    release_date?: string;
    vote_average?: number;
    }
    
    
    export type MovieDetails = Movie & {
    runtime?: number;
    genres?: {id:number; name:string}[];
    credits?: {cast:any[]; crew:any[]};
    videos?: {results:any[]};
    similar?: {results: Movie[]};
    reviews?: {results:any[]};
    }