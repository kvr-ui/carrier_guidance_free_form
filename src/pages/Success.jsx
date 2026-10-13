import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock, MessageCircle, Phone, Video } from "lucide-react";

// TODO: paste the Career Guidance Meet WhatsApp group invite link. The button stays hidden while empty.
const WHATSAPP_GROUP_URL = "";

const DETAILS = [
  { icon: CalendarDays, label: "Date", value: "Sunday, 18th October 2026" },
  { icon: Clock, label: "Time", value: "10:30 AM – 12:30 PM" },
  { icon: Video, label: "Mode", value: "Online · Google Meet" },
];

export default function Success() {
  const name = useLocation().state?.name;
  useEffect(() => {
    document.title = "Registration confirmed | Career Guidance Meet";
  }, []);

  return (
    <div className="cg-root flex min-h-screen items-center justify-center bg-[#fbfaf7] px-4 py-12">
      <div className="cg-card cg-rise w-full max-w-md p-8 text-center shadow-[0_30px_60px_-35px_rgba(19,41,75,.45)] sm:p-10">
        <CheckCircle2 className="mx-auto h-14 w-14 text-[#a87b2a]" />
        <h1 className="cg-display mt-4 text-4xl font-semibold">Registration confirmed</h1>
        <p className="mt-3 text-slate-600">
          Thank you{name ? `, ${name}` : ""}. You're registered for the Career Guidance Meet. The Google Meet link
          will be sent on <strong className="text-[#13294b]">WhatsApp</strong> before the session.
        </p>

        <ul className="mt-7 divide-y divide-[#e7e2d8] rounded-xl border border-[#e7e2d8] text-left">
          {DETAILS.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center gap-3 px-4 py-3">
              <Icon className="h-5 w-5 flex-shrink-0 text-[#a87b2a]" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="font-bold text-[#13294b]">{value}</p>
              </div>
            </li>
          ))}
        </ul>

        {WHATSAPP_GROUP_URL && (
          <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" className="cg-btn mt-8 w-full">
            <MessageCircle className="h-5 w-5" /> Join the WhatsApp group for updates
          </a>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-lg text-slate-600">
          <Phone className="h-4 w-4" /> Need help?{" "}
          <a href="tel:+916383514285" className="font-semibold text-[#13294b]">+91 63835 14285</a>
        </p>
        <a href="https://focasedu.com" className="mt-4 inline-block text-lg font-bold text-[#13294b] underline decoration-[#a87b2a] underline-offset-4">
          Visit FOCAS Edu
        </a>
      </div>
    </div>
  );
}
