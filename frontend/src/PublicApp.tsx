import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, Globe2, MapPin, Plane, Search, ShieldCheck, Star, Users, WalletCards, X } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
type Airport={code:string;city:string;name:string;country:string};
type ApiFlight={id:string;flightNumber:string;airline:string;departureTime:string;arrivalTime:string;durationMin:number;economyPrice:string|number;businessPrice:string|number;availableSeats:number;departure:Airport;arrival:Airport};
type Flight=ApiFlight & {depart:string;arrive:string;duration:string;stops:string;price:number;rating:number;logo:string};

const money=(v:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
const time=(v:string)=>new Date(v).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
const duration=(m:number)=>`${Math.floor(m/60)}h ${m%60}m`;
const codeFrom=(value:string, airports:Airport[])=>airports.find(a=>a.code===value.toUpperCase())?.code || airports.find(a=>a.city.toLowerCase()===value.toLowerCase())?.code || value.toUpperCase();

function App(){
 const [trip,setTrip]=useState<'Round trip'|'One way'>('Round trip');
 const [from,setFrom]=useState('Lagos'),[to,setTo]=useState('London'),[date,setDate]=useState('2026-10-10'),[passengers,setPassengers]=useState(1);
 const [airports,setAirports]=useState<Airport[]>([]),[flights,setFlights]=useState<Flight[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [searched,setSearched]=useState(false),[selected,setSelected]=useState<Flight|null>(null),[booking,setBooking]=useState(false),[sort,setSort]=useState('Recommended');
 const [token,setToken]=useState(localStorage.getItem('skybook_token')||'');
 const [verifyRef,setVerifyRef]=useState(''),[verifyResult,setVerifyResult]=useState<any>(null),[verifyLoading,setVerifyLoading]=useState(false),[verifyError,setVerifyError]=useState('');
 const [passenger,setPassenger]=useState({firstName:'',lastName:'',email:'',phone:''});
 useEffect(()=>{fetch(`${API}/flights/airports`).then(r=>r.json()).then(setAirports).catch(()=>setError('Could not connect to the SkyBook API. Start the backend on port 4000.'));},[]);
 const search=async()=>{
   setLoading(true);setError('');
   try{
     const params=new URLSearchParams({from:codeFrom(from,airports),to:codeFrom(to,airports),date,passengers:String(passengers)});
     const r=await fetch(`${API}/flights?${params}`); const data=await r.json(); if(!r.ok) throw new Error(data.message||'Search failed');
     setFlights(data.map((f:ApiFlight)=>({...f,depart:time(f.departureTime),arrive:time(f.arrivalTime),duration:duration(f.durationMin),stops:'Non-stop',price:Number(f.economyPrice),rating:4.8,logo:f.airline.charAt(0)})));
     setSearched(true);setSelected(null);setTimeout(()=>document.getElementById('results')?.scrollIntoView({behavior:'smooth'}),80);
   }catch(e){setError(e instanceof Error?e.message:'Search failed');} finally{setLoading(false);}
 };
 const results=useMemo(()=>[...flights].sort((a,b)=>sort==='Price'?a.price-b.price:sort==='Duration'?a.durationMin-b.durationMin:b.rating-a.rating),[flights,sort]);
 const selectFlight=(f:Flight)=>{setSelected(f);setBooking(false)};
 const verifyTicket=async()=>{
   const reference=verifyRef.trim().toUpperCase();
   if(!reference){setVerifyError('Enter your booking number.');setVerifyResult(null);return;}
   setVerifyLoading(true);setVerifyError('');setVerifyResult(null);
   try{
     const r=await fetch(`${API}/bookings/verify/${encodeURIComponent(reference)}`);
     const d=await r.json();
     if(!r.ok) throw new Error(d.message||'Ticket not found');
     setVerifyResult(d);
   }catch(e){setVerifyError(e instanceof Error?e.message:'Ticket verification failed');}
   finally{setVerifyLoading(false);}
 };
 const confirm=async()=>{
   if(!selected)return;
   setError('');
   try{
     let authToken=token;
     if(!authToken){
       const email=passenger.email||`guest${Date.now()}@skybook.demo`;
       const r=await fetch(`${API}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:`${passenger.firstName} ${passenger.lastName}`.trim()||'Guest Traveler',email,password:'DemoPass123!'})});
       const d=await r.json(); if(!r.ok) throw new Error(d.message||'Please sign in or use a new email'); authToken=d.token; localStorage.setItem('skybook_token',authToken);setToken(authToken);
     }
     const r=await fetch(`${API}/bookings`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${authToken}`},body:JSON.stringify({flightId:selected.id,tripType:trip==='Round trip'?'ROUND_TRIP':'ONE_WAY',cabinClass:'economy',seats:['12A'],passengerData:[passenger]})});
     const d=await r.json(); if(!r.ok) throw new Error(d.message||'Booking failed');
     alert(`Booking confirmed! Reference: ${d.reference}`);setSelected(null);setBooking(false);search();
   }catch(e){setError(e instanceof Error?e.message:'Booking failed');}
 };
 return <div className="app">
  <header className="nav"><div className="brand"><span className="brandMark"><Plane size={20}/></span>Sky<span>Book</span></div><nav><button>Flights</button><button>Explore</button><button>Deals</button></nav><div className="navRight"><button className="currency"><Globe2 size={16}/> USD <ChevronDown size={14}/></button></div></header>
  <main>
   <section className="hero"><div className="heroInner"><div className="eyebrow"><span>✦</span> Travel smarter. Fly further.</div><h1>Where will you <em>fly</em> next?</h1><p>Compare hundreds of flights and book your perfect trip in minutes.</p>
    <div className="searchCard"><div className="tripTabs">{['Round trip','One way'].map(x=><button key={x} className={trip===x?'active':''} onClick={()=>setTrip(x as typeof trip)}>{x}</button>)}</div>
     <div className="fields"><label><span>FROM</span><div className="field"><MapPin/><input list="airports" value={from} onChange={e=>setFrom(e.target.value)}/><small>{codeFrom(from,airports)}</small></div></label><button className="swap" onClick={()=>{setFrom(to);setTo(from)}}><ArrowRight size={17}/></button><label><span>TO</span><div className="field"><MapPin/><input list="airports" value={to} onChange={e=>setTo(e.target.value)}/><small>{codeFrom(to,airports)}</small></div></label><label><span>DEPARTURE</span><div className="field"><CalendarDays/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div></label>{trip==='Round trip'&&<label><span>RETURN</span><div className="field"><CalendarDays/><input type="date" defaultValue="2026-10-20"/></div></label>}<label><span>TRAVELERS</span><div className="field"><Users/><select value={passengers} onChange={e=>setPassengers(+e.target.value)}>{[1,2,3,4].map(n=><option key={n} value={n}>{n} traveler{n>1?'s':''}</option>)}</select></div></label><button className="searchBtn" onClick={search} disabled={loading}><Search size={19}/> {loading?'Searching...':'Search'}</button></div>
     <datalist id="airports">{airports.map(a=><option key={a.code} value={a.city}>{a.code} — {a.name}</option>)}</datalist>
    </div></div></section>
   <section className="verifyTicket">
    <div className="verifyCopy"><span className="eyebrow">TICKET VERIFICATION</span><h2>Verify your flight ticket</h2><p>Enter your booking number to instantly check whether your ticket is valid.</p></div>
    <div className="verifyForm">
      <div className="verifyInput"><span>BOOKING NUMBER</span><input value={verifyRef} onChange={e=>setVerifyRef(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==='Enter')verifyTicket()}} placeholder="e.g. SKY-A1B2C3-4821" aria-label="Booking number"/><button onClick={verifyTicket} disabled={verifyLoading}><ShieldCheck size={18}/>{verifyLoading?'Checking...':'Verify ticket'}</button></div>
      {verifyError&&<div className="verifyMessage error">{verifyError}</div>}
      {verifyResult&&<div className={`verifyMessage ${verifyResult.valid?'valid':'invalid'}`}><div className="verifyIcon">{verifyResult.valid?<Check size={20}/>:<X size={20}/>}</div><div><b>{verifyResult.valid?'Ticket verified':'Ticket is cancelled'}</b><span>{verifyResult.reference} · {verifyResult.flight.airline} {verifyResult.flight.flightNumber} · {verifyResult.flight.departure.code} → {verifyResult.flight.arrival.code}</span><small>{new Date(verifyResult.flight.departureTime).toLocaleString()} · {verifyResult.passengerCount} passenger{verifyResult.passengerCount===1?'':'s'}</small></div></div>}
    </div>
   </section>
   <section className="trust"><div><ShieldCheck/> <span><b>Secure booking</b><small>Your payment is protected</small></span></div><div><Star/> <span><b>4.8/5 customer rating</b><small>From 50,000+ travelers</small></span></div><div><WalletCards/> <span><b>Best price promise</b><small>Find a lower fare? We'll match it.</small></span></div></section>
   {error&&<div className="apiError">{error}</div>}
   <section id="results" className="results"><div className="sectionHead"><div><span className="eyebrow">FLIGHT SEARCH</span><h2>{searched?'Flights from '+from+' to '+to:'Search results'}</h2><p>{searched?(results.length? 'Select a flight to continue your booking.':'No flights found for this date.'):'Search the live demo database above.'}</p></div></div>
    <div className="resultLayout"><aside className="filters"><h3>Filter</h3><div className="filterGroup"><b>Stops</b><label><input type="checkbox" defaultChecked/> Non-stop</label><label><input type="checkbox"/> 1 stop</label></div><div className="filterGroup"><b>Airlines</b>{[...new Set(results.map(f=>f.airline))].map(a=><label key={a}><input type="checkbox" defaultChecked/> {a}</label>)}</div></aside>
     <div className="flightList"><div className="sortbar"><span><b>{results.length}</b> flights found</span><select value={sort} onChange={e=>setSort(e.target.value)}><option>Recommended</option><option>Price</option><option>Duration</option></select></div>{results.map(f=><article className="flightCard" key={f.id}><div className="airline"><span className="airLogo">{f.logo}</span><div><b>{f.airline}</b><small>{f.flightNumber} · Economy</small></div></div><div className="route"><div><strong>{f.depart}</strong><small>{f.departure.code}</small></div><div className="routeLine"><small>{f.duration}</small><span></span><small>{f.stops}</small></div><div><strong>{f.arrive}</strong><small>{f.arrival.code}</small></div></div><div className="fare"><small>from</small><strong>{money(f.price)}</strong><span>per traveler</span></div><button className="selectBtn" onClick={()=>selectFlight(f)}>Select <ArrowRight size={16}/></button></article>)}</div></div>
   </section>
  </main><footer><div className="brand"><span className="brandMark"><Plane size={18}/></span>Sky<span>Book</span></div><span>© 2026 SkyBook. Demo booking experience.</span></footer>
  {selected&&!booking&&<div className="modalBackdrop"><div className="modal"><button className="close" onClick={()=>setSelected(null)}><X/></button><span className="eyebrow">SELECTED FLIGHT</span><h2>{selected.airline}</h2><div className="modalRoute"><b>{selected.depart}<small>{selected.departure.code}</small></b><ArrowRight/><b>{selected.arrive}<small>{selected.arrival.code}</small></b></div><div className="summary"><span>Flight</span><b>{selected.flightNumber}</b><span>Seats available</span><b>{selected.availableSeats}</b><span>Fare</span><b>{money(selected.price*passengers)}</b></div><button className="continue" onClick={()=>setBooking(true)}>Continue to passenger details <ArrowRight/></button></div></div>}
  {selected&&booking&&<div className="modalBackdrop"><div className="modal"><button className="close" onClick={()=>setBooking(false)}><X/></button><span className="successIcon"><Check/></span><h2>Passenger details</h2><p className="modalCopy">This demo uses a real backend booking API with a simulated payment step.</p><div className="inputGrid"><label>First name<input value={passenger.firstName} onChange={e=>setPassenger({...passenger,firstName:e.target.value})} placeholder="John"/></label><label>Last name<input value={passenger.lastName} onChange={e=>setPassenger({...passenger,lastName:e.target.value})} placeholder="Doe"/></label><label>Email<input type="email" value={passenger.email} onChange={e=>setPassenger({...passenger,email:e.target.value})} placeholder="john@example.com"/></label><label>Phone<input value={passenger.phone} onChange={e=>setPassenger({...passenger,phone:e.target.value})} placeholder="+234..."/></label></div><button className="continue" onClick={confirm}>Confirm booking <Check/></button></div></div>}
 </div>
}
export default App;

