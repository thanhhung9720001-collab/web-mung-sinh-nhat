"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminSession,
  deleteAdminSession,
  hasValidAdminSession,
} from "@/lib/admin-session.server";
import { verifyAdminPassword } from "@/lib/password.server";
import {
  moderateAdminWish,
  setAdminWishDisplayOrder,
  type AdminModerationIntent,
} from "@/lib/supabase-admin.server";

export type AdminLoginState = {
  status: "idle" | "error";
  message: string;
};

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const value = formData.get("password");
  const password = typeof value === "string" ? value : "";

  if (!verifyAdminPassword(password)) {
    return {
      status: "error",
      message: "Mật khẩu quản trị không đúng.",
    };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin(): Promise<never> {
  await deleteAdminSession();
  redirect("/admin");
}

export async function moderateWish(formData: FormData): Promise<never> {
  if (!(await hasValidAdminSession())) {
    redirect("/admin");
  }

  const wishIdValue = formData.get("wishId");
  const intentValue = formData.get("intent");
  const wishId = typeof wishIdValue === "string" ? wishIdValue : "";
  const intent = parseModerationIntent(intentValue);

  if (!intent) {
    redirect(`/admin/wishes/${encodeURIComponent(wishId)}?notice=invalid`);
  }

  const result = await moderateAdminWish(wishId, intent);

  revalidatePath("/admin");
  revalidatePath(`/admin/wishes/${wishId}`);

  if (result === "not_found") {
    redirect("/admin?notice=not-found");
  }

  if (intent === "delete") {
    redirect(
      result === "deleted_media_cleanup_failed"
        ? "/admin?notice=deleted-media-warning"
        : "/admin?notice=deleted",
    );
  }

  redirect(`/admin/wishes/${wishId}?notice=${intent}`);
}

export async function updateWishDisplayOrder(
  formData: FormData,
): Promise<never> {
  if (!(await hasValidAdminSession())) {
    redirect("/admin");
  }

  const wishIdValue = formData.get("wishId");
  const positionValue = formData.get("position");
  const wishId = typeof wishIdValue === "string" ? wishIdValue : "";
  const position = parseDisplayPosition(positionValue);

  if (position === undefined) {
    redirect(`/admin/wishes/${encodeURIComponent(wishId)}?notice=order-invalid`);
  }

  const updated = await setAdminWishDisplayOrder(
    wishId,
    position === null ? null : position - 1,
  );

  revalidatePath("/admin");
  revalidatePath(`/admin/wishes/${wishId}`);

  redirect(
    updated
      ? `/admin/wishes/${wishId}?notice=order-updated`
      : "/admin?notice=not-found",
  );
}

function parseModerationIntent(
  value: FormDataEntryValue | null,
): AdminModerationIntent | null {
  return value === "approved" ||
    value === "rejected" ||
    value === "delete"
    ? value
    : null;
}

function parseDisplayPosition(
  value: FormDataEntryValue | null,
): number | null | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  if (value.trim() === "") {
    return null;
  }

  const position = Number(value);

  return Number.isSafeInteger(position) && position >= 1 && position <= 10_000
    ? position
    : undefined;
}
