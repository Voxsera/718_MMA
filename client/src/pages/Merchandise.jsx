import { useState } from 'react';
import PageHead from '../components/PageHead.jsx';

export default function Merchandise() {
  const [done, setDone] = useState(false);
  return (
    <PageHead crumb="Shop" title='718 <span class="text-red">Merch</span>'>
      <section className="coming-soon">
        <div className="container">
          <div className="big">COMING SOON</div>
          <h2>Rep The <span className="text-red">Club</span></h2>
          <p className="section-intro" style={{ margin: '18px auto 26px' }}>Tees, hoodies, caps, gloves and training gear with the 718 mark are on the way. Be first to know when the drop goes live.</p>
          <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 460, margin: '0 auto' }}>
            <input type="email" placeholder="Your email" required style={{ maxWidth: 280 }} />
            <button className="btn btn-primary">Notify Me</button>
          </form>
          {done && <p className="form-msg ok" style={{ textAlign: 'center' }}>You're on the list! We'll email you when merch drops.</p>}
        </div>
      </section>
    </PageHead>
  );
}
