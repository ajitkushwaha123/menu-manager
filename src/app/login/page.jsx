"use client";

import { useActionState, useEffect, useState } from "react";
import { loginWithPassword } from "./actions";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginWithPassword, null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Protected Area</h1>
            <p className="text-sm text-gray-500">
              Please enter the password to access the app.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !password}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Unlock"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
