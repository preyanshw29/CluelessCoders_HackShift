'use client';
import Link from 'next/link';import {Sprout} from 'lucide-react';
export function Shell({children}:{children:React.ReactNode}){return <><header className="topbar"><div className="topinner"><Link href="/" className="brand"><Sprout size={21} style={{verticalAlign:'-4px',color:'#73934f'}}/> Fasalpramaaan</Link><nav className="nav"><Link href="/">Dashboard</Link><Link href="/fields/1">Fields</Link><Link href="/market">Market</Link></nav></div></header>{children}<footer>Fasalpramaaan · Field evidence for clearer decisions <span style={{float:'right'}}><Link href="/simulate">Demo controls ↗</Link></span></footer></>}
export function PageLoading(){return <main className="wrap"><div className="card muted">Loading field data…</div></main>}
export function ErrorBox({message}:{message:string}){return <div className="notice" role="alert">{message}</div>}
