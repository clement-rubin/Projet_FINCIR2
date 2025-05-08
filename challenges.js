import { CHALLENGE_TYPES } from './utils/constants';

export const CHALLENGES = [
  {
    id: 1,
    title: 'Morning Run at Parc de la Citadelle',
    description: 'Complete a 5km run around the park.',
    location: {
      latitude: 50.6372,
      longitude: 3.0635
    },
    points: 50,
    type: CHALLENGE_TYPES.REGULAR,
    completed: false
  },
  {
    id: 2,
    title: 'Photography Challenge',
    description: 'Take a photo of the most beautiful spot in Parc de la Citadelle.',
    location: {
      latitude: 50.6372,
      longitude: 3.0635
    },
    points: 30,
    type: CHALLENGE_TYPES.REGULAR,
    completed: false
  },
  {
    id: 3,
    title: 'Nature Walk',
    description: 'Walk through the park and identify 5 different types of trees.',
    location: {
      latitude: 50.6372,
      longitude: 3.0635
    },
    points: 40,
    type: CHALLENGE_TYPES.REGULAR,
    completed: false
  }
];

// Fonction pour obtenir les défis complétés
export const getCompletedChallenges = () => {
  return CHALLENGES.filter(challenge => challenge.completed);
};

// Fonction pour marquer un défi comme complété
export const markChallengeAsCompleted = (challengeId) => {
  const challenge = CHALLENGES.find(c => c.id === challengeId);
  if (challenge) {
    challenge.completed = true;
    challenge.type = CHALLENGE_TYPES.COMPLETED;
  }
};
