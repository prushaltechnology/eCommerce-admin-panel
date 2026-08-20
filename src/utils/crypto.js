import CryptoJS from "crypto-js";

export const getDecryptedUser = () => {
  try {
    const encryptedUser = localStorage.getItem("user");
    if (!encryptedUser) return null;

    const encryptionKey = import.meta.env.VITE_USER_ENCRYPTION_KEY.trim();

    const bytes = CryptoJS.AES.decrypt(encryptedUser, encryptionKey);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      // console.error("Decryption failed, wrong key or corrupted data");
      localStorage.removeItem("user");
      return null;
    }

    const user = JSON.parse(decryptedText);

    /* -------- Determine Display Name -------- */
    let displayName = "Guest";

    if (user.first_name) {
      displayName = user.first_name;
    } else if (
      user.role === "company_admin" ||
      user.role === "admin"
    ) {
      displayName = "Admin";
    }

    /* -------- Return Normalized User -------- */
    return {
      ...user,
      displayName,
      employee_id: user.employee_id || `ADMIN-${user.id}`,
      designation: user.designation || user.role,
    };

  } catch (error) {
    // console.error("Failed to decrypt user info:", error);
    localStorage.removeItem("user");
    return null;
  }
};