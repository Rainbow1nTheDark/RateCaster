import {
    DappRating,
  } from "../graphQL/fetchFromSubgraph";

export type RatingsMap = { [dappId: string]: { averageRating: number, count: number } };

export function computeAverageRatings(submittedRatings: DappRating[]): RatingsMap {
    const ratings: RatingsMap = {};
  
    submittedRatings.forEach(({ dappId, starRating }) => {
      if (ratings[dappId]) {
        ratings[dappId].averageRating += starRating;
        ratings[dappId].count += 1;
      } else {
        ratings[dappId] = { averageRating: starRating, count: 1 };
      }
    });
  
    for (const dappId in ratings) {
      ratings[dappId].averageRating = ratings[dappId].averageRating / ratings[dappId].count;
    }
  
    return ratings;
  }
  
  // Function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }
  
  // Function to get 3 random elements from an array
export function getRandomApps<T>(array: T[], numItems: number): T[] {
    const shuffledArray = shuffleArray(array);
    return shuffledArray.slice(0, numItems);
  }

export function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return `${text.substring(0, maxLength)}...`;
  }
  return text;
}