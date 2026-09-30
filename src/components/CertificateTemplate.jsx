import collegeLogo from "../assets/college-logo.png";
import "../styles/certificate.css";
import { certificateTypes } from "../data/certificateTypes";

const formatDate = (value) => {
  if (!value) return "________________";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

function CertificateTemplate({
  certificateType = "participation",
  studentName = "Student Name",
  eventName = "Cultural Event",
  achievement,
  eventDate,
  certificateDate,
  participantCode = "CUL-2026-XXXXX",
  collegeName = "College Name",
  committeeName = "Cultural Committee",
  authorizedName = "Authorized Person",
  signature = "",
}) {
  const type = certificateTypes[certificateType] || certificateTypes.participation;
  const displayedAchievement = achievement || type.achievement;

  return (
    <article className="certificate-sheet" aria-label="Certificate preview">
      <div className="certificate-inner-border" />
      <div className="certificate-corner certificate-corner-top-left" />
      <div className="certificate-corner certificate-corner-top-right" />
      <div className="certificate-corner certificate-corner-bottom-left" />
      <div className="certificate-corner certificate-corner-bottom-right" />
      <div className="certificate-accent certificate-accent-top" />
      <div className="certificate-accent certificate-accent-bottom" />

      <aside className="certificate-ribbon" aria-hidden="true">
        <span className="certificate-ribbon-line" />
        <span className="certificate-ribbon-line certificate-ribbon-line-second" />
        <span className="certificate-medallion">
          <span className="certificate-medallion-mark">CC</span>
        </span>
      </aside>

      <div className="certificate-content">
        <header className="certificate-header">
          <img src={collegeLogo} alt="College logo" className="certificate-logo" />
          <div>
            <p className="certificate-kicker">{committeeName}</p>
            <p className="certificate-college">{collegeName}</p>
          </div>
        </header>

        <div className="certificate-heading-block">
          <p className="certificate-eyebrow">Official Recognition</p>
          <h1>{type.title}</h1>
          <span className="certificate-heading-rule" />
        </div>

        <div className="certificate-copy">
          <p>This certificate is proudly presented to</p>
          <h2>{studentName || "Student Name"}</h2>
          <p>for securing</p>
          <strong>{displayedAchievement}</strong>
          <p>
            in <b>{eventName || "Cultural Event"}</b> held on {formatDate(eventDate)}.
          </p>
        </div>

        <div className="certificate-meta">
          <span>Participant Code: <b>{participantCode || "CUL-2026-XXXXX"}</b></span>
          <span>Certificate Date: <b>{formatDate(certificateDate)}</b></span>
        </div>

        <footer className="certificate-footer">
          <div className="certificate-signature">
            <div className="certificate-signature-mark">{signature || "Authorized Signature"}</div>
            <span className="certificate-footer-rule" />
            <b>{authorizedName || "Authorized Person"}</b>
            <small>{committeeName}</small>
          </div>
          <div className="certificate-seal" aria-label="Cultural Committee seal">
            <span>EST.</span>
            <b>CC</b>
            <span>2026</span>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default CertificateTemplate;
