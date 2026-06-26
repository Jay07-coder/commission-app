import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "Privacy Policy — SplitKey" };

export default function PrivacyPage() {
  return (
    <>
      <header className="legal-top">
        <Link href="/" style={{ display: "inline-flex" }}><Logo variant="light" size={28} /></Link>
        <Link href="/" className="back">← Back to home</Link>
      </header>
      <main className="legal">
        <h1>Privacy Policy</h1>
        <p className="upd">Last updated: June 26, 2026</p>

        <p>
          SplitKey (&ldquo;SplitKey,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) provides commission-management
          software for real-estate brokerages. This Privacy Policy explains what information we collect, how we use and protect it,
          and the choices you have. By using SplitKey, you agree to this Policy.
        </p>

        <h2>1. Who this Policy covers</h2>
        <p>
          SplitKey is a business tool used by brokerages (&ldquo;Customers&rdquo;) and the people they invite — owners, brokers,
          coordinators, accountants, and agents (&ldquo;Users&rdquo;). A Customer brokerage controls the data in its own workspace and
          decides who may access it. We process that data on the Customer&rsquo;s behalf.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> name, email address, password (stored encrypted), role, and the brokerage you belong to.</li>
          <li><strong>Brokerage and commission data:</strong> transactions, properties, clients, lead sources, agent commission plans, splits, caps, fees, and statements you enter or import.</li>
          <li><strong>Tax information (W-9):</strong> to support 1099 preparation, agents may provide their legal name, business name, mailing address, and taxpayer identification number (SSN or EIN). This information is sensitive and is treated accordingly.</li>
          <li><strong>Usage data:</strong> basic technical information such as device, browser, and log data used to operate and secure the service.</li>
          <li><strong>Cookies:</strong> we use strictly necessary cookies to keep you signed in. We do not use advertising cookies.</li>
        </ul>

        <h2>3. How we use information</h2>
        <ul>
          <li>To provide, maintain, and secure the SplitKey service.</li>
          <li>To calculate commissions, generate statements and reports, route approvals, and prepare year-end 1099 totals.</li>
          <li>To send service and account communications (for example, deal-approval notifications).</li>
          <li>To detect, prevent, and respond to fraud, abuse, or security incidents.</li>
          <li>To comply with legal obligations.</li>
        </ul>
        <p>We do not sell your personal information, and we do not use your brokerage&rsquo;s data to advertise to you.</p>

        <h2>4. How information is shared</h2>
        <p>We share information only as needed to run the service:</p>
        <ul>
          <li><strong>Within your brokerage:</strong> according to the roles your administrators assign. Agents see only their own deals and earnings.</li>
          <li><strong>Service providers (subprocessors):</strong> trusted vendors that host and operate the platform — including cloud hosting and database infrastructure, transactional email delivery, and AI processing used to power in-app assistant features. These providers process data on our instructions.</li>
          <li><strong>Legal:</strong> when required by law, regulation, or valid legal process, or to protect the rights, safety, and security of users and the public.</li>
          <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets, subject to this Policy.</li>
        </ul>

        <h2>5. Data security</h2>
        <p>
          We use technical and organizational measures designed to protect your information, including encryption of data in transit and at
          rest, database row-level security that isolates each brokerage&rsquo;s data, role-based access controls, and restricted access to
          sensitive fields. No method of transmission or storage is completely secure, but we work to protect your information and to limit
          access to it.
        </p>

        <h2>6. Data retention</h2>
        <p>
          We retain your information for as long as your account is active and as needed to provide the service, and afterward as required to
          comply with legal, tax, and recordkeeping obligations. You may request deletion of your data as described below; some records may be
          retained where the law requires.
        </p>

        <h2>7. Your choices and rights</h2>
        <p>
          Depending on your location, you may have the right to access, correct, export, or delete your personal information. Users can update
          much of their information directly in the app. For other requests, or to reach the brokerage that controls your data, contact us at{" "}
          <a href="mailto:jay@topagentmi.com">jay@topagentmi.com</a>. If your data is controlled by a Customer brokerage, we will refer your
          request to them.
        </p>

        <h2>8. Children</h2>
        <p>SplitKey is a business tool intended for users aged 18 and older. It is not directed to children, and we do not knowingly collect information from anyone under 18.</p>

        <h2>9. Changes to this Policy</h2>
        <p>We may update this Policy from time to time. When we make material changes, we will update the date above and, where appropriate, provide additional notice.</p>

        <h2>10. Contact us</h2>
        <p>Questions about this Policy or your information? Email <a href="mailto:jay@topagentmi.com">jay@topagentmi.com</a>.</p>
      </main>
    </>
  );
}
