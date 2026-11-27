import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { MaintenanceBanner } from "./maintenance-banner";

/** The navbar, footer and banner around every normal page. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MaintenanceBanner />
      <Navbar />
      <main id="main" className="mx-auto min-h-[60vh] max-w-[1240px] px-5 md:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}

/** Full-screen pages (games, shared links, sign-in screens) have no navbar. */
export function BareShell({ children }: { children: React.ReactNode }) {
  return <div id="main">{children}</div>;
}
