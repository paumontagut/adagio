import phraseData from '../assets/training-phrases.json';

interface PhraseDataset {
  phrases: string[];
  totalCount: number;
}

class PhraseService {
  private phrases: string[] = [];
  private isLoaded = false;

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load phrases from JSON file
      const data: PhraseDataset = phraseData;
      this.phrases = data.phrases;
      this.isLoaded = true;
      console.log(`Loaded ${this.phrases.length} training phrases`);
    } catch (error) {
      console.error('Error loading phrases:', error);
      // Fallback to default phrases
      this.phrases = [
        "Buenos días, ¿cómo está usted?",
        "Necesito ayuda con esto, por favor",
        "El clima está muy agradable hoy",
        "Me gustaría hacer una reservación",
        "¿Puede repetir eso, por favor?",
        "Muchas gracias por su ayuda",
        "Hasta luego, que tenga un buen día",
        "¿Dónde está la estación más cercana?"
      ];
      this.isLoaded = true;
    }
  }

  getRandomPhrase(): string {
    if (!this.isLoaded || this.phrases.length === 0) {
      // Return a default phrase if not initialized
      return "Buenos días, ¿cómo está usted?";
    }

    const randomIndex = Math.floor(Math.random() * this.phrases.length);
    return this.phrases[randomIndex];
  }

  getTotalCount(): number {
    return this.phrases.length;
  }

  getPhrasesByCategory(category?: string): string[] {
    // For future enhancement - categorized phrases
    return this.phrases;
  }
}

export const phraseService = new PhraseService();