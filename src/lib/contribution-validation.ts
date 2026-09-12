export type ContributionField =
  | "senderName"
  | "avatar"
  | "contentType"
  | "message"
  | "video"
  | "consent";

export type ContributionFieldErrors = Partial<
  Record<ContributionField, string>
>;

export type ContributionFormState = {
  status: "idle" | "submitting" | "error" | "success" | "closed";
  message: string;
  fieldErrors: ContributionFieldErrors;
  submissionId: string;
  editUrl?: string;
};

function readText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasSelectedFile(value: FormDataEntryValue | null): boolean {
  return value !== null && typeof value !== "string" && value.size > 0;
}

export function validateRequiredContributionFields(
  formData: FormData,
): ContributionFieldErrors {
  const fieldErrors: ContributionFieldErrors = {};
  const senderName = readText(formData.get("senderName"));
  const contentType = readText(formData.get("contentType"));
  const message = readText(formData.get("message"));
  const consent = readText(formData.get("consent"));

  if (!senderName) {
    fieldErrors.senderName = "Vui lòng nhập tên của bạn.";
  } else if (senderName.length > 80) {
    fieldErrors.senderName = "Tên không được dài quá 80 ký tự.";
  }

  if (contentType !== "text" && contentType !== "video") {
    fieldErrors.contentType = "Vui lòng chọn viết lời chúc hoặc gửi video.";
  } else if (contentType === "text") {
    if (!message) {
      fieldErrors.message = "Vui lòng viết lời chúc dành cho bé Heo.";
    } else if (message.length > 5000) {
      fieldErrors.message = "Lời chúc không được dài quá 5.000 ký tự.";
    }
  } else if (!hasSelectedFile(formData.get("video"))) {
    fieldErrors.video = "Vui lòng chọn một video lời chúc.";
  }

  if (consent !== "accepted") {
    fieldErrors.consent = "Bạn cần đồng ý trước khi gửi lời chúc.";
  }

  return fieldErrors;
}
