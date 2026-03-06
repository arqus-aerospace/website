const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 px-8 md:px-12 py-10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-8 text-white/30 text-xs tracking-wide">
        <div className="space-y-1">
          <p className="text-white/50 uppercase tracking-[0.2em] text-[11px] mb-3">Arqus Aerospace</p>
          <p>Maria-Merian-Straße</p>
          <p>85521 Ottobrunn, Germany</p>
          <p className="pt-2">Arqus Aerospace GmbH &amp; Arqus Aerospace BV</p>
        </div>
        <div className="space-y-1">
          <p className="text-white/50 uppercase tracking-[0.2em] text-[11px] mb-3">Contact</p>
          <p>
            For more information, please contact{" "}
            <a
              href="mailto:contact@arqusaerospace.com"
              className="text-white/50 hover:text-white/80 transition-colors duration-200"
            >
              contact@arqusaerospace.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
