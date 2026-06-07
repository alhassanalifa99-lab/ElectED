export const BADGES = {
  FIRST_VOTE: { id: 'first_vote', label: 'First Vote', emoji: '🗳️' },
  EARLY_BIRD: { id: 'early_bird', label: 'Early Bird', emoji: '🐦' },
  INFORMED_VOTER: { id: 'informed_voter', label: 'Informed Voter', emoji: '🤖' },
  RESEARCHER: { id: 'researcher', label: 'Researcher', emoji: '🔍' },
  CIVIC_CHAMPION: { id: 'civic_champion', label: 'Civic Champion', emoji: '🏆' },
}

export function calculateBadges(
  isFirstVote: boolean,
  votedWithinFirstHour: boolean,
  usedChatbot: boolean,
  usedComparison: boolean,
  totalElectionsVoted: number
): string[] {
  const earned: string[] = []

  if (isFirstVote) earned.push(BADGES.FIRST_VOTE.id)
  if (votedWithinFirstHour) earned.push(BADGES.EARLY_BIRD.id)
  if (usedChatbot) earned.push(BADGES.INFORMED_VOTER.id)
  if (usedComparison) earned.push(BADGES.RESEARCHER.id)
  if (totalElectionsVoted >= 3) earned.push(BADGES.CIVIC_CHAMPION.id)

  return earned
}

export function getBadgeDetails(badgeId: string) {
  return Object.values(BADGES).find((b) => b.id === badgeId)
}