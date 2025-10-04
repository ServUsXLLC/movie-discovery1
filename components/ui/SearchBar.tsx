'use client'
import React from 'react';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useSWR from 'swr';
import { searchMovies } from '../../lib/tmdb';


export default function SearchBar({onSelect}:{onSelect: (m:any)=>void}){
const [q, setQ] = React.useState('');
const debounced = useDebouncedValue(q, 350);


const {data} = useSWR(debounced ? ['search', debounced] : null, () => searchMovies(debounced));


return (
<div className="relative">
<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search movies..." className="input" />
{data?.results?.length > 0 && (
<ul className="absolute bg-card shadow rounded mt-1 w-full max-h-60 overflow-auto">
{data.results.slice(0,8).map((m:any)=> (
<li key={m.id} onClick={()=> onSelect(m)} className="p-2 hover:bg-muted cursor-pointer">{m.title} ({m.release_date?.slice(0,4)})</li>
))}
</ul>
)}
</div>
)
}