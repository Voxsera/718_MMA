import PageHead from '../components/PageHead.jsx';

// NOTE: Standard draft. It already reflects the data the site actually collects.
// Replace every <mark>[PLACEHOLDER]</mark> and have it reviewed before launch.
const Sec = ({ n, title, children }) => (
  <div className="legal-sec"><h2>{n}. {title}</h2>{children}</div>
);
const P = ({ children }) => <mark>{children}</mark>;

export default function Privacy() {
  return (
    <PageHead crumb="Legal" title='Privacy <span class="text-red">Policy</span>'
      sub="How we collect, use and protect your personal information.">
      <section style={{ paddingTop: 30 }}>
        <div className="container">
          <div className="legal">
            <div className="legal-note">
              <b>Draft template.</b> The data-collection details below reflect how this website currently works, but every item
              highlighted in red (e.g. <P>[Legal Business Name]</P>) must be replaced with the gym's real details. Have this reviewed
              for compliance with India's Digital Personal Data Protection Act, 2023 before the site goes live.
            </div>
            <p className="legal-meta">Effective date: <P>[DD Month YYYY]</P> · Last updated: <P>[DD Month YYYY]</P></p>

            <Sec n="1" title="Who We Are">
              <p>This website is operated by <P>[Legal Business Name]</P> ("718 MMA", "we", "us", "our"), located at
                <P>[Registered Business Address]</P>. We are the data fiduciary responsible for your personal data collected through
                this website. For any privacy questions or requests, contact <P>[privacy contact email]</P>.</p>
            </Sec>

            <Sec n="2" title="Information We Collect">
              <p>We collect only the information needed to provide our services:</p>
              <h3>Information you give us</h3>
              <ul>
                <li><b>Free trial bookings:</b> your name and phone number (required), and optionally your email, chosen discipline,
                  preferred date and any message.</li>
                <li><b>Collaboration enquiries:</b> your name and email (required), and optionally organisation, phone, enquiry type and message.</li>
                <li><b>Memberships & personal training:</b> your name, email, phone, the plan selected and the amount paid.</li>
              </ul>
              <h3>Information from Google Sign-In</h3>
              <ul>
                <li>When you log in with Google we receive and store your email address, name, profile picture, Google account identifier
                  and last login time, so we can verify your active membership and give you access to your account.</li>
              </ul>
              <h3>Payment information</h3>
              <ul>
                <li>Payments are processed by <b>Razorpay</b>. We receive a record of the transaction (such as order and payment IDs and
                  status) but we do <b>not</b> collect or store your card, UPI or bank details.</li>
              </ul>
              <h3>Cookies & technical data</h3>
              <ul>
                <li>We use a secure login cookie to keep you signed in. Our hosting provider and the third-party services we use may also
                  automatically log technical information such as your IP address and browser type.</li>
              </ul>
            </Sec>

            <Sec n="3" title="How We Use Your Information">
              <ul>
                <li>To respond to trial and collaboration enquiries and contact you about them.</li>
                <li>To process payments and activate, manage and renew your membership.</li>
                <li>To authenticate your login and give you access to your member account.</li>
                <li>To operate, maintain and improve our website and services.</li>
                <li><P>[If applicable: to send you updates, offers or the merchandise waitlist — only with your consent.]</P></li>
              </ul>
            </Sec>

            <Sec n="4" title="Legal Basis & Consent">
              <p>We process your personal data on the basis of your consent (given when you submit a form or sign in) and to perform the
                services you request from us, in accordance with the Digital Personal Data Protection Act, 2023. You may withdraw your
                consent at any time by contacting us, though this may affect our ability to provide certain services.</p>
            </Sec>

            <Sec n="5" title="How We Share Information">
              <p>We do not sell your personal data. We share information only with the service providers needed to run the website:</p>
              <ul>
                <li><b>Google</b> — for sign-in and to load website fonts.</li>
                <li><b>Razorpay</b> — to process payments.</li>
                <li><b>Unsplash</b> — images load from Unsplash, which may receive your IP address.</li>
                <li><b>Our hosting provider</b> (<P>[e.g. Render]</P>) — to host the website and store data.</li>
                <li>Authorities or others where required by law.</li>
              </ul>
            </Sec>

            <Sec n="6" title="Data Retention">
              <p>We keep your personal data only as long as needed for the purposes above or as required by law. <P>[State retention
                approach, e.g. enquiry data kept for 12 months; member data kept while your membership is active and for a period
                afterwards.]</P> You may ask us to delete your data at any time, subject to legal requirements.</p>
            </Sec>

            <Sec n="7" title="Data Security">
              <p>We take reasonable technical and organisational measures to protect your data, including secure login tokens and
                processing payments through a trusted provider. No method of transmission or storage is fully secure, and we cannot
                guarantee absolute security.</p>
            </Sec>

            <Sec n="8" title="Your Rights">
              <p>Under the Digital Personal Data Protection Act, 2023 you have the right to access, correct and update your personal
                data, to request its deletion, to withdraw consent, and to nominate another person to exercise your rights. To make a
                request, contact us at <P>[privacy contact email]</P>. You also have the right to make a complaint to the Data
                Protection Board of India.</p>
            </Sec>

            <Sec n="9" title="Children's Privacy">
              <p>We do not knowingly collect personal data from children under <P>[age, e.g. 18]</P> without verifiable parental or
                guardian consent. <P>[Adjust if the gym accepts minors with guardian consent.]</P></p>
            </Sec>

            <Sec n="10" title="Marketing Communications">
              <p><P>[State whether you send marketing.]</P> If we send promotional emails or messages, we will do so only with your
                consent, and you can opt out at any time using the unsubscribe option or by contacting us.</p>
            </Sec>

            <Sec n="11" title="Changes To This Policy">
              <p>We may update this Privacy Policy from time to time. The latest version will always be posted on this page with an
                updated date.</p>
            </Sec>

            <Sec n="12" title="Grievance Officer & Contact">
              <p>For any privacy concern or to exercise your rights, contact our grievance officer:</p>
              <ul>
                <li>Name: <P>[Grievance Officer Name]</P></li>
                <li>Email: <P>[privacy contact email]</P></li>
                <li>Phone: <P>[contact phone]</P></li>
                <li>Address: <P>[Registered Business Address]</P></li>
              </ul>
            </Sec>
          </div>
        </div>
      </section>
    </PageHead>
  );
}
