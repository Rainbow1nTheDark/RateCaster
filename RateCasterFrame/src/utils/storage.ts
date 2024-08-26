import fs from 'fs';


const FILE_PATH = './scores.json';

// Ensure the file exists and is initialized
const initializeStorage = (): void => {
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify({}));
  }
};

// Retrieve scores from the file
const getScores = (): Record<string, number> => {
  initializeStorage();
  const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
  return JSON.parse(fileContent);
};

// Save scores to the file
const saveScores = (scores: Record<string, number>): void => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(scores, null, 2));
};

// Update the score for a given fid
export const updateScore = (fid: string, newScore: number): void => {
    if (!fs.existsSync(FILE_PATH)) {
        initializeStorage();
      }
  const scores = getScores();
  scores[fid] = newScore;
  saveScores(scores);
};

