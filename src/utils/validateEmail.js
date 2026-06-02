export function isUSUEmail(email) {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();

  return (
    normalizedEmail.endsWith("@usu.ac.id") ||
    normalizedEmail.endsWith("@students.usu.ac.id")
  );
}

export function getUserRoleFromEmail(email) {
  if (!email) return "";

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail.endsWith("@students.usu.ac.id")) {
    return "student";
  }

  if (normalizedEmail.endsWith("@usu.ac.id")) {
    return "staff";
  }

  return "";
}

export function isValidStudentNIM(identity) {
  return /^\d{9}$/.test(identity);
}

export function isValidStaffNIP(identity) {
  return /^\d{18}$/.test(identity);
}