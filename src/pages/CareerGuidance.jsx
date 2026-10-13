import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessagesSquare,
  Minus,
  Plus,
  ShieldCheck,
  Users,
  Video,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DIAL_CODES, Honeypot, Reveal, Row, captureUtms } from "../kit";
import { STATE_CITIES, STATES } from "../indiaStatesCities";

/**
 * Career Guidance Meet registration page — same content as the main site's
 * /career-guidance, but registration is free: the form posts to our server
 * (server/index.js), which stores the lead in MongoDB, then we go to /success.
 * Traffic comes from ads watched mostly by parents, so the tone is calm and
 * professional.
 */

// ─── Content ─────────────────────────────────────────────────────────────────

const EVENT_START = new Date("2026-10-18T10:30:00+05:30");

// TODO: replace with the new speaker photo once it's shared.
const SPEAKER_IMG = "/fs-assets/venkat-ramanan.webp";

// RTI Day testimonials (Bunny Stream library 680244, vertical 9:16), shown as a
// swipeable carousel with the speaker's name under each video.
// Played through Bunny's embed player, which handles HLS in every browser; they
// autoplay muted (browsers block autoplay with sound) and viewers can unmute.
const BUNNY_LIBRARY = "680244";
const TESTIMONIALS = [
  { id: "22082c5f-a1fc-45c4-a4e6-0ab0ad6be56f", name: "Sarvajith" },
  { id: "ac0d6605-cb43-497f-80d3-6d457e6c20b0", name: "Elakya" },
  { id: "e0f8779c-5a21-47d3-8ca9-33296d9233bb", name: "Akshaya" },
  { id: "a73ff229-1ed6-41d5-91c6-5f4bfdeeda3c", name: "Kishore" },
];

const EVENT_DETAILS = [
  { icon: CalendarDays, label: "Date", value: "Sun, 18th Oct 2026" },
  { icon: Clock, label: "Time", value: "10:30 AM – 12:30 PM" },
  { icon: Video, label: "Mode · Online", value: "Google Meet" },
];

const HIGHLIGHTS = [
  { icon: Users, text: "Open for Parents & Students" },
  { icon: MessagesSquare, text: "Live Q & A with CA K Venkat Ramanan" },
  { icon: ShieldCheck, text: "Secure online registration" },
];

const WHAT_YOU_GET = [
  "Discover the entry route to CA, immediately after 12th",
  "What is CA? — a complete understanding of the course.",
  "How does life during & after CA look like?",
  "Why CA matters?",
];

const AGENDA = [
  { time: "10:30 AM", title: "Welcoming the students & parents" },
  { time: "11:00 AM", title: "What is CA — a brief outlook" },
  { time: "11:30 AM", title: "Life during CA & life after CA" },
  { time: "12:00 Noon", title: "Live Q & A with CA K Venkat Ramanan" },
];

const FAQS = [
  {
    q: "Who can attend this meet?",
    a: "Parents & Students currently studying in 10th, 11th & 12th.",
  },
  {
    q: "How do we join the session?",
    a: "The meet link is sent to you as a WhatsApp message before the session.",
  },
  {
    q: "Can parents and the student attend together?",
    a: "Yes. One registration covers the student and their parents watching together from the same device.",
  },
  {
    q: "Does my child need to be in the Commerce stream?",
    a: "No. Students from any stream can attend — the session covers all career possibilities after 12th, not just CA.",
  },
  {
    q: "Will a recording be available?",
    // TODO(confirm): recording policy.
    a: "The session is live and interactive, so we recommend attending it live. Please contact us if you can't make it.",
  },
  {
    q: "Who do I contact for help?",
    a: "Call or WhatsApp us at +91 63835 14285 and our team will help you out.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
    ended: diff === 0,
  };
}

const pad = (n) => String(n).padStart(2, "0");

function SectionHeading({ label, title, sub }) {
  return (
    <Reveal>
      <p className="cg-label">{label}</p>
      <h2 className="cg-display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-3 text-xl text-slate-600">{sub}</p>}
    </Reveal>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function RegisterButton({ ended, onRegister, source, className = "", light = false }) {
  if (ended) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-7 py-4 text-xl font-bold text-slate-500 ${className}`}
      >
        Registrations closed
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onRegister(source)}
      className={`group ${light ? "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-xl font-bold text-[#13294b] transition-colors hover:bg-[#f3eee3]" : "cg-btn"} ${className}`}
    >
      Register Now
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function Nav({ ended, onRegister }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#e7e2d8] bg-[#fbfaf7]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <img src="/fs-assets/logo.webp" alt="FOCAS Edu" className="h-8 w-auto object-contain sm:h-9" />
        {!ended && (
          <button
            type="button"
            onClick={() => onRegister("nav")}
            className="whitespace-nowrap rounded-lg bg-[#13294b] px-4 py-2 text-base font-bold text-white transition-colors hover:bg-[#0c1d38] sm:text-lg"
          >
            Register
          </button>
        )}
      </div>
    </nav>
  );
}

function Countdown({ countdown }) {
  if (countdown.ended) return null;
  const units = [
    ["Days", countdown.d],
    ["Hours", countdown.h],
    ["Mins", countdown.m],
    ["Secs", countdown.s],
  ];
  return (
    <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="text-lg font-semibold text-slate-600">Session begins in</p>
      <div className="flex gap-2">
        {units.map(([label, v]) => (
          <div key={label} className="cg-card w-[4.5rem] py-2 text-center sm:w-20">
            <div className="cg-display text-2xl font-semibold tabular-nums sm:text-3xl">{pad(v)}</div>
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero({ countdown, onRegister }) {
  return (
    <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <div className="cg-rise">
          <p className="cg-label">FOCAS Edu presents</p>
          <h1 className="cg-display mt-4 text-[3.2rem] font-semibold leading-[1.05] sm:text-7xl">Career Guidance Meet</h1>
          <p className="mt-5 text-2xl font-semibold text-[#13294b] sm:text-2xl">
            Exclusively for{" "}
            <span className="border-b-2 border-[#a87b2a] pb-0.5">10th, 11th and 12th students</span>
          </p>
          <p className="mt-4 max-w-xl text-xl leading-relaxed text-slate-600 sm:text-2xl">
            Get clarity about CA — the course, the journey and the paths.
          </p>

          <dl className="cg-card mt-8 grid divide-y divide-[#e7e2d8] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {EVENT_DETAILS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5 sm:flex-col sm:items-start sm:gap-2">
                <Icon className="h-5 w-5 flex-shrink-0 text-[#a87b2a]" />
                <div>
                  <dt className="text-sm font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="whitespace-nowrap text-lg font-bold text-[#13294b] sm:text-lg">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <Countdown countdown={countdown} />
          <RegisterButton ended={countdown.ended} onRegister={onRegister} source="hero" className="mt-7 w-full sm:w-auto" />
          <p className="mt-3 text-lg text-slate-500">One registration covers the student and parents.</p>
        </div>

        <div className="cg-rise relative mx-auto w-full max-w-sm" style={{ animationDelay: ".15s" }}>
          <div aria-hidden className="absolute -right-3 -top-3 h-full w-full rounded-2xl border border-[#a87b2a]/50" />
          <figure className="relative overflow-hidden rounded-2xl bg-[#13294b] shadow-[0_30px_60px_-30px_rgba(19,41,75,.6)]">
            <div className="bg-[radial-gradient(circle_at_50%_30%,#24406e,#13294b_70%)] pt-8">
              <img src={SPEAKER_IMG} alt="CA K Venkat Ramanan" className="mx-auto h-80 w-auto object-contain object-bottom sm:h-[22rem]" />
            </div>
            <figcaption className="border-t border-white/10 bg-[#0f2240] px-6 py-4 text-white">
              <p className="cg-display text-2xl font-semibold !text-white">CA K Venkat Ramanan</p>
              <p className="text-lg text-white/70">Founder &amp; CEO, FOCAS Edu</p>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Highlights() {
  return (
    <section className="border-y border-[#e7e2d8] bg-white">
      <ul className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6">
        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-lg font-semibold text-[#13294b]">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#f3eee3] text-[#a87b2a]">
              <Icon className="h-4.5 w-4.5" />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function WhatYouGet() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading label="What you get" title="What your child will take away" />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2">
          {WHAT_YOU_GET.map((title, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <li className="cg-card flex h-full items-start gap-5 p-6">
                <span className="cg-display text-4xl font-semibold !text-[#a87b2a]">{pad(i + 1)}</span>
                <p className="pt-1.5 text-2xl font-semibold leading-snug text-[#13294b]">{title}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Agenda() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading label="Agenda for the day" title="How the two hours are planned" sub="Sunday, 18th October · 10:30 AM – 12:30 PM (IST)" />
        <Reveal>
          <ol className="divide-y divide-[#e7e2d8] border-y border-[#e7e2d8]">
            {AGENDA.map((item) => (
              <li key={item.time} className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4 py-5 sm:grid-cols-[10rem_1fr]">
                <span className="text-lg font-bold tabular-nums text-[#a87b2a]">{item.time}</span>
                <span className="cg-display text-2xl font-semibold sm:text-2xl">{item.title}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

function StudentVideos() {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  // Track which card is nearest the centre so the dots follow manual swipes too.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    [...track.children].forEach((el, i) => {
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (d < Math.abs(track.children[best].offsetLeft + track.children[best].offsetWidth / 2 - mid)) best = i;
    });
    setActive(best);
  };

  const goTo = (i) => {
    const n = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
    trackRef.current?.children[n]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActive(n);
  };

  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="py-16 sm:py-24">
      <style>{`
        .cg-vtrack { display:flex; gap:1.25rem; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none; -webkit-overflow-scrolling:touch; padding:0 1rem 1.5rem; }
        .cg-vtrack::-webkit-scrollbar { display:none; }
        .cg-vtrack > :first-child { margin-left:auto; }
        .cg-vtrack > :last-child { margin-right:auto; }
        .cg-vslide { flex:0 0 min(80vw, 22rem); scroll-snap-align:center; }
        @media (min-width:640px) { .cg-vtrack { gap:1.75rem; padding:0 1.5rem 1.5rem; } .cg-vslide { flex-basis:22rem; } }
        @media (min-width:1024px) { .cg-vslide { flex-basis:23rem; } }
      `}</style>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 px-4 text-center sm:px-6">
          <SectionHeading label="Testimonials" title="Hear from our students" />
        </div>
        <Reveal>
          <div ref={trackRef} onScroll={onScroll} className="cg-vtrack">
            {TESTIMONIALS.map((t, i) => (
              <figure key={t.id} className="cg-vslide cg-card overflow-hidden p-2 shadow-[0_24px_50px_-30px_rgba(19,41,75,.5)]">
                <div className="relative overflow-hidden rounded-xl bg-[#13294b]" style={{ aspectRatio: "9 / 16" }}>
                  <iframe
                    src={`https://player.mediadelivery.net/embed/${BUNNY_LIBRARY}/${t.id}?autoplay=true&muted=true&loop=true&preload=true&responsive=true`}
                    title={t.name ? `FOCAS Edu testimonial — ${t.name}` : "FOCAS Edu testimonial"}
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
                {t.name && <figcaption className="cg-display px-3 pb-2 pt-4 text-center text-xl font-semibold">{t.name}</figcaption>}
              </figure>
            ))}
          </div>
        </Reveal>
        {TESTIMONIALS.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 px-4">
            <button onClick={() => goTo(active - 1)} aria-label="Previous testimonial" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e2d8] bg-white text-[#13294b] transition hover:bg-[#13294b] hover:text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => goTo(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-[#13294b]" : "w-2 bg-[#13294b]/25"}`}
                />
              ))}
            </div>
            <button onClick={() => goTo(active + 1)} aria-label="Next testimonial" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e7e2d8] bg-white text-[#13294b] transition hover:bg-[#13294b] hover:text-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <SectionHeading label="FAQs" title="Frequently asked questions" />
          <Reveal>
            <p className="mt-4 text-lg text-slate-600">
              Have another question? Call us at{" "}
              <a href="tel:+916383514285" className="whitespace-nowrap font-semibold text-[#13294b] underline decoration-[#a87b2a] underline-offset-4">
                +91 63835 14285
              </a>
            </p>
          </Reveal>
        </div>
        <div className="cg-card divide-y divide-[#e7e2d8] overflow-hidden">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg font-semibold text-[#13294b] sm:text-xl transition-colors hover:bg-[#fbfaf7]"
              >
                {f.q}
                {open === i ? <Minus className="h-5 w-5 flex-shrink-0 text-[#a87b2a]" /> : <Plus className="h-5 w-5 flex-shrink-0 text-[#a87b2a]" />}
              </button>
              <div style={{ maxHeight: open === i ? "300px" : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
                <p className="px-6 pb-5 text-lg text-slate-600">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ ended, onRegister }) {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-24">
      <Reveal>
        <div className="mx-auto max-w-5xl rounded-2xl bg-[#13294b] px-6 py-12 text-center sm:px-12 sm:py-14">
          <p className="cg-label !text-[#d9b46a]">Limited online seats</p>
          <h2 className="cg-display mt-3 text-4xl font-semibold !text-white sm:text-5xl">
            Help your child choose their path with confidence.
          </h2>
          <p className="mt-3 text-white/75">Sunday, 18th October · 10:30 AM · Online on Google Meet</p>
          <RegisterButton ended={ended} onRegister={onRegister} source="final" light className="mt-8 w-full sm:w-auto" />
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0f2240] px-4 py-8 pb-24 text-center text-lg text-white/60 md:pb-8">
      <img src="/fs-assets/logo-white.webp" alt="FOCAS Edu" loading="lazy" className="mx-auto mb-4 h-9 w-auto" />
      © {new Date().getFullYear()} FOCAS Edu. All rights reserved.
    </footer>
  );
}

function StickyMobileCTA({ ended, onRegister }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (ended) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#e7e2d8] bg-white/95 p-3 backdrop-blur transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <button type="button" onClick={() => onRegister("sticky")} className="cg-btn w-full">
        Register Now
      </button>
    </div>
  );
}

// ─── Registration + payment ──────────────────────────────────────────────────

// Same fields and Bigin-look card as the main site's form, in this page's navy/gold.
// The server (server/index.js) validates against the same option lists.
const CLASS_OPTIONS = ["Class 10", "Class 11", "Class 12"];
const LANGUAGE_OPTIONS = ["English", "Tamil", "Hindi"];

function RegisterModal({ onClose }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    studentName: "",
    parentName: "",
    dialCode: "+91",
    phone: "",
    studentClass: "",
    state: "",
    city: "",
    language: "",
    company: "", // honeypot — must stay empty for real users
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && status === "idle" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, status]);

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  // Changing the state resets the dependent city selection.
  const setState = (e) => {
    setValues((v) => ({ ...v, state: e.target.value, city: "" }));
    setErrors((er) => ({ ...er, state: undefined }));
  };

  const validate = () => {
    const e = {};
    const req = (k) => {
      if (!String(values[k]).trim()) e[k] = "This field is required.";
    };
    req("studentName");
    req("parentName");
    if (values.studentName.trim() && /\d/.test(values.studentName)) e.studentName = "Only letters are allowed.";
    if (values.parentName.trim() && /\d/.test(values.parentName)) e.parentName = "Only letters are allowed.";
    if (!values.phone.trim()) e.phone = "This field is required.";
    else if (!/^[0-9]{10}$/.test(values.phone.trim())) e.phone = "Enter a valid 10-digit phone number.";
    req("studentClass");
    req("state");
    req("city");
    req("language");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "loading") return;
    setErrorMsg("");
    if (!validate()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, utm: captureUtms() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Server-side field errors use the same keys as the form.
        if (data.errors) setErrors(data.errors);
        setErrorMsg(data.error || "Could not register. Please try again.");
        setStatus("idle");
        return;
      }
      if (window.fbq) window.fbq("track", "Lead", { content_name: "Career Guidance Meet 2026" });
      window.dataLayer?.push({ event: "career_guidance_register_submit", student_class: values.studentClass });
      document.body.style.overflow = "";
      navigate("/success", { replace: true, state: { name: values.studentName.trim() } });
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("idle");
    }
  };

  const select = (name, options, placeholder = "-Select-", onChange = set(name), disabled = false) => (
    <select name={name} className="bwf-input bwf-select" value={values[name]} onChange={onChange} disabled={disabled}>
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#fbfaf7]" role="dialog" aria-modal="true" aria-labelledby="cg-register-title">
      <div className="relative mx-auto max-w-lg px-4 py-14 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#13294b]"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-8 text-center">
          <p className="cg-label">Sunday · 18th October · 10:30 AM</p>
          <h2 id="cg-register-title" className="cg-display mt-3 text-4xl font-semibold">Register for the Career Guidance Meet</h2>
          <p className="mt-2 text-slate-600">Online on Google Meet</p>
        </div>

        <div className="bwf-scope">
          <div className="bwf-wrapper">
            <form className="bwf-form" onSubmit={handleSubmit} noValidate>
              <Honeypot value={values.company} onChange={set("company")} />

              <Row label="Student Name" name="studentName" error={errors.studentName}>
                <input maxLength={40} type="text" className="bwf-input" value={values.studentName} onChange={set("studentName")} />
              </Row>

              <Row label="Parent's Name" name="parentName" error={errors.parentName}>
                <input maxLength={80} type="text" className="bwf-input" value={values.parentName} onChange={set("parentName")} />
              </Row>

              <Row label="Parent's WhatsApp Number" name="phone" error={errors.phone}>
                <select className="bwf-dialcode" value={values.dialCode} onChange={set("dialCode")} aria-label="Country code">
                  {DIAL_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  maxLength={10}
                  type="tel"
                  inputMode="numeric"
                  className="bwf-input bwf-phone"
                  value={values.phone}
                  onChange={(e) => set("phone")({ target: { value: e.target.value.replace(/\D/g, "").slice(0, 10) } })}
                />
              </Row>

              <Row label="Currently studying in" name="studentClass" error={errors.studentClass}>
                {select("studentClass", CLASS_OPTIONS)}
              </Row>

              <Row label="State &amp; City" name="location" error={errors.state || errors.city}>
                <div className="bwf-two-col">
                  {select("state", STATES, "-State-", setState)}
                  {select("city", STATE_CITIES[values.state] || [], values.state ? "-City-" : "-Select state first-", set("city"), !values.state)}
                </div>
              </Row>

              <Row label="Preferred Language" name="language" error={errors.language}>
                {select("language", LANGUAGE_OPTIONS)}
              </Row>

              {errorMsg && <div className="bwf-submit-error">{errorMsg}</div>}

              <div className="bwf-btn-wrap">
                <button type="submit" className="bwf-btn" disabled={status === "loading"}>
                  {status === "loading" ? <><Loader2 className="h-5 w-5 animate-spin" /> Registering…</> : <>Register Now</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        <ul className="mt-6 space-y-2 text-lg text-slate-600">
          {["Google Meet link sent on WhatsApp", "Parents can attend along with the student"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#a87b2a]" /> {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const CareerGuidance = () => {
  const countdown = useCountdown(EVENT_START);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Career Guidance Meet | FOCAS Edu";
    captureUtms(); // remember ad UTMs on landing, not only on submit
    if (window.fbq) window.fbq("track", "ViewContent", { content_name: "Career Guidance Meet 2026" });
    window.dataLayer?.push({ event: "career_guidance_view" });
  }, []);

  const openRegister = (source) => {
    if (countdown.ended) return;
    if (typeof window.gtag === "function")
      window.gtag("event", "career_guidance_cta_click", { event_category: "engagement", event_label: source });
    setModalOpen(true);
  };

  return (
    <div className="cg-root min-h-screen overflow-x-hidden bg-[#fbfaf7]">
      <Nav ended={countdown.ended} onRegister={openRegister} />
      <main>
        <Hero countdown={countdown} onRegister={openRegister} />
        <Highlights />
        <WhatYouGet />
        <Agenda />
        <StudentVideos />
        <FAQ />
        <FinalCTA ended={countdown.ended} onRegister={openRegister} />
      </main>
      <Footer />
      <StickyMobileCTA ended={countdown.ended} onRegister={openRegister} />
      {modalOpen && <RegisterModal onClose={() => setModalOpen(false)} />}
    </div>
  );
};

export default CareerGuidance;
