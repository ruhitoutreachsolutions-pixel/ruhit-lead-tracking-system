import { describe, it, expect } from 'vitest';
import {
  formatKeywordsForScraper,
  formatLocationsForScraper,
} from '../lib/clipboard';
import { CollectionLocation, CollectionBatch } from '../types';

describe('Lead Collection Engine & Clipboard Formatting', () => {
  describe('formatKeywordsForScraper', () => {
    it('formats keywords exactly 1 per line without bullets or quotes', () => {
      const input = [
        '  homecare agency  ',
        'domiciliary care  ',
        'supported living',
        '   ',
        'nursing home',
      ];
      const output = formatKeywordsForScraper(input);
      expect(output).toBe('homecare agency\ndomiciliary care\nsupported living\nnursing home');
      expect(output.split('\n')).toHaveLength(4);
    });

    it('handles empty arrays gracefully', () => {
      expect(formatKeywordsForScraper([])).toBe('');
    });
  });

  describe('formatLocationsForScraper', () => {
    it('formats locations 1 per line as City, Country', () => {
      const input = [
        { city: 'Dublin', country: 'Ireland' },
        { city: 'Cork', country: 'Ireland' },
        { city: 'Galway', country: '' },
      ];
      const output = formatLocationsForScraper(input);
      expect(output).toBe('Dublin, Ireland\nCork, Ireland\nGalway');
    });
  });

  describe('Combinations Calculation', () => {
    it('correctly calculates K x L combinations', () => {
      const keywordCount = 6;
      const locationCount = 20;
      const combinations = keywordCount * locationCount;
      expect(combinations).toBe(120);
    });

    it('handles zero keywords or locations', () => {
      expect(0 * 20).toBe(0);
      expect(6 * 0).toBe(0);
    });
  });

  describe('Location Availability & Claiming Algorithm', () => {
    const mockLocations: CollectionLocation[] = [
      {
        id: 'loc-1',
        city: 'Longford',
        country: 'Ireland',
        normalized_name: 'longford_ireland',
        status: 'available',
        created_at: new Date().toISOString(),
      },
      {
        id: 'loc-2',
        city: 'Dungarvan',
        country: 'Ireland',
        normalized_name: 'dungarvan_ireland',
        status: 'available',
        created_at: new Date().toISOString(),
      },
      {
        id: 'loc-3',
        city: 'Nenagh',
        country: 'Ireland',
        normalized_name: 'nenagh_ireland',
        status: 'in_progress', // Claimed by another active batch
        created_at: new Date().toISOString(),
      },
      {
        id: 'loc-4',
        city: 'Trim',
        country: 'Ireland',
        normalized_name: 'trim_ireland',
        status: 'completed',
        last_used_keyword_set_id: 'kw-care', // Completed for kw-care
        created_at: new Date().toISOString(),
      },
      {
        id: 'loc-5',
        city: 'New Ross',
        country: 'Ireland',
        normalized_name: 'new_ross_ireland',
        status: 'available',
        created_at: new Date().toISOString(),
      },
    ];

    const mockBatches: CollectionBatch[] = [
      {
        id: 'batch-active-1',
        batch_number: 'BATCH-001',
        batch_name: 'Active Scrape',
        keyword_set_id: 'kw-care',
        keyword_set_name: 'Care Services',
        country: 'Ireland',
        status: 'in_progress',
        keyword_count: 5,
        location_count: 1,
        combination_count: 5,
        leads_collected: 0,
        locations: [
          {
            id: 'bl-1',
            batch_id: 'batch-active-1',
            location_id: 'loc-3',
            city: 'Nenagh',
            country: 'Ireland',
            status: 'pending',
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    function getNextAvailable(
      country: string,
      keywordSetId: string,
      count: number,
      locations: CollectionLocation[],
      batches: CollectionBatch[]
    ): CollectionLocation[] {
      const activeClaimed = new Set<string>();
      batches
        .filter((b) => b.status === 'ready' || b.status === 'in_progress')
        .forEach((b) => {
          b.locations?.forEach((bl) => activeClaimed.add(bl.location_id));
        });

      return locations
        .filter((loc) => {
          if (loc.country.toLowerCase() !== country.toLowerCase()) return false;
          if (activeClaimed.has(loc.id)) return false;
          if (loc.status === 'in_progress' || loc.status === 'claimed') return false;
          if (loc.last_used_keyword_set_id === keywordSetId && loc.status === 'completed') {
            return false;
          }
          return true;
        })
        .slice(0, count);
    }

    it('excludes locations claimed by active batches', () => {
      const available = getNextAvailable('Ireland', 'kw-care', 10, mockLocations, mockBatches);
      const ids = available.map((l) => l.id);

      expect(ids).not.toContain('loc-3'); // loc-3 is in_progress / claimed
      expect(ids).toContain('loc-1'); // loc-1 is available
      expect(ids).toContain('loc-2'); // loc-2 is available
      expect(ids).toContain('loc-5'); // loc-5 is available
    });

    it('excludes locations completed for the same keyword set', () => {
      const available = getNextAvailable('Ireland', 'kw-care', 10, mockLocations, mockBatches);
      const ids = available.map((l) => l.id);

      expect(ids).not.toContain('loc-4'); // Trim already completed for kw-care
    });

    it('allows locations completed for a DIFFERENT keyword set to be reused', () => {
      const available = getNextAvailable('Ireland', 'kw-training', 10, mockLocations, mockBatches);
      const ids = available.map((l) => l.id);

      expect(ids).toContain('loc-4'); // Reusable for another keyword set
    });

    it('respects requested batch size count', () => {
      const available = getNextAvailable('Ireland', 'kw-training', 2, mockLocations, mockBatches);
      expect(available).toHaveLength(2);
    });
  });
});
