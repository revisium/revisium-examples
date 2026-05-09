import { getRemoteConfig } from "../src/revisium/config-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = await getRemoteConfig();
  const hero = config.pageCopies[0];
  const plan = config.plans[0];
  const flag = config.featureFlags[0];

  return (
    <main>
      <span className="eyebrow">Revisium remote config</span>
      <h1>{hero?.title ?? "Remote content is ready"}</h1>
      <p>{hero?.body ?? "Bootstrap the web-config project to populate this page."}</p>

      <section className="grid" aria-label="Remote configuration">
        <article className="card">
          <h2>Feature flag</h2>
          <p className="metric">{flag?.enabled ? "On" : "Off"}</p>
          <p>{flag?.description ?? "No flag rows were found."}</p>
          <span className="pill">{flag?.rollout ?? 0}% rollout</span>
        </article>

        <article className="card">
          <h2>Plan</h2>
          <p className="metric">${plan?.monthlyPrice ?? 0}</p>
          <p>{plan?.name ?? "No plan"} plan managed in Revisium.</p>
          <ul className="list">
            {(plan?.features ?? []).map((feature) => (
              <li key={feature.name}>{feature.name}</li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Rows loaded</h2>
          <p className="metric">{config.totals.rows}</p>
          <p>
            {config.totals.featureFlags} flags, {config.totals.pageCopies} page copy rows, and{" "}
            {config.totals.plans} plans.
          </p>
        </article>
      </section>
    </main>
  );
}
