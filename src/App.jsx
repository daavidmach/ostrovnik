import { useState, useEffect, useMemo, useRef } from "react";
import { MapPin, Plus, X, Pencil, Trash2, Lock, LogIn, LogOut,
  Briefcase, Clock, HeartHandshake, Loader2, GitBranch, ChevronDown, Flag } from "lucide-react";

// ── KRAJ DATA ────────────────────────────────────────────────────────────────
const KRAJE = [
  { name:"Bratislavský kraj",    fill:"#D9CA8C" },
  { name:"Trnavský kraj",        fill:"#CCCF82" },
  { name:"Trenčiansky kraj",     fill:"#99BC7A" },
  { name:"Nitriansky kraj",      fill:"#BECA78" },
  { name:"Žilinský kraj",        fill:"#7DAA6C" },
  { name:"Banskobystrický kraj", fill:"#6A965C" },
  { name:"Prešovský kraj",       fill:"#7C9C64" },
  { name:"Košický kraj",         fill:"#94AA6E" },
];
const KRAJNAMES = KRAJE.map(k => k.name);

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const navy    = "#0F1E35";
const cream   = "#F5EFE0";
const teal    = "#2A7A74";
const coral   = "#D95B35";
const gold    = "#C49A1E";
const cardMuted  = "rgba(26,47,72,.55)";
const textMuted  = "rgba(245,239,224,.55)";
const GRADS = ["135deg,#2A7A74,#0F1E35","135deg,#D95B35,#C49A1E","135deg,#C49A1E,#2A7A74","135deg,#5a2a7a,#2A7A74"];
const IS = { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid rgba(26,47,72,.18)", background:"#fff", color:"#1A2F48", fontSize:14, fontFamily:"'Inter',sans-serif" };

const PROC = {
  INHOUSE:{ label:"Vlastná kapacita", sub:"§ 1(2) ZVO", color:teal,    tl:"Okamžite",  steps:["Autorizácia","Priradenie","Zápisnica"] },
  DIRECT: { label:"Priame zadanie",   sub:"§ 117 ZVO",  color:"#5A9060",tl:"1–2 týž.",  steps:["Cenová ponuka","Schválenie","Objednávka"] },
  BELOW:  { label:"Podlimitná",       sub:"§ 108 ZVO",  color:gold,     tl:"3–6 týž.",  steps:["Prieskum","UVO","Vyhodnotenie","Zmluva"] },
  ABOVE:  { label:"Nadlimitná",       sub:"§ 57 / TED", color:coral,    tl:"35+ dní",   steps:["TED/OJEU","Standstill","Vyhodnotenie","Zmluva"] },
};
const NIS2C  = ["ICT infraštruktúra","Kybernetická bezpečnosť","Dátové služby","Cloudové služby","Vývoj softvéru"];
const EUPLC  = ["Vývoj softvéru","Cloudové služby"];
const STATUS = {
  open:       { l:"Otvorená",  c:gold },
  claimed:    { l:"Prijatá",   c:teal },
  in_progress:{ l:"Prebieha",  c:coral },
  completed:  { l:"Hotovo",    c:"#5A9060" },
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmt  = n => "\u20AC"+Number(n).toLocaleString("sk-SK");
const ini  = s => (s||"?").split(" ").filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");
const gfor = s => { let h=0; for(const c of String(s)) h=(h*31+c.charCodeAt(0))>>>0; return `linear-gradient(${GRADS[h%GRADS.length]})`; };
const sug  = (b,ih) => ih?"INHOUSE":b<=5000?"DIRECT":b<=143000?"BELOW":"ABOVE";
const SKEY = "ostrovnik7";
// LOKÁLNA VERZIA (localStorage)
const sget = async k => {
  try { const v=localStorage.getItem(SKEY+k);
    return v?JSON.parse(v):null; } catch { return null; }
};
const sset = async (k,v) => {
  try { localStorage.setItem(SKEY+k,JSON.stringify(v)); } catch {}
};
// ── SEED DATA ────────────────────────────────────────────────────────────────
const TEAMS0 = [
  {id:"t1",name:"Bratislava Hub",location:"Bratislava",region:"Bratislavský kraj",blurb:"Logistika a onboarding.",employees:18,partTimers:6,volunteers:4,gitlabUrl:"https://gitlab.com/ostrovnik/ba-hub",members:[{id:"m1",name:"Lucia Horváthová",role:"employees",project:"Revamp onboardingu"},{id:"m2",name:"Marek Šimko",role:"partTimers",project:"Dashboard"}]},
  {id:"t2",name:"Coastline Outreach",location:"Žilina",region:"Žilinský kraj",blurb:"Partnerstvá s VŠ.",employees:9,partTimers:11,volunteers:22,gitlabUrl:"https://gitlab.com/ostrovnik/coastline",members:[{id:"m3",name:"Veronika Kollárová",role:"employees",project:"Sieť VŠ partnerov"}]},
  {id:"t3",name:"East Field Office",location:"Košice",region:"Košický kraj",blurb:"Terénna koordinácia.",employees:12,partTimers:3,volunteers:0,gitlabUrl:"",members:[{id:"m4",name:"Adam Petráš",role:"employees",project:"Migrácia dát"}]},
];
const TASKS0 = [
  {id:"k1",title:"Refresh zimnej signalizácie",desc:"Sezónne orientačné prvky.",region:"Žilinský kraj",budget:3200,cat:"Logistika",inhouse:false,status:"open",postedBy:"Coastline Outreach",claimedTeamId:null,nis2:false,eupl:false,method:"DIRECT"},
  {id:"k2",title:"Migrácia obecných dát",desc:"Pokračovanie migrácie.",region:"Košický kraj",budget:92000,cat:"Dátové služby",inhouse:false,status:"in_progress",postedBy:"East Field Office",claimedTeamId:"t3",nis2:true,eupl:false,method:"BELOW"},
  {id:"k3",title:"Onboarding dobrovoľníkov",desc:"Celodenný event.",region:"Bratislavský kraj",budget:1500,cat:"Komunitné aktivity",inhouse:true,status:"completed",postedBy:"Bratislava Hub",claimedTeamId:"t1",nis2:false,eupl:false,method:"INHOUSE"},
  {id:"k4",title:"Audit kybernetickej bezpečnosti",desc:"Hĺbkový audit, NIS2.",region:"Bratislavský kraj",budget:185000,cat:"Kybernetická bezpečnosť",inhouse:false,status:"open",postedBy:"Ministerstvo vnútra",claimedTeamId:null,nis2:true,eupl:false,method:"ABOVE"},
  {id:"k5",title:"Portál zdieľania dát",desc:"Open-source portál, EUPL-2.1.",region:"Banskobystrický kraj",budget:78000,cat:"Vývoj softvéru",inhouse:false,status:"open",postedBy:"BB kraj",claimedTeamId:null,nis2:true,eupl:true,method:"BELOW"},
];
const POOL0 = [
  {id:"p1",name:"Jana Kováčová",title:"Analytik IT",spec:"ICT infraštruktúra",region:"Bratislavský kraj",available:true},
  {id:"p2",name:"Rastislav Novák",title:"Developer",spec:"Vývoj softvéru",region:"Žilinský kraj",available:false},
  {id:"p3",name:"Marta Čechová",title:"PM",spec:"Logistika",region:"Košický kraj",available:true},
  {id:"p4",name:"Patrik Sloboda",title:"Bezpečnostný expert",spec:"Kybernetická bezpečnosť",region:"Bratislavský kraj",available:true},
];

// ── SLOVAKIA MAP ─────────────────────────────────────────────────────────────
const CENT_LAT = {
  "Bratislavský kraj":    [48.22,17.08], "Trnavský kraj":        [48.34,17.68],
  "Trenčiansky kraj":     [48.90,18.04], "Nitriansky kraj":      [48.20,18.22],
  "Žilinský kraj":        [49.15,18.95], "Banskobystrický kraj": [48.72,19.75],
  "Prešovský kraj":       [49.08,21.30], "Košický kraj":         [48.65,21.20],
};

// Embedded GeoJSON — no CDN fetch needed, always works
// Coordinates: [longitude, latitude] (GeoJSON standard)
const KRAJE_FEATURES = [
  { name:"Bratislavský kraj",    fill:"#D9CA8C",
    ring:[[16.87,48.63],[17.19,48.63],[17.38,48.26],[17.25,47.99],[17.08,47.88],[16.84,47.90],[16.84,48.42]] },
  { name:"Trnavský kraj",        fill:"#CCCF82",
    ring:[[17.19,48.63],[17.80,48.88],[18.00,48.95],[18.00,48.65],[18.44,47.84],[18.12,47.76],[17.90,47.74],[17.55,47.76],[17.35,47.80],[17.25,47.99],[17.38,48.26]] },
  { name:"Trenčiansky kraj",     fill:"#99BC7A",
    ring:[[18.00,48.95],[18.08,49.28],[18.42,49.40],[18.86,48.78],[18.86,48.48],[18.00,48.65]] },
  { name:"Nitriansky kraj",      fill:"#BECA78",
    ring:[[18.00,48.65],[18.86,48.48],[19.08,47.82],[18.86,47.82],[18.44,47.84]] },
  { name:"Žilinský kraj",        fill:"#7DAA6C",
    ring:[[18.42,49.40],[19.50,49.52],[19.95,49.60],[20.45,49.52],[19.55,49.22],[19.35,48.92],[19.08,48.72],[18.86,48.48],[18.86,48.78]] },
  { name:"Banskobystrický kraj", fill:"#6A965C",
    ring:[[18.86,48.48],[19.08,48.72],[19.35,48.92],[19.55,49.22],[20.45,49.52],[20.52,49.35],[20.36,48.18],[19.65,48.08],[19.08,47.82]] },
  { name:"Prešovský kraj",       fill:"#7C9C64",
    ring:[[20.45,49.52],[21.00,49.42],[21.80,49.42],[22.10,49.38],[22.56,49.08],[22.35,48.92],[21.50,48.85],[20.52,49.35]] },
  { name:"Košický kraj",         fill:"#94AA6E",
    ring:[[20.52,49.35],[21.50,48.85],[22.35,48.92],[22.08,48.35],[21.72,48.45],[21.50,48.40],[21.00,48.35],[20.86,48.35],[20.36,48.18]] },
];

function SlovakiaMap({ teams, tasks, selectedRegion, onSelect }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const groupRef     = useRef(null);   // holds the kraje L.layerGroup
  const [krajeOn, setKrajeOn] = useState(true);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    function boot(L) {
      const map = L.map(containerRef.current, {
        center:[48.7,19.5], zoom:7,
        zoomControl:true, scrollWheelZoom:true,
      });

      // OSM tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom:19,
      }).addTo(map);

      // Build kraj layers from embedded data
      function buildKrajeGroup(features) {
        const fills = features.map(k => {
          const gj = { type:"Feature",
            properties:{ name:k.name },
            geometry:{ type:"Polygon", coordinates:[[...k.ring, k.ring[0]]] } };
          return L.geoJSON(gj, {
            style:() => ({
              fillColor:k.fill, fillOpacity:0.35,
              color:"transparent", weight:0,
            }),
            onEachFeature:(f,lyr) => {
              lyr.on("click", ()=>onSelect(k.name===selectedRegion?null:k.name));
              lyr.on("mouseover", ()=>lyr.setStyle({fillOpacity:0.6}));
              lyr.on("mouseout",  ()=>lyr.setStyle({fillOpacity:k.name===selectedRegion?0.6:0.35}));
              lyr.bindTooltip(k.name,{sticky:true,direction:"center"});
            },
          });
        });

        // Border-only layer on top — the actual kraj lines
        const borders = L.geoJSON(
          { type:"FeatureCollection", features: features.map(k=>({
              type:"Feature", properties:{name:k.name},
              geometry:{ type:"Polygon", coordinates:[[...k.ring,k.ring[0]]] }
            }))
          },
          { style:()=>({ fill:false, color:"#1A2F48", weight:2.5, opacity:0.85, smoothFactor:0.5 }),
            interactive:false }
        );

        return L.layerGroup([...fills, borders]);
      }

      // ── Add embedded kraje immediately (always works) ──
      const group = buildKrajeGroup(KRAJE_FEATURES);
      group.addTo(map);
      groupRef.current = group;

      // ── EXACT OSM alignment via Overpass API ─────────────────────────────────
      // Overpass API uses the same database as the OSM map tiles → perfect match
      const ISO_TO_KRAJ = {
        'SK-BL':"Bratislavský kraj", 'SK-TA':"Trnavský kraj",
        'SK-TC':"Trenčiansky kraj",  'SK-NI':"Nitriansky kraj",
        'SK-ZI':"Žilinský kraj",     'SK-BC':"Banskobystrický kraj",
        'SK-PO':"Prešovský kraj",    'SK-KE':"Košický kraj",
      };
      const NUTS_MAP2 = {
        'SK010':"Bratislavský kraj",'SK021':"Trnavský kraj",'SK022':"Trenčiansky kraj",
        'SK023':"Nitriansky kraj",'SK031':"Žilinský kraj",'SK032':"Banskobystrický kraj",
        'SK041':"Prešovský kraj",'SK042':"Košický kraj",
      };

      function resolveKrajName(props) {
        return ISO_TO_KRAJ[props['ISO3166-2']]
          || NUTS_MAP2[props['ref:NUTS']]
          || (() => {
               const n=(props.name||'').toLowerCase();
               if(n.includes('bratislava'))  return "Bratislavský kraj";
               if(n.includes('trnava'))      return "Trnavský kraj";
               if(n.includes('trenč'))       return "Trenčiansky kraj";
               if(n.includes('nitra'))       return "Nitriansky kraj";
               if(n.includes('žilin'))       return "Žilinský kraj";
               if(n.includes('bansk'))       return "Banskobystrický kraj";
               if(n.includes('prešov'))      return "Prešovský kraj";
               if(n.includes('košic'))       return "Košický kraj";
               return null;
             })();
      }

      function applyRealLayer(features) {
        const enriched = features
          .map(f => ({ ...f, _name:resolveKrajName(f.properties), _fill:KRAJ_FILL[resolveKrajName(f.properties)]||'#9AB870' }))
          .filter(f => f._name);
        if (!enriched.length) return false;

        const fills = enriched.map(f => L.geoJSON(f, {
          style:()=>({ fillColor:f._fill, fillOpacity:0.35, color:"transparent", weight:0 }),
          onEachFeature:(_,lyr)=>{
            lyr.on("click",()=>onSelect(f._name===selectedRegion?null:f._name));
            lyr.on("mouseover",()=>lyr.setStyle({fillOpacity:0.55}));
            lyr.on("mouseout",()=>lyr.setStyle({fillOpacity:0.35}));
            lyr.bindTooltip(f._name,{sticky:true,direction:"center"});
          },
        }));
        const borders = L.geoJSON(
          {type:"FeatureCollection",features:enriched},
          {style:()=>({fill:false,color:"#0F1E35",weight:2.2,opacity:0.9,smoothFactor:0.1}),
           interactive:false}
        );
        if (map.hasLayer(groupRef.current)) map.removeLayer(groupRef.current);
        const g = L.layerGroup([...fills, borders]);
        g.addTo(map);
        groupRef.current = g;
        return true;
      }

      // Helper: load external script and return the exposed global
      function loadScript(src, test) {
        return new Promise((res,rej) => {
          if (eval('typeof '+test+' !== "undefined"')) return res(eval(test));
          const s=document.createElement('script');
          s.src=src; s.onload=()=>res(eval(test)); s.onerror=rej;
          document.head.appendChild(s);
        });
      }

      // Cascade: Overpass → GISCO 60M → GISCO 20M → deldersveld topojson
      (async () => {
        // 1. Overpass API (same data as OSM tiles)
        try {
          const osmtogeojson = await loadScript(
            'https://cdn.jsdelivr.net/npm/osmtogeojson@3.0.0-beta.4/osmtogeojson.min.js',
            'osmtogeojson'
          );
          const q = encodeURIComponent(
            '[out:json][timeout:25];relation["boundary"="administrative"]["admin_level"="4"](47.73,16.84,49.61,22.56);out geom;'
          );
          const osm = await fetch(`https://overpass-api.de/api/interpreter?data=${q}`).then(r=>r.json());
          const geo = osmtogeojson(osm);
          const polys = geo.features.filter(f => f.geometry && (f.geometry.type==='Polygon'||f.geometry.type==='MultiPolygon'));
          if (applyRealLayer(polys)) { console.log('✓ Overpass OSM boundaries loaded'); return; }
        } catch(e) { console.log('Overpass failed, trying GISCO…'); }

        // 2. GISCO Eurostat 60M
        try {
          const d = await fetch('https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_60M_2021_4326_LEVL_3.geojson').then(r=>r.json());
          const sk = d.features.filter(f=>f.properties.CNTR_CODE==='SK');
          const mapped = sk.map(f=>({...f,properties:{...f.properties,name:f.properties.NAME_LATN,'ref:NUTS':f.properties.NUTS_ID}}));
          if (applyRealLayer(mapped)) { console.log('✓ GISCO 60M loaded'); return; }
        } catch(e) { console.log('GISCO 60M failed…'); }

        // 3. GISCO 20M
        try {
          const d = await fetch('https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2021_4326_LEVL_3.geojson').then(r=>r.json());
          const sk = d.features.filter(f=>f.properties.CNTR_CODE==='SK');
          const mapped = sk.map(f=>({...f,properties:{...f.properties,name:f.properties.NAME_LATN,'ref:NUTS':f.properties.NUTS_ID}}));
          if (applyRealLayer(mapped)) { console.log('✓ GISCO 20M loaded'); return; }
        } catch(e) { console.log('GISCO 20M failed…'); }

        // 4. deldersveld topojson
        try {
          const topo = await loadScript('https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js','topojson');
          const d = await fetch('https://cdn.jsdelivr.net/gh/deldersveld/topojson/countries/slovakia/slovakia-regions.json').then(r=>r.json());
          const key = Object.keys(d.objects)[0];
          const geo = topo.feature(d,d.objects[key]);
          if (applyRealLayer(geo.features)) { console.log('✓ deldersveld loaded'); return; }
        } catch(e) {}

        console.log('All sources failed — embedded approximation showing');
      })();


      // ── Team pins ──
      teams.forEach(t => {
        const c=CENT_LAT[t.region]; if(!c) return;
        const h=parseInt(t.id.replace(/\D/g,""),10)||0;
        const icon=L.divIcon({
          html:`<div style="width:34px;height:34px;border-radius:50%;background:${gfor(t.id)};border:2.5px solid rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;font-family:monospace;box-shadow:0 4px 12px rgba(0,0,0,.4);cursor:pointer">${ini(t.name)}</div>`,
          className:"",iconSize:[34,34],iconAnchor:[17,17],
        });
        L.marker([c[0]+(h%5-2)*0.06,c[1]+(h%7-3)*0.08],{icon,zIndexOffset:100})
          .addTo(map).on('click',()=>onSelect(t.region))
          .bindTooltip(t.name,{direction:"top",offset:[0,-22]});
      });

      // ── Task flags ──
      tasks.filter(t=>t.status==="open").forEach(t=>{
        const c=CENT_LAT[t.region]; if(!c) return;
        const h=parseInt(t.id.replace(/\D/g,""),10)||0;
        const icon=L.divIcon({
          html:`<div style="width:22px;height:22px;border-radius:50%;background:#C49A1E;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#1A2F48;box-shadow:0 3px 8px rgba(0,0,0,.4);cursor:pointer">!</div>`,
          className:"",iconSize:[22,22],iconAnchor:[11,11],
        });
        L.marker([c[0]+0.2+(h%3)*0.06,c[1]+(h%3-1)*0.14],{icon,zIndexOffset:200})
          .addTo(map).on('click',()=>onSelect(t.region))
          .bindTooltip(t.title,{direction:"top",offset:[0,-16]});
      });

      mapRef.current = map;
    }

    if (window.L) {
      boot(window.L);
    } else {
      if (!document.getElementById("lf-css")) {
        const css=document.createElement("link");
        css.id="lf-css";css.rel="stylesheet";
        css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
        document.head.appendChild(css);
      }
      const js=document.createElement("script");
      js.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      js.onload=()=>boot(window.L);
      document.head.appendChild(js);
    }
    return ()=>{ if(mapRef.current){mapRef.current.remove();mapRef.current=null;} };
  }, []);

  // Toggle handler — always has access to groupRef
  const toggleKraje = () => {
    const group = groupRef.current;
    const map   = mapRef.current;
    if (!group || !map) return;
    if (krajeOn) { map.removeLayer(group); }
    else         { group.addTo(map); }
    setKrajeOn(v => !v);
  };

  return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      <div ref={containerRef} style={{width:"100%",height:"100%",background:"#e8f0e8"}}/>

      {/* Toggle button — always visible, React overlay */}
      <button onClick={toggleKraje} title="Zapnúť/vypnúť vrstvu krajov" style={{
        position:"absolute", top:10, right:50, zIndex:1000,
        background:krajeOn?"#fff":"#eee",
        border:`2px solid ${krajeOn?"#2A7A74":"#bbb"}`,
        borderRadius:7, padding:"7px 13px", cursor:"pointer",
        fontSize:12.5, fontWeight:700, fontFamily:"'Inter',sans-serif",
        boxShadow:"0 2px 8px rgba(0,0,0,.28)",
        display:"flex", alignItems:"center", gap:7,
        color:krajeOn?"#1A2F48":"#999", transition:"all .2s",
        lineHeight:1,
      }}>
        <span style={{
          width:9, height:9, borderRadius:"50%", display:"inline-block",
          background:krajeOn?"#2A7A74":"#bbb",
          boxShadow:krajeOn?"0 0 0 2px rgba(42,122,116,.2)":"none",
          flexShrink:0,
        }}/>
        Kraje&nbsp;{krajeOn?"ZAP":"VYP"}
      </button>
    </div>
  );
}


// ── UI ATOMS ─────────────────────────────────────────────────────────────────
function Av({ name, size=36 }) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:gfor(name),
      display:"flex",alignItems:"center",justifyContent:"center",
      color:"#fff",fontWeight:700,fontSize:size*0.35,
      fontFamily:"'JetBrains Mono',monospace",
      border:"2px solid rgba(255,255,255,.3)",flexShrink:0}}>
      {ini(name)}
    </div>
  );
}
function Chip({ color, small, children }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:3,
      background:`${color}22`,color,borderRadius:999,
      padding:small?"2px 7px":"4px 10px",
      fontSize:small?10:11.5,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>
      {children}
    </span>
  );
}
function Btn({ children, onClick, variant, sm, disabled, style }) {
  variant = variant||"teal"; style = style||{};
  const BG={teal,gold,coral,outline:"transparent"};
  const CL={teal:"#F5EFE0",gold:"#1A2F48",coral:"#F5EFE0",outline:"#F5EFE0"};
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:"inline-flex",alignItems:"center",gap:6,
      background:disabled?"rgba(255,255,255,.1)":BG[variant]||teal,
      color:disabled?"rgba(255,255,255,.3)":CL[variant]||"#F5EFE0",
      border:variant==="outline"?"1px solid rgba(255,255,255,.1)":"none",
      borderRadius:999,padding:sm?"7px 14px":"9px 18px",
      fontSize:sm?12:13.5,fontWeight:600,
      cursor:disabled?"not-allowed":"pointer",
      fontFamily:"'Inter',sans-serif",...style}}>
      {children}
    </button>
  );
}
function Modal({ open, onClose, children, width=480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,
      background:"rgba(10,20,40,.8)",display:"flex",
      alignItems:"center",justifyContent:"center",padding:20,zIndex:999}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:cream,color:"#1A2F48",borderRadius:16,
        width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",padding:26}}>
        {children}
      </div>
    </div>
  );
}
function Fld({ label, children, row }) {
  return (
    <div style={{marginBottom:13,flex:row?1:undefined}}>
      <label style={{display:"block",fontSize:11,fontWeight:700,
        textTransform:"uppercase",letterSpacing:".04em",
        color:cardMuted,marginBottom:5}}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── REGION PANEL ─────────────────────────────────────────────────────────────
function RegionPanel({ region, teams, tasks, user, onTeamDetail, onClose, onNewTeam, onNewTask }) {
  const rt=teams.filter(t=>t.region===region);
  const rk=tasks.filter(t=>t.region===region);
  return (
    <div style={{background:cream,color:"#1A2F48",borderTop:`3px solid ${gold}`,padding:"16px 36px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}>
        <h3 style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:18,margin:0}}>{region}</h3>
        <div style={{display:"flex",gap:8}}>
          {user&&<Btn sm variant="teal" onClick={()=>onNewTeam(region)}><Plus size={13}/>Tím</Btn>}
          {user&&<Btn sm variant="gold" onClick={()=>onNewTask(region)}><Flag size={13}/>Výzva</Btn>}
          <Btn sm variant="outline" onClick={onClose} style={{color:"#1A2F48",border:"1px solid #DDD5C0"}}>✕</Btn>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:cardMuted,margin:"0 0 7px"}}>Tímy ({rt.length})</p>
          {rt.length===0&&<p style={{fontSize:13,color:cardMuted}}>Žiadne tímy.</p>}
          {rt.map(t=>(
            <div key={t.id} onClick={()=>onTeamDetail(t.id)}
              style={{display:"flex",alignItems:"center",gap:9,background:"#fff",borderRadius:9,padding:"9px 11px",marginBottom:7,cursor:"pointer",boxShadow:"0 1px 4px rgba(26,47,72,.08)"}}>
              <Av name={t.name} size={30}/>
              <div><div style={{fontSize:13,fontWeight:600}}>{t.name}</div>
              <div style={{fontSize:11,color:cardMuted}}>{t.location} · {t.employees}E {t.partTimers}P {t.volunteers}D</div></div>
            </div>
          ))}
        </div>
        <div>
          <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:cardMuted,margin:"0 0 7px"}}>Výzvy ({rk.length})</p>
          {rk.length===0&&<p style={{fontSize:13,color:cardMuted}}>Žiadne výzvy.</p>}
          {rk.map(t=>{const pm=PROC[t.method];return(
            <div key={t.id} style={{background:"#fff",borderRadius:9,padding:"9px 11px",marginBottom:7,boxShadow:"0 1px 4px rgba(26,47,72,.08)",borderLeft:`3px solid ${pm.color}`}}>
              <div style={{fontSize:12.5,fontWeight:600,marginBottom:3}}>{t.title}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                <Chip color={STATUS[t.status].c} small>{STATUS[t.status].l}</Chip>
                <Chip color={pm.color} small>{pm.label}</Chip>
                <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{fmt(t.budget)}</span>
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({ task, teams, user, claimingId, onStartClaim, onCancelClaim, onClaim, onAdvance, onDelete }) {
  const [exp,setExp]=useState(false);
  const [ct,setCt]=useState(teams[0]?.id||"");
  const pm=PROC[task.method];
  const claimedTeam=teams.find(t=>t.id===task.claimedTeamId);
  return (
    <div style={{background:cream,color:"#1A2F48",borderRadius:14,borderTop:`3px solid ${pm.color}`,boxShadow:"0 2px 8px rgba(15,30,53,.08)"}}>
      <div style={{padding:"13px 15px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:7}}>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <Chip color={STATUS[task.status].c} small>{STATUS[task.status].l}</Chip>
            <Chip color={pm.color} small>{pm.label}</Chip>
            {task.nis2&&<Chip color="#7755AA" small>🛡 NIS2</Chip>}
            {task.eupl&&<Chip color={teal} small>📜 EUPL</Chip>}
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13.5,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{fmt(task.budget)}</span>
        </div>
        <h4 style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,margin:"0 0 4px"}}>{task.title}</h4>
        <p style={{fontSize:12,color:cardMuted,margin:"0 0 7px",lineHeight:1.45}}>{task.desc}</p>
        <div style={{fontSize:11,color:cardMuted,display:"flex",gap:8,flexWrap:"wrap"}}>
          <span>📍 {task.region}</span><span>· {task.postedBy}</span>
          {claimedTeam&&<span>· → <strong>{claimedTeam.name}</strong></span>}
        </div>
      </div>
      <div style={{borderTop:"1px solid #DDD5C0"}}>
        <button onClick={()=>setExp(!exp)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 15px",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:cardMuted}}>
          <span>Právny rámec · {pm.sub}</span>
          <ChevronDown size={12} style={{transform:exp?"rotate(180deg)":"none",transition:".2s"}}/>
        </button>
        {exp&&(
          <div style={{padding:"0 15px 11px",fontSize:11.5,color:cardMuted,lineHeight:1.6}}>
            <strong style={{color:pm.color}}>{pm.label}</strong> · {pm.sub} · ⏱ {pm.tl}<br/>
            {pm.steps.join(" → ")}
            {task.nis2&&<div style={{marginTop:3,color:"#7755AA"}}>🛡 NIS2: Bezpečnostné požiadavky v dokumentácii</div>}
            {task.eupl&&<div style={{color:teal}}>📜 EUPL-2.1: Zdrojový kód musí byť zverejnený</div>}
          </div>
        )}
      </div>
      {user&&(
        <div style={{padding:"9px 15px",borderTop:"1px solid #DDD5C0",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {task.status==="open"&&claimingId!==task.id&&<Btn sm variant="teal" onClick={()=>onStartClaim(task.id)}><Plus size={13}/>Prijať</Btn>}
          {task.status==="open"&&claimingId===task.id&&(
            <>
              <select value={ct} onChange={e=>setCt(e.target.value)}
                style={{...IS,width:"auto",flex:1,minWidth:110,padding:"6px 10px",fontSize:12}}>
                {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <Btn sm variant="teal" onClick={()=>onClaim(task.id,ct)}>OK</Btn>
              <Btn sm variant="outline" onClick={onCancelClaim} style={{color:"#1A2F48",border:"1px solid #DDD5C0"}}>✕</Btn>
            </>
          )}
          {task.status==="claimed"&&<Btn sm variant="coral" onClick={()=>onAdvance(task.id,"in_progress")}>▶ Spustiť</Btn>}
          {task.status==="in_progress"&&<Btn sm onClick={()=>onAdvance(task.id,"completed")} style={{background:"#5A9060",color:"#fff"}}>✓ Hotovo</Btn>}
          <Btn sm variant="outline" onClick={()=>onDelete(task.id)} style={{color:"rgba(200,50,30,.7)",border:"1px solid rgba(200,50,30,.2)",marginLeft:"auto"}}><Trash2 size={12}/></Btn>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [teams,setTeams]=useState(null);
  const [tasks,setTasks]=useState(null);
  const [pool,setPool]=useState(null);
  const [user,setUser]=useState(null);
  const [selR,setSelR]=useState(null);
  const [tab,setTab]=useState("tasks");
  const [claimId,setClaimId]=useState(null);
  const [taskFilter,setTaskFilter]=useState("all");
  const [regFilter,setRegFilter]=useState("all");
  const [signInOpen,setSignInOpen]=useState(false);
  const [taskFormOpen,setTaskFormOpen]=useState(false);
  const [teamFormOpen,setTeamFormOpen]=useState(false);
  const [teamDetailId,setTeamDetailId]=useState(null);
  const [editingTeamId,setEditingTeamId]=useState(null);
  const [signInName,setSignInName]=useState("");
  const [tf,setTf]=useState({title:"",desc:"",region:KRAJNAMES[0],budget:5000,cat:"Logistika",inhouse:false});
  const [ntf,setNtf]=useState({name:"",location:"",region:KRAJNAMES[0],blurb:"",employees:0,partTimers:0,volunteers:0,gitlabUrl:""});

  useEffect(()=>{
    (async()=>{
      const [t,k,p]=await Promise.all([sget("teams"),sget("tasks"),sget("pool")]);
      setTeams(t||TEAMS0); setTasks(k||TASKS0); setPool(p||POOL0);
      if(!t) sset("teams",TEAMS0); if(!k) sset("tasks",TASKS0); if(!p) sset("pool",POOL0);
    })();
  },[]);

  const persist=async(key,val,setter)=>{setter(val);await sset(key,val);};

  const budget=useMemo(()=>{
    if(!tasks) return{spent:0,committed:0,remaining:19e6};
    const spent=tasks.filter(t=>t.status==="completed").reduce((a,t)=>a+(+t.budget||0),0);
    const committed=tasks.filter(t=>t.status!=="completed").reduce((a,t)=>a+(+t.budget||0),0);
    return{spent,committed,remaining:19e6-spent-committed};
  },[tasks]);

  const filtTasks=useMemo(()=>!tasks?[]:tasks.filter(t=>(taskFilter==="all"||t.method===taskFilter)&&(regFilter==="all"||t.region===regFilter)),[tasks,taskFilter,regFilter]);
  const filtTeams=useMemo(()=>!teams?[]:regFilter==="all"?teams:teams.filter(t=>t.region===regFilter),[teams,regFilter]);
  const td=teamDetailId?teams?.find(t=>t.id===teamDetailId):null;
  const pm=PROC[sug(+tf.budget,tf.inhouse)];

  const saveTask=async()=>{
    if(!tf.title.trim()) return;
    const m=sug(+tf.budget,tf.inhouse);
    const t={id:"k"+Date.now(),...tf,budget:+tf.budget,status:"open",postedBy:user||"Anon",
      claimedTeamId:null,nis2:NIS2C.includes(tf.cat),eupl:EUPLC.includes(tf.cat),method:m};
    await persist("tasks",[...tasks,t],setTasks);
    setTaskFormOpen(false);
    setTf({title:"",desc:"",region:KRAJNAMES[0],budget:5000,cat:"Logistika",inhouse:false});
  };
  const openNewTeam=r=>{setEditingTeamId(null);setNtf({name:"",location:"",region:r||KRAJNAMES[0],blurb:"",employees:0,partTimers:0,volunteers:0,gitlabUrl:""});setTeamFormOpen(true);};
  const openEditTeam=id=>{const t=teams.find(x=>x.id===id);if(!t)return;setEditingTeamId(id);setNtf({...t});setTeamFormOpen(true);};
  const saveTeam=async()=>{
    if(!ntf.name.trim()) return;
    const d={...ntf,employees:+ntf.employees||0,partTimers:+ntf.partTimers||0,volunteers:+ntf.volunteers||0,
      members:editingTeamId?teams.find(t=>t.id===editingTeamId)?.members||[]:[]}; 
    const n=editingTeamId?teams.map(t=>t.id===editingTeamId?{...d,id:editingTeamId}:t):[...teams,{...d,id:"t"+Date.now()}];
    await persist("teams",n,setTeams); setTeamFormOpen(false);
  };

  if(!teams||!tasks) return(
    <div style={{background:navy,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:textMuted,fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>
      <Loader2 size={20} style={{marginRight:10,animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Načítavam…
    </div>
  );

  return(
    <div style={{background:navy,minHeight:"100vh",fontFamily:"'Inter',sans-serif",color:"#F5EFE0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box}
        input:focus,textarea:focus,select:focus{outline:2px solid ${teal};outline-offset:1px}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 36px",borderBottom:"1px solid rgba(255,255,255,.1)",position:"sticky",top:0,background:navy,zIndex:100,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${teal},${gold})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <MapPin size={15} color="#fff" strokeWidth={2.5}/>
          </div>
          <span style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:17}}>Ostrovník</span>
          <span style={{fontSize:10,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:6,padding:"2px 8px",fontFamily:"'JetBrains Mono',monospace",color:textMuted}}>PROTOTYP</span>
        </div>
        {user?(
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:13,color:textMuted}}>👤 <strong style={{color:"#F5EFE0"}}>{user}</strong></span>
            <Btn sm variant="outline" onClick={()=>setUser(null)}><LogOut size={13}/>Odhlásiť</Btn>
          </div>
        ):(
          <Btn sm variant="teal" onClick={()=>setSignInOpen(true)}><LogIn size={13}/>Prihlásenie</Btn>
        )}
      </nav>

      {/* HERO */}
      <div style={{padding:"22px 36px 12px"}}>
        <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:".12em",textTransform:"uppercase",color:gold,margin:"0 0 6px"}}>Slovenská republika · Sieť štátnych tímov</p>
        <h1 style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"clamp(20px,3.5vw,32px)",lineHeight:1.1,margin:"0 0 10px"}}>Jeden štát, mnoho ostrovov.</h1>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {["⚖️ ZVO 343/2015","🛡 NIS2","📜 EUPL-2.1","🇪🇺 Dir. 2014/24/EÚ"].map(b=>(
            <span key={b} style={{fontSize:11,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:7,padding:"3px 10px",fontFamily:"'JetBrains Mono',monospace",color:textMuted}}>{b}</span>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div style={{margin:"0 36px",borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,.1)",background:"#1A3558"}}>
        <div style={{width:"100%",paddingBottom:"38%",position:"relative",minHeight:180}}>
          <div style={{position:"absolute",inset:0}}>
            <SlovakiaMap teams={teams} tasks={tasks} selectedRegion={selR} onSelect={setSelR}/>
          </div>
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center",padding:"7px 16px",background:"rgba(0,0,0,.15)",flexWrap:"wrap"}}>
          <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:textMuted,textTransform:"uppercase",letterSpacing:".05em"}}>Mapa krajov SK</span>
          <span style={{fontSize:11.5,color:textMuted,display:"flex",alignItems:"center",gap:4}}><span style={{width:11,height:11,borderRadius:"50%",background:`linear-gradient(135deg,${teal},#0F1E35)`,display:"inline-block"}}/>Tím</span>
          <span style={{fontSize:11.5,color:textMuted,display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:"50%",background:gold,display:"inline-block"}}/>Otvorená výzva</span>
          <span style={{marginLeft:"auto",fontSize:10,color:"rgba(245,239,224,.25)",fontFamily:"'JetBrains Mono',monospace"}}>© D3 Mercator · Voronoi kraje · skutočné súradnice SK</span>
        </div>
      </div>

      {/* REGION PANEL */}
      {selR&&(
        <div style={{margin:"0 36px"}}>
          <RegionPanel region={selR} teams={teams} tasks={tasks} user={user}
            onTeamDetail={setTeamDetailId} onClose={()=>setSelR(null)}
            onNewTeam={r=>openNewTeam(r)}
            onNewTask={r=>{setTf(p=>({...p,region:r}));setTaskFormOpen(true);}}/>
        </div>
      )}

      {/* STATS + BUDGET */}
      <div style={{padding:"16px 36px 0"}}>
        <div style={{display:"flex",gap:22,flexWrap:"wrap",marginBottom:13}}>
          {[{v:teams.length,l:"Tímov"},{v:KRAJNAMES.length,l:"Krajov"},{v:teams.reduce((s,t)=>s+(+t.employees||0)+(+t.partTimers||0)+(+t.volunteers||0),0),l:"Ľudí"},{v:tasks.filter(t=>t.status==="open").length,l:"Otv. výziev"},{v:fmt(budget.remaining),l:"Zostatok"},].map(s=>(
            <div key={s.l}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"clamp(17px,2.3vw,24px)",fontWeight:500}}>{s.v}</div><div style={{fontSize:10.5,color:textMuted,textTransform:"uppercase",letterSpacing:".05em",marginTop:2}}>{s.l}</div></div>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 15px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,fontFamily:"'JetBrains Mono',monospace",color:textMuted,marginBottom:5,flexWrap:"wrap",gap:3}}>
            <span>Obálka: <strong style={{color:"#F5EFE0"}}>€19 000 000</strong></span>
            <span>Vyč.: {fmt(budget.spent)} · Prir.: {fmt(budget.committed)} · Dost.: {fmt(budget.remaining)}</span>
          </div>
          <div style={{height:7,borderRadius:999,background:"rgba(255,255,255,.07)",display:"flex",overflow:"hidden"}}>
            <div style={{width:`${(budget.spent/19e6)*100}%`,background:"#5A9060",transition:"width .4s"}}/>
            <div style={{width:`${(budget.committed/19e6)*100}%`,background:gold,transition:"width .4s"}}/>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:2,margin:"16px 36px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
        {[["tasks","Zákazky"],["teams","Tímy"],["pool","Kmeňový fond"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",borderBottom:tab===k?`2px solid ${gold}`:"2px solid transparent",color:tab===k?"#F5EFE0":textMuted,padding:"9px 17px",fontSize:14,fontWeight:tab===k?600:400,cursor:"pointer",marginBottom:-1,fontFamily:"'Inter',sans-serif"}}>
            {l}{k==="pool"&&!user&&<Lock size={11} style={{marginLeft:5,verticalAlign:"middle"}}/>}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",padding:"12px 36px 0"}}>
        {(tab==="tasks"||tab==="teams")&&(
          <select value={regFilter} onChange={e=>setRegFilter(e.target.value)}
            style={{...IS,width:"auto",fontSize:12.5,padding:"7px 11px",background:"rgba(255,255,255,.06)",color:"#F5EFE0",border:"1px solid rgba(255,255,255,.1)"}}>
            <option value="all">Všetky kraje</option>
            {KRAJNAMES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        )}
        {tab==="tasks"&&(
          <select value={taskFilter} onChange={e=>setTaskFilter(e.target.value)}
            style={{...IS,width:"auto",fontSize:12.5,padding:"7px 11px",background:"rgba(255,255,255,.06)",color:"#F5EFE0",border:"1px solid rgba(255,255,255,.1)"}}>
            <option value="all">Všetky metódy</option>
            {Object.entries(PROC).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}
          </select>
        )}
        {user&&tab==="tasks"&&<Btn sm variant="gold" onClick={()=>setTaskFormOpen(true)} style={{marginLeft:"auto"}}><Flag size={13}/>Zadať výzvu</Btn>}
        {user&&tab==="teams"&&<Btn sm variant="teal" onClick={()=>openNewTeam(null)} style={{marginLeft:"auto"}}><Plus size={13}/>Nový tím</Btn>}
      </div>

      {/* CONTENT */}
      <div style={{padding:"13px 36px 56px"}}>
        {tab==="tasks"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:13}}>
            {filtTasks.length===0?<div style={{gridColumn:"1/-1",textAlign:"center",padding:28,color:textMuted}}>Žiadne výzvy.</div>
              :filtTasks.map(t=>(
                <TaskCard key={t.id} task={t} teams={teams} user={user}
                  claimingId={claimId}
                  onStartClaim={id=>setClaimId(id)} onCancelClaim={()=>setClaimId(null)}
                  onClaim={async(id,tid)=>{await persist("tasks",tasks.map(x=>x.id===id?{...x,status:"claimed",claimedTeamId:tid}:x),setTasks);setClaimId(null);}}
                  onAdvance={async(id,status)=>persist("tasks",tasks.map(x=>x.id===id?{...x,status}:x),setTasks)}
                  onDelete={async id=>persist("tasks",tasks.filter(x=>x.id!==id),setTasks)}/>
              ))}
          </div>
        )}
        {tab==="teams"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(245px,1fr))",gap:13}}>
            {filtTeams.map(t=>(
              <div key={t.id} style={{background:cream,color:"#1A2F48",borderRadius:13,overflow:"hidden",boxShadow:"0 2px 8px rgba(15,30,53,.08)",cursor:"pointer"}} onClick={()=>setTeamDetailId(t.id)}>
                <div style={{height:82,background:gfor(t.id),display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                  <span style={{fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:700,color:"rgba(255,255,255,.85)"}}>{ini(t.name)}</span>
                  {user&&(<div style={{position:"absolute",top:7,right:7}} onClick={e=>{e.stopPropagation();openEditTeam(t.id);}}><button style={{width:25,height:25,borderRadius:6,border:"none",background:"rgba(0,0,0,.4)",color:"#fff",cursor:"pointer",fontSize:11}}>✏</button></div>)}
                </div>
                <div style={{padding:"11px 13px"}}>
                  <div style={{fontSize:10.5,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:".04em",color:cardMuted,marginBottom:3}}>📍 {t.location} · {t.region.replace(" kraj","")}</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,marginBottom:7}}>{t.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <Chip color={teal} small><Briefcase size={10}/> {t.employees}</Chip>
                    <Chip color={coral} small><Clock size={10}/> {t.partTimers}</Chip>
                    <Chip color={gold} small><HeartHandshake size={10}/> {t.volunteers}</Chip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab==="pool"&&(!user?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"44px 0",gap:11}}>
            <Lock size={30} color={textMuted}/>
            <p style={{color:textMuted,fontSize:14}}>Kmeňový fond je pre prihlásených členov.</p>
            <Btn variant="teal" onClick={()=>setSignInOpen(true)}><LogIn size={14}/>Prihlásiť sa</Btn>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(205px,1fr))",gap:11}}>
            {pool.map(p=>(
              <div key={p.id} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:11,padding:"11px 13px",display:"flex",alignItems:"center",gap:9}}>
                <Av name={p.name} size={34}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
                  <div style={{fontSize:11.5,color:textMuted}}>{p.title}</div>
                  <div style={{fontSize:10.5,color:textMuted}}>{p.spec}</div>
                </div>
                <div style={{width:7,height:7,borderRadius:"50%",background:p.available?"#5A9060":coral,flexShrink:0}}/>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* SIGN IN */}
      <Modal open={signInOpen} onClose={()=>setSignInOpen(false)} width={340}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h3 style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,margin:0}}>Prihlásenie</h3>
          <button onClick={()=>setSignInOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:cardMuted,fontSize:19}}>✕</button>
        </div>
        <p style={{fontSize:12,color:cardMuted,marginBottom:12}}>Demo – akékoľvek meno odomkne zobrazenie pre člena.</p>
        <Fld label="Meno"><input style={IS} value={signInName} onChange={e=>setSignInName(e.target.value)} placeholder="Vaše meno"
          onKeyDown={e=>{if(e.key==="Enter"&&signInName.trim()){setUser(signInName.trim());setSignInOpen(false);setSignInName("");}}}/></Fld>
        <div style={{display:"flex",gap:10,marginTop:12}}>
          <Btn variant="outline" onClick={()=>setSignInOpen(false)} style={{flex:1,justifyContent:"center",color:"#1A2F48",border:"1px solid #DDD5C0"}}>Zrušiť</Btn>
          <Btn variant="teal" onClick={()=>{if(signInName.trim()){setUser(signInName.trim());setSignInOpen(false);setSignInName("");}}} style={{flex:1,justifyContent:"center"}} disabled={!signInName.trim()}>Prihlásiť</Btn>
        </div>
      </Modal>

      {/* TASK FORM */}
      <Modal open={taskFormOpen} onClose={()=>setTaskFormOpen(false)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
          <h3 style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,margin:0}}>Zadať výzvu</h3>
          <button onClick={()=>setTaskFormOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:cardMuted,fontSize:19}}>✕</button>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Fld label="Názov" row><input style={IS} value={tf.title} onChange={e=>setTf(p=>({...p,title:e.target.value}))} placeholder="Krátky názov"/></Fld>
          <Fld label="Kraj" row><select style={IS} value={tf.region} onChange={e=>setTf(p=>({...p,region:e.target.value}))}>{KRAJNAMES.map(r=><option key={r} value={r}>{r}</option>)}</select></Fld>
        </div>
        <Fld label="Popis"><textarea style={{...IS,resize:"vertical"}} rows={2} value={tf.desc} onChange={e=>setTf(p=>({...p,desc:e.target.value}))}/></Fld>
        <div style={{display:"flex",gap:10}}>
          <Fld label="Náklad (€)" row><input style={IS} type="number" min={0} value={tf.budget} onChange={e=>setTf(p=>({...p,budget:e.target.value}))}/></Fld>
          <Fld label="Kategória" row>
            <select style={IS} value={tf.cat} onChange={e=>setTf(p=>({...p,cat:e.target.value}))}>
              {["Logistika","ICT infraštruktúra","Kybernetická bezpečnosť","Vývoj softvéru","Dátové služby","Komunitné aktivity","Administratíva","Cloudové služby"].map(c=><option key={c}>{c}</option>)}
            </select>
          </Fld>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer",marginBottom:11}}>
          <input type="checkbox" checked={tf.inhouse} onChange={e=>setTf(p=>({...p,inhouse:e.target.checked}))}/> Vlastné kapacity (bez VO)
        </label>
        <div style={{background:`${pm.color}11`,border:`1px solid ${pm.color}44`,borderRadius:9,padding:"9px 13px",fontSize:12,color:"#1A2F48"}}>
          <strong style={{color:pm.color}}>{pm.label}</strong> · {pm.sub} · ⏱ {pm.tl}<br/>{pm.steps.join(" → ")}
          {NIS2C.includes(tf.cat)&&<div style={{color:"#7755AA",marginTop:3}}>🛡 NIS2</div>}
          {EUPLC.includes(tf.cat)&&<div style={{color:teal}}>📜 EUPL-2.1</div>}
        </div>
        <div style={{display:"flex",gap:10,marginTop:13}}>
          <Btn variant="outline" onClick={()=>setTaskFormOpen(false)} style={{flex:1,justifyContent:"center",color:"#1A2F48",border:"1px solid #DDD5C0"}}>Zrušiť</Btn>
          <Btn variant="gold" onClick={saveTask} style={{flex:1,justifyContent:"center"}} disabled={!tf.title.trim()}>Zadať</Btn>
        </div>
      </Modal>

      {/* TEAM FORM */}
      <Modal open={teamFormOpen} onClose={()=>setTeamFormOpen(false)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
          <h3 style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,margin:0}}>{editingTeamId?"Upraviť tím":"Nový tím"}</h3>
          <button onClick={()=>setTeamFormOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:cardMuted,fontSize:19}}>✕</button>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Fld label="Názov" row><input style={IS} value={ntf.name} onChange={e=>setNtf(p=>({...p,name:e.target.value}))}/></Fld>
          <Fld label="Lokalita" row><input style={IS} value={ntf.location} onChange={e=>setNtf(p=>({...p,location:e.target.value}))}/></Fld>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Fld label="Kraj" row><select style={IS} value={ntf.region} onChange={e=>setNtf(p=>({...p,region:e.target.value}))}>{KRAJNAMES.map(r=><option key={r} value={r}>{r}</option>)}</select></Fld>
          <Fld label="Popis" row><input style={IS} value={ntf.blurb} onChange={e=>setNtf(p=>({...p,blurb:e.target.value}))}/></Fld>
        </div>
        <div style={{display:"flex",gap:10}}>
          {[["employees","Zam."],["partTimers","Ext."],["volunteers","Dobr."]].map(([k,l])=>(
            <Fld key={k} label={l} row><input style={IS} type="number" min={0} value={ntf[k]} onChange={e=>setNtf(p=>({...p,[k]:e.target.value}))}/></Fld>
          ))}
        </div>
        <Fld label="GitLab URL"><input style={IS} value={ntf.gitlabUrl} onChange={e=>setNtf(p=>({...p,gitlabUrl:e.target.value}))} placeholder="https://gitlab.com/…"/></Fld>
        <div style={{display:"flex",gap:10,marginTop:13}}>
          <Btn variant="outline" onClick={()=>setTeamFormOpen(false)} style={{flex:1,justifyContent:"center",color:"#1A2F48",border:"1px solid #DDD5C0"}}>Zrušiť</Btn>
          <Btn variant="teal" onClick={saveTeam} style={{flex:1,justifyContent:"center"}} disabled={!ntf.name.trim()}>Uložiť</Btn>
        </div>
      </Modal>

      {/* TEAM DETAIL */}
      <Modal open={!!td} onClose={()=>setTeamDetailId(null)}>
        {td&&(
          <>
            <div style={{height:95,background:gfor(td.id),borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:13}}>
              <span style={{fontFamily:"'Fraunces',serif",fontSize:36,fontWeight:700,color:"rgba(255,255,255,.85)"}}>{ini(td.name)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
              <div>
                <div style={{fontSize:11,color:cardMuted,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:".04em"}}>📍 {td.location} · {td.region}</div>
                <h3 style={{fontFamily:"'Fraunces',serif",fontSize:19,fontWeight:700,margin:"3px 0"}}>{td.name}</h3>
              </div>
              <button onClick={()=>setTeamDetailId(null)} style={{background:"none",border:"none",cursor:"pointer",color:cardMuted,fontSize:19}}>✕</button>
            </div>
            {td.blurb&&<p style={{fontSize:13,color:cardMuted,marginBottom:11,lineHeight:1.5}}>{td.blurb}</p>}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              <Chip color={teal}><Briefcase size={11}/> {td.employees} zam.</Chip>
              <Chip color={coral}><Clock size={11}/> {td.partTimers} ext.</Chip>
              <Chip color={gold}><HeartHandshake size={11}/> {td.volunteers} dobr.</Chip>
            </div>
            {td.gitlabUrl&&<a href={td.gitlabUrl} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:teal,textDecoration:"none",fontWeight:600,marginBottom:12}}><GitBranch size={13}/>GitLab ↗</a>}
            <div style={{borderTop:"1px solid #DDD5C0",paddingTop:11}}>
              <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",color:cardMuted,marginBottom:7}}>Členovia & projekty</p>
              {user?td.members?.length?td.members.map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:9,background:"rgba(26,47,72,.05)",borderRadius:8,padding:"7px 9px",marginBottom:6}}>
                  <Av name={m.name} size={28}/>
                  <div><div style={{fontSize:12.5,fontWeight:600}}>{m.name}</div>
                  <div style={{fontSize:11,color:cardMuted}}>{m.role==="employees"?"Zamestnanec":m.role==="partTimers"?"Externista":"Dobrovoľník"} · {m.project||"—"}</div></div>
                </div>
              )):<p style={{fontSize:12.5,color:cardMuted}}>Žiadni členovia.</p>
              :<div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,color:cardMuted}}><Lock size={13}/>Prihláste sa pre zobrazenie členov.</div>}
            </div>
            {user&&(
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <Btn sm variant="outline" onClick={()=>{openEditTeam(td.id);setTeamDetailId(null);}} style={{color:"#1A2F48",border:"1px solid #DDD5C0"}}><Pencil size={12}/>Upraviť</Btn>
                <Btn sm variant="outline" onClick={async()=>{await persist("teams",teams.filter(t=>t.id!==td.id),setTeams);setTeamDetailId(null);}} style={{color:coral,border:"1px solid rgba(217,91,53,.25)"}}><Trash2 size={12}/>Odstrániť</Btn>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
