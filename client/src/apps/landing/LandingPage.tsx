import { HeroSection } from './HeroSection';
import { LoginSection } from './LoginSection';

export function LandingPage() {
  return (
    <main className="landing">
      <HeroSection />
      <LoginSection />
    </main>
  );
}
