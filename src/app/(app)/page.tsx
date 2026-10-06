import { requireSession } from "@/lib/auth/session";
import { Card } from "@/components/ui";

export default async function TodayPage() {
  await requireSession();
  return (
    <div className="space-y-5">
      <h1 className="px-1 text-3xl font-bold tracking-tight">Today</h1>
      <Card>
        <p className="text-muted">Your cards, credits and offers will show up here as each part is added.</p>
      </Card>
    </div>
  );
}
