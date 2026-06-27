"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginWithPassword(prevState, formData) {
  const password = formData.get("password");
  const APP_PASSWORD = process.env.APP_PASSWORD;

  if (!APP_PASSWORD) {
    return { error: "Authentication is not configured on the server." };
  }

  if (password === APP_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("app_auth_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    redirect("/");
  }

  return { error: "Invalid password" };
}
