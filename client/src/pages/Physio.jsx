import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';

export default function Physio() {
  return (
    <PageHead crumb="Recovery" title='Physio <span class="text-red">&amp; Rehab</span>'>
      <section className="coming-soon">
        <div className="container">
          <div className="big">COMING SOON</div>
          <h2>Recover <span className="text-red">Like A Pro</span></h2>
          <p className="section-intro" style={{ margin: '18px auto 26px' }}>In-house physiotherapy and rehab is on the way — injury recovery, mobility work, sports massage and prehab to keep you in the fight.</p>
          <Link to="/trial" className="btn btn-outline">Meanwhile, Train With Us →</Link>
        </div>
      </section>
    </PageHead>
  );
}
