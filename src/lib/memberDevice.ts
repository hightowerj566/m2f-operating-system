// A device-local navigation hint, never authentication or an access entitlement.
const MEMBER_DEVICE_KEY = "m2f-member-device";

export function isRecognizedMemberDevice(): boolean {
  try {
    return window.localStorage.getItem(MEMBER_DEVICE_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberMemberDevice(): void {
  try {
    window.localStorage.setItem(MEMBER_DEVICE_KEY, "1");
  } catch {
    // Restricted storage must not prevent sign-in.
  }
}

export function clearMemberDevice(): boolean {
  try {
    window.localStorage.removeItem(MEMBER_DEVICE_KEY);
    return true;
  } catch {
    return false;
  }
}