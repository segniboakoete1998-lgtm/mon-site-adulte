
const { useState, useEffect, useMemo, useRef } = React;

// --- Réglages ---
const GAME_TITLE = "SEGNIBO & DIEU QUIZ";
const DON_FLOOZ = "+228 97829674";
const DON_TMONEY = "+228 71258442";
const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXX"; // Remplacez par votre ID

const THEME_IMAGES = [
  "https://images.unsplash.com/photo-1543644091-cb81e64aa086?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f?q=80&w=1600&auto=format&fit=crop"
];

// Utils
const shuffle = (arr) => arr.map(v => [Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const pickN = (arr, n) => shuffle(arr).slice(0, n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = (s) => (s||'').trim().replace(/\s+/g,' ').toLowerCase();

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}

function generateQuestion(verses) {
  if (!verses?.length) return null;
  const v = verses[Math.floor(Math.random()*verses.length)];
  const type = Math.floor(Math.random()*4);
  switch(type){
    case 0: {
      const options = pickN(verses, 3).map(o => `${o.book} ${o.chapter}:${o.verse}`);
      if (!options.includes(`${v.book} ${v.chapter}:${v.verse}`)) options[0] = `${v.book} ${v.chapter}:${v.verse}`;
      return { kind:'qcm_ref', prompt:`De quel passage provient ce verset ?\n“${v.text}”`, options:shuffle(options), answer:`${v.book} ${v.chapter}:${v.verse}`, explain:`${v.book} ${v.chapter}:${v.verse}` };
    }
    case 1: {
      const words = v.text.split(/\s+/).filter(w=>w.length>3);
      const missing = words[Math.floor(Math.random()*Math.max(1, words.length))] || words[0] || "God";
      const masked = v.text.replace(missing, "_____ ");
      const distractors = ["love","faith","hope","grace","truth","heart","peace","light"];
      const options = shuffle([missing, ...pickN(distractors.filter(d=>d.toLowerCase()!==missing.toLowerCase()), 3)]);
      return { kind:'qcm_blank', prompt:`Complète le verset (${v.book} ${v.chapter}:${v.verse}) :\n“${masked}”`, options, answer:missing, explain:v.text };
    }
    case 2: {
      const correct = Math.random() < 0.5;
      const fake = (verses.find(o=>o.book !== v.book) || verses[0]).book;
      const stated = correct ? v.book : fake;
      return { kind:'vf_book', prompt:`VRAI ou FAUX ? Ce verset vient du livre de ${stated}.\n“${v.text}”`, options:["Vrai","Faux"], answer: correct?"Vrai":"Faux", explain:`${v.book} ${v.chapter}:${v.verse}` };
    }
    case 3: {
      return { kind:'input_ref', prompt:`Entre la référence (Livre Chapitre:Verset) pour ce passage :\n“${v.text}”`, answer:`${v.book} ${v.chapter}:${v.verse}`, explain:`${v.book} ${v.chapter}:${v.verse}` };
    }
    default: return null;
  }
}

function AdBox({enabled}){
  useEffect(()=>{
    if(enabled && window.adsbygoogle){ try{ (window.adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){} }
  });
  return (
    <div className="ads">
      {enabled ? <ins className="adsbygoogle" style={{display:"block"}} data-ad-client={ADSENSE_CLIENT} data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true"></ins> : "Zone publicité Google (mettez votre ID ca-pub-… dans app.js)"}
    </div>
  );
}

function BibleReader({ verses }){
  const [q,setQ] = useState("");
  const [page,setPage] = useState(0);
  const pageSize = 20;
  const filtered = useMemo(()=>{
    const k = q.trim().toLowerCase();
    if(!k) return verses;
    return verses.filter(v => String(v.book).toLowerCase().includes(k) || String(v.text).toLowerCase().includes(k) || `${v.book} ${v.chapter}:${v.verse}`.toLowerCase().includes(k));
  },[q,verses]);
  useEffect(()=>setPage(0),[q]);
  const total = Math.max(1, Math.ceil(filtered.length/pageSize));
  const slice = filtered.slice(page*pageSize, page*pageSize+pageSize);
  return (
    <div className="grid" style={{gap:8}}>
      <div className="row"><input className="input" placeholder="Rechercher (livre, référence ou texte) …" value={q} onChange={e=>setQ(e.target.value)} /><button className="btn" onClick={()=>setQ("")}>Effacer</button></div>
      <div className="small">{filtered.length} versets trouvés</div>
      <div className="grid" style={{gap:8}}>
        {slice.map((v,i)=> (
          <div key={`${v.book}-${v.chapter}-${v.verse}-${i}`} className="card">
            <div className="small" style={{opacity:.7}}>{v.book} {v.chapter}:{v.verse}</div>
            <div>{v.text}</div>
          </div>
        ))}
      </div>
      <div className="row" style={{justifyContent:"space-between"}}>
        <button className="btn" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>Précédent</button>
        <div className="small">Page {page+1} / {total}</div>
        <button className="btn" onClick={()=>setPage(p=>Math.min(total-1,p+1))} disabled={page>=total-1}>Suivant</button>
      </div>
    </div>
  );
}

function App(){
  const [tab,setTab] = useState("jouer");
  const [verseBank,setVerseBank] = useLocalStorage("sg_verses", []);
  const [score,setScore] = useLocalStorage("sg_score", 0);
  const [streak,setStreak] = useLocalStorage("sg_streak", 0);
  const [lives,setLives] = useLocalStorage("sg_lives", 3);
  const [goal,setGoal] = useLocalStorage("sg_goal", 20);
  const [asked,setAsked] = useLocalStorage("sg_asked", 0);
  const [currentQ,setCurrentQ] = useState(null);
  const [selected,setSelected] = useState(null);
  const [inputRef,setInputRef] = useState("");
  const [adsOn,setAdsOn] = useLocalStorage("sg_ads", true);

  // Load initial sample
  useEffect(()=>{
    if(verseBank.length===0){
      fetch('bible_fr_sample.json').then(r=>r.json()).then(setVerseBank).catch(()=>{});
    }
  },[]);

  // Inject AdSense client script if ID provided
  useEffect(()=>{
    if (!ADSENSE_CLIENT || ADSENSE_CLIENT.includes("X")) return;
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  },[]);

  function nextQuestion(){
    const q = generateQuestion(verseBank);
    setCurrentQ(q);
    setSelected(null);
    setInputRef("");
  }
  useEffect(()=>{ if(!currentQ) nextQuestion(); },[verseBank]);

  const progress = Math.min(100, Math.round((asked/goal)*100));

  function answer(value){
    if(!currentQ) return;
    let ok=false;
    if(currentQ.kind==='input_ref'){ ok = norm(value)===norm(currentQ.answer); }
    else { ok = value===currentQ.answer; setSelected(value); }

    if(ok){
      setScore(s=>s+5); setStreak(s=>s+1); setAsked(a=>a+1);
      setTimeout(nextQuestion, 600);
    } else {
      setStreak(0); setLives(l=>Math.max(0,l-1)); setAsked(a=>a+1);
      if(lives-1<=0){
        setTimeout(()=>{ setLives(3); setScore(0); setAsked(0); setStreak(0); nextQuestion(); }, 900);
      } else {
        setTimeout(nextQuestion, 800);
      }
    }
  }

  // Import JSON
  const fileInput = React.useRef(null);
  function onFile(e){
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        const cleaned = data.filter(v=>v.book&&v.chapter&&v.verse&&v.text).map(v=>({book:String(v.book),chapter:Number(v.chapter),verse:Number(v.verse),text:String(v.text)}));
        setVerseBank(cleaned);
        setScore(0); setStreak(0); setLives(3); setAsked(0);
        nextQuestion();
      }catch{ alert("Fichier JSON invalide"); }
    };
    reader.readAsText(f);
  }

  return (
    <div className="container">
      <div className="header">
        <div className="row">
          <div className="logo">SG</div>
          <div>
            <div className="title">{GAME_TITLE}</div>
            <div className="small">Apprends la Bible, joue & soutiens le projet 🙏</div>
          </div>
        </div>
        <div className="row small" style={{gap:8}}>
          <span className="badge">Score: {score}</span>
          <span className="badge">Série: {streak}</span>
          <span className="badge" style={{borderColor:lives>1?"#2a2a2a":"#7a1e1e"}}>Vies: {lives}</span>
        </div>
      </div>

      <AdBox enabled={adsOn}/>

      <div className="tabs">
        {["jouer","lire","import","reglages"].map(t => (
          <button key={t} className={"tabbtn "+(tab===t?"active":"")} onClick={()=>setTab(t)} style={{textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>

      {tab==="jouer" && (
        <div className="grid" style={{gap:8, gridTemplateColumns:"1.6fr .8fr"}}>
          <div className="card">
            {currentQ ? (
              <div className="grid" style={{gap:8}}>
                <div style={{whiteSpace:"pre-line"}}>{currentQ.prompt}</div>
                {currentQ.kind==='input_ref' ? (
                  <div className="row">
                    <input className="input" placeholder="Livre Chapitre:Verset (ex: John 3:16)" value={inputRef} onChange={e=>setInputRef(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') answer(inputRef); }} />
                    <button className="btn primary" onClick={()=>answer(inputRef)}>Valider</button>
                  </div>
                ) : (
                  <div className="grid grid2">
                    {currentQ.options.map((opt,i)=>(
                      <button className={"btn "+(selected===opt?(opt===currentQ.answer?"primary":""): "")} key={i} onClick={()=>answer(opt)}>{opt}</button>
                    ))}
                  </div>
                )}
                <div className="progress"><div style={{width:progress+'%'}}></div></div>
                <div className="row">
                  <button className="btn" onClick={nextQuestion}>Suivante</button>
                  <button className="btn" onClick={()=>{ setLives(3); setScore(0); setAsked(0); setStreak(0); nextQuestion(); }}>Relancer</button>
                </div>
                <div className="small">Objectif: {goal} questions</div>
              </div>
            ) : "Chargement…"}
          </div>

          <div className="grid" style={{gap:8}}>
            <div className="card">
              <div style={{fontWeight:700, marginBottom:6}}>Images du jour</div>
              <div className="gallery">
                {THEME_IMAGES.map((src,idx)=>(<img key={idx} src={src} alt="Bible"/>))}
              </div>
            </div>
            <div className="card">
              <div style={{fontWeight:700, marginBottom:6}}>Faire un don</div>
              <div className="grid" style={{gap:8}}>
                <div className="row" style={{justifyContent:"space-between"}}>
                  <div><div style={{fontWeight:600}}>Flooz (Togo)</div><div className="small">{DON_FLOOZ}</div></div>
                  <button className="btn" onClick={()=>navigator.clipboard.writeText(DON_FLOOZ)}>Copier</button>
                </div>
                <div className="row" style={{justifyContent:"space-between"}}>
                  <div><div style={{fontWeight:600}}>TMoney (Togo)</div><div className="small">{DON_TMONEY}</div></div>
                  <button className="btn" onClick={()=>navigator.clipboard.writeText(DON_TMONEY)}>Copier</button>
                </div>
              </div>
            </div>
            <div className="card small">Progrès sauvegardé automatiquement (localStorage).</div>
          </div>
        </div>
      )}

      {tab==="lire" && (
        <div className="card">
          <div style={{fontWeight:700, marginBottom:6}}>Lire la Bible (banque: {verseBank.length.toLocaleString()} versets)</div>
          <BibleReader verses={verseBank}/>
        </div>
      )}

      {tab==="import" && (
        <div className="card">
          <div className="grid" style={{gap:8}}>
            <div className="small">Importe un grand fichier JSON KJV (domaine public) avec les champs <b>book, chapter, verse, text</b> pour générer 1000+ questions.</div>
            <input type="file" accept="application/json" style={{display:"none"}} ref={fileInput} onChange={onFile} />
            <div className="row">
              <button className="btn" onClick={()=>fileInput.current?.click()}>Choisir un fichier .json</button>
              <a className="btn" href="bible_fr_sample.json" download>Exemple JSON</a>
            </div>
          </div>
        </div>
      )}

      {tab==="reglages" && (
        <div className="grid grid2">
          <div className="card">
            <div className="grid" style={{gap:8}}>
              <label className="small">Objectif de questions / session</label>
              <input className="input" type="number" min="5" max="100" value={goal} onChange={e=>{ const v = Number(e.target.value||20); const nv = Math.max(5, Math.min(100, v)); localStorage.setItem('sg_goal', JSON.stringify(nv)); }} />
              <div className="small">Ajuste le nombre de questions par partie.</div>
            </div>
          </div>
          <div className="card">
            <div className="grid" style={{gap:8}}>
              <div className="row" style={{justifyContent:"space-between"}}>
                <div>Activer AdSense</div>
                <input type="checkbox" checked={adsOn} onChange={e=>localStorage.setItem('sg_ads', JSON.stringify(e.target.checked)) || location.reload()} />
              </div>
              <div className="small">Mets ton ID <b>ca-pub-…</b> dans <code>app.js</code> et <code>index.html</code>.</div>
              <button className="btn" onClick={()=>{ alert('Ouvre app.js et index.html, remplace ca-pub-XXXXXXXX par ton ID, puis recharge.'); }}>Où mettre mon ID ?</button>
            </div>
          </div>
          <div className="card">
            <button className="btn" onClick={()=>{ if(confirm('Tout remettre à zéro ?')){ localStorage.clear(); location.reload(); } }}>Tout réinitialiser</button>
          </div>
        </div>
      )}

      <AdBox enabled={adsOn}/>

      <div className="footer">
        © 2025 SEGNIBO & DIEU QUIZ — Dons: Flooz +228 97829674 · TMoney +228 71258442
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
