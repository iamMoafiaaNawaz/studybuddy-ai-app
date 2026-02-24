import { useState, useRef, useEffect } from "react";

const GROQ_API_KEY = "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";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

async function callGroq(messages, system = "") {
  const msgs = system ? [{ role:"system", content:system }, ...messages] : messages;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json", Authorization:`Bearer ${GROQ_API_KEY}` },
    body:JSON.stringify({ model:GROQ_MODEL, messages:msgs, max_tokens:1800, temperature:0.7 }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || "API Error"); }
  return (await res.json()).choices[0].message.content;
}

const SUBJECTS = [
  { id:"general", label:"General",         icon:"🌐" },
  { id:"math",    label:"Mathematics",      icon:"📐" },
  { id:"science", label:"Science",          icon:"🔬" },
  { id:"history", label:"History",          icon:"📜" },
  { id:"english", label:"English",          icon:"📖" },
  { id:"cs",      label:"Computer Science", icon:"💻" },
  { id:"bio",     label:"Biology",          icon:"🧬" },
  { id:"physics", label:"Physics",          icon:"⚛️"  },
  { id:"chem",    label:"Chemistry",        icon:"⚗️"  },
  { id:"econ",    label:"Economics",        icon:"📊" },
];

const Q_TYPES = [
  { id:"mcq",   label:"Multiple Choice", icon:"⊙", desc:"4-option MCQs with auto-grading"    },
  { id:"short", label:"Short Answer",    icon:"✎", desc:"Concise 2–3 sentence answers"       },
  { id:"long",  label:"Essay",           icon:"≡", desc:"Long-form with outline guide"        },
  { id:"fill",  label:"Fill in Blanks",  icon:"▭", desc:"Complete the sentence"              },
  { id:"case",  label:"Case Study",      icon:"◎", desc:"Real-world scenario questions"      },
];

const DIFF = [
  { id:"Easy",   label:"Beginner",     color:"#10B981", bg:"#ECFDF5" },
  { id:"Medium", label:"Intermediate", color:"#F59E0B", bg:"#FFFBEB" },
  { id:"Hard",   label:"Advanced",     color:"#EF4444", bg:"#FEF2F2" },
];

const C = {
  bg:"#F7F8FC", card:"#FFFFFF", border:"#E4E7F0",
  text:"#0F172A", muted:"#64748B", light:"#94A3B8",
  accent:"#4F46E5", accent2:"#7C3AED",
  success:"#10B981", warn:"#F59E0B", danger:"#EF4444",
};

