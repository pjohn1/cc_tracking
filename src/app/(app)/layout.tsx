import { requireSession } from "@/lib/auth/session";
import { AppLock } from "@/components/AppLock";
import { TabBar } from "@/components/TabBar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireSession();
  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <TabBar />
      <AppLock />
    </>
  );
}
