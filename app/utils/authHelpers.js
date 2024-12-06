const AUTHORIZED_USERS = ['a.kh.adb@gmail.com', 'bhk891@gmail.com'];
const PROTECTED_ORGS = ['1729975050858', '1729975843089', '1729976182622'];

export function canManageOrg(userEmail, orgId) {
  if (!isProtectedOrg(orgId)) {
    return true;
  }
  return AUTHORIZED_USERS.includes(userEmail);
}

export function isProtectedOrg(orgId) {
  return PROTECTED_ORGS.includes(orgId);
} 