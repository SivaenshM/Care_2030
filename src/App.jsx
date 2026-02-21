import { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from "react";


import hospitalsData from "./data/hospitals.json";
const AppContext = createContext();
const useApp = () => useContext(AppContext);

const CITIES = ["Kanyakumari", "Tirunelveli", "Thoothukudi", "Madurai"];
const TAMIL = {
  "Care 2030": "கேர் 2030", "Trusted hospital visit assistance": "நம்பகமான மருத்துவமனை வருகை உதவி",
  "Book Assistance": "உதவி முன்பதிவு", "Elder Care": "முதியோர் பராமரிப்பு",
  "Pregnancy Care": "கர்ப்பகால பராமரிப்பு", "Services": "சேவைகள்", "Home": "முகப்பு",
  "Hospitals": "மருத்துவமனைகள்", "Book Now": "இப்போது முன்பதிவு", "Login": "உள்நுழைய",
  "Sign Up": "பதிவு செய்ய", "How It Works": "எப்படி செயல்படுகிறது",
};

const PROVIDERS = hospitalsData.providers.map((p) => {
  const hoursMatch = (p.doctorAvailability || "").match(/OP\s*[:\-]\s*([^\.\n]{3,60})/i);
  const hours = hoursMatch ? hoursMatch[1].trim() : "Call for timings";
  return {
    id: p.id,
    name: p.name,
    city: p.district,
    type: p.type,
    area: p.locality || (p.address ? p.address.split(",")[0] : ""),
    address: p.address,
    phone: p.phone,
    website: p.website,
    specialties: p.specialties || [],
    specialtiesText: p.specialtiesText || "",
    doctorAvailability: p.doctorAvailability || "",
    services: p.services || "",
    rating: typeof p.rating === "number" ? p.rating : null,
    ratingText: p.ratingText || "",
    reviewSummary: p.reviewSummary || "",
    meta: p.meta || "",
    ownership: p.ownership || "unknown",
    hours,
  };
});

// Doctor-level structured data is not available for every facility.
// We keep this array empty for now; the UI falls back to the "Doctor Availability" field.
const DOCTORS = [];

const PACKAGES = [
  { id:"transport",name:"Transport Only",desc:"We book a safe, reliable cab for your loved one's hospital visit",price:199,icon:"car",features:["Door-to-door cab via Uber/Ola","Real-time ride tracking shared with you","Comfortable, verified vehicles","SMS updates at pickup & drop-off"] },
  { id:"assistant",name:"Assistant + Care",desc:"A trained, compassionate caretaker who stays with your family member throughout",price:499,icon:"heart",features:["Verified & background-checked assistant","Fluent in Tamil & English","Stays from waiting room to consultation","Handles reports, prescriptions & billing","Updates you via WhatsApp in real-time"] },
  { id:"full",name:"Complete Peace of Mind",desc:"Everything handled — appointment, transport, and a caring assistant, end to end",price:799,icon:"shield",features:["Everything in Transport + Assistant","We book the doctor appointment for you","Priority scheduling assistance","Coordination with hospital staff","Post-visit summary shared with family"] },
];

const ADDONS = [
  { id:"wheelchair",name:"Wheelchair Assistance",price:150,icon:"\u267F",desc:"For patients with limited mobility" },
  { id:"multi-attend",name:"Extra Attendant",price:300,icon:"\uD83D\uDC65",desc:"Additional caretaker for complex visits" },
  { id:"pharmacy",name:"Pharmacy Pickup",price:100,icon:"\uD83D\uDC8A",desc:"We'll collect medicines after the visit" },
  { id:"lab-pickup",name:"Lab Report Pickup",price:200,icon:"\uD83D\uDCCB",desc:"We'll collect reports when ready" },
];

const TESTIMONIALS = [
  { name:"Lakshmi Anand",relation:"Daughter",city:"Kanyakumari",text:"Amma needs dialysis twice a week. I used to miss work every time. Now Care 2030's assistant takes her \u2014 and sends me updates throughout. It changed our lives.",rating:5,avatar:"\uD83D\uDC69" },
  { name:"Priya Sundaram",relation:"Expectant Mother",city:"Madurai",text:"My husband works in Chennai. Every scan appointment was stressful alone. My Care 2030 assistant was like having an older sister with me. So grateful.",rating:5,avatar:"\uD83E\uDD30" },
  { name:"Rajesh Kumar",relation:"Son",city:"Tirunelveli",text:"Appa is 78 and stubborn about going to the doctor alone. The assistant was patient, respectful, and Appa actually liked him. That's saying something!",rating:5,avatar:"\uD83D\uDC68" },
  { name:"Meena Raghavan",relation:"Daughter-in-law",city:"Thoothukudi",text:"My mother-in-law doesn't speak English and was anxious about her eye surgery. The Tamil-speaking assistant put her completely at ease.",rating:5,avatar:"\uD83D\uDC69" },
];

const t = (text, lang) => (lang === "ta" && TAMIL[text]) ? TAMIL[text] : text;
const genId = () => "BK" + Date.now().toString(36).toUpperCase();
const formatPrice = (p) => "\u20B9" + p.toLocaleString("en-IN");
const typeEmoji = { hospital: "\uD83C\uDFE5", clinic: "\uD83E\uDE7A", lab: "\uD83D\uDD2C" };

const useFadeIn = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); }}, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: "opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1)" }};
};

const I = ({ name, size = 20, color = "currentColor", strokeWidth = 1.8 }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", verticalAlign: "middle", flexShrink: 0 } };
  const icons = {
    calendar: <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    car: <svg {...p}><path d="M5 17h14v-5l-2-5H7L5 12v5zM7 17a2 2 0 100 4 2 2 0 000-4zM17 17a2 2 0 100 4 2 2 0 000-4z"/></svg>,
    hospital: <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>,
    user: <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    heart: <svg {...{...p, fill: color, stroke: "none"}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    heartLine: <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    shield: <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
    phone: <svg {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
    search: <svg {...p}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    check: <svg {...{...p, strokeWidth: 2.5}}><polyline points="20 6 9 17 4 12"/></svg>,
    arrow: <svg {...p}><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
    back: <svg {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
    menu: <svg {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    close: <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    map: <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    clock: <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    plus: <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    globe: <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    star: <svg {...{...p, fill: color, stroke: "none"}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    whatsapp: <svg {...{...p, fill: color, stroke: "none"}} viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    send: <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  };
  return icons[name] || null;
};


const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');
    :root {
      --bg: #FEFCF9; --bg2: #F7F3ED; --bg3: #EFE9DF;
      --teal: #1A6B5A; --teal-light: #E6F3EF; --teal-dark: #0E4A3D; --teal-glow: #2A9D7E;
      --coral: #D4715E; --coral-light: #FDF0EC; --coral-dark: #B5503F;
      --gold: #C49A3C; --gold-light: #FBF5E6;
      --text: #1F2D28; --text2: #4A5D54; --text3: #7D8F87; --text4: #A8B5AF;
      --white: #FFFFFF; --border: #E5DFD5; --border2: #D4CCC0;
      --shadow-sm: 0 1px 3px rgba(30,50,40,0.05); --shadow: 0 2px 12px rgba(30,50,40,0.07);
      --shadow-lg: 0 8px 32px rgba(30,50,40,0.1); --shadow-xl: 0 16px 48px rgba(30,50,40,0.12);
      --radius: 14px; --radius-lg: 20px; --radius-xl: 28px;
      --serif: 'Libre Baskerville', Georgia, serif;
      --sans: 'Outfit', system-ui, sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--sans); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
    ::selection { background: var(--teal-light); color: var(--teal-dark); }
    input, select, textarea, button { font-family: var(--sans); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .fade-up { animation: fadeUp 0.6s cubic-bezier(.16,1,.3,1) both; }
    .fade-up-d1 { animation-delay: 0.1s; }
    .fade-up-d2 { animation-delay: 0.2s; }
    .fade-up-d3 { animation-delay: 0.3s; }
    .fade-up-d4 { animation-delay: 0.4s; }
    @media (max-width: 768px) {
      .hide-mobile { display: none !important; }
      .show-mobile { display: flex !important; }
      .hero-grid { grid-template-columns: 1fr !important; }
      .grid-2 { grid-template-columns: 1fr !important; }
      .grid-3 { grid-template-columns: 1fr !important; }
      .grid-4 { grid-template-columns: 1fr 1fr !important; }
    }
    @media (min-width: 769px) { .show-mobile { display: none !important; } }
    a { text-decoration: none; color: inherit; }
    .card-hover { transition: transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s ease; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .btn-hover { transition: all 0.25s cubic-bezier(.16,1,.3,1); }
    .btn-hover:hover { transform: translateY(-2px); }
    .btn-hover:active { transform: translateY(0) scale(0.98); }

    /* Glassmorphism buttons + ripple/glow (performance-friendly) */
    .btn-ripple { position: relative; overflow: hidden; }
    .btn-ripple::after {
      content: ""; position: absolute; inset: -2px;
      background: radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.28), transparent 40%);
      opacity: 0; transition: opacity 220ms ease; pointer-events: none;
    }
    .btn-ripple:hover::after { opacity: 1; }
    .glass {
      background: rgba(255,255,255,0.14) !important;
      color: rgba(255,255,255,0.95) !important;
      border: 1px solid rgba(255,255,255,0.22) !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12) !important;
      backdrop-filter: blur(14px);
    }
    .glass-dark {
      background: rgba(26,107,90,0.16) !important;
      color: var(--teal-dark) !important;
      border: 1px solid rgba(26,107,90,0.20) !important;
      backdrop-filter: blur(14px);
    }
    .select-anim { transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease, border-color 0.2s ease; }
    .select-anim:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; scroll-behavior: auto !important; }
    }

    input:focus, select:focus { outline: none; border-color: var(--teal) !important; box-shadow: 0 0 0 3px rgba(26,107,90,0.12); }
    .grain { position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:9999;opacity:0.018;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  `}</style>
);

const Btn = ({ children, variant = "primary", onClick, style, disabled, full, className="" }) => {
  const base = { display:"inline-flex",alignItems:"center",gap:10,padding:"13px 26px",borderRadius:12,fontWeight:600,fontSize:15,cursor:"pointer",border:"none",fontFamily:"var(--sans)",letterSpacing:"-0.01em",lineHeight:1 };
  const vars = {
    primary: { background:"var(--teal)",color:"var(--white)" },
    accent: { background:"var(--coral)",color:"var(--white)" },
    outline: { background:"transparent",color:"var(--teal)",border:"2px solid var(--teal)" },
    ghost: { background:"transparent",color:"var(--text2)",padding:"10px 16px" },
    soft: { background:"var(--teal-light)",color:"var(--teal)" },
    whatsapp: { background:"#25D366",color:"var(--white)" },
    white: { background:"var(--white)",color:"var(--teal)",boxShadow:"var(--shadow-sm)" },
    glass: { background:"rgba(255,255,255,0.14)",color:"rgba(255,255,255,0.95)",border:"1px solid rgba(255,255,255,0.22)",backdropFilter:"blur(14px)" },
    glassDark: { background:"rgba(255,255,255,0.68)",color:"var(--teal-dark)",border:"1px solid rgba(255,255,255,0.9)",backdropFilter:"blur(14px)",boxShadow:"var(--shadow-sm)" },
  };
  return <button onClick={onClick} disabled={disabled} className={"btn-hover " + className} style={{...base,...vars[variant],...(full?{width:"100%",justifyContent:"center"}:{}), ...(disabled?{opacity:0.45,cursor:"not-allowed",transform:"none"}:{}), ...style}}>{children}</button>;
};

const Card = ({ children, style, onClick, className="" }) => (
  <div onClick={onClick} className={"card-hover " + className} style={{ background:"var(--white)",borderRadius:"var(--radius-lg)",padding:28,boxShadow:"var(--shadow-sm)",border:"1px solid var(--border)",cursor:onClick?"pointer":"default", ...style }}>{children}</div>
);

const Badge = ({ children, bg="var(--teal-light)", color="var(--teal)", style }) => (
  <span style={{ display:"inline-flex",alignItems:"center",padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700,background:bg,color,letterSpacing:"0.02em",...style }}>{children}</span>
);

const Stars = ({ rating, size = 14 }) => {
  if (rating == null || Number.isNaN(rating)) {
    return <span style={{ fontSize: size - 1, fontWeight: 700, color: "var(--text4)" }}>No rating</span>;
  }
  return (
    <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <I key={i} name="star" size={size} color={i <= Math.round(rating) ? "#E8A838" : "var(--border)"} />
      ))}
      <span style={{ fontSize: size - 1, fontWeight: 700, color: "var(--text2)", marginLeft: 4 }}>{rating}</span>
    </span>
  );
};

const Input = ({ label, error, style: inputStyle, ...props }) => (
  <div style={{ marginBottom:18 }}>
    {label && <label style={{ display:"block",fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:7 }}>{label}</label>}
    <input {...props} style={{ width:"100%",padding:"13px 16px",borderRadius:12,border:"1.5px solid " + (error?"var(--coral)":"var(--border)"),fontSize:15,background:"var(--white)",color:"var(--text)",transition:"all 0.2s",boxSizing:"border-box",fontFamily:"var(--sans)", ...inputStyle }} />
    {error && <span style={{ fontSize:12,color:"var(--coral)",marginTop:4,display:"block" }}>{error}</span>}
  </div>
);

const Select = ({ label, options, value, onChange, error }) => (
  <div style={{ marginBottom:18 }}>
    {label && <label style={{ display:"block",fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:7 }}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:"100%",padding:"13px 16px",borderRadius:12,border:"1.5px solid " + (error?"var(--coral)":"var(--border)"),fontSize:15,background:"var(--white)",color:"var(--text)",cursor:"pointer",boxSizing:"border-box",fontFamily:"var(--sans)",appearance:"auto" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Section = ({ children, style, bg, id }) => (
  <section id={id} style={{ padding:"80px 24px",background:bg||"transparent",...style }}>
    <div style={{ maxWidth:1120,margin:"0 auto" }}>{children}</div>
  </section>
);

const SectionLabel = ({ children }) => (
  <div style={{ display:"inline-flex",alignItems:"center",gap:8,marginBottom:14 }}>
    <div style={{ width:24,height:2,background:"var(--teal)",borderRadius:1 }} />
    <span style={{ fontSize:13,fontWeight:700,color:"var(--teal)",textTransform:"uppercase",letterSpacing:"0.08em" }}>{children}</span>
  </div>
);

const SectionTitle = ({ children, sub, align="center" }) => (
  <div style={{ textAlign:align,marginBottom:48 }}>
    <h2 style={{ fontSize:"clamp(26px, 4vw, 38px)",fontWeight:700,color:"var(--text)",fontFamily:"var(--serif)",lineHeight:1.25,letterSpacing:"-0.02em" }}>{children}</h2>
    {sub && <p style={{ color:"var(--text3)",marginTop:12,fontSize:17,lineHeight:1.6,maxWidth:560,margin:align==="center"?"12px auto 0":"12px 0 0" }}>{sub}</p>}
  </div>
);

const StepBar = ({ steps, current }) => (
  <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:36,flexWrap:"wrap",padding:"0 8px" }}>
    {steps.map((s,i) => (
      <div key={i} style={{ display:"flex",alignItems:"center" }}>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:56 }}>
          <div style={{ width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:i<current?"var(--teal)":i===current?"var(--coral)":"var(--bg3)",color:i<=current?"var(--white)":"var(--text4)",fontSize:14,fontWeight:700,transition:"all 0.4s cubic-bezier(.16,1,.3,1)",boxShadow:i===current?"0 0 0 4px var(--coral-light)":"none" }}>
            {i<current?"\u2713":i+1}
          </div>
          <span style={{ fontSize:11,color:i<=current?"var(--teal)":"var(--text4)",fontWeight:i===current?700:500,textAlign:"center",maxWidth:64,lineHeight:1.2 }}>{s}</span>
        </div>
        {i < steps.length - 1 && <div style={{ width:24,height:2,background:i<current?"var(--teal)":"var(--bg3)",margin:"0 2px",marginBottom:20,transition:"all 0.4s",borderRadius:1 }} />}
      </div>
    ))}
  </div>
);

const Navbar = () => {
  const { page, setPage, city, setCity, lang, setLang, user } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 10); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  const links = [{label:t("Home",lang),p:"/"},{label:t("Services",lang),p:"/services"},{label:t("Hospitals",lang),p:"/providers"},{label:t("Book Now",lang),p:"/book"}];
  const isActive = (lp) => lp === "/" ? page === "/" : page.startsWith(lp);
  return (
    <nav style={{ position:"sticky",top:0,zIndex:100,background:scrolled?"rgba(254,252,249,0.92)":"rgba(254,252,249,0.98)",backdropFilter:"blur(16px)",borderBottom:"1px solid " + (scrolled?"var(--border)":"transparent"),transition:"all 0.3s",padding:"0 24px" }}>
      <div style={{ maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:68 }}>
        <div style={{ display:"flex",alignItems:"center",gap:3,cursor:"pointer" }} onClick={() => setPage("/")}>
          <I name="heart" size={22} color="var(--coral)" />
          <span style={{ fontSize:22,fontWeight:700,color:"var(--teal-dark)",fontFamily:"var(--serif)",marginLeft:6 }}>Care</span>
          <span style={{ fontSize:13,fontWeight:700,color:"var(--white)",background:"var(--coral)",borderRadius:6,padding:"2px 7px",marginTop:1 }}>2030</span>
        </div>
        <div className="hide-mobile" style={{ display:"flex",alignItems:"center",gap:4 }}>
          {links.map(l => <button key={l.p} onClick={() => setPage(l.p)} style={{ background:isActive(l.p)?"var(--teal-light)":"transparent",color:isActive(l.p)?"var(--teal)":"var(--text2)",border:"none",padding:"8px 16px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"var(--sans)",transition:"all 0.2s" }}>{l.label}</button>)}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <select value={city} onChange={e => setCity(e.target.value)} style={{ border:"1.5px solid var(--border)",borderRadius:10,padding:"7px 10px",fontSize:13,background:"var(--white)",color:"var(--text)",fontFamily:"var(--sans)",cursor:"pointer",maxWidth:115 }}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => setLang(lang==="en"?"ta":"en")} style={{ border:"1.5px solid var(--border)",borderRadius:10,padding:"7px 10px",fontSize:13,background:"var(--white)",cursor:"pointer",fontFamily:"var(--sans)",color:"var(--text)",fontWeight:600,display:"flex",alignItems:"center",gap:4 }}>
            <I name="globe" size={14} />{lang==="en"?"\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD":"EN"}
          </button>
          {user ? (
            <button onClick={() => setPage("/account")} style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--teal),var(--teal-glow))",color:"var(--white)",border:"none",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"var(--sans)" }}>{(user.name||"U").charAt(0).toUpperCase()}</button>
          ) : (
            <Btn variant="primary" onClick={() => setPage("/login")} style={{ padding:"8px 18px",fontSize:13 }} className="hide-mobile">{t("Login",lang)}</Btn>
          )}
          <button onClick={() => setOpen(!open)} className="show-mobile" style={{ display:"none",border:"none",background:"none",cursor:"pointer",color:"var(--text)",padding:4 }}><I name={open?"close":"menu"} size={24} /></button>
        </div>
      </div>
      {open && <div style={{ padding:"8px 0 16px",display:"flex",flexDirection:"column",gap:2 }}>
        {links.map(l => <button key={l.p} onClick={() => { setPage(l.p); setOpen(false); }} style={{ background:isActive(l.p)?"var(--teal-light)":"transparent",color:isActive(l.p)?"var(--teal)":"var(--text)",border:"none",textAlign:"left",padding:"14px 16px",borderRadius:12,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:"var(--sans)" }}>{l.label}</button>)}
        {!user && <Btn variant="primary" onClick={() => { setPage("/login"); setOpen(false); }} full style={{ marginTop:8 }}>{t("Login",lang)}</Btn>}
      </div>}
    </nav>
  );
};

const Footer = () => {
  const { setPage } = useApp();
  return (
    <footer style={{ background:"var(--teal-dark)",color:"rgba(255,255,255,0.85)",padding:"56px 24px 28px" }}>
      <div style={{ maxWidth:1120,margin:"0 auto" }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:36,marginBottom:36 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:16 }}>
              <I name="heart" size={18} color="var(--coral)" />
              <span style={{ fontSize:20,fontWeight:700,color:"#fff",fontFamily:"var(--serif)" }}>Care</span>
              <span style={{ background:"var(--coral)",color:"#fff",borderRadius:5,padding:"1px 6px",fontSize:12,fontWeight:700 }}>2030</span>
            </div>
            <p style={{ fontSize:14,lineHeight:1.7,opacity:0.75 }}>Making hospital visits worry-free for families across South Tamil Nadu. Because your loved ones deserve care, even when you can't be there.</p>
          </div>
          <div>
            <h4 style={{ color:"#fff",fontSize:12,fontWeight:700,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.1em" }}>Navigate</h4>
            {[["Home","/"],["Services","/services"],["Hospitals","/providers"],["Book Now","/book"],["My Account","/account"]].map(([l,p]) => (
              <div key={p}><a onClick={() => setPage(p)} style={{ color:"rgba(255,255,255,0.65)",fontSize:14,cursor:"pointer",lineHeight:2.4 }}>{l}</a></div>
            ))}
          </div>
          <div>
            <h4 style={{ color:"#fff",fontSize:12,fontWeight:700,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.1em" }}>Service Areas</h4>
            {CITIES.map(c => <div key={c} style={{ fontSize:14,lineHeight:2.4,opacity:0.65,display:"flex",alignItems:"center",gap:6 }}><I name="map" size={12} color="rgba(255,255,255,0.4)" />{c}</div>)}
          </div>
          <div>
            <h4 style={{ color:"#fff",fontSize:12,fontWeight:700,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.1em" }}>Contact Us</h4>
            <a href="tel:+919876543210" style={{ display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,0.75)",fontSize:14,marginBottom:12 }}><I name="phone" size={16} /> +91 98765 43210</a>
            <a href="https://wa.me/919876543210" style={{ display:"flex",alignItems:"center",gap:8,color:"#25D366",fontSize:14,fontWeight:600 }}><I name="whatsapp" size={16} color="#25D366" /> WhatsApp Us</a>
          </div>
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.12)",paddingTop:20,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,fontSize:13,opacity:0.5 }}>
          <span>&copy; 2025 Care 2030. Built with love for South Tamil Nadu.</span>
          <span>Privacy Policy &middot; Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};

const HomePage = () => {
  const { setPage, city, lang } = useApp();
  const f1 = useFadeIn(), f2 = useFadeIn(), f3 = useFadeIn(), f4 = useFadeIn(), f5 = useFadeIn();
  return <div>
    <section style={{ background:"linear-gradient(165deg, var(--teal-dark) 0%, var(--teal) 40%, #1D8A6F 100%)",color:"#fff",padding:"0 24px",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:-120,right:-80,width:450,height:450,borderRadius:"50%",background:"rgba(255,255,255,0.04)" }} />
      <div style={{ position:"absolute",bottom:-40,left:"10%",width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.03)" }} />
      <div style={{ position:"absolute",top:"50%",right:"15%",width:12,height:12,borderRadius:"50%",background:"rgba(255,255,255,0.1)",animation:"float 4s ease-in-out infinite" }} />
      <div className="hero-grid" style={{ maxWidth:1120,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"center",minHeight:520,paddingTop:40,paddingBottom:40,position:"relative",zIndex:1 }}>
        <div>
          <div className="fade-up" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.12)",borderRadius:20,padding:"6px 16px",marginBottom:20 }}>
            <I name="map" size={14} color="rgba(255,255,255,0.7)" />
            <span style={{ fontSize:13,fontWeight:600,opacity:0.9 }}>Serving {city} & South Tamil Nadu</span>
          </div>
          <h1 className="fade-up fade-up-d1" style={{ fontSize:"clamp(34px, 5.5vw, 52px)",fontWeight:700,lineHeight:1.15,fontFamily:"var(--serif)",letterSpacing:"-0.02em",marginBottom:20 }}>
            When you can't be there,<br/><span style={{ color:"#7DDEC5" }}>we will.</span>
          </h1>
          <p className="fade-up fade-up-d2" style={{ fontSize:18,lineHeight:1.7,opacity:0.88,maxWidth:480,marginBottom:36 }}>
            Trusted companions who take your parents to the doctor and support expectant mothers through every hospital visit — so you never have to worry.
          </p>
          <div className="fade-up fade-up-d3" style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            <Btn variant="accent" onClick={() => setPage("/book")} style={{ padding:"15px 30px",fontSize:16,borderRadius:14,boxShadow:"0 4px 20px rgba(212,113,94,0.35)" }}>
              {t("Book Assistance",lang)} <I name="arrow" size={18} color="#fff" />
            </Btn>
            <Btn variant="glass" className="glass btn-hover" style={{ padding:"15px 24px",fontSize:16,borderRadius:14 }}>
              <I name="whatsapp" size={18} color="#25D366" /> WhatsApp
            </Btn>
          </div>
          <div className="fade-up fade-up-d4" style={{ display:"flex",alignItems:"center",gap:16,marginTop:36,paddingTop:28,borderTop:"1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ display:"flex" }}>
              {["\uD83D\uDC69","\uD83D\uDC68","\uD83E\uDDD5","\uD83D\uDC74"].map((e,i) => (
                <div key={i} style={{ width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.15)",border:"2px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginLeft:i?-8:0 }}>{e}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:14,fontWeight:700 }}>500+ families trust us</div>
              <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                {[1,2,3,4,5].map(i => <I key={i} name="star" size={12} color="#E8A838" />)}
                <span style={{ fontSize:12,opacity:0.7,marginLeft:4 }}>4.8 average</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hide-mobile fade-up fade-up-d2" style={{ display:"flex",justifyContent:"center" }}>
          <div style={{ background:"rgba(255,255,255,0.08)",borderRadius:28,padding:32,backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.1)",maxWidth:380 }}>
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              {[{emoji:"\uD83D\uDC74\uD83C\uDFFD",title:"Appa's cardiologist visit",sub:"Tomorrow, 10:30 AM",tag:"Assistant assigned",tagColor:"#7DDEC5"},
                {emoji:"\uD83E\uDD30\uD83C\uDFFD",title:"Prenatal scan \u2014 Week 28",sub:"Thursday, 9:00 AM",tag:"Transport booked",tagColor:"#E8A838"}
              ].map((item,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.1)",borderRadius:16,padding:16,display:"flex",gap:14,alignItems:"flex-start" }}>
                  <span style={{ fontSize:32,lineHeight:1 }}>{item.emoji}</span>
                  <div>
                    <div style={{ fontWeight:600,fontSize:14,marginBottom:2 }}>{item.title}</div>
                    <div style={{ fontSize:12,opacity:0.7 }}>{item.sub}</div>
                    <div style={{ marginTop:8,display:"inline-flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.12)",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:600 }}>
                      <div style={{ width:6,height:6,borderRadius:"50%",background:item.tagColor }} />{item.tag}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ background:"rgba(255,255,255,0.06)",borderRadius:12,padding:12,textAlign:"center",fontSize:13,opacity:0.7,fontStyle:"italic" }}>
                "Amma reached the hospital safely. The assistant is with her now." — 2 min ago
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section style={{ padding:"20px 24px",background:"var(--bg)",borderBottom:"1px solid var(--border)" }}>
      <div style={{ maxWidth:1120,margin:"0 auto",display:"flex",justifyContent:"center",gap:32,flexWrap:"wrap" }}>
        {[{icon:"shield",label:"Verified & Background-Checked"},{icon:"hospital",label:"Partner Hospitals"},{icon:"heartLine",label:"Trusted by 500+ Families"},{icon:"phone",label:"24/7 Support"}].map((item,i) => (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600,color:"var(--text3)" }}>
            <I name={item.icon} size={17} color="var(--teal)" /> {item.label}
          </div>
        ))}
      </div>
    </section>

    <div ref={f1.ref} style={f1.style}>
    <Section>
      <div style={{ textAlign:"center",marginBottom:48 }}><SectionLabel>Who We Help</SectionLabel>
        <SectionTitle sub="We step in when you can't be physically there \u2014 so your loved ones are never alone.">Your family is in safe hands</SectionTitle>
      </div>
      <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:24 }}>
        {[{emoji:"\uD83D\uDC74\uD83C\uDFFD",title:t("Elder Care",lang),desc:"Your parents need a check-up, but you're at work 200km away. Our trained assistant picks them up, accompanies them through the entire visit, and keeps you updated \u2014 like family would.",color:"var(--teal)",bg:"linear-gradient(135deg,var(--teal-light),#D5EDE7)",features:["Door-to-door accompaniment","Medication & report management","Real-time WhatsApp updates to you","Patient, respectful, Tamil-speaking"]},
          {emoji:"\uD83E\uDD30\uD83C\uDFFD",title:t("Pregnancy Care",lang),desc:"Every scan, every blood test, every anxious wait \u2014 our assistant sits beside her, handles the paperwork, asks the right questions, and makes sure she feels supported.",color:"var(--coral)",bg:"linear-gradient(135deg,var(--coral-light),#FAE0DA)",features:["Scan & test appointment support","Comfortable transport arranged","Emotional and practical support","Summary of doctor's advice sent to family"]}
        ].map((s,i) => (
          <Card key={i} style={{ padding:0,overflow:"hidden",border:"none",boxShadow:"var(--shadow)" }}>
            <div style={{ background:s.bg,padding:"36px 32px 28px" }}>
              <span style={{ fontSize:48,display:"block",marginBottom:12,filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.1))" }}>{s.emoji}</span>
              <h3 style={{ fontSize:22,fontWeight:700,color:"var(--text)",fontFamily:"var(--serif)",marginBottom:8 }}>{s.title}</h3>
              <p style={{ fontSize:15,color:"var(--text2)",lineHeight:1.65 }}>{s.desc}</p>
            </div>
            <div style={{ padding:"24px 32px 32px" }}>
              {s.features.map((f,j) => <div key={j} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 0",fontSize:14,color:"var(--text2)" }}><I name="check" size={15} color={s.color} /> {f}</div>)}
              <Btn variant="soft" onClick={() => setPage("/book")} full style={{ marginTop:16,background:i===0?"var(--teal-light)":"var(--coral-light)",color:i===0?"var(--teal)":"var(--coral)" }}>
                Book for {i===0?"Elder":"Pregnancy"} Care <I name="arrow" size={16} />
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </Section>
    </div>

    <div ref={f2.ref} style={f2.style}>
    <Section bg="var(--bg2)">
      <div style={{ textAlign:"center",marginBottom:48 }}><SectionLabel>How It Works</SectionLabel>
        <SectionTitle sub="Three simple steps. That's it.">Booking care takes 2 minutes</SectionTitle>
      </div>
      <div className="grid-3" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:28 }}>
        {[{num:"01",title:"Tell us who needs care",desc:"Select the city, the type of visit (doctor / scan / test), and any special needs like wheelchair or language preference.",icon:"send"},
          {num:"02",title:"We set everything up",desc:"We book the appointment, arrange a comfortable cab, and assign a trained, verified assistant who matches your preferences.",icon:"calendar"},
          {num:"03",title:"Stay updated, stay relaxed",desc:"From pickup to homecoming, your assistant sends you WhatsApp updates. You'll know every step, even from far away.",icon:"heartLine"}
        ].map((s,i) => (
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ width:64,height:64,borderRadius:20,background:i===2?"linear-gradient(135deg,var(--coral),var(--coral-dark))":"linear-gradient(135deg,var(--teal),var(--teal-glow))",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:i===2?"0 6px 24px rgba(212,113,94,0.3)":"0 6px 24px rgba(26,107,90,0.25)" }}>
              <I name={s.icon} size={26} color="#fff" />
            </div>
            <span style={{ fontSize:12,fontWeight:700,color:"var(--text4)",letterSpacing:"0.08em" }}>{s.num}</span>
            <h3 style={{ fontSize:18,fontWeight:700,color:"var(--text)",margin:"6px 0 8px",fontFamily:"var(--serif)" }}>{s.title}</h3>
            <p style={{ fontSize:14,color:"var(--text3)",lineHeight:1.65 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </Section>
    </div>

    <div ref={f3.ref} style={f3.style}>
    <Section>
      <div style={{ textAlign:"center",marginBottom:48 }}><SectionLabel>Services</SectionLabel>
        <SectionTitle sub="Choose what fits your situation. Every package includes our promise of care.">Flexible packages for every need</SectionTitle>
      </div>
      <div className="grid-3" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20 }}>
        {PACKAGES.map((pkg,i) => (
          <Card key={pkg.id} onClick={() => setPage("/services")} style={{ padding:0,overflow:"hidden",position:"relative",border:i===2?"2px solid var(--teal)":"1px solid var(--border)" }}>
            {i === 2 && <div style={{ position:"absolute",top:16,right:16 }}><Badge bg="var(--coral)" color="#fff">Recommended</Badge></div>}
            <div style={{ padding:"28px 28px 0" }}>
              <div style={{ width:48,height:48,borderRadius:14,background:i===2?"var(--teal-light)":i===1?"var(--coral-light)":"var(--gold-light)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}>
                <I name={pkg.icon} size={24} color={i===2?"var(--teal)":i===1?"var(--coral)":"var(--gold)"} />
              </div>
              <h3 style={{ fontSize:19,fontWeight:700,color:"var(--text)",fontFamily:"var(--serif)",marginBottom:6 }}>{pkg.name}</h3>
              <p style={{ fontSize:14,color:"var(--text3)",lineHeight:1.6,marginBottom:16 }}>{pkg.desc}</p>
              <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:20 }}>
                <span style={{ fontSize:32,fontWeight:700,color:"var(--teal)",fontFamily:"var(--serif)" }}>{formatPrice(pkg.price)}</span>
                <span style={{ fontSize:13,color:"var(--text4)" }}>/ visit</span>
              </div>
            </div>
            <div style={{ padding:"0 28px 28px" }}>
              {pkg.features.map((f,j) => <div key={j} style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0",fontSize:13,color:"var(--text2)" }}><I name="check" size={14} color="var(--teal)" /> <span>{f}</span></div>)}
              <Btn variant={i===2?"primary":"outline"} onClick={(e) => {e.stopPropagation(); setPage("/book");}} full style={{ marginTop:16 }}>
                Choose This <I name="arrow" size={16} color={i===2?"#fff":"var(--teal)"} />
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </Section>
    </div>

    <div ref={f4.ref} style={f4.style}>
    <Section bg="var(--bg2)">
      <div style={{ textAlign:"center",marginBottom:48 }}><SectionLabel>Partner Network</SectionLabel>
        <SectionTitle sub={"Verified hospitals, clinics, and labs in " + city}>Hospitals that know us</SectionTitle>
      </div>
      <div className="grid-4" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16 }}>
        {PROVIDERS.filter(p => p.city === city).slice(0,4).map(p => (
          <Card key={p.id} onClick={() => setPage("/providers/" + p.id)} style={{ padding:20,textAlign:"center" }}>
            <span style={{ fontSize:36,display:"block",marginBottom:10 }}>{typeEmoji[p.type]}</span>
            <h4 style={{ fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:4,lineHeight:1.3 }}>{p.name}</h4>
            <p style={{ fontSize:12,color:"var(--text3)",marginBottom:6 }}>{p.area}</p>
            <Stars rating={p.rating} size={11} />
          </Card>
        ))}
      </div>
      <div style={{ textAlign:"center",marginTop:24 }}>
        <Btn variant="outline" onClick={() => setPage("/providers")}>View All Providers <I name="arrow" size={16} /></Btn>
      </div>
    </Section>
    </div>

    <div ref={f5.ref} style={f5.style}>
    <Section>
      <div style={{ textAlign:"center",marginBottom:48 }}><SectionLabel>Real Stories</SectionLabel>
        <SectionTitle sub="From families just like yours">Why families trust Care 2030</SectionTitle>
      </div>
      <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
        {TESTIMONIALS.map((tm,i) => (
          <Card key={i} style={{ padding:28,borderLeft:"4px solid " + (i%2===0?"var(--teal)":"var(--coral)"),borderRadius:"4px 20px 20px 4px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
              <div style={{ width:44,height:44,borderRadius:"50%",background:i%2===0?"var(--teal-light)":"var(--coral-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{tm.avatar}</div>
              <div>
                <div style={{ fontWeight:700,fontSize:15,color:"var(--text)" }}>{tm.name}</div>
                <div style={{ fontSize:12,color:"var(--text3)" }}>{tm.relation} &middot; {tm.city}</div>
              </div>
              <div style={{ marginLeft:"auto" }}><Stars rating={tm.rating} size={12} /></div>
            </div>
            <p style={{ fontSize:15,color:"var(--text2)",lineHeight:1.7,fontStyle:"italic" }}>"{tm.text}"</p>
          </Card>
        ))}
      </div>
    </Section>
    </div>

    <section style={{ background:"linear-gradient(135deg, var(--teal-dark) 0%, var(--teal) 100%)",padding:"72px 24px",textAlign:"center",color:"#fff",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:-60,right:-60,width:300,height:300,borderRadius:"50%",background:"rgba(255,255,255,0.04)" }} />
      <div style={{ maxWidth:560,margin:"0 auto",position:"relative",zIndex:1 }}>
        <span style={{ fontSize:40,display:"block",marginBottom:16 }}>{"\uD83E\uDD1D"}</span>
        <h2 style={{ fontSize:"clamp(24px,4vw,34px)",fontWeight:700,fontFamily:"var(--serif)",marginBottom:14,lineHeight:1.3 }}>Your loved one has a hospital visit coming up?</h2>
        <p style={{ fontSize:17,opacity:0.85,marginBottom:32,lineHeight:1.6 }}>Let us handle it. Book a caring assistant in under 2 minutes.</p>
        <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
          <Btn variant="accent" onClick={() => setPage("/book")} style={{ padding:"15px 32px",fontSize:16,borderRadius:14,boxShadow:"0 4px 20px rgba(212,113,94,0.4)" }}>
            {t("Book Assistance",lang)} <I name="arrow" size={18} color="#fff" />
          </Btn>
          <Btn variant="white" style={{ padding:"15px 24px",fontSize:16,borderRadius:14 }}><I name="phone" size={18} color="var(--teal)" /> Call Us</Btn>
        </div>
      </div>
    </section>
  </div>;
};

const ServicesPage = () => {
  const { setPage, lang } = useApp();
  return <div>
    <Section>
      <SectionLabel>Packages</SectionLabel>
      <SectionTitle align="left" sub="Transparent pricing. No hidden charges. Pay after the visit.">Choose your level of support</SectionTitle>
      <div className="grid-3" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24 }}>
        {PACKAGES.map((pkg,i) => (
          <Card key={pkg.id} style={{ padding:32,position:"relative",border:i===2?"2px solid var(--teal)":"1px solid var(--border)" }}>
            {i===2 && <Badge bg="var(--coral)" color="#fff" style={{ position:"absolute",top:-12,right:20 }}>Most Popular</Badge>}
            <div style={{ width:52,height:52,borderRadius:16,background:i===2?"var(--teal-light)":i===1?"var(--coral-light)":"var(--gold-light)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20 }}>
              <I name={pkg.icon} size={24} color={i===2?"var(--teal)":i===1?"var(--coral)":"var(--gold)"} />
            </div>
            <h3 style={{ fontSize:20,fontWeight:700,color:"var(--text)",fontFamily:"var(--serif)",marginBottom:8 }}>{pkg.name}</h3>
            <p style={{ fontSize:14,color:"var(--text3)",lineHeight:1.6,marginBottom:20 }}>{pkg.desc}</p>
            <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:20 }}>
              <span style={{ fontSize:36,fontWeight:700,color:"var(--teal)",fontFamily:"var(--serif)" }}>{formatPrice(pkg.price)}</span>
              <span style={{ fontSize:13,color:"var(--text4)" }}>starting / visit</span>
            </div>
            <div style={{ borderTop:"1px solid var(--border)",paddingTop:16,marginBottom:20 }}>
              {pkg.features.map((f,j) => <div key={j} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"6px 0",fontSize:14,color:"var(--text2)" }}><I name="check" size={15} color="var(--teal)" style={{ marginTop:2,flexShrink:0 }} /> {f}</div>)}
            </div>
            <Btn variant={i===2?"primary":"outline"} onClick={() => setPage("/book")} full>{t("Book Now",lang)} <I name="arrow" size={16} color={i===2?"#fff":"var(--teal)"} /></Btn>
          </Card>
        ))}
      </div>
    </Section>
    <Section bg="var(--bg2)">
      <SectionLabel>Add-Ons</SectionLabel>
      <SectionTitle align="left" sub="Customize any package with these extras">Additional services</SectionTitle>
      <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        {ADDONS.map(a => (
          <Card key={a.id} style={{ padding:22,display:"flex",alignItems:"center",gap:16 }}>
            <span style={{ fontSize:32,width:52,height:52,borderRadius:14,background:"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center" }}>{a.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,fontSize:15,color:"var(--text)",marginBottom:2 }}>{a.name}</div>
              <div style={{ fontSize:13,color:"var(--text3)" }}>{a.desc}</div>
            </div>
            <span style={{ fontWeight:700,color:"var(--teal)",fontSize:16,fontFamily:"var(--serif)",whiteSpace:"nowrap" }}>+{formatPrice(a.price)}</span>
          </Card>
        ))}
      </div>
    </Section>
    <section style={{ background:"linear-gradient(135deg,var(--coral) 0%,var(--coral-dark) 100%)",padding:"56px 24px",textAlign:"center",color:"#fff" }}>
      <h2 style={{ fontSize:26,fontWeight:700,fontFamily:"var(--serif)",marginBottom:12 }}>Ready to take care of your family?</h2>
      <p style={{ opacity:0.9,marginBottom:28,fontSize:16 }}>Our team is standing by. Book in under 2 minutes.</p>
      <Btn variant="white" onClick={() => setPage("/book")} style={{ color:"var(--coral)" }}>Start Booking <I name="arrow" size={16} color="var(--coral)" /></Btn>
    </section>
  </div>;
};

const ProvidersPage = () => {
  const { city, setPage } = useApp();
  const [fc, setFc] = useState(city);
  const [ft, setFt] = useState("all");
  const [fs, setFs] = useState("all");
  const [q, setQ] = useState("");

  const specialtyOptions = useMemo(() => {
    const set = new Set();
    PROVIDERS.forEach(p => (p.specialties || []).forEach(s => set.add(s)));
    return Array.from(set).sort((a,b) => a.localeCompare(b));
  }, []);

  const qq = q.trim().toLowerCase();
  const filtered = PROVIDERS.filter(p => {
    const matchesCity = (fc === "all" || p.city === fc);
    const matchesType = (ft === "all" || p.type === ft);
    const matchesSpec = (fs === "all" || (p.specialties || []).some(s => s.toLowerCase() === fs.toLowerCase()) || (p.specialtiesText || "").toLowerCase().includes(fs.toLowerCase()));
    const hay = (p.name + " " + (p.area || "") + " " + (p.address || "") + " " + (p.specialtiesText || "")).toLowerCase();
    const matchesQuery = !qq || hay.includes(qq);
    return matchesCity && matchesType && matchesSpec && matchesQuery;
  });

  // Doctor-level search is limited because most facilities don't expose structured doctor rosters publicly.
  const docResults = q ? DOCTORS.filter(d => d.name.toLowerCase().includes(qq) || d.speciality.toLowerCase().includes(qq)) : [];
  return <Section>
    <SectionLabel>Our Network</SectionLabel>
    <SectionTitle align="left" sub="Find hospitals, clinics, and labs near your loved one">Hospitals & Clinics</SectionTitle>
    <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:28 }}>
      <div style={{ flex:1,minWidth:220,position:"relative" }}>
        <input placeholder="Search by doctor, hospital, or speciality..." value={q} onChange={e=>setQ(e.target.value)} className="select-anim" style={{ width:"100%",padding:"13px 16px 13px 16px",borderRadius:12,border:"1.5px solid var(--border)",fontSize:14,fontFamily:"var(--sans)",background:"var(--white)",boxSizing:"border-box" }} />
      </div>
      <select value={fc} onChange={e=>setFc(e.target.value)} className="select-anim" style={{ padding:"13px 16px",borderRadius:12,border:"1.5px solid var(--border)",fontSize:14,fontFamily:"var(--sans)",background:"var(--white)",cursor:"pointer" }}>
        <option value="all">All Cities</option>
        {CITIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <select value={ft} onChange={e=>setFt(e.target.value)} className="select-anim" style={{ padding:"13px 16px",borderRadius:12,border:"1.5px solid var(--border)",fontSize:14,fontFamily:"var(--sans)",background:"var(--white)",cursor:"pointer" }}>
        <option value="all">All Types</option><option value="hospital">Hospitals</option><option value="clinic">Clinics</option><option value="lab">Labs</option>
      </select>
      <select value={fs} onChange={e=>setFs(e.target.value)} className="select-anim" style={{ padding:"13px 16px",borderRadius:12,border:"1.5px solid var(--border)",fontSize:14,fontFamily:"var(--sans)",background:"var(--white)",cursor:"pointer",minWidth:220 }}>
        <option value="all">All Specialties</option>
        {specialtyOptions.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
    {docResults.length > 0 && <div style={{ marginBottom:28 }}>
      <h3 style={{ fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:12 }}>Doctors matching "{q}"</h3>
      <div className="grid-3" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
        {docResults.map(d => { const prov = PROVIDERS.find(p => p.id === d.providerId); return <Card key={d.id} onClick={() => setPage("/providers/" + d.providerId)} style={{ padding:16 }}>
          <div style={{ fontWeight:700,fontSize:14,color:"var(--text)" }}>{d.name}</div>
          <div style={{ fontSize:13,color:"var(--teal)",fontWeight:600 }}>{d.speciality}</div>
          <div style={{ fontSize:12,color:"var(--text3)",marginTop:4 }}>{prov ? prov.name : ""}</div>
        </Card>; })}
      </div>
    </div>}
    <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
      {filtered.map((p,i) => (
        <Card key={p.id} onClick={() => setPage("/providers/" + p.id)} className="fade-up" style={{ padding:22, animationDelay: (Math.min(i, 10) * 0.05) + "s" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
            <div style={{ display:"flex",gap:14 }}>
              <span style={{ fontSize:36 }}>{typeEmoji[p.type]}</span>
              <div>
                <h3 style={{ fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:4 }}>{p.name}</h3>
                <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text3)" }}><I name="map" size={13} /> {p.address || (p.area + ", " + p.city)}</div>
                <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text3)",marginTop:2 }}><I name="map" size={13} /> {p.address}</div>
                {p.specialties?.length > 0 && <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:10,maxWidth:520 }}>
                  {p.specialties.slice(0,6).map(s => <span key={s} style={{ padding:"5px 10px",borderRadius:999,background:"var(--bg2)",border:"1px solid var(--border)",fontSize:12,fontWeight:600,color:"var(--text2)" }}>{s}</span>)}
                  {p.specialties.length > 6 && <span style={{ padding:"5px 10px",borderRadius:999,background:"var(--bg2)",border:"1px solid var(--border)",fontSize:12,fontWeight:700,color:"var(--text3)" }}>+{p.specialties.length-6}</span>}
                </div>}
                <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text3)",marginTop:2 }}><I name="clock" size={13} /> {p.hours}</div>
                <div style={{ marginTop:6 }}><Stars rating={p.rating} size={12} /></div>
              </div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
              <Badge bg={p.ownership==="government" ? "var(--gold-light)" : "var(--teal-light)"} color={p.ownership==="government" ? "var(--gold)" : "var(--teal)"}>{p.ownership==="government" ? "Government" : "Private"}</Badge>
              <Badge bg="var(--bg2)" color="var(--text2)">{p.type}</Badge>
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <Btn variant="primary" onClick={e=>{e.stopPropagation();setPage("/book");}} style={{ padding:"9px 16px",fontSize:13,flex:1 }}>Book with this provider</Btn>
            <Btn variant="ghost" style={{ padding:"9px 12px" }}><I name="phone" size={15} /></Btn>
          </div>
        </Card>
      ))}
    </div>
    {filtered.length === 0 && <div style={{ textAlign:"center",padding:48,color:"var(--text3)" }}>No providers found. Try different filters.</div>}
  </Section>;
};

const ProviderDetail = ({ id }) => {
  const { setPage } = useApp();
  const p = PROVIDERS.find(x => x.id === id);
  const docs = DOCTORS.filter(d => d.providerId === id);
  if (!p) return <Section><p>Provider not found.</p></Section>;
  return <Section>
    <button onClick={() => setPage("/providers")} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"var(--teal)",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:24,fontFamily:"var(--sans)" }}><I name="back" size={18} /> Back to all providers</button>
    <Card style={{ padding:36,marginBottom:28 }}>
      <div style={{ display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
        <span style={{ fontSize:52 }}>{typeEmoji[p.type]}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
              <Badge bg={p.ownership==="government" ? "var(--gold-light)" : "var(--teal-light)"} color={p.ownership==="government" ? "var(--gold)" : "var(--teal)"}>{p.ownership==="government" ? "Government" : "Private"}</Badge>
              <Badge bg="var(--bg2)" color="var(--text2)">{p.type}</Badge>
            </div>
          <h1 style={{ fontSize:26,fontWeight:700,color:"var(--text)",margin:"8px 0 6px",fontFamily:"var(--serif)" }}>{p.name}</h1>
          <div style={{ display:"flex",gap:16,flexWrap:"wrap",fontSize:14,color:"var(--text3)" }}>
            <span style={{ display:"flex",alignItems:"center",gap:5 }}><I name="map" size={14} /> {p.address || (p.area + ", " + p.city)}</span>
            <span style={{ display:"flex",alignItems:"center",gap:5 }}><I name="clock" size={14} /> {p.hours}</span>
            <span style={{ display:"flex",alignItems:"center",gap:5 }}><I name="phone" size={14} /> {p.phone}</span>
            {p.website && <span style={{ display:"flex",alignItems:"center",gap:5 }}><I name="globe" size={14} /> <a href={p.website.split(" / ")[0]} target="_blank" rel="noreferrer" style={{ color:"var(--teal)",fontWeight:700 }}>Website</a></span>}
          </div>
          <div style={{ marginTop:8 }}><Stars rating={p.rating} size={16} /></div>
        </div>
        <Btn variant="primary" onClick={() => setPage("/book")}>Book with this provider</Btn>
      </div>
    </Card>

    <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
      <Card style={{ padding:22 }}>
        <h2 style={{ fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:10,fontFamily:"var(--serif)" }}>Specialties / Departments</h2>
        {p.specialties?.length ? (
          <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
            {p.specialties.map(s => <span key={s} style={{ padding:"6px 12px",borderRadius:999,background:"var(--teal-light)",color:"var(--teal)",fontSize:12,fontWeight:700 }}>{s}</span>)}
          </div>
        ) : (
          <p style={{ color:"var(--text3)",fontSize:14,lineHeight:1.6 }}>{p.specialtiesText || "Not publicly listed."}</p>
        )}
      </Card>

      <Card style={{ padding:22 }}>
        <h2 style={{ fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:10,fontFamily:"var(--serif)" }}>Doctor availability</h2>
        <p style={{ color:"var(--text2)",fontSize:14,lineHeight:1.7 }}>
          {p.doctorAvailability || "Doctor availability details are not publicly listed. Please call the facility to confirm timings."}
        </p>
        {p.ratingText && <div style={{ marginTop:12,fontSize:13,color:"var(--text3)" }}><strong style={{ color:"var(--text2)" }}>Ratings:</strong> {p.ratingText}</div>}
      </Card>
    </div>

    <Card style={{ padding:22,marginBottom:20 }}>
      <h2 style={{ fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:10,fontFamily:"var(--serif)" }}>Services & facilities</h2>
      <p style={{ color:"var(--text2)",fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{p.services || "Not publicly listed."}</p>
    </Card>

    {p.reviewSummary && (
      <Card style={{ padding:22,marginBottom:20 }}>
        <h2 style={{ fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:10,fontFamily:"var(--serif)" }}>Review summary</h2>
        <p style={{ color:"var(--text2)",fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{p.reviewSummary}</p>
      </Card>
    )}

    {docs.length > 0 && (
      <>
        <h2 style={{ fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:16,fontFamily:"var(--serif)" }}>Doctors ({docs.length})</h2>
        <div className="grid-2" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
          {docs.map(d => (
            <Card key={d.id} style={{ padding:22 }}>
              <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:14 }}>
                <div style={{ width:48,height:48,borderRadius:"50%",background:"var(--teal-light)",display:"flex",alignItems:"center",justifyContent:"center" }}><I name="user" size={22} color="var(--teal)" /></div>
                <div><h4 style={{ fontSize:15,fontWeight:700,color:"var(--text)",margin:0 }}>{d.name}</h4><Badge style={{ marginTop:4 }}>{d.speciality}</Badge></div>
              </div>
              <div style={{ fontSize:13,fontWeight:600,color:"var(--text3)",marginBottom:8 }}>Available Slots</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:14 }}>
                {d.slots.map(s => <span key={s} style={{ padding:"5px 12px",borderRadius:8,background:"var(--teal-light)",color:"var(--teal)",fontSize:12,fontWeight:600 }}>{s}</span>)}
              </div>
              <Btn variant="outline" onClick={() => setPage("/book")} full style={{ padding:"9px 16px",fontSize:13 }}>Book Appointment</Btn>
            </Card>
          ))}
        </div>
      </>
    )}
  </Section>;
};

const BookingFlow = () => {
  const { city, setPage, addBooking } = useApp();
  const [step, setStep] = useState(0);
  const steps = ["Service","Patient","Provider","Assistant","Review"];
  const [bk, setBk] = useState({ city,package_id:"",addons:[],patientName:"",patientPhone:"",patientAge:"",category:"elderly",notes:"",providerId:"",doctorId:"",date:"",time:"",testType:"",assistants:1,genderPref:"any",langPref:"tamil",wheelchair:false,pickupLocation:"",transport:false });
  const up = f => setBk(p => ({...p,...f}));
  const cprov = PROVIDERS.filter(p => p.city===bk.city);
  const selProv = PROVIDERS.find(p => p.id===bk.providerId);
  const provDocs = DOCTORS.filter(d => d.providerId===bk.providerId);
  const selDoc = DOCTORS.find(d => d.id===bk.doctorId);
  const selPkg = PACKAGES.find(p => p.id===bk.package_id);
  const total = () => {
    let t = selPkg ? selPkg.price : 0;
    bk.addons.forEach(a => { const ad = ADDONS.find(x=>x.id===a); if(ad) t += ad.price; });
    if(bk.assistants>1) t += (bk.assistants-1)*300;
    if(bk.transport) t += 150;
    return t;
  };
  const ok = () => {
    if(step===0) return bk.city && bk.package_id;
    if(step===1) return bk.patientName && bk.patientPhone && bk.category;
    if(step===2) return bk.providerId && bk.date;
    if(step===3) return bk.pickupLocation;
    return true;
  };
  const confirm = () => {
    const id = genId();
    addBooking({...bk,id,total:total(),status:"confirmed",createdAt:new Date().toISOString()});
    setPage("/book/success?id="+id);
  };
  return <Section>
    <SectionTitle sub="We'll handle the rest.">Book care for your loved one</SectionTitle>
    <StepBar steps={steps} current={step} />
    <div style={{ maxWidth:640,margin:"0 auto" }}>
      {step===0 && <Card style={{ padding:32 }}>
        <h3 style={{ fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:24,fontFamily:"var(--serif)" }}>What do you need?</h3>
        <Select label="City" value={bk.city} onChange={v=>up({city:v})} options={CITIES.map(c=>({value:c,label:c}))} />
        <div style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:12 }}>Choose Package</div>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:24 }}>
          {PACKAGES.map(pkg => (
            <div key={pkg.id} onClick={()=>up({package_id:pkg.id})} style={{ padding:18,borderRadius:14,border:"2px solid " + (bk.package_id===pkg.id?"var(--teal)":"var(--border)"),background:bk.package_id===pkg.id?"var(--teal-light)":"var(--white)",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"all 0.2s" }}>
              <div style={{ width:44,height:44,borderRadius:12,background:bk.package_id===pkg.id?"var(--teal)":"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s" }}>
                <I name={pkg.icon} size={20} color={bk.package_id===pkg.id?"#fff":"var(--text3)"} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:15,color:"var(--text)" }}>{pkg.name}</div>
                <div style={{ fontSize:13,color:"var(--text3)" }}>{pkg.desc}</div>
              </div>
              <div style={{ fontWeight:700,color:"var(--teal)",fontSize:16,fontFamily:"var(--serif)" }}>{formatPrice(pkg.price)}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:12 }}>Add extras (optional)</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
          {ADDONS.map(a => (
            <div key={a.id} onClick={()=>{const has=bk.addons.includes(a.id);up({addons:has?bk.addons.filter(x=>x!==a.id):[...bk.addons,a.id]});}} style={{ padding:14,borderRadius:12,border:"2px solid " + (bk.addons.includes(a.id)?"var(--teal)":"var(--border)"),background:bk.addons.includes(a.id)?"var(--teal-light)":"var(--white)",cursor:"pointer",transition:"all 0.2s" }}>
              <div style={{ fontSize:22,marginBottom:4 }}>{a.icon}</div>
              <div style={{ fontWeight:600,fontSize:13,color:"var(--text)" }}>{a.name}</div>
              <div style={{ color:"var(--teal)",fontWeight:700,fontSize:13 }}>+{formatPrice(a.price)}</div>
            </div>
          ))}
        </div>
      </Card>}

      {step===1 && <Card style={{ padding:32 }}>
        <h3 style={{ fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:24,fontFamily:"var(--serif)" }}>Who needs care?</h3>
        <Input label="Patient Name *" value={bk.patientName} onChange={e=>up({patientName:e.target.value})} placeholder="Full name of the person visiting" />
        <Input label="Your Phone Number *" value={bk.patientPhone} onChange={e=>up({patientPhone:e.target.value})} placeholder="+91 98765 43210" type="tel" />
        <Input label="Patient's Age" value={bk.patientAge} onChange={e=>up({patientAge:e.target.value})} placeholder="Age" type="number" />
        <div style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:10 }}>Who is this for? *</div>
        <div style={{ display:"flex",gap:10,marginBottom:18 }}>
          {[["elderly","\uD83D\uDC74\uD83C\uDFFD Elderly Parent"],["pregnancy","\uD83E\uDD30\uD83C\uDFFD Pregnancy"],["other","\uD83D\uDC64 Other"]].map(([v,l]) => (
            <div key={v} onClick={()=>up({category:v})} style={{ flex:1,padding:"16px 12px",borderRadius:14,textAlign:"center",border:"2px solid " + (bk.category===v?"var(--teal)":"var(--border)"),background:bk.category===v?"var(--teal-light)":"var(--white)",cursor:"pointer",fontSize:14,fontWeight:600,transition:"all 0.2s" }}>{l}</div>
          ))}
        </div>
        <Input label="Special Notes" value={bk.notes} onChange={e=>up({notes:e.target.value})} placeholder="Any allergies, mobility issues, or preferences..." />
      </Card>}

      {step===2 && <Card style={{ padding:32 }}>
        <h3 style={{ fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:24,fontFamily:"var(--serif)" }}>Where and when?</h3>
        <div style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:10 }}>Select Hospital / Clinic</div>
        <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:22,maxHeight:220,overflowY:"auto",paddingRight:4 }}>
          {cprov.map(p => (
            <div key={p.id} onClick={()=>up({providerId:p.id,doctorId:""})} style={{ padding:14,borderRadius:12,border:"2px solid " + (bk.providerId===p.id?"var(--teal)":"var(--border)"),background:bk.providerId===p.id?"var(--teal-light)":"var(--white)",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.2s" }}>
              <span style={{ fontSize:24 }}>{typeEmoji[p.type]}</span>
              <div style={{ flex:1 }}><div style={{ fontWeight:700,fontSize:14 }}>{p.name}</div><div style={{ fontSize:12,color:"var(--text3)" }}>{p.area} &middot; {p.hours}</div></div>
              <Stars rating={p.rating} size={11} />
            </div>
          ))}
        </div>
        {bk.providerId && provDocs.length > 0 && <>
          <div style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:10 }}>Select Doctor (optional)</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:22 }}>
            {provDocs.map(d => (
              <div key={d.id} onClick={()=>up({doctorId:d.id})} style={{ padding:12,borderRadius:10,border:"2px solid " + (bk.doctorId===d.id?"var(--teal)":"var(--border)"),background:bk.doctorId===d.id?"var(--teal-light)":"var(--white)",cursor:"pointer",fontSize:14,transition:"all 0.2s" }}>
                <span style={{ fontWeight:700 }}>{d.name}</span> &middot; <span style={{ color:"var(--teal)" }}>{d.speciality}</span>
              </div>
            ))}
          </div>
        </>}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <Input label="Preferred Date *" type="date" value={bk.date} onChange={e=>up({date:e.target.value})} />
          {selDoc ? <Select label="Time Slot" value={bk.time} onChange={v=>up({time:v})} options={[{value:"",label:"Select time"},...selDoc.slots.map(s=>({value:s,label:s}))]} /> : <Input label="Preferred Time" value={bk.time} onChange={e=>up({time:e.target.value})} placeholder="e.g. 10:00 AM" />}
        </div>
        <Select label="Test Type (if applicable)" value={bk.testType} onChange={v=>up({testType:v})} options={[{value:"",label:"None"},{value:"blood",label:"Blood Test"},{value:"scan",label:"Scan / Ultrasound"},{value:"xray",label:"X-Ray"},{value:"ecg",label:"ECG"},{value:"other",label:"Other"}]} />
      </Card>}

      {step===3 && <Card style={{ padding:32 }}>
        <h3 style={{ fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:24,fontFamily:"var(--serif)" }}>Assistant & Transport</h3>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
          <Select label="Number of Assistants" value={bk.assistants} onChange={v=>up({assistants:parseInt(v)})} options={[1,2,3].map(n=>({value:n,label:n + " Assistant" + (n>1?"s":"")}))} />
          <Select label="Gender Preference" value={bk.genderPref} onChange={v=>up({genderPref:v})} options={[{value:"any",label:"No Preference"},{value:"female",label:"Female"},{value:"male",label:"Male"}]} />
        </div>
        <Select label="Language Preference" value={bk.langPref} onChange={v=>up({langPref:v})} options={[{value:"tamil",label:"Tamil"},{value:"english",label:"English"},{value:"both",label:"Both Tamil & English"}]} />
        {[["wheelchair","\u267F Wheelchair support needed"],["transport","\uD83D\uDE97 Arrange transport (Uber/Ola)"]].map(([key,label]) => (
          <label key={key} style={{ display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"14px 16px",borderRadius:12,border:"1.5px solid " + (bk[key]?"var(--teal)":"var(--border)"),background:bk[key]?"var(--teal-light)":"var(--white)",marginBottom:10,transition:"all 0.2s" }}>
            <input type="checkbox" checked={bk[key]} onChange={e=>up({[key]:e.target.checked})} style={{ width:18,height:18,accentColor:"var(--teal)" }} />
            <span style={{ fontWeight:600,fontSize:14 }}>{label}</span>
          </label>
        ))}
        <Input label="Pickup Address *" value={bk.pickupLocation} onChange={e=>up({pickupLocation:e.target.value})} placeholder="Full address where we should pick up your loved one" />
      </Card>}

      {step===4 && <Card style={{ padding:32 }}>
        <h3 style={{ fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:24,fontFamily:"var(--serif)" }}>Review your booking</h3>
        <div style={{ background:"var(--bg2)",borderRadius:16,padding:22,marginBottom:22 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,fontSize:14 }}>
            {[["City",bk.city],["Package",selPkg?selPkg.name:""],["Patient",bk.patientName],["Phone",bk.patientPhone],["Category",bk.category],["Provider",selProv?selProv.name:""],["Doctor",selDoc?selDoc.name:"Any available"],["Date",bk.date],["Time",bk.time||"Any"],["Assistants",bk.assistants],["Language",bk.langPref],["Pickup",bk.pickupLocation]].map(([l,v],i) => (
              <div key={i}><div style={{ color:"var(--text4)",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>{l}</div><div style={{ color:"var(--text)",fontWeight:600,marginTop:2 }}>{v}</div></div>
            ))}
          </div>
          {bk.notes && <div style={{ marginTop:14,fontSize:13,color:"var(--text3)",borderTop:"1px solid var(--border)",paddingTop:12 }}><strong>Notes:</strong> {bk.notes}</div>}
        </div>
        <div style={{ background:"var(--teal-light)",borderRadius:16,padding:22 }}>
          <div style={{ fontSize:13,fontWeight:700,color:"var(--teal-dark)",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.05em" }}>Price Breakdown</div>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:15,marginBottom:8 }}><span>{selPkg?selPkg.name:""}</span><span style={{ fontWeight:700 }}>{formatPrice(selPkg?selPkg.price:0)}</span></div>
          {bk.addons.map(a => { const ad=ADDONS.find(x=>x.id===a); return ad ? <div key={a} style={{ display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:6,color:"var(--text2)" }}><span>{ad.name}</span><span>{formatPrice(ad.price)}</span></div> : null; })}
          {bk.assistants>1 && <div style={{ display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:6,color:"var(--text2)" }}><span>Extra Assistants (&times;{bk.assistants-1})</span><span>{formatPrice((bk.assistants-1)*300)}</span></div>}
          {bk.transport && <div style={{ display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:6,color:"var(--text2)" }}><span>Transport</span><span>{formatPrice(150)}</span></div>}
          <div style={{ borderTop:"2px solid var(--teal)",marginTop:14,paddingTop:14,display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:700,color:"var(--teal-dark)" }}>
            <span>Total</span><span style={{ fontFamily:"var(--serif)" }}>{formatPrice(total())}</span>
          </div>
        </div>
      </Card>}

      <div style={{ display:"flex",justifyContent:"space-between",marginTop:24,gap:12 }}>
        {step>0 ? <Btn variant="outline" onClick={()=>setStep(s=>s-1)}><I name="back" size={16} /> Back</Btn> : <div />}
        {step<4 ? <Btn variant="primary" onClick={()=>setStep(s=>s+1)} disabled={!ok()}>Next <I name="arrow" size={16} color="#fff" /></Btn> : <Btn variant="accent" onClick={confirm} style={{ padding:"14px 32px",boxShadow:"0 4px 20px rgba(212,113,94,0.35)" }}><I name="check" size={18} color="#fff" /> Confirm Booking</Btn>}
      </div>
    </div>
  </Section>;
};

const BookingSuccess = ({ bookingId }) => {
  const { setPage, bookings } = useApp();
  const bk = bookings.find(b => b.id === bookingId);
  return <Section>
    <div style={{ maxWidth:520,margin:"0 auto",textAlign:"center" }}>
      <div style={{ width:80,height:80,borderRadius:"50%",background:"#E6F3EF",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"scaleIn 0.5s cubic-bezier(.16,1,.3,1)" }}>
        <I name="check" size={38} color="var(--teal)" />
      </div>
      <h1 style={{ fontSize:28,fontWeight:700,color:"var(--text)",margin:"0 0 8px",fontFamily:"var(--serif)" }}>You're all set!</h1>
      <p style={{ color:"var(--text3)",marginBottom:28,fontSize:16,lineHeight:1.6 }}>Your loved one is in caring hands. We'll reach out shortly to confirm all the details.</p>
      <Card style={{ padding:28,textAlign:"left",marginBottom:28 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <span style={{ fontSize:13,color:"var(--text3)" }}>Booking ID</span>
          <span style={{ fontWeight:700,color:"var(--teal)",fontFamily:"monospace",fontSize:16,letterSpacing:"0.05em" }}>{bookingId}</span>
        </div>
        {bk && <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,fontSize:14 }}>
          <div><span style={{ color:"var(--text4)",fontSize:11 }}>Patient</span><div style={{ fontWeight:600 }}>{bk.patientName}</div></div>
          <div><span style={{ color:"var(--text4)",fontSize:11 }}>Date</span><div style={{ fontWeight:600 }}>{bk.date}</div></div>
          <div><span style={{ color:"var(--text4)",fontSize:11 }}>Provider</span><div style={{ fontWeight:600 }}>{PROVIDERS.find(p=>p.id===bk.providerId) ? PROVIDERS.find(p=>p.id===bk.providerId).name : ""}</div></div>
          <div><span style={{ color:"var(--text4)",fontSize:11 }}>Total</span><div style={{ fontWeight:700,color:"var(--teal)",fontSize:18,fontFamily:"var(--serif)" }}>{formatPrice(bk.total)}</div></div>
        </div>}
      </Card>
      <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
        <Btn variant="whatsapp"><I name="whatsapp" size={18} color="#fff" /> WhatsApp Support</Btn>
        <Btn variant="outline" onClick={() => setPage("/")}><I name="back" size={16} /> Home</Btn>
      </div>
    </div>
  </Section>;
};

const LoginPage = () => {
  const { setPage, setUser, lang } = useApp();
  const [e, setE] = useState(""); const [p, setP] = useState("");
  return <Section>
    <div style={{ maxWidth:420,margin:"0 auto" }}>
      <Card style={{ padding:36 }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <I name="heart" size={28} color="var(--coral)" />
          <h2 style={{ fontSize:24,fontWeight:700,color:"var(--text)",margin:"12px 0 4px",fontFamily:"var(--serif)" }}>Welcome back</h2>
          <p style={{ fontSize:14,color:"var(--text3)" }}>Sign in to manage your bookings</p>
        </div>
        <Input label="Email" value={e} onChange={ev=>setE(ev.target.value)} placeholder="you@email.com" type="email" />
        <Input label="Password" value={p} onChange={ev=>setP(ev.target.value)} placeholder="••••••••" type="password" />
        <Btn variant="primary" onClick={()=>{if(e&&p){setUser({email:e,name:e.split("@")[0]});setPage("/account");}}} full disabled={!e||!p} style={{ marginTop:4 }}>Sign In</Btn>
        <p style={{ textAlign:"center",fontSize:14,color:"var(--text3)",marginTop:18 }}>New here? <a onClick={()=>setPage("/signup")} style={{ color:"var(--teal)",fontWeight:700,cursor:"pointer" }}>{t("Sign Up",lang)}</a></p>
      </Card>
    </div>
  </Section>;
};

const SignupPage = () => {
  const { setPage, setUser, lang } = useApp();
  const [n, setN] = useState(""); const [e, setE] = useState(""); const [ph, setPh] = useState(""); const [p, setP] = useState("");
  return <Section>
    <div style={{ maxWidth:420,margin:"0 auto" }}>
      <Card style={{ padding:36 }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <I name="heart" size={28} color="var(--coral)" />
          <h2 style={{ fontSize:24,fontWeight:700,color:"var(--text)",margin:"12px 0 4px",fontFamily:"var(--serif)" }}>Join Care 2030</h2>
          <p style={{ fontSize:14,color:"var(--text3)" }}>Create an account to start booking</p>
        </div>
        <Input label="Full Name" value={n} onChange={ev=>setN(ev.target.value)} placeholder="Your name" />
        <Input label="Email" value={e} onChange={ev=>setE(ev.target.value)} placeholder="you@email.com" type="email" />
        <Input label="Phone" value={ph} onChange={ev=>setPh(ev.target.value)} placeholder="+91 98765 43210" type="tel" />
        <Input label="Password" value={p} onChange={ev=>setP(ev.target.value)} placeholder="Choose a password" type="password" />
        <Btn variant="primary" onClick={()=>{if(n&&e&&p){setUser({name:n,email:e,phone:ph});setPage("/account");}}} full disabled={!n||!e||!p} style={{ marginTop:4 }}>Create Account</Btn>
        <p style={{ textAlign:"center",fontSize:14,color:"var(--text3)",marginTop:18 }}>Already have an account? <a onClick={()=>setPage("/login")} style={{ color:"var(--teal)",fontWeight:700,cursor:"pointer" }}>{t("Login",lang)}</a></p>
      </Card>
    </div>
  </Section>;
};

const AccountPage = () => {
  const { user, setUser, setPage, bookings } = useApp();
  if (!user) { setPage("/login"); return null; }
  return <Section>
    <div style={{ maxWidth:700,margin:"0 auto" }}>
      <Card style={{ padding:28,marginBottom:28,background:"linear-gradient(135deg,var(--teal-light),#D5EDE7)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            <div style={{ width:52,height:52,borderRadius:"50%",background:"var(--teal)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,fontFamily:"var(--serif)" }}>{(user.name||"U").charAt(0).toUpperCase()}</div>
            <div>
              <h2 style={{ fontSize:22,fontWeight:700,color:"var(--text)",margin:0,fontFamily:"var(--serif)" }}>Hi, {user.name}!</h2>
              <p style={{ color:"var(--text3)",fontSize:14,margin:0 }}>{user.email}</p>
            </div>
          </div>
          <Btn variant="ghost" onClick={()=>{setUser(null);setPage("/");}} style={{ color:"var(--coral)" }}>Sign Out</Btn>
        </div>
      </Card>
      <h3 style={{ fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:16,fontFamily:"var(--serif)" }}>Your Bookings</h3>
      {bookings.length===0 ? <Card style={{ padding:40,textAlign:"center" }}><p style={{ color:"var(--text3)",marginBottom:16 }}>No bookings yet.</p><Btn variant="primary" onClick={()=>setPage("/book")}>Book Your First Visit</Btn></Card> : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {bookings.map(b => <Card key={b.id} style={{ padding:22 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10 }}>
              <div>
                <span style={{ fontFamily:"monospace",fontWeight:700,color:"var(--teal)",fontSize:14 }}>{b.id}</span>
                <div style={{ fontWeight:700,fontSize:16,marginTop:4 }}>{b.patientName}</div>
                <div style={{ fontSize:13,color:"var(--text3)" }}>{PROVIDERS.find(p=>p.id===b.providerId)?.name} &middot; {b.date}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <Badge bg="#E6F3EF" color="var(--teal)">{b.status}</Badge>
                <div style={{ fontWeight:700,color:"var(--teal)",marginTop:6,fontSize:18,fontFamily:"var(--serif)" }}>{formatPrice(b.total)}</div>
              </div>
            </div>
          </Card>)}
        </div>
      )}
    </div>
  </Section>;
};

const AdminPage = () => {
  const { bookings } = useApp();
  const [tab, setTab] = useState("providers");
  const [provs, setProvs] = useState([...PROVIDERS]);
  const [docs, setDocs] = useState([...DOCTORS]);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddD, setShowAddD] = useState(false);
  const [np, setNp] = useState({name:"",city:CITIES[0],type:"hospital",area:"",hours:"",phone:""});
  const [nd, setNd] = useState({name:"",speciality:"",providerId:PROVIDERS[0].id,slots:""});
  const tabs = [{id:"providers",label:"Providers",icon:"hospital"},{id:"doctors",label:"Doctors",icon:"user"},{id:"bookings",label:"Bookings",icon:"calendar"},{id:"pricing",label:"Pricing",icon:"star"}];

  return <Section>
    <SectionTitle sub="Manage providers, doctors, bookings, and pricing">Admin Dashboard</SectionTitle>
    <div style={{ display:"flex",gap:8,marginBottom:28,flexWrap:"wrap" }}>
      {tabs.map(tb => <button key={tb.id} onClick={()=>setTab(tb.id)} style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:12,background:tab===tb.id?"var(--teal)":"var(--white)",color:tab===tb.id?"#fff":"var(--text2)",border:"1.5px solid " + (tab===tb.id?"var(--teal)":"var(--border)"),cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"var(--sans)",transition:"all 0.2s" }}>
        <I name={tb.icon} size={16} color={tab===tb.id?"#fff":"var(--text3)"} /> {tb.label}
      </button>)}
    </div>

    {tab==="providers" && <div>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:16 }}>
        <h3 style={{ fontSize:18,fontWeight:700,fontFamily:"var(--serif)" }}>Providers ({provs.length})</h3>
        <Btn variant="primary" onClick={()=>setShowAdd(true)} style={{ padding:"8px 18px",fontSize:13 }}><I name="plus" size={16} color="#fff" /> Add Provider</Btn>
      </div>
      {showAdd && <Card style={{ padding:22,marginBottom:16,border:"2px solid var(--teal)" }}>
        <h4 style={{ margin:"0 0 14px",fontFamily:"var(--serif)" }}>Add New Provider</h4>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="Name" value={np.name} onChange={e=>setNp({...np,name:e.target.value})} placeholder="Hospital name" />
          <Select label="City" value={np.city} onChange={v=>setNp({...np,city:v})} options={CITIES.map(c=>({value:c,label:c}))} />
          <Select label="Type" value={np.type} onChange={v=>setNp({...np,type:v})} options={[{value:"hospital",label:"Hospital"},{value:"clinic",label:"Clinic"},{value:"lab",label:"Lab"}]} />
          <Input label="Area" value={np.area} onChange={e=>setNp({...np,area:e.target.value})} placeholder="Area" />
          <Input label="Hours" value={np.hours} onChange={e=>setNp({...np,hours:e.target.value})} placeholder="24/7" />
          <Input label="Phone" value={np.phone} onChange={e=>setNp({...np,phone:e.target.value})} placeholder="+91..." />
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <Btn variant="primary" onClick={()=>{setProvs([...provs,{...np,id:"p"+Date.now(),rating:4.0}]);setShowAdd(false);setNp({name:"",city:CITIES[0],type:"hospital",area:"",hours:"",phone:""});}} style={{ padding:"8px 20px",fontSize:13 }}>Save</Btn>
          <Btn variant="ghost" onClick={()=>setShowAdd(false)} style={{ fontSize:13 }}>Cancel</Btn>
        </div>
      </Card>}
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {provs.map(p => <Card key={p.id} style={{ padding:16 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <span style={{ fontSize:24 }}>{typeEmoji[p.type]}</span>
              <div><div style={{ fontWeight:700,fontSize:14 }}>{p.name}</div><div style={{ fontSize:12,color:"var(--text3)" }}>{p.address || (p.area + ", " + p.city)} &middot; {p.type}</div></div>
            </div>
            <div style={{ display:"flex",gap:6 }}>
              <button style={{ background:"none",border:"none",cursor:"pointer",color:"var(--teal)",padding:4 }}><I name="edit" size={16} /></button>
              <button onClick={()=>setProvs(provs.filter(x=>x.id!==p.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--coral)",padding:4 }}><I name="trash" size={16} /></button>
            </div>
          </div>
        </Card>)}
      </div>
    </div>}

    {tab==="doctors" && <div>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:16 }}>
        <h3 style={{ fontSize:18,fontWeight:700,fontFamily:"var(--serif)" }}>Doctors ({docs.length})</h3>
        <Btn variant="primary" onClick={()=>setShowAddD(true)} style={{ padding:"8px 18px",fontSize:13 }}><I name="plus" size={16} color="#fff" /> Add Doctor</Btn>
      </div>
      {showAddD && <Card style={{ padding:22,marginBottom:16,border:"2px solid var(--teal)" }}>
        <h4 style={{ margin:"0 0 14px",fontFamily:"var(--serif)" }}>Add New Doctor</h4>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="Name" value={nd.name} onChange={e=>setNd({...nd,name:e.target.value})} placeholder="Dr. Name" />
          <Input label="Speciality" value={nd.speciality} onChange={e=>setNd({...nd,speciality:e.target.value})} placeholder="e.g. Cardiology" />
          <Select label="Provider" value={nd.providerId} onChange={v=>setNd({...nd,providerId:v})} options={provs.map(p=>({value:p.id,label:p.name}))} />
          <Input label="Slots (comma sep)" value={nd.slots} onChange={e=>setNd({...nd,slots:e.target.value})} placeholder="9:00 AM, 10:00 AM" />
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <Btn variant="primary" onClick={()=>{setDocs([...docs,{...nd,id:"d"+Date.now(),slots:nd.slots.split(",").map(s=>s.trim()).filter(Boolean)}]);setShowAddD(false);setNd({name:"",speciality:"",providerId:provs[0]?.id,slots:""});}} style={{ padding:"8px 20px",fontSize:13 }}>Save</Btn>
          <Btn variant="ghost" onClick={()=>setShowAddD(false)} style={{ fontSize:13 }}>Cancel</Btn>
        </div>
      </Card>}
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {docs.map(d => { const pv=provs.find(p=>p.id===d.providerId); return <Card key={d.id} style={{ padding:16 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div><div style={{ fontWeight:700,fontSize:14 }}>{d.name}</div><div style={{ fontSize:12,color:"var(--text3)" }}>{d.speciality} &middot; {pv?.name||"\u2014"}</div></div>
            <button onClick={()=>setDocs(docs.filter(x=>x.id!==d.id))} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--coral)",padding:4 }}><I name="trash" size={16} /></button>
          </div>
        </Card>; })}
      </div>
    </div>}

    {tab==="bookings" && <div>
      <h3 style={{ fontSize:18,fontWeight:700,margin:"0 0 16px",fontFamily:"var(--serif)" }}>Bookings ({bookings.length})</h3>
      {bookings.length===0 ? <Card style={{ padding:36,textAlign:"center",color:"var(--text3)" }}>No bookings yet.</Card> : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
            <thead><tr style={{ background:"var(--bg2)" }}>
              {["ID","Patient","City","Provider","Date","Package","Total","Status"].map(h => <th key={h} style={{ padding:"12px 14px",textAlign:"left",fontWeight:700,color:"var(--text)",borderBottom:"2px solid var(--border)",fontSize:12,textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>)}
            </tr></thead>
            <tbody>{bookings.map(b => <tr key={b.id} style={{ borderBottom:"1px solid var(--border)" }}>
              <td style={{ padding:"12px 14px",fontFamily:"monospace",fontWeight:700,color:"var(--teal)" }}>{b.id}</td>
              <td style={{ padding:"12px 14px" }}>{b.patientName}</td>
              <td style={{ padding:"12px 14px" }}>{b.city}</td>
              <td style={{ padding:"12px 14px" }}>{PROVIDERS.find(p=>p.id===b.providerId)?.name?.substring(0,20)}</td>
              <td style={{ padding:"12px 14px" }}>{b.date}</td>
              <td style={{ padding:"12px 14px" }}>{PACKAGES.find(p=>p.id===b.package)?.name}</td>
              <td style={{ padding:"12px 14px",fontWeight:700 }}>{formatPrice(b.total)}</td>
              <td style={{ padding:"12px 14px" }}><Badge bg="#E6F3EF" color="var(--teal)">{b.status}</Badge></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </div>}

    {tab==="pricing" && <div>
      <h3 style={{ fontSize:18,fontWeight:700,margin:"0 0 16px",fontFamily:"var(--serif)" }}>Pricing Configuration</h3>
      {PACKAGES.map(pkg => <Card key={pkg.id} style={{ padding:18,marginBottom:10 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:40,height:40,borderRadius:10,background:"var(--teal-light)",display:"flex",alignItems:"center",justifyContent:"center" }}><I name={pkg.icon} size={18} color="var(--teal)" /></div>
            <div><div style={{ fontWeight:700,fontSize:15 }}>{pkg.name}</div><div style={{ fontSize:12,color:"var(--text3)" }}>{pkg.desc}</div></div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontWeight:700,color:"var(--teal)",fontSize:18,fontFamily:"var(--serif)" }}>{formatPrice(pkg.price)}</span>
            <button style={{ background:"none",border:"none",cursor:"pointer",color:"var(--teal)" }}><I name="edit" size={16} /></button>
          </div>
        </div>
      </Card>)}
      <h4 style={{ fontSize:16,fontWeight:700,marginTop:20,marginBottom:12,fontFamily:"var(--serif)" }}>Add-Ons</h4>
      {ADDONS.map(a => <Card key={a.id} style={{ padding:14,marginBottom:8 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}><span style={{ fontSize:20 }}>{a.icon}</span><span style={{ fontWeight:600,fontSize:14 }}>{a.name}</span></div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontWeight:700,color:"var(--teal)" }}>{formatPrice(a.price)}</span>
            <button style={{ background:"none",border:"none",cursor:"pointer",color:"var(--teal)" }}><I name="edit" size={16} /></button>
          </div>
        </div>
      </Card>)}
    </div>}
  </Section>;
};

const Router = ({ page }) => {
  if (page === "/") return <HomePage />;
  if (page === "/services") return <ServicesPage />;
  if (page === "/providers") return <ProvidersPage />;
  if (page.startsWith("/providers/")) return <ProviderDetail id={page.split("/providers/")[1]} />;
  if (page === "/book") return <BookingFlow />;
  if (page.startsWith("/book/success")) return <BookingSuccess bookingId={page.split("?id=")[1]} />;
  if (page === "/login") return <LoginPage />;
  if (page === "/signup") return <SignupPage />;
  if (page === "/account") return <AccountPage />;
  if (page === "/admin") return <AdminPage />;
  return <HomePage />;
};

export default function App() {
  const [page, setPage] = useState("/");
  const [city, setCity] = useState("Kanyakumari");
  const [lang, setLang] = useState("en");
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const addBooking = useCallback(b => setBookings(p => [...p, b]), []);
  const go = useCallback(p => { setPage(p); window.scrollTo({ top:0, behavior:"smooth" }); }, []);

  return (
    <AppContext.Provider value={{ page, setPage: go, city, setCity, lang, setLang, user, setUser, bookings, addBooking }}>
      <GlobalStyles />
      <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column" }}>
        <div className="grain" />
        <Navbar />
        <main style={{ flex:1 }}><Router page={page} /></main>
        <Footer />
        <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" style={{ position:"fixed",bottom:24,right:24,width:56,height:56,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,0.35)",zIndex:99,transition:"transform 0.25s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          <I name="whatsapp" size={28} color="#fff" />
        </a>
        <button onClick={()=>go("/admin")} style={{ position:"fixed",bottom:24,left:24,padding:"8px 14px",borderRadius:8,background:"var(--text)",color:"var(--white)",fontSize:11,fontWeight:700,border:"none",cursor:"pointer",opacity:0.5,zIndex:99,fontFamily:"var(--sans)" }}>&#x2699; Admin</button>
      </div>
    </AppContext.Provider>
  );
}
