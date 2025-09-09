/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NewsItem } from '../types';

/**
 * Text processing utilities
 */
export class TextUtils {
  static cleanDescription(description: string): string {
    return description.replace(/<[^>]*>/g, '').trim();
  }

  static formatDate(pubDate: string): string {
    return pubDate
      ? new Date(pubDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';
  }

  static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Array utilities
 */
export class ArrayUtils {
  static getRandomItem<T>(array: T[]): T | undefined {
    return array[Math.floor(Math.random() * array.length)];
  }

  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  static isValidNewsItem(item: any): item is NewsItem {
    return (
      typeof item === 'object' &&
      typeof item.title === 'string' &&
      typeof item.description === 'string'
    );
  }

  static isValidApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length > 0;
  }
}