export default function App() {
  const [tab, setTab]   = useState("home");
  const [cfg, setCfg]   = useState({ subject:"general", difficulty:"Medium", type:"mcq", n:5, topic:"" });
  const [quiz, setQuiz] = useState(null);
  const [busy, setBusy] = useState(false);

  const [sumIn, setSumIn]     = useState("");
  const [sumOut, setSumOut]   = useState("");
  const [sumN, setSumN]       = useState(3);
  const [sumBusy, setSumBusy] = useState(false);

  const [expTopic, setExpTopic] = useState("");
  const [expLvl, setExpLvl]     = useState("simple");
  const [expOut, setExpOut]     = useState("");
  const [expBusy, setExpBusy]   = useState(false);

  const [msgs, setMsgs]         = useState([]);
  const [chatIn, setChatIn]     = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const mem    = useRef([]);
  const endRef = useRef(null);

  const [notes, setNotes]   = useState({});
  const [nTitle, setNTitle] = useState("");
  const [nBody, setNBody]   = useState("");

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const generateQuiz = async () => {
    setBusy(true);
    const subLabel = SUBJECTS.find(s => s.id === cfg.subject)?.label || "General";
    const topicStr = cfg.topic.trim() || subLabel;
    const p = {
      mcq:`Generate exactly ${cfg.n} multiple-choice questions about "${topicStr}" (${subLabel}, ${cfg.difficulty} level).
Use EXACTLY this format with no extra text:
Q1: [question]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [A or B or C or D]
EXPLAIN: [one sentence]
---
Q2: ...and so on`,

      short:`Generate exactly ${cfg.n} short-answer questions about "${topicStr}" (${subLabel}, ${cfg.difficulty} level).
EXACT format:
Q1: [question]
ANSWER: [2-3 sentence model answer]
KEYPOINTS: [point1 | point2 | point3]
---`,

      long:`Generate exactly ${cfg.n} essay questions about "${topicStr}" (${subLabel}, ${cfg.difficulty} level).
EXACT format:
Q1: [question]
OUTLINE: [key point 1 | key point 2 | key point 3 | key point 4]
MARKS: [X]/10
---`,

      fill:`Generate exactly ${cfg.n} fill-in-the-blank questions about "${topicStr}" (${subLabel}, ${cfg.difficulty} level).
EXACT format:
Q1: [sentence with _____ for the blank]
ANSWER: [correct word or phrase]
HINT: [helpful hint]
---`,

      case:`Generate 2 case studies about "${topicStr}" (${subLabel}, ${cfg.difficulty} level).
EXACT format:
SCENARIO: [2-3 sentence real-world situation]
Q1: [analytical question]
ANSWER: [model answer]
Q2: [second question on same scenario]
ANSWER: [model answer]
---`,
    };
    try {
      const raw = await callGroq([{ role:"user", content:p[cfg.type] }],
        "You are an expert academic quiz creator. Follow the format exactly. Every MCQ must have exactly 4 options: A) B) C) D). Do not add anything outside the format.");
      setQuiz({ raw, ...cfg, subLabel, topicStr });
      setTab("quiz");
    } catch(e) { alert("Error generating quiz: " + e.message); }
    setBusy(false);
  };

  const doSummarize = async () => {
    if (!sumIn.trim()) return;
    setSumBusy(true); setSumOut("");
    try {
      const r = await callGroq([{ role:"user", content:`Summarize in exactly ${sumN} concise sentences. Focus on the most important key points:\n\n${sumIn}` }],
        "You are an expert at creating clear, accurate academic summaries.");
      setSumOut(r);
    } catch(e) { setSumOut("Error: " + e.message); }
    setSumBusy(false);
  };

  const doExplain = async () => {
    if (!expTopic.trim()) return;
    setExpBusy(true); setExpOut("");
    const lvl = {
      simple:"Explain for a complete beginner. Use simple everyday analogies and avoid jargon.",
      medium:"Explain with moderate technical detail for someone with basic knowledge.",
      detailed:"Give a comprehensive, technically detailed explanation for an advanced student.",
    };
    try {
      const r = await callGroq([{ role:"user", content:`${lvl[expLvl]}\n\nConcept: ${expTopic}\n\nInclude:\n1. Simple definition\n2. Real-world example\n3. Three key takeaways` }],
        "You are an expert educator. Explain concepts clearly and engagingly.");
      setExpOut(r);
    } catch(e) { setExpOut("Error: " + e.message); }
    setExpBusy(false);
  };

  const doChat = async () => {
    if (!chatIn.trim() || chatBusy) return;
    const txt = chatIn.trim(); setChatIn("");
    setMsgs(p => [...p, { role:"user", text:txt }]);
    mem.current.push({ role:"user", content:txt });
    setChatBusy(true);
    try {
      const r = await callGroq(mem.current, "You are a knowledgeable AI study tutor. Answer questions clearly, concisely, and with helpful examples.");
      setMsgs(p => [...p, { role:"assistant", text:r }]);
      mem.current.push({ role:"assistant", content:r });
    } catch(e) { setMsgs(p => [...p, { role:"assistant", text:"Error: " + e.message }]); }
    setChatBusy(false);
  };

  const NAV = [
    { id:"home",      label:"Home"      },
    { id:"setup",     label:"Quiz"      },
    { id:"summarize", label:"Summarize" },
    { id:"explain",   label:"Explain"   },
    { id:"chat",      label:"Chat"      },
    { id:"notes",     label:"Notes"     },
  ];

  const Spinner = () => (
    <div style={{ width:"16px", height:"16px", border:"2.5px solid rgba(255,255,255,0.35)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", flexShrink:0 }}/>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Plus Jakarta Sans', sans-serif", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#DDE1EE; border-radius:8px; }
        input, textarea, button { font-family:'Plus Jakarta Sans', sans-serif; }
        input:focus, textarea:focus { outline:2px solid ${C.accent}; outline-offset:-1px; }
        textarea { resize:vertical; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width:640px) {
          .top-nav { display:none !important; }
          .mobile-nav { display:flex !important; }
          .hero-h1 { font-size:24px !important; }
          .hero-btns { flex-direction:column !important; align-items:stretch !important; }
          .page-wrap { padding:16px 14px 90px 14px !important; }
        }
        @media (min-width:641px) {
          .mobile-nav { display:none !important; }
          .top-nav { display:flex !important; }
        }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .fu { animation:fadeUp 0.3s ease forwards; }
        .btn {
          cursor:pointer; border:none; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700;
          transition:all 0.18s; display:inline-flex; align-items:center; justify-content:center; gap:7px;
        }
        .btn:hover:not(:disabled) { filter:brightness(1.06); transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,0.1); }
        .btn:active:not(:disabled) { transform:translateY(0); }
        .btn:disabled { opacity:0.55; cursor:not-allowed; transform:none !important; filter:none !important; }
        .inp {
          width:100%; padding:11px 14px; border-radius:9px;
          border:1.5px solid ${C.border}; font-size:14px; color:${C.text};
          background:#FAFBFF; transition:border-color 0.18s;
        }
        .inp:focus { border-color:${C.accent}; background:#fff; }
        .card { background:${C.card}; border:1px solid ${C.border}; border-radius:14px; }
        .tag {
          display:inline-flex; align-items:center; padding:3px 10px;
          border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.3px;
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:"52px", position:"sticky", top:0, zIndex:300 }}>
        <div onClick={() => setTab("home")} style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", flexShrink:0 }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"7px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"14px" }}>S</div>
          <span style={{ fontFamily:"'DM Serif Display', serif", fontWeight:400, fontSize:"16px", letterSpacing:"0px" }}>StudyBuddy <span style={{ color:C.accent }}>AI</span></span>
        </div>
        <div style={{ display:"flex", gap:"2px" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} className="btn"
              style={{ padding:"5px 10px", borderRadius:"6px", background:tab===n.id?`${C.accent}12`:"transparent", color:tab===n.id?C.accent:C.muted, fontSize:"12px", fontWeight:tab===n.id?700:500 }}>
              {n.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ══════════════════════════════ HOME ══════════════════════════════════ */}
      {tab === "home" && (
        <div className="page-wrap" style={{ maxWidth:"960px", margin:"0 auto", padding:"36px 28px 40px" }}>

          {/* Hero */}
          <div className="fu" style={{ textAlign:"center", marginBottom:"44px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"5px 14px", borderRadius:"20px", background:`${C.accent}10`, border:`1px solid ${C.accent}25`, marginBottom:"24px" }}>
              <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:C.accent, display:"inline-block" }}/>
              <span style={{ fontSize:"11px", fontWeight:700, color:C.accent, letterSpacing:"0.8px" }}>POWERED BY GROQ AI · GAME FRAMEWORK</span>
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display', serif", fontWeight:400, fontSize:"44px", lineHeight:1.25, letterSpacing:"0px", marginBottom:"16px" }}>
              Your Intelligent{" "}
              <span style={{ background:`linear-gradient(135deg,${C.accent},${C.accent2})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Study Assistant</span>
            </h1>
            <p style={{ fontSize:"15px", color:C.muted, maxWidth:"440px", margin:"0 auto 32px", lineHeight:1.7, fontWeight:500 }}>
              Generate quizzes, summarize content, explain concepts, and save notes — all powered by advanced AI.
            </p>
            <div style={{ display:"flex", gap:"12px", justifyContent:"center" }}>
              <button className="btn" onClick={() => setTab("setup")}
                style={{ padding:"14px 32px", borderRadius:"10px", fontSize:"14px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", boxShadow:`0 8px 24px ${C.accent}35`, letterSpacing:"0.2px" }}>
                Start Studying →
              </button>
              <button className="btn" onClick={() => setTab("chat")}
                style={{ padding:"14px 28px", borderRadius:"10px", fontSize:"14px", background:C.card, color:C.text, border:`1.5px solid ${C.border}`, fontWeight:600 }}>
                Talk to AI Tutor
              </button>
            </div>
          </div>

          {/* Feature grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"14px" }}>
            {[
              { icon:"⊙", label:"Smart Quizzes",     desc:"MCQ, Short Answer, Essay, Fill-in-the-Blanks, and Case Studies — all AI-generated.", color:C.accent,   sc:"setup"     },
              { icon:"≡", label:"Text Summarizer",   desc:"Paste any text and instantly get a concise summary highlighting the key points.",      color:"#7C3AED",  sc:"summarize" },
              { icon:"💡",label:"Concept Explainer", desc:"Understand any concept at beginner, intermediate, or advanced level with examples.",    color:"#0EA5E9",  sc:"explain"   },
              { icon:"◎", label:"AI Chat Tutor",     desc:"Ask any question. Get instant, clear, and accurate answers from your AI tutor.",       color:C.success,  sc:"chat"      },
              { icon:"✎", label:"Study Notes",       desc:"Save and organize your important notes to access them anytime during the session.",     color:C.warn,     sc:"notes"     },
              { icon:"⚡",label:"GAME Framework",    desc:"Built on Goal, Action, Memory & Environment architecture for intelligent responses.",   color:C.danger,   sc:"home"      },
            ].map((f,i) => (
              <div key={i} className="card fu btn" onClick={() => setTab(f.sc)}
                style={{ padding:"24px", cursor:"pointer", textAlign:"left", animationDelay:`${i*0.07}s`, transition:"border-color 0.2s, box-shadow 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=f.color; e.currentTarget.style.boxShadow=`0 4px 20px ${f.color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow="none"; }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"9px", background:`${f.color}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", marginBottom:"14px" }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight:700, fontSize:"14px", marginBottom:"7px" }}>{f.label}</div>
                <div style={{ fontSize:"13px", color:C.muted, lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════ QUIZ SETUP ════════════════════════════ */}
      {tab === "setup" && (
        <div style={{ maxWidth:"640px", margin:"0 auto", padding:"40px 28px" }}>
          <div className="fu card" style={{ padding:"36px" }}>
            <h2 style={{ fontFamily:"'DM Serif Display', serif", fontWeight:400, fontSize:"30px", letterSpacing:"0px", marginBottom:"6px" }}>Create a Quiz</h2>
            <p style={{ color:C.muted, fontSize:"13px", marginBottom:"30px" }}>Configure your personalized quiz below</p>

            {/* Topic */}
            <Label>Topic</Label>
            <input className="inp" value={cfg.topic} onChange={e=>setCfg(p=>({...p,topic:e.target.value}))}
              placeholder="e.g. Newton's Laws, World War II, Binary Trees..."
              style={{ marginBottom:"22px" }} />

            {/* Subject */}
            <Label>Subject</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", marginBottom:"22px" }}>
              {SUBJECTS.map(s => (
                <button key={s.id} onClick={() => setCfg(p=>({...p,subject:s.id}))} className="btn"
                  style={{ padding:"7px 13px", borderRadius:"7px", fontSize:"12px", fontWeight:600, border:`1.5px solid ${cfg.subject===s.id?C.accent:C.border}`, background:cfg.subject===s.id?`${C.accent}10`:C.card, color:cfg.subject===s.id?C.accent:C.muted }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <Label>Difficulty</Label>
            <div style={{ display:"flex", gap:"9px", marginBottom:"22px" }}>
              {DIFF.map(d => (
                <button key={d.id} onClick={() => setCfg(p=>({...p,difficulty:d.id}))} className="btn"
                  style={{ flex:1, padding:"11px", borderRadius:"9px", fontSize:"13px", border:`1.5px solid ${cfg.difficulty===d.id?d.color:C.border}`, background:cfg.difficulty===d.id?d.bg:C.card, color:cfg.difficulty===d.id?d.color:C.muted }}>
                  {d.label}
                </button>
              ))}
            </div>

            {/* Question type */}
            <Label>Question Type</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))", gap:"7px", marginBottom:"22px" }}>
              {Q_TYPES.map(q => (
                <button key={q.id} onClick={() => setCfg(p=>({...p,type:q.id}))} className="btn"
                  style={{ padding:"13px 6px", borderRadius:"9px", fontSize:"10px", fontWeight:700, border:`1.5px solid ${cfg.type===q.id?C.accent:C.border}`, background:cfg.type===q.id?`${C.accent}10`:C.card, color:cfg.type===q.id?C.accent:C.muted, flexDirection:"column", gap:"5px" }}>
                  <span style={{ fontSize:"17px" }}>{q.icon}</span>
                  <span style={{ lineHeight:1.3, textAlign:"center" }}>{q.label}</span>
                </button>
              ))}
            </div>

            {/* Number */}
            {cfg.type !== "case" && (
              <div style={{ marginBottom:"26px" }}>
                <Label>Number of Questions — <span style={{ color:C.accent, fontWeight:800 }}>{cfg.n}</span></Label>
                <input type="range" min="3" max="10" value={cfg.n} onChange={e=>setCfg(p=>({...p,n:+e.target.value}))}
                  style={{ width:"100%", accentColor:C.accent, marginTop:"8px" }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:C.light, marginTop:"4px" }}><span>3</span><span>10</span></div>
              </div>
            )}

            <button className="btn" onClick={generateQuiz} disabled={busy}
              style={{ width:"100%", padding:"14px", borderRadius:"10px", fontSize:"14px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", boxShadow:busy?"none":`0 6px 20px ${C.accent}30` }}>
              {busy ? <><Spinner/>Generating Quiz...</> : "Generate Quiz →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ QUIZ VIEW ════════════════════════════ */}
      {tab === "quiz" && quiz && (
        <QuizDisplay quiz={quiz} onBack={() => setTab("setup")} onNew={() => { setQuiz(null); setTab("setup"); }} />
      )}

      {/* ══════════════════════════════ SUMMARIZE ════════════════════════════ */}
      {tab === "summarize" && (
        <div style={{ maxWidth:"680px", margin:"0 auto", padding:"40px 28px" }}>
          <div className="fu card" style={{ padding:"36px" }}>
            <h2 style={{ fontFamily:"'DM Serif Display', serif", fontWeight:400, fontSize:"30px", letterSpacing:"0px", marginBottom:"6px" }}>Text Summarizer</h2>
            <p style={{ color:C.muted, fontSize:"14px", marginBottom:"28px" }}>Paste any text and get a focused, concise summary</p>

            <Label>Input Text</Label>
            <textarea className="inp" value={sumIn} onChange={e=>setSumIn(e.target.value)}
              placeholder="Paste your paragraph, article, or notes here..." rows={7}
              style={{ marginBottom:"18px" }}/>

            <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"24px" }}>
              <Label style={{ whiteSpace:"nowrap", margin:0 }}>Length: <span style={{ color:C.accent }}>{sumN} sentence{sumN>1?"s":""}</span></Label>
              <input type="range" min="1" max="8" value={sumN} onChange={e=>setSumN(+e.target.value)} style={{ flex:1, accentColor:C.accent }}/>
            </div>

            <button className="btn" onClick={doSummarize} disabled={sumBusy||!sumIn.trim()}
              style={{ width:"100%", padding:"13px", borderRadius:"10px", fontSize:"14px", background:"linear-gradient(135deg,#7C3AED,#A855F7)", color:"#fff", marginBottom:"18px" }}>
              {sumBusy ? <><Spinner/>Summarizing...</> : "Summarize →"}
            </button>

            {sumOut && (
              <div className="fu" style={{ padding:"20px", background:"#FAFBFF", borderRadius:"10px", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:"11px", fontWeight:700, color:C.accent, marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.6px" }}>Summary</div>
                <p style={{ fontSize:"14px", lineHeight:1.85, color:C.text }}>{sumOut}</p>
                <div style={{ marginTop:"12px", fontSize:"12px", color:C.light }}>~{sumIn.split(" ").length} words → {sumN} sentence{sumN>1?"s":""}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════ EXPLAIN ══════════════════════════════ */}
      {tab === "explain" && (
        <div style={{ maxWidth:"680px", margin:"0 auto", padding:"40px 28px" }}>
          <div className="fu card" style={{ padding:"36px" }}>
            <h2 style={{ fontFamily:"'DM Serif Display', serif", fontWeight:400, fontSize:"30px", letterSpacing:"0px", marginBottom:"6px" }}>Concept Explainer</h2>
            <p style={{ color:C.muted, fontSize:"14px", marginBottom:"28px" }}>Enter any concept and get a clear, structured explanation</p>

            <Label>Concept</Label>
            <input className="inp" value={expTopic} onChange={e=>setExpTopic(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doExplain()}
              placeholder="e.g. Machine Learning, Photosynthesis, Recursion..."
              style={{ marginBottom:"20px" }}/>

            <Label>Level</Label>
            <div style={{ display:"flex", gap:"9px", marginBottom:"26px" }}>
              {[["simple","Beginner",C.success],["medium","Intermediate",C.warn],["detailed","Advanced",C.danger]].map(([id,label,color])=>(
                <button key={id} onClick={()=>setExpLvl(id)} className="btn"
                  style={{ flex:1, padding:"11px", borderRadius:"9px", fontSize:"13px", border:`1.5px solid ${expLvl===id?color:C.border}`, background:expLvl===id?`${color}12`:C.card, color:expLvl===id?color:C.muted }}>
                  {label}
                </button>
              ))}
            </div>

            <button className="btn" onClick={doExplain} disabled={expBusy||!expTopic.trim()}
              style={{ width:"100%", padding:"13px", borderRadius:"10px", fontSize:"14px", background:"linear-gradient(135deg,#0EA5E9,#0284C7)", color:"#fff", marginBottom:"18px" }}>
              {expBusy ? <><Spinner/>Explaining...</> : "Explain →"}
            </button>

            {expOut && (
              <div className="fu" style={{ padding:"20px", background:"#FAFBFF", borderRadius:"10px", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:"11px", fontWeight:700, color:"#0EA5E9", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.6px" }}>{expTopic}</div>
                <p style={{ fontSize:"14px", lineHeight:1.9, color:C.text, whiteSpace:"pre-wrap" }}>{expOut}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════ CHAT ══════════════════════════════════ */}
      {tab === "chat" && (
        <div style={{ maxWidth:"660px", margin:"0 auto", padding:"24px 28px", height:"calc(100vh - 56px)", display:"flex", flexDirection:"column" }}>
          <div className="fu card" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:"11px" }}>
              <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:`linear-gradient(135deg,${C.success},#059669)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"13px" }}>AI</div>
              <div>
                <div style={{ fontWeight:700, fontSize:"14px" }}>AI Study Tutor</div>
                <div style={{ fontSize:"11px", color:C.success, fontWeight:600 }}>● Online</div>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:"13px" }}>
              {msgs.length===0 && (
                <div style={{ textAlign:"center", padding:"36px 20px" }}>
                  <div style={{ fontSize:"40px", marginBottom:"12px" }}>👋</div>
                  <div style={{ fontWeight:700, fontSize:"16px", marginBottom:"7px" }}>Hi! I'm your AI Study Tutor</div>
                  <div style={{ color:C.muted, fontSize:"13px", marginBottom:"22px" }}>Ask me anything — any subject, any concept</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", justifyContent:"center" }}>
                    {["Explain photosynthesis","What is machine learning?","How does gravity work?","What is the French Revolution?"].map(s=>(
                      <button key={s} onClick={()=>setChatIn(s)} className="btn"
                        style={{ padding:"8px 14px", borderRadius:"18px", border:`1.5px solid ${C.border}`, background:C.card, color:C.accent, fontSize:"12px", fontWeight:600 }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m,i)=>(
                <div key={i} className="fu" style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                  <div style={{ maxWidth:"76%", padding:"11px 15px", borderRadius:m.role==="user"?"14px 14px 3px 14px":"14px 14px 14px 3px", background:m.role==="user"?`linear-gradient(135deg,${C.accent},${C.accent2})`:"#F1F3F8", color:m.role==="user"?"#fff":C.text, fontSize:"13px", lineHeight:1.75, fontWeight:500, whiteSpace:"pre-wrap" }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatBusy && (
                <div style={{ display:"flex", gap:"4px", padding:"11px 15px", background:"#F1F3F8", borderRadius:"14px 14px 14px 3px", width:"fit-content" }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:"7px", height:"7px", borderRadius:"50%", background:C.accent, animation:"pulse 1.1s ease infinite", animationDelay:`${i*0.18}s` }}/>)}
                </div>
              )}
              <div ref={endRef}/>
            </div>

            <div style={{ padding:"13px 18px", borderTop:`1px solid ${C.border}`, display:"flex", gap:"9px" }}>
              <input className="inp" value={chatIn} onChange={e=>setChatIn(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&doChat()} placeholder="Ask your question..." style={{ flex:1 }}/>
              <button className="btn" onClick={doChat} disabled={chatBusy||!chatIn.trim()}
                style={{ padding:"11px 18px", borderRadius:"9px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", fontSize:"15px", flexShrink:0 }}>→</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ NOTES ════════════════════════════════ */}
      {tab === "notes" && (
        <div style={{ maxWidth:"860px", margin:"0 auto", padding:"40px 28px" }}>
          <h2 style={{ fontFamily:"'DM Serif Display', serif", fontWeight:400, fontSize:"30px", letterSpacing:"0px", marginBottom:"22px" }}>Study Notes</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"18px" }}>
            <div className="fu card" style={{ padding:"24px" }}>
              <div style={{ fontWeight:700, fontSize:"14px", marginBottom:"16px" }}>Add New Note</div>
              <input className="inp" value={nTitle} onChange={e=>setNTitle(e.target.value)} placeholder="Title..."
                style={{ marginBottom:"9px" }}/>
              <textarea className="inp" value={nBody} onChange={e=>setNBody(e.target.value)} placeholder="Write your notes..." rows={7}
                style={{ marginBottom:"13px" }}/>
              <button className="btn" onClick={()=>{ if(nTitle&&nBody){ setNotes(p=>({...p,[nTitle]:{body:nBody,date:new Date().toLocaleDateString()}})); setNTitle(""); setNBody(""); }}}
                style={{ width:"100%", padding:"11px", borderRadius:"9px", background:`linear-gradient(135deg,${C.success},#059669)`, color:"#fff", fontSize:"13px" }}>
                Save Note
              </button>
            </div>

            <div>
              <div style={{ fontWeight:600, fontSize:"12px", color:C.muted, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"12px" }}>Saved Notes · {Object.keys(notes).length}</div>
              {Object.keys(notes).length===0 ? (
                <div className="card" style={{ padding:"48px", textAlign:"center", color:C.muted }}>
                  <div style={{ fontSize:"32px", marginBottom:"10px" }}>📭</div>
                  <div style={{ fontWeight:600, fontSize:"14px" }}>No notes yet</div>
                  <div style={{ fontSize:"12px", marginTop:"4px" }}>Add your first note</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"9px", maxHeight:"520px", overflowY:"auto" }}>
                  {Object.entries(notes).map(([title,{body,date}],i)=>{
                    const accent=[C.accent,"#7C3AED",C.success,C.warn,"#0EA5E9"][i%5];
                    return (
                      <div key={title} className="card fu" style={{ padding:"14px 16px", borderLeft:`3px solid ${accent}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
                          <div style={{ fontWeight:700, fontSize:"13px" }}>{title}</div>
                          <div style={{ display:"flex", gap:"10px", alignItems:"center", flexShrink:0 }}>
                            <span style={{ fontSize:"11px", color:C.light }}>{date}</span>
                            <button onClick={()=>setNotes(p=>{const n={...p};delete n[title];return n;})}
                              style={{ background:"none", border:"none", cursor:"pointer", color:C.light, fontSize:"17px", lineHeight:1, padding:"0 2px" }}>×</button>
                          </div>
                        </div>
                        <div style={{ fontSize:"12px", color:C.muted, lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{body}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav" style={{ position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"1px solid #E4E7F0", zIndex:500, justifyContent:"space-around", alignItems:"center", padding:"6px 0 10px", boxShadow:"0 -4px 20px rgba(0,0,0,0.06)" }}>
        {NAV.map(n => {
          const icons = { home:"⌂", setup:"?", summarize:"≡", explain:"💡", chat:"💬", notes:"📓" };
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} className="btn"
              style={{ flexDirection:"column", gap:"2px", padding:"4px 8px", background:"transparent", color:active?C.accent:C.light, fontSize:"10px", fontWeight:active?700:500, minWidth:"48px" }}>
              <span style={{ fontSize:"18px", lineHeight:1 }}>{icons[n.id]}</span>
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>
      {/* FOOTER */}
      <footer style={{ marginTop:'40px', borderTop:'1px solid #E4E7F0', background:'#fff', padding:'28px', textAlign:'center' }}>
        <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:'18px', color:'#0F172A', marginBottom:'6px' }}>StudyBuddy <span style={{ color:'#4F46E5' }}>AI</span></div>
        <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'10px' }}>Powered by Groq AI · Built with GAME Framework</div>
        <div style={{ fontSize:'11px', color:'#CBD5E1' }}>© 2025 StudyBuddy AI · All rights reserved</div>
      </footer>
    </div>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────
function Label({ children, style }) {
  return <div style={{ fontWeight:700, fontSize:"11px", color:"#64748B", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:"8px", ...style }}>{children}</div>;
}

// ════════════════════════════════════════════════════════════════════════════
//  QUIZ DISPLAY
// ════════════════════════════════════════════════════════════════════════════
function QuizDisplay({ quiz, onBack, onNew }) {
  const { raw, type, subLabel, difficulty, topicStr } = quiz;
  const [answers, setAnswers]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [shown, setShown]         = useState({});

  const dc = { Easy:"#10B981", Medium:"#F59E0B", Hard:"#EF4444" };

  const parseMCQ = () => raw.split(/---+/).filter(b=>b.trim()).map((blk,i)=>{
    const lines = blk.trim().split("\n").map(l=>l.trim()).filter(Boolean);
    const q = { id:i, question:"", opts:["","","",""], correct:"", explain:"" };
    lines.forEach(l=>{
      if      (/^Q\d+:/i.test(l))    q.question   = l.replace(/^Q\d+:\s*/i,"");
      else if (/^A\)/i.test(l))      q.opts[0]    = l.slice(3).trim();
      else if (/^B\)/i.test(l))      q.opts[1]    = l.slice(3).trim();
      else if (/^C\)/i.test(l))      q.opts[2]    = l.slice(3).trim();
      else if (/^D\)/i.test(l))      q.opts[3]    = l.slice(3).trim();
      else if (/^CORRECT:/i.test(l)) q.correct    = l.replace(/^CORRECT:\s*/i,"").trim().charAt(0).toUpperCase();
      else if (/^EXPLAIN:/i.test(l)) q.explain    = l.replace(/^EXPLAIN:\s*/i,"");
    });
    return q;
  }).filter(q=>q.question && q.opts.filter(Boolean).length===4);

  const parseGeneral = () => raw.split(/---+/).filter(b=>b.trim()).map((blk,i)=>{
    const lines = blk.trim().split("\n").map(l=>l.trim()).filter(Boolean);
    const q = { id:i, question:"", answer:"", extra:"", outline:"", marks:"" };
    lines.forEach(l=>{
      if      (/^Q\d+:/i.test(l))          q.question = l.replace(/^Q\d+:\s*/i,"");
      else if (/^ANSWER:/i.test(l))        q.answer   = l.replace(/^ANSWER:\s*/i,"");
      else if (/^KEYPOINTS:/i.test(l))     q.extra    = l.replace(/^KEYPOINTS:\s*/i,"");
      else if (/^HINT:/i.test(l))          q.extra    = l.replace(/^HINT:\s*/i,"");
      else if (/^OUTLINE:/i.test(l))       q.outline  = l.replace(/^OUTLINE:\s*/i,"");
      else if (/^MARKS:/i.test(l))         q.marks    = l.replace(/^MARKS:\s*/i,"");
    });
    return q;
  }).filter(q=>q.question);

  const parseCase = () => raw.split(/---+/).filter(b=>b.trim()).map((blk,i)=>{
    const lines = blk.trim().split("\n").map(l=>l.trim()).filter(Boolean);
    const cs = { id:i, scenario:"", qs:[] };
    let cur = null;
    lines.forEach(l=>{
      if      (/^SCENARIO:/i.test(l))          cs.scenario = l.replace(/^SCENARIO:\s*/i,"");
      else if (/^Q\d+:/i.test(l))              { cur={q:l.replace(/^Q\d+:\s*/i,""),a:""}; cs.qs.push(cur); }
      else if (/^ANSWER:/i.test(l) && cur)     cur.a = l.replace(/^ANSWER:\s*/i,"");
    });
    return cs;
  }).filter(c=>c.scenario&&c.qs.length);

  const QHeader = () => (
    <div className="fu card" style={{ padding:"14px 20px", marginBottom:"18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <div style={{ fontFamily:"'DM Serif Display', serif", fontWeight:800, fontSize:"17px", marginBottom:"6px" }}>{topicStr}</div>
        <div style={{ display:"flex", gap:"6px" }}>
          <span className="tag" style={{ background:`${C.accent}12`, color:C.accent }}>{subLabel}</span>
          <span className="tag" style={{ background:`${dc[difficulty]}12`, color:dc[difficulty] }}>{difficulty}</span>
          <span className="tag" style={{ background:"#F1F3F8", color:C.muted }}>{type==="mcq"?"Multiple Choice":type==="short"?"Short Answer":type==="long"?"Essay":type==="fill"?"Fill in Blanks":"Case Study"}</span>
        </div>
      </div>
      <div style={{ display:"flex", gap:"8px" }}>
        <button className="btn" onClick={onBack} style={{ padding:"8px 14px", borderRadius:"8px", background:C.bg, color:C.muted, fontSize:"12px", border:`1px solid ${C.border}` }}>← Back</button>
        <button className="btn" onClick={onNew}  style={{ padding:"8px 14px", borderRadius:"8px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", fontSize:"12px" }}>New Quiz</button>
      </div>
    </div>
  );

  /* MCQ */
  if (type==="mcq") {
    const qs    = parseMCQ();
    const score = qs.filter(q=>answers[q.id]===q.correct).length;
    const pct   = qs.length ? Math.round(score/qs.length*100) : 0;
    const sc    = pct>=80?C.success:pct>=50?C.warn:C.danger;
    return (
      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"28px" }}>
        <QHeader/>
        {submitted && (
          <div className="fu" style={{ marginBottom:"18px", padding:"22px", borderRadius:"12px", background:`${sc}10`, border:`1px solid ${sc}30`, textAlign:"center" }}>
            <div style={{ fontFamily:"'DM Serif Display', serif", fontWeight:800, fontSize:"38px", color:sc }}>{pct}%</div>
            <div style={{ fontWeight:700, fontSize:"14px", marginTop:"3px" }}>Score: {score} / {qs.length} correct</div>
            <div style={{ fontSize:"12px", color:C.muted, marginTop:"4px" }}>{pct===100?"Perfect score!":pct>=80?"Excellent work!":pct>=60?"Good effort — review the explanations below":pct>=40?"Keep practicing!":"Review this topic and try again"}</div>
          </div>
        )}
        {qs.map((q,qi)=>{
          const ua=answers[q.id];
          const cor=submitted&&ua===q.correct;
          const wrg=submitted&&ua&&ua!==q.correct;
          return (
            <div key={q.id} className="fu card" style={{ padding:"20px", marginBottom:"12px", border:`1px solid ${submitted?(cor?C.success:wrg?C.danger:C.border):C.border}`, animationDelay:`${qi*0.04}s` }}>
              <div style={{ display:"flex", gap:"9px", marginBottom:"14px" }}>
                <span className="tag" style={{ background:`${C.accent}12`, color:C.accent, flexShrink:0, marginTop:"2px" }}>Q{qi+1}</span>
                <span style={{ fontWeight:600, fontSize:"14px", lineHeight:1.65 }}>{q.question}</span>
              </div>
              {/* Exactly 4 options */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"7px" }}>
                {["A","B","C","D"].map((letter,oi)=>{
                  const optText = q.opts[oi];
                  if (!optText) return null;
                  const sel       = ua===letter;
                  const isCorrect = submitted && letter===q.correct;
                  const isWrong   = submitted && sel && letter!==q.correct;
                  return (
                    <button key={letter} onClick={()=>!submitted&&setAnswers(a=>({...a,[q.id]:letter}))}
                      className="btn"
                      style={{ padding:"10px 13px", borderRadius:"9px", fontSize:"13px", fontWeight:500, textAlign:"left", justifyContent:"flex-start", cursor:submitted?"default":"pointer",
                        border:`1.5px solid ${isCorrect?C.success:isWrong?C.danger:sel?C.accent:C.border}`,
                        background:isCorrect?`${C.success}10`:isWrong?`${C.danger}08`:sel?`${C.accent}10`:C.bg,
                        color:isCorrect?C.success:isWrong?C.danger:sel?C.accent:C.text }}>
                      <span style={{ fontWeight:800, marginRight:"8px", color:isCorrect?C.success:isWrong?C.danger:C.muted, flexShrink:0 }}>{letter})</span>
                      {optText}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explain && (
                <div style={{ marginTop:"11px", padding:"9px 13px", background:`${C.accent}07`, borderRadius:"8px", fontSize:"12px", color:C.muted, borderLeft:`3px solid ${C.accent}` }}>
                  <strong style={{ color:C.accent }}>Explanation: </strong>{q.explain}
                </div>
              )}
            </div>
          );
        })}
        {!submitted
          ? <button className="btn" onClick={()=>setSubmitted(true)} style={{ width:"100%", padding:"14px", borderRadius:"10px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", fontSize:"14px", boxShadow:`0 6px 20px ${C.accent}30` }}>Submit Answers</button>
          : <button className="btn" onClick={onNew} style={{ width:"100%", padding:"14px", borderRadius:"10px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", fontSize:"14px" }}>Try Another Quiz</button>
        }
      </div>
    );
  }

  /* Short / Fill */
  if (type==="short"||type==="fill") {
    const qs=parseGeneral();
    return (
      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"28px" }}>
        <QHeader/>
        {qs.map((q,qi)=>(
          <div key={q.id} className="fu card" style={{ padding:"20px", marginBottom:"12px", animationDelay:`${qi*0.04}s` }}>
            <div style={{ display:"flex", gap:"9px", marginBottom:"11px" }}>
              <span className="tag" style={{ background:`${C.accent}12`, color:C.accent, flexShrink:0 }}>Q{qi+1}</span>
              <span style={{ fontWeight:600, fontSize:"14px", lineHeight:1.65 }}>{q.question}</span>
            </div>
            <textarea className="inp" placeholder={type==="fill"?"Type the missing word or phrase...":"Write your answer here..."} rows={3}
              value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>
            <button onClick={()=>setShown(p=>({...p,[q.id]:!p[q.id]}))}
              style={{ marginTop:"9px", padding:"7px 14px", borderRadius:"7px", border:`1px solid ${C.border}`, background:C.bg, color:C.muted, fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
              {shown[q.id]?"Hide Answer":"Show Model Answer"}
            </button>
            {shown[q.id] && (
              <div className="fu" style={{ marginTop:"9px", padding:"13px", background:`${C.success}08`, borderRadius:"9px", border:`1px solid ${C.success}25` }}>
                <div style={{ fontWeight:700, color:C.success, fontSize:"11px", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Model Answer</div>
                <div style={{ fontSize:"13px", lineHeight:1.75, color:C.text }}>{q.answer}</div>
                {q.extra && <div style={{ marginTop:"7px", fontSize:"12px", color:C.muted }}><strong>{type==="short"?"Key Points":"Hint"}:</strong> {q.extra}</div>}
              </div>
            )}
          </div>
        ))}
        <button className="btn" onClick={onNew} style={{ width:"100%", padding:"14px", borderRadius:"10px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", fontSize:"14px" }}>Try Another Quiz</button>
      </div>
    );
  }

  /* Essay */
  if (type==="long") {
    const qs=parseGeneral();
    return (
      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"28px" }}>
        <QHeader/>
        {qs.map((q,qi)=>(
          <div key={q.id} className="fu card" style={{ padding:"20px", marginBottom:"12px", animationDelay:`${qi*0.04}s` }}>
            <div style={{ display:"flex", gap:"9px", alignItems:"flex-start", marginBottom:"9px" }}>
              <span className="tag" style={{ background:`${C.accent}12`, color:C.accent, flexShrink:0 }}>Q{qi+1}</span>
              {q.marks && <span className="tag" style={{ background:`${C.warn}12`, color:C.warn }}>{q.marks}</span>}
            </div>
            <p style={{ fontWeight:600, fontSize:"14px", lineHeight:1.7, marginBottom:"12px" }}>{q.question}</p>
            <textarea className="inp" placeholder="Write your detailed answer here..." rows={6}
              value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>
            {q.outline && (
              <>
                <button onClick={()=>setShown(p=>({...p,[q.id]:!p[q.id]}))}
                  style={{ marginTop:"9px", padding:"7px 14px", borderRadius:"7px", border:`1px solid ${C.border}`, background:C.bg, color:C.muted, fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
                  {shown[q.id]?"Hide Outline":"Show Answer Outline"}
                </button>
                {shown[q.id] && (
                  <div className="fu" style={{ marginTop:"9px", padding:"13px", background:`${C.accent}06`, borderRadius:"9px", border:`1px solid ${C.accent}18` }}>
                    <div style={{ fontWeight:700, color:C.accent, fontSize:"11px", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Answer Outline</div>
                    {q.outline.split("|").map((pt,i)=>(
                      <div key={i} style={{ fontSize:"13px", color:C.text, padding:"3px 0", display:"flex", gap:"8px" }}>
                        <span style={{ color:C.accent, fontWeight:800, flexShrink:0 }}>{i+1}.</span>{pt.trim()}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <button className="btn" onClick={onNew} style={{ width:"100%", padding:"14px", borderRadius:"10px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", fontSize:"14px" }}>Try Another Quiz</button>
      </div>
    );
  }

  /* Case Study */
  if (type==="case") {
    const cases=parseCase();
    return (
      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"28px" }}>
        <QHeader/>
        {cases.map((cs,ci)=>(
          <div key={cs.id} className="fu card" style={{ marginBottom:"18px", overflow:"hidden", animationDelay:`${ci*0.1}s` }}>
            <div style={{ padding:"16px 20px", background:`${C.accent}06`, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, fontSize:"10px", color:C.accent, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"7px" }}>Case Study {ci+1}</div>
              <p style={{ fontSize:"14px", lineHeight:1.75, fontWeight:500 }}>{cs.scenario}</p>
            </div>
            <div style={{ padding:"20px" }}>
              {cs.qs.map((q,qi)=>(
                <div key={qi} style={{ marginBottom:"18px" }}>
                  <div style={{ display:"flex", gap:"9px", marginBottom:"9px" }}>
                    <span className="tag" style={{ background:`${C.accent}12`, color:C.accent, flexShrink:0 }}>Q{qi+1}</span>
                    <span style={{ fontWeight:600, fontSize:"13px", lineHeight:1.65 }}>{q.q}</span>
                  </div>
                  <textarea className="inp" placeholder="Write your answer here..." rows={4}
                    value={answers[`${ci}-${qi}`]||""} onChange={e=>setAnswers(a=>({...a,[`${ci}-${qi}`]:e.target.value}))}/>
                  {q.a && (
                    <>
                      <button onClick={()=>setShown(p=>({...p,[`${ci}-${qi}`]:!p[`${ci}-${qi}`]}))}
                        style={{ marginTop:"8px", padding:"7px 14px", borderRadius:"7px", border:`1px solid ${C.border}`, background:C.bg, color:C.muted, fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
                        {shown[`${ci}-${qi}`]?"Hide Answer":"Show Model Answer"}
                      </button>
                      {shown[`${ci}-${qi}`] && (
                        <div className="fu" style={{ marginTop:"7px", padding:"11px 14px", background:`${C.success}08`, borderRadius:"8px", border:`1px solid ${C.success}22`, fontSize:"13px", lineHeight:1.7 }}>
                          <strong style={{ color:C.success }}>Model Answer: </strong>{q.a}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="btn" onClick={onNew} style={{ width:"100%", padding:"14px", borderRadius:"10px", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, color:"#fff", fontSize:"14px" }}>Try Another Quiz</button>
      </div>
    );
  }
  return null;
}