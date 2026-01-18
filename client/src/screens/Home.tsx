import { UtcRuler, LocalTimeRuler } from "@/components";

export function Home() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Trader Time Organizer
        </h1>
        <p className="text-muted-foreground mt-2" data-testid="text-page-description">
          Manage your trading schedule across global time zones
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <LocalTimeRuler />
        </section>
        <section>
          <UtcRuler />
        </section>
      </div>
    </div>
  );
}
