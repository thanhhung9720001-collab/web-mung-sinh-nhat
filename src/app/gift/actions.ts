"use server";

import { redirect } from "next/navigation";
import {
  createGiftSession,
  deleteGiftSession,
} from "@/lib/gift-session.server";
import { verifyGiftPassword } from "@/lib/password.server";

export type GiftLoginState = {
  status: "idle" | "error";
  message: string;
};

export async function loginGift(
  _previousState: GiftLoginState,
  formData: FormData,
): Promise<GiftLoginState> {
  const value = formData.get("password");
  const password = typeof value === "string" ? value : "";

  if (!verifyGiftPassword(password)) {
    return {
      status: "error",
      message: "Mật khẩu mở quà chưa đúng.",
    };
  }

  await createGiftSession();
  redirect("/gift");
}

export async function logoutGift(): Promise<never> {
  await deleteGiftSession();
  redirect("/gift");
}
