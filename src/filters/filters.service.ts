import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FiltersService {
  private readonly logger = new Logger(FiltersService.name);

  async generateFilterFromPrompt(prompt: string) {
    try {
      const response = await fetch(
        'https://apps.abacus.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-5.1',
            messages: [
              {
                role: 'user',
                content: `Generate an image filter effect based on this description: ${prompt}. Create a stylized visual effect. Please respond in JSON format with filter parameters.`,
              },
            ],
            modalities: ['image'],
            image_config: {
              num_images: 1,
              aspect_ratio: '1:1',
            },
            stream: false,
          }),
        },
      );

      const data = await response.json();
      const imageData =
        data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) {
        throw new Error('No image generated');
      }

      return {
        filterName: prompt,
        imageUrl: imageData,
      };
    } catch (error: any) {
      this.logger.error('Filter generation error:', error?.message);
      throw error;
    }
  }

  async getPresetFilters() {
    return [
      { id: 'vintage', name: 'Vintage', description: 'Classic retro look' },
      { id: 'noir', name: 'Noir', description: 'Black and white cinematic' },
      { id: 'vivid', name: 'Vivid', description: 'Enhanced colors' },
      { id: 'warm', name: 'Warm', description: 'Warm tones' },
      { id: 'cool', name: 'Cool', description: 'Cool blue tones' },
      { id: 'sepia', name: 'Sepia', description: 'Classic sepia tone' },
      { id: 'dramatic', name: 'Dramatic', description: 'High contrast' },
      { id: 'dreamy', name: 'Dreamy', description: 'Soft and ethereal' },
    ];
  }
}
