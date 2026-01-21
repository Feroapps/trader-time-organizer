import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function LegalPageWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8" data-testid="legal-page">
      <div className="mb-6">
        <Link href="/settings">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 mb-4"
            data-testid="button-back-to-settings"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Settings
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-legal-title">
          {title}
        </h1>
      </div>
      <div
        className="prose prose-sm sm:prose dark:prose-invert max-w-none select-text"
        data-testid="legal-content"
      >
        {children}
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalPageWrapper title="Privacy Policy — Trader Time Organizer">
      <p className="text-muted-foreground">Last update: 2026</p>

      <h2>1. Scope and commitment</h2>
      <p>
        Trader Time Organizer (the "App") places the highest priority on user privacy. We are
        committed to complying with applicable data protection laws, including the EU General Data
        Protection Regulation (GDPR).
      </p>

      <h2>2. Controller</h2>
      <p>The App is published by FeroApps.</p>
      <p>
        For questions about privacy, contact:{" "}
        <a href="mailto:tradertimeorganizer@feroapps.com">tradertimeorganizer@feroapps.com</a>
      </p>
      <p>
        Official app page:{" "}
        <a
          href="https://www.feroapps.com/apps/trader-time-organizer"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://www.feroapps.com/apps/trader-time-organizer
        </a>
      </p>

      <h2>3. Data collection — what we collect and why</h2>
      <ul>
        <li>
          The App does not collect or transmit personal data such as name, email, phone number, IP
          address, or precise location.
        </li>
        <li>
          All user-generated data (including notes, alerts, and calendar entries) is stored locally
          on the user's device only.
        </li>
        <li>The developer has no technical ability to access this data.</li>
      </ul>

      <h2>4. Local data storage</h2>
      <ul>
        <li>Data is stored using local storage or a local database.</li>
        <li>No data is synchronized to external servers.</li>
        <li>Removing the app will remove locally stored data.</li>
      </ul>

      <h2>5. Advertisements</h2>
      <p>The App may display advertisements to support ongoing development.</p>
      <p>Advertisements are shown only in the following cases:</p>
      <ul>
        <li>When the user adds a custom alert.</li>
        <li>
          When the user chooses to view trading pairs related to a trading session or session
          overlap.
        </li>
      </ul>
      <ul>
        <li>No personal data is shared with advertisers.</li>
        <li>
          Advertising networks may use general technical identifiers according to their own privacy
          policies.
        </li>
      </ul>
      <p>A paid version may be offered in the future to reduce or remove advertisements.</p>

      <h2>6. Subscriptions and paid plans</h2>
      <p>
        The App may offer optional paid subscription plans in the future, billed on a monthly or
        yearly basis.
      </p>
      <p>
        Subscription details, pricing, renewal terms, and cancellation conditions will be clearly
        presented before any purchase. Users will manage subscriptions through the relevant app
        store.
      </p>

      <h2>7. Cookies</h2>
      <p>The App does not use cookies directly.</p>
      <p>Any similar technologies are governed by third-party providers' policies.</p>

      <h2>8. User rights under GDPR</h2>
      <p>Because no personal data is collected or stored centrally:</p>
      <ul>
        <li>There is no data to access, correct, delete, or export.</li>
        <li>All data remains under the user's control on their device.</li>
      </ul>

      <h2>9. Data security</h2>
      <p>Users are responsible for securing their devices.</p>
      <p>
        The developer is not responsible for data loss caused by device compromise or deletion.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>This Privacy Policy may be updated if new features are introduced.</p>
      <p>Updates will be published inside the App or on the official app page.</p>

      <h2>11. Contact</h2>
      <p>
        Privacy inquiries may be sent to:{" "}
        <a href="mailto:tradertimeorganizer@feroapps.com">tradertimeorganizer@feroapps.com</a>
      </p>

      <h2>Additional Clauses</h2>

      <h3>A. Controller identification and contact details</h3>
      <p>Controller: FeroApps.</p>
      <p>
        Contact email for all legal and privacy matters:{" "}
        <a href="mailto:tradertimeorganizer@feroapps.com">tradertimeorganizer@feroapps.com</a>
      </p>
      <p>
        Official application page:{" "}
        <a
          href="https://www.feroapps.com/apps/trader-time-organizer"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://www.feroapps.com/apps/trader-time-organizer
        </a>
      </p>

      <h3>B. Third-party services and SDKs</h3>
      <p>The App may integrate or display content provided by third-party services.</p>
      <p>The App does not provide personal data to third parties.</p>
      <p>
        Third-party services may use device-level technical identifiers according to their policies.
      </p>

      <h3>C. Refunds and billing</h3>
      <p>Refunds and billing are subject to the policies of Google Play and Apple App Store.</p>

      <h3>D. Minimum age</h3>
      <p>Users must meet the minimum age required by applicable law.</p>
      <p>Parents or guardians are responsible for minors.</p>

      <h3>E. Data retention</h3>
      <p>All data is stored locally.</p>
      <p>Deleting the app removes the data.</p>

      <h3>F. External links</h3>
      <p>The App may link to external websites.</p>
      <p>The developer is not responsible for external content.</p>
    </LegalPageWrapper>
  );
}

