import Page from './Page.jsx';
export default function PageHead({ crumb, title, sub, children }) {
  return (
    <Page>
      <div className="page-head">
        <div className="container">
          {crumb && <div className="breadcrumb">{crumb}</div>}
          <h1 dangerouslySetInnerHTML={{ __html: title }} />
          {sub && <p>{sub}</p>}
        </div>
      </div>
      {children}
    </Page>
  );
}
