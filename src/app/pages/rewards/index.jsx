import { Page } from "components/shared/Page";

export default function Referral() {
  return (
    <Page title="Referral">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Referral
          </h2>
          10% of the activation and upgrade of your direct sponsor.
        </div>
      </div>
    </Page>
  );
}

export function Leadership() {
    return (
      <Page title="Rewards">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Leadership
            </h2>
            5% of the activation and upgrade of your group sales distributed to the first 3 qualified higher rank.
          </div>
        </div>
      </Page>
    );
}

export function Passive() {
    return (
      <Page title="Rewards">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Passive
            </h2>
            Get up 2% from VIP Level Contribution<br/>
             <br/>
          </div>
        </div>
      </Page>
    );
}