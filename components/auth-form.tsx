"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button, Card, CardBody, Input, Tab, Tabs } from "@nextui-org/react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail, UserRound, WalletCards } from "lucide-react";

type AuthMode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callbackUrl = useMemo(() => {
    const requested = searchParams.get("callbackUrl");
    return requested?.startsWith("/") && !requested.startsWith("/login") ? requested : "/";
  }, [searchParams]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = (await response.json().catch(() => null)) as { message?: string } | null;

        if (!response.ok) {
          setMessage(data?.message ?? "Registration failed.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setMessage("Invalid email or password.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <WalletCards size={18} />
            Expense Desk
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Secure access for your spending dashboard.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Sign in to keep the workspace private while the Next.js backend handles account verification and sessions.
            </p>
          </div>
        </section>

        <Card radius="sm" shadow="sm" className="border border-slate-200/70">
          <CardBody className="gap-5 p-6">
            <Tabs
              aria-label="Authentication mode"
              selectedKey={mode}
              onSelectionChange={(key) => {
                setMode(key as AuthMode);
                setMessage("");
              }}
            >
              <Tab key="login" title="Sign in" />
              <Tab key="register" title="Create account" />
            </Tabs>

            <form className="grid gap-4" onSubmit={submit}>
              {mode === "register" ? (
                <Input
                  isRequired
                  autoComplete="name"
                  label="Name"
                  startContent={<UserRound size={17} />}
                  value={name}
                  onValueChange={setName}
                />
              ) : null}
              <Input
                isRequired
                autoComplete="email"
                label="Email"
                startContent={<Mail size={17} />}
                type="email"
                value={email}
                onValueChange={setEmail}
              />
              <Input
                isRequired
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                description={mode === "register" ? "Use 12+ characters with upper, lower, and number." : undefined}
                label="Password"
                startContent={<LockKeyhole size={17} />}
                type="password"
                value={password}
                onValueChange={setPassword}
              />
              {message ? (
                <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                  {message}
                </div>
              ) : null}
              <Button color="primary" isLoading={isSubmitting} size="lg" type="submit">
                {mode === "register" ? "Create account" : "Sign in"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
