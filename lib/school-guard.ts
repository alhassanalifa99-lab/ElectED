export function canAccessSchool(electionSchoolId: string | null): boolean {
  try {
    if (sessionStorage.getItem('is_super_admin') === 'true') {
      return true
    }
    const schoolId = sessionStorage.getItem('school_id')
    return schoolId !== null && schoolId === electionSchoolId
  } catch {
    return false
  }
}
