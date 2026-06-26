import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "Terms of Service — SplitKey" };

export default function TermsPage() {
  return (
    <>
      <header className="legal-top">
        <Link href="/" style={{ display: "inline-flex" }}><Logo variant="light" size={28} /></Link>
        <Link href="/" className="back">← Back to home</Link>
      </header>
      <main className="legal">
        <h1>Terms of Service</h1>
        <p className="upd">Last updated: June 26, 2026</p>

        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of SplitKey, a commission-management platform for
          real-estate brokerages (the &ldquo;Service&rdquo;). By creating an account or using the Service, you agree to these Terms. If you
          are using the Service on behalf of a brokerage, you represent that you are authorized to bind that organization.
        </p>

        <h2>1. The Service</h2>
        <p>
          SplitKey lets brokerages calculate commission splits, manage deals and approvals, run reports, give agents a portal, and prepare
          year-end 1099 totals. We may add, change, or remove features over time to improve the Service.
        </p>

        <h2>2. Accounts and eligibility</h2>
        <ul>
          <li>You must be at least 18 years old to use the Service.</li>
          <li>You are responsible for the accuracy of the information you provide and for all activity under your account.</li>
          <li>You must keep your login credentials confidential and notify us promptly of any unauthorized use.</li>
          <li>Administrators are responsible for the users they invite and the access levels they assign.</li>
        </ul>

        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service in violation of any law or regulation.</li>
          <li>Upload data you do not have the right to use, or infringe the rights of others.</li>
          <li>Attempt to access another brokerage&rsquo;s data, probe or breach security, or disrupt the Service.</li>
          <li>Reverse engineer, resell, or copy the Service except as permitted by these Terms.</li>
        </ul>

        <h2>4. Your data</h2>
        <p>
          As between you and SplitKey, you own the data you submit to the Service (&ldquo;Customer Data&rdquo;). You grant us a limited license
          to host, process, and display Customer Data solely to provide and improve the Service and as described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>. You are responsible for the lawfulness of the data you submit, including any taxpayer
          information you collect from your agents.
        </p>

        <h2>5. Fees</h2>
        <p>
          Access to the Service is provided on the plan and pricing agreed with your brokerage. Fees are due as agreed and, unless stated
          otherwise, are non-refundable. We may change pricing on a going-forward basis with reasonable notice.
        </p>

        <h2>6. Confidentiality and security</h2>
        <p>
          We treat Customer Data as confidential and apply technical and organizational safeguards designed to protect it, including encryption
          and per-brokerage data isolation. You agree to protect any non-public information about the Service that you access.
        </p>

        <h2>7. Service availability</h2>
        <p>
          We work to keep the Service available and reliable but do not guarantee uninterrupted access. We may perform maintenance, and the
          Service may occasionally be unavailable. We are not responsible for outages caused by third-party providers or events beyond our
          reasonable control.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; SplitKey assists with commission calculations and 1099
          preparation but does not provide tax, legal, accounting, or financial advice. You are responsible for verifying outputs and for your
          own tax and regulatory compliance. To the fullest extent permitted by law, we disclaim all warranties not expressly stated in these
          Terms.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, SplitKey will not be liable for any indirect, incidental, special, consequential, or punitive
          damages, or for lost profits or revenues. Our total liability arising out of or relating to the Service will not exceed the amounts
          you paid for the Service in the twelve months before the event giving rise to the claim.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold SplitKey harmless from claims, damages, and expenses arising from your Customer Data, your use of the
          Service, or your violation of these Terms.
        </p>

        <h2>11. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate access if you breach these Terms or to protect the Service or
          its users. On termination, your right to use the Service ends; we will make Customer Data available for export for a reasonable period
          unless prohibited by law.
        </p>

        <h2>12. Governing law</h2>
        <p>These Terms are governed by the laws of the State of Michigan, USA, without regard to its conflict-of-laws rules.</p>

        <h2>13. Changes to these Terms</h2>
        <p>We may update these Terms from time to time. When we make material changes, we will update the date above and, where appropriate, provide additional notice. Continued use of the Service means you accept the updated Terms.</p>

        <h2>14. Contact us</h2>
        <p>Questions about these Terms? Email <a href="mailto:jay@topagentmi.com">jay@topagentmi.com</a>.</p>
      </main>
    </>
  );
}
