import type { Metadata } from "next";

// The legal notice (Impressum), German and English, on a plain orange page.
export const metadata: Metadata = {
  title: "Imprint",
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const DIRECTORS = "Marnix Meersman, Anton Liegert, Stijn Lafontaine";
const ODR = "https://ec.europa.eu/consumers/odr/";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="arq-imprint__block">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function Imprint() {
  return (
    <main className="arq-imprint">
      <a className="arq-imprint__home" href={`${BASE}/`}>
        ← Arqus
      </a>
      <h1>Impressum · Imprint</h1>

      <div className="arq-imprint__cols">
        <div lang="de">
          <Block title="Angaben gemäß § 5 DDG:">
            <p>Arqus GmbH<br />Landsberger Str. 366<br />80687 München<br />Deutschland</p>
          </Block>
          <Block title="Vertreten durch die Geschäftsführer:">
            <p>{DIRECTORS}</p>
          </Block>
          <Block title="Kontakt:">
            <p>
              E-Mail: <a href="mailto:contact@arqus.space">contact@arqus.space</a>
              <br />
              Website: <a href="https://www.arqus.space/">https://www.arqus.space/</a>
            </p>
          </Block>
          <Block title="Registereintrag:">
            <p>Eintragung im Handelsregister.<br />Registergericht: Amtsgericht München<br />Registernummer: HRB 314181</p>
          </Block>
          <Block title="Umsatzsteuer-ID:">
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />DE464127677</p>
          </Block>
          <Block title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:">
            <p>Arqus GmbH<br />Landsberger Str. 366<br />80687 München</p>
          </Block>
          <Block title="EU-Streitbeilegung">
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a href={ODR}>{ODR}</a>.<br />Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </Block>
          <Block title="Verbraucherstreitbeilegung">
            <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
          </Block>
        </div>

        <div lang="en">
          <Block title="Information pursuant to § 5 DDG">
            <p>Arqus GmbH<br />Landsberger Str. 366<br />80687 Munich<br />Germany</p>
          </Block>
          <Block title="Represented by the Managing Directors:">
            <p>{DIRECTORS}</p>
          </Block>
          <Block title="Contact Information:">
            <p>
              E-Mail: <a href="mailto:contact@arqus.space">contact@arqus.space</a>
              <br />
              Website: <a href="https://www.arqus.space/">https://www.arqus.space/</a>
            </p>
          </Block>
          <Block title="Commercial Register:">
            <p>
              Registered in the Commercial Register (Handelsregister) of the local court (Amtsgericht) of Munich.
              <br />
              Registration Number: HRB 314181
            </p>
          </Block>
          <Block title="VAT Identification Number:">
            <p>
              VAT identification number pursuant to § 27 a of the German Value Added Tax Act (Umsatzsteuergesetz):
              <br />
              DE464127677
            </p>
          </Block>
          <Block title="Person Responsible for Content under § 18 Abs. 2 MStV:">
            <p>Arqus GmbH<br />Landsberger Str. 366<br />80687 Munich</p>
          </Block>
          <Block title="EU Dispute Resolution">
            <p>
              The European Commission provides a platform for online dispute resolution (ODR):{" "}
              <a href={ODR}>{ODR}</a>.<br />Our e-mail address can be found above in the legal notice.
            </p>
          </Block>
          <Block title="Consumer Dispute Resolution:">
            <p>We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>
          </Block>
        </div>
      </div>
    </main>
  );
}
