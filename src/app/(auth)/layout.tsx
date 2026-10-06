export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 pt-[env(safe-area-inset-top)] pb-[max(2rem,env(safe-area-inset-bottom))]">
      {children}
    </main>
  );
}
