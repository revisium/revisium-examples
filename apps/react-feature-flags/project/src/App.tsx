import { useFlag } from "./features/flags/useFlag";

export function App() {
  const checkoutFlag = useFlag("checkout-v2");

  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">Revisium feature flags</span>
        <h1>React UI controlled by Revisium rows</h1>
        <p>
          The card below changes when the `checkout-v2` row changes in the committed `head`
          revision.
        </p>
      </section>

      <section className="panel" aria-label="Checkout feature flag">
        <div>
          <span className={checkoutFlag?.enabled ? "status enabled" : "status disabled"}>
            {checkoutFlag?.enabled ? "Enabled" : "Disabled"}
          </span>
          <h2>Checkout v2</h2>
          <p>{checkoutFlag?.description ?? "No checkout-v2 flag was returned."}</p>
        </div>
        <div className="meter" aria-label={`${checkoutFlag?.rollout ?? 0}% rollout`}>
          <span style={{ width: `${checkoutFlag?.rollout ?? 0}%` }} />
        </div>
        <p className="small">
          Rollout: {checkoutFlag?.rollout ?? 0}% across{" "}
          {(checkoutFlag?.environments ?? []).join(", ") || "no environments"}
        </p>
      </section>
    </main>
  );
}