export function TermsOfUse() {
  return (
    <LegalPageWrapper title="Terms of Use — Trader Time Organizer">
      <p className="text-muted-foreground">Last update: 2026</p>

      <h2>1. Acceptance of terms</h2>
      <p>By using Trader Time Organizer, you agree to these Terms of Use.</p>

      <h2>2. Nature of the application</h2>
      <p>The App is an educational and organizational tool.</p>
      <p>It does not provide investment advice or trading signals.</p>

      <h2>3. No financial advice</h2>
      <p>All content is informational only.</p>
      <p>Users bear full responsibility for their decisions.</p>

      <h2>4. User responsibility</h2>
      <p>Use of the App is at the user's own risk.</p>
      <p>The developer is not liable for financial losses.</p>

      <h2>5. Accuracy of information</h2>
      <p>Information may change without notice.</p>

      <h2>6. Advertisements and subscriptions</h2>
      <p>The App may contain advertisements.</p>
      <p>Paid subscriptions may be offered in the future.</p>
      <p>Subscriptions are managed via the app store.</p>

      <h2>7. Permitted use</h2>
      <p>The App is for personal use only.</p>
      <p>Commercial use is prohibited.</p>

      <h2>8. Intellectual property</h2>
      <p>All content and code are owned by the developer.</p>

      <h2>9. Service availability</h2>
      <p>The developer may modify or discontinue the App.</p>

      <h2>10. Governing law</h2>
      <p>These Terms are governed by German and EU law.</p>

      <h2>11. Contact</h2>
      <p>
        <a href="mailto:tradertimeorganizer@feroapps.com">tradertimeorganizer@feroapps.com</a>
      </p>

      <h2>Additional Clauses</h2>

      <h3>A. Billing and refunds</h3>
      <p>Payments are processed via app stores.</p>
      <p>Refunds follow store policies.</p>

      <h3>B. Third-party services</h3>
      <p>The developer is not responsible for third-party services.</p>

      <h3>C. Age requirement</h3>
      <p>Users confirm they are legally allowed to use the App.</p>

      <h3>D. Termination</h3>
      <p>The developer may suspend services at any time.</p>
    </LegalPageWrapper>
  );
}

export function Disclaimer() {
  return (
    <LegalPageWrapper title="Disclaimer — Trader Time Organizer">
      <p className="text-muted-foreground">Last update: 2026</p>

      <p>Trader Time Organizer is provided for educational and organizational purposes only.</p>

      <p>The App does not provide financial advice or trading recommendations.</p>

      <p>Trading involves risk and may result in loss of capital.</p>

      <p>Users accept full responsibility for their actions.</p>

      <p>The developer is not liable for any losses.</p>

      <p>Content is provided "as is".</p>

      <p>External content and advertisements are not controlled by the developer.</p>

      <p>
        For legal inquiries:{" "}
        <a href="mailto:tradertimeorganizer@feroapps.com">tradertimeorganizer@feroapps.com</a>
      </p>
    </LegalPageWrapper>
  );
}
