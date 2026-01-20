import goldenSetData from '../assets/golden_set.json';
import trainingPhrasesData from '../assets/training-phrases.json';

interface PhraseDataset {
  phrases: string[];
}

export type TrainingPhase = 'golden' | 'extended';

interface TrainingProgress {
  phase: TrainingPhase;
  goldenIndex: number;
  completedPhrases: string[];
}

class PhraseService {
  private goldenPhrases: string[] = [];
  private trainingPhrases: string[] = [];
  private filteredTrainingPhrases: string[] = [];
  private isLoaded = false;
  
  // Current progress
  private currentPhase: TrainingPhase = 'golden';
  private goldenIndex = 0;
  private completedPhrases: Set<string> = new Set();

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load golden set (priority/mandatory)
      const goldenData: PhraseDataset = goldenSetData;
      this.goldenPhrases = goldenData.phrases;
      
      // Load training phrases
      const trainingData: PhraseDataset = trainingPhrasesData;
      this.trainingPhrases = trainingData.phrases;
      
      // Filter training phrases to exclude those in golden set
      const goldenSet = new Set(this.goldenPhrases);
      this.filteredTrainingPhrases = this.trainingPhrases.filter(
        phrase => !goldenSet.has(phrase)
      );
      
      this.isLoaded = true;
      console.log(`Loaded ${this.goldenPhrases.length} golden phrases and ${this.filteredTrainingPhrases.length} training phrases`);
    } catch (error) {
      console.error('Error loading phrases:', error);
      // Fallback to default phrases
      this.goldenPhrases = [
        "Buenos días, ¿cómo está usted?",
        "Necesito ayuda con esto, por favor",
        "El clima está muy agradable hoy",
        "Me gustaría hacer una reservación"
      ];
      this.filteredTrainingPhrases = [];
      this.isLoaded = true;
    }
  }

  // Load progress from saved state
  loadProgress(progress: TrainingProgress): void {
    this.currentPhase = progress.phase;
    this.goldenIndex = progress.goldenIndex;
    this.completedPhrases = new Set(progress.completedPhrases);
    console.log(`Restored progress: phase=${this.currentPhase}, goldenIndex=${this.goldenIndex}, completed=${this.completedPhrases.size}`);
  }

  // Get current progress for saving
  getProgress(): TrainingProgress {
    return {
      phase: this.currentPhase,
      goldenIndex: this.goldenIndex,
      completedPhrases: Array.from(this.completedPhrases)
    };
  }

  // Get current phase
  getCurrentPhase(): TrainingPhase {
    return this.currentPhase;
  }

  // Get current phrase based on phase
  getCurrentPhrase(): string {
    if (!this.isLoaded) {
      return "Cargando...";
    }

    if (this.currentPhase === 'golden') {
      if (this.goldenIndex < this.goldenPhrases.length) {
        return this.goldenPhrases[this.goldenIndex];
      }
      // This shouldn't happen - we should transition to extended phase first
      return this.goldenPhrases[this.goldenPhrases.length - 1];
    } else {
      // Extended phase - random from filtered training phrases
      return this.getRandomTrainingPhrase();
    }
  }

  // Move to next phrase (returns true if phase completed)
  nextPhrase(): boolean {
    const currentPhrase = this.getCurrentPhrase();
    this.completedPhrases.add(currentPhrase);

    if (this.currentPhase === 'golden') {
      this.goldenIndex++;
      // Check if golden set is completed
      if (this.goldenIndex >= this.goldenPhrases.length) {
        return true; // Signal that golden phase is complete
      }
    }
    // Extended phase doesn't "complete" - it's infinite random
    return false;
  }

  // Transition to extended phase
  transitionToExtendedPhase(): void {
    this.currentPhase = 'extended';
    console.log('Transitioned to extended phase');
  }

  // Get random phrase from filtered training set
  private getRandomTrainingPhrase(): string {
    // Filter out already completed phrases
    const available = this.filteredTrainingPhrases.filter(
      p => !this.completedPhrases.has(p)
    );
    
    if (available.length === 0) {
      // All phrases completed, reset and pick randomly
      return this.filteredTrainingPhrases[
        Math.floor(Math.random() * this.filteredTrainingPhrases.length)
      ];
    }
    
    return available[Math.floor(Math.random() * available.length)];
  }

  // Get progress info
  getGoldenProgress(): { current: number; total: number } {
    return {
      current: Math.min(this.goldenIndex + 1, this.goldenPhrases.length),
      total: this.goldenPhrases.length
    };
  }

  // Check if golden set is complete
  isGoldenSetComplete(): boolean {
    return this.goldenIndex >= this.goldenPhrases.length;
  }

  // Reset progress
  resetProgress(): void {
    this.currentPhase = 'golden';
    this.goldenIndex = 0;
    this.completedPhrases.clear();
  }

  // Legacy method for compatibility
  getRandomPhrase(): string {
    return this.getCurrentPhrase();
  }

  getTotalCount(): number {
    return this.goldenPhrases.length + this.filteredTrainingPhrases.length;
  }

  getGoldenCount(): number {
    return this.goldenPhrases.length;
  }

  getExtendedCount(): number {
    return this.filteredTrainingPhrases.length;
  }
}

export const phraseService = new PhraseService();
