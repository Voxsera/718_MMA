import PageHead from '../components/PageHead.jsx';

// NOTE: This is a standard template/draft. Replace every <mark>[PLACEHOLDER]</mark>
// with the gym's real details and have it reviewed before launch.
const Sec = ({ n, title, children }) => (
  <div className="legal-sec"><h2>{n}. {title}</h2>{children}</div>
);
const P = ({ children }) => <mark>{children}</mark>;

export default function Terms() {
  return (
    <PageHead crumb="Legal" title='Terms Of <span class="text-red">Service</span>'
      sub="The rules for using our website and training with us.">
      <section style={{ paddingTop: 30 }}>
        <div className="container">
          <div className="legal">
            <div className="legal-note">
              <b>Draft template.</b> This is placeholder text using standard sections. All items highlighted in red
              (e.g. <P>[Legal Business Name]</P>) must be replaced with the gym's actual details, and the document
              should be reviewed by a legal professional before the site goes live.
            </div>
            <p className="legal-meta">Effective date: <P>[DD Month YYYY]</P> · Last updated: <P>[DD Month YYYY]</P></p>

            <Sec n="1" title="Introduction & Acceptance">
              <p>These Terms of Service ("Terms") govern your access to and use of the website operated by <P>[Legal Business Name]</P>
                ("718 MMA", "we", "us", "our"), located at <P>[Registered Business Address]</P>, and the services, classes,
                memberships and facilities we offer. By using this website, booking a trial, purchasing a membership or training
                with us, you agree to these Terms. If you do not agree, please do not use our website or services.</p>
            </Sec>

            <Sec n="2" title="Eligibility">
              <p>You must be at least <P>[minimum age, e.g. 18]</P> years old to create an account or purchase a membership on your own.
                Minors may train only with the consent and, where required, the presence or written authorisation of a parent or legal guardian.
                By using our services you confirm that the information you provide is accurate and that you are medically fit to participate
                in physical and combat-sports training.</p>
            </Sec>

            <Sec n="3" title="Memberships & Bookings">
              <p>Memberships, day passes, personal-training packages and free-trial bookings are subject to availability and to the
                specific terms shown at the time of purchase. Membership durations (for example Day, Monthly, Quarterly and Annual)
                begin and expire as described on the Memberships page and as recorded in your account. Freezing, pausing or transferring
                a membership is permitted only as described here: <P>[freeze / pause / transfer policy]</P>.</p>
            </Sec>

            <Sec n="4" title="Pricing & Payments">
              <p>All prices are listed in Indian Rupees (INR) and are <P>[inclusive / exclusive]</P> of applicable taxes. Payments are
                processed securely by our third-party payment provider, <b>Razorpay</b>. We do not collect or store your full card,
                UPI or banking details. By making a payment you also agree to Razorpay's terms and policies.</p>
            </Sec>

            <Sec n="5" title="Refunds & Cancellations">
              <p><P>[Insert the gym's refund and cancellation policy here.]</P> For example: state whether memberships, day passes,
                personal-training packages and trials are refundable, any notice period required to cancel, and how and when any
                eligible refund is processed. A clear refund policy is required by our payment provider and must reflect the gym's
                actual practice.</p>
            </Sec>

            <Sec n="6" title="Free Trial">
              <p>We may offer a one-day free trial. Booking a trial does not create a membership. Trials are subject to availability,
                to verification of the details you provide, and to the same conduct and safety rules that apply to all members.
                <P>[Add any trial-specific limits, e.g. one trial per person.]</P></p>
            </Sec>

            <Sec n="7" title="Assumption of Risk & Liability Waiver">
              <p>Combat sports and physical training involve inherent risks, including the risk of serious injury. By training with us
                you acknowledge and voluntarily accept these risks. To the maximum extent permitted by law, you agree that
                <P>[Legal Business Name]</P>, its coaches, staff and owners are not liable for injuries, loss or damage arising from
                your participation, except where caused by our proven gross negligence. <P>[State whether a separate signed physical
                waiver / health declaration is also required before training.]</P></p>
            </Sec>

            <Sec n="8" title="Code Of Conduct & Gym Rules">
              <p>Members and guests must follow all posted gym rules and staff instructions, train safely and respectfully, maintain
                hygiene, and use equipment as intended. We reserve the right to refuse entry, suspend or cancel the membership of any
                person who behaves dangerously, abusively or in breach of these Terms. <P>[Add specific house rules if any.]</P></p>
            </Sec>

            <Sec n="9" title="Photography & Media">
              <p><P>[State the gym's stance.]</P> For example: classes and events may be photographed or filmed, and such media may be
                used for promotion on the website and social media. Members who do not wish to appear in such media should inform staff.</p>
            </Sec>

            <Sec n="10" title="Accounts & Login">
              <p>Member accounts are created using Google Sign-In and are linked to an active membership. You are responsible for keeping
                access to your Google account secure. We may suspend or remove accounts that are inactive, expired, or used in breach of
                these Terms.</p>
            </Sec>

            <Sec n="11" title="Intellectual Property">
              <p>All content on this website — including the 718 MMA name, logo, text, graphics and design — is owned by or licensed to
                <P>[Legal Business Name]</P> and may not be copied or reused without permission. Photographs are used under licence from
                their respective providers.</p>
            </Sec>

            <Sec n="12" title="Third-Party Services & Links">
              <p>Our website uses and links to third-party services including Google (sign-in and fonts), Razorpay (payments), Unsplash
                (images) and food-delivery partners (Swiggy, Zomato). We are not responsible for the content or practices of these third
                parties, which are governed by their own terms.</p>
            </Sec>

            <Sec n="13" title="Limitation Of Liability">
              <p>To the maximum extent permitted by law, our total liability arising out of or relating to the website or services is
                limited to the amount you paid to us in the <P>[time period, e.g. preceding three months]</P>. We are not liable for any
                indirect, incidental or consequential loss.</p>
            </Sec>

            <Sec n="14" title="Indemnity">
              <p>You agree to indemnify and hold harmless <P>[Legal Business Name]</P>, its staff and owners from any claims, damages or
                expenses arising from your breach of these Terms or your misuse of our website or facilities.</p>
            </Sec>

            <Sec n="15" title="Changes To These Terms">
              <p>We may update these Terms from time to time. The current version will always be posted on this page with an updated
                date. Continued use of the website or services after changes means you accept the revised Terms.</p>
            </Sec>

            <Sec n="16" title="Governing Law & Jurisdiction">
              <p>These Terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of the courts of
                <P>[City, e.g. Hyderabad, Telangana]</P>.</p>
            </Sec>

            <Sec n="17" title="Contact">
              <p>Questions about these Terms? Contact us at <P>[contact email]</P> or <P>[contact phone]</P>,
                <P>[Registered Business Address]</P>.</p>
            </Sec>
          </div>
        </div>
      </section>
    </PageHead>
  );
}
