"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { login, type LoginFormState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginFormState = {
  message: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="w-full max-w-[420px] rounded-lg border-stone/70 bg-cream/95 shadow-xl shadow-stone/30 ring-till/20">
      <CardHeader className="gap-2 px-6 pt-6">
        <div className="flex size-11 items-center justify-center rounded-lg bg-till text-cream shadow-sm"></div>
        <CardTitle className="font-spanlight text-3xl text-brown">
          Welcome back
        </CardTitle>
        <CardDescription className="font-urbanist text-brown/70">
          Sign in with your resort account.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-brown">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
              className="h-11 border-tan/80 bg-sand/40 text-brown placeholder:text-brown/45 focus-visible:border-till focus-visible:ring-mint/40"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-brown">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                autoComplete="current-password"
                required
                className="h-11 border-tan/80 bg-sand/40 pr-11 text-brown placeholder:text-brown/45 focus-visible:border-till focus-visible:ring-mint/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-brown/65 transition hover:bg-tan/30 hover:text-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          {state.message ? (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={pending}
            className="mt-1 h-11 bg-till text-cream hover:bg-green"
          >
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
