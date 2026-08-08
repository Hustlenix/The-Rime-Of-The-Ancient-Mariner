export default function PageBanner({ kicker, title, sub, image }) {
  return (
    <header className="page-banner">
      <img className="banner-img" src={image} alt="" aria-hidden="true" />
      <div className="banner-overlay" aria-hidden="true" />
      <div className="banner-content">
        <p className="banner-kicker">{kicker}</p>
        <h1 className="banner-title">{title}</h1>
        {sub && <p className="banner-sub">{sub}</p>}
      </div>
    </header>
  );
}
