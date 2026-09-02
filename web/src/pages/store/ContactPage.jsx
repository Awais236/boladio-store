import { useData } from '../../context/DataContext';
import { Ic } from '../../lib/icons';
import { WHATSAPP } from '../../lib/format';

export default function ContactPage() {
  const { meta } = useData();

  const wa = WHATSAPP('Hello Boliolo! I have a question.', meta.whatsapp);

  return (
    <>
      <div className="page-head">
        <div className="crumbs">Home / Contact</div>
        <h1>Contact Us</h1>
        <p>We'd love to hear from you — questions, styling help or orders.</p>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>
        <div className="contact-cards">
          <div className="contact-card">
            <div className="ic"><Ic.Phone /></div>
            <h4>Call Now</h4>
            <p>{meta.phone}</p>
            <a href={`tel:${meta.phone}`} className="btn btn-dark btn-sm">Call Now</a>
          </div>
          <div className="contact-card">
            <div className="ic"><Ic.Pin /></div>
            <h4>Visit the Boutique</h4>
            <p>Block ABC, Street ABC<br />House Number 123, Islamabad</p>
            <a
              className="btn btn-outline btn-sm"
              href="https://www.google.com/maps/search/?api=1&query=Block+ABC+Street+ABC+House+Number+123+Islamabad"
              target="_blank"
              rel="noreferrer"
            >
              Get Directions
            </a>
          </div>
          <div className="contact-card">
            <div className="ic"><Ic.WhatsApp /></div>
            <h4>WhatsApp</h4>
            <p>Fastest way to reach us</p>
            <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noreferrer">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
