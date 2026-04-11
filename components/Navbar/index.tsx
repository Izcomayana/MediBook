import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-[#f8f6f1]/90 backdrop-blur-md shadow-sm border-b border-[#ddd]"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="font-['Fraunces'] text-xl text-[#0f4f3a] tracking-tight">
          Medi<span className="text-[#1d9e75]">Book</span>
        </span>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-[#555] hover:text-[#0f4f3a] transition-colors duration-200">
            Features
          </a>
          <a href="#how" className="text-sm text-[#555] hover:text-[#0f4f3a] transition-colors duration-200">
            How it works
          </a>
          <Link
            href="/sign-in"
            className="text-sm bg-[#0f4f3a] text-[#e1f5ee] px-5 py-2 rounded-full hover:bg-[#0a3829] active:scale-95 transition-all duration-200"
          >
            Sign in
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-[#0f4f3a] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#0f4f3a] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#0f4f3a] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 pb-4 flex flex-col gap-4 bg-[#f8f6f1]">
          <a href="#features" className="text-sm text-[#555]" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how" className="text-sm text-[#555]" onClick={() => setMenuOpen(false)}>How it works</a>
          <Link href="/sign-in" className="text-sm bg-[#0f4f3a] text-[#e1f5ee] px-5 py-2 rounded-full text-center">Sign in</Link>
        </div>
      </div>
    </nav>
  );
}