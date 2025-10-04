export function saveJSON<T>(key: string, data: T){
    if(typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
    }
    export function loadJSON<T>(key: string, fallback: T): T{
    if(typeof window === 'undefined') return fallback;
    try{
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) as T : fallback;
    }catch{ return fallback; }
    }