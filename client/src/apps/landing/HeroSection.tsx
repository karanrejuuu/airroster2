import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { ArrowDown, Building2, Map, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../components/Button';

const words = ['Every crew,', 'every flight,', 'perfectly rostered.'];
const routes = [
  'M40 220 C180 80 320 80 460 220',
  'M560 160 C690 40 840 64 980 190',
  'M120 520 C300 390 470 430 630 300',
  'M720 560 C850 400 1000 430 1160 260',
  'M80 360 C250 250 420 260 590 150',
  'M640 330 C790 230 970 250 1120 120'
];

const features: Array<[LucideIcon, string, string]> = [
  [Users, 'Crew Master', 'Complete crew profiles — pilots, FOs, and flight attendants with licence and medical tracking.'],
  [Building2, 'Airline & Flight', 'Manage airline details, fleet, and flight numbers as reusable master records.'],
  [Map, 'Route Mapping', 'Assign crew to specific sectors by date and time. Live conflict detection built in.']
];

export function HeroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const background = useMotionTemplate`radial-gradient(600px circle at ${springX}px ${springY}px, rgba(255,255,255,0.04), transparent 70%)`;

  return (
    <>
      <section className="hero" onMouseMove={(event) => { mouseX.set(event.clientX); mouseY.set(event.clientY); }}>
        <div className="dot-grid" />
        <motion.div className="dot-grid" style={{ background }} />
        <svg className="route-art" viewBox="0 0 1200 700" aria-hidden>
          {routes.map((path, index) => (
            <motion.path
              key={path}
              d={path}
              fill="none"
              stroke="white"
              strokeWidth="1"
              opacity="0.06"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 1, 0] }}
              transition={{ duration: 4, delay: index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </svg>
        <div className="hero-content">
          <motion.div className="overline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            AVIATION CREW MANAGEMENT PLATFORM
          </motion.div>
          <h1>
            {words.map((word, index) => (
              <motion.span
                className="hero-word"
                key={word}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            AirRoster maps pilots, first officers and flight attendants to airlines, flights and routes — beautifully.
          </motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
            <Button variant="primary" onClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })}>Get started</Button>
            <Button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Watch how it works <ArrowDown size={16} strokeWidth={1.5} /></Button>
          </motion.div>
        </div>
        <ArrowDown className="scroll-indicator" size={18} strokeWidth={1.5} />
      </section>
      <section className="features" id="features">
        <div className="feature-grid">
          {features.map(([FeatureIcon, title, body], index) => {
            return (
              <motion.article className="feature-card" key={String(title)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <FeatureIcon size={18} strokeWidth={1.5} />
                <h3>{title}</h3>
                <p>{body}</p>
              </motion.article>
            );
          })}
        </div>
      </section>
    </>
  );
}
