// ==============================================================================
// src/services/prospect/GooglePlacesClient.ts — Google Places API (New) Client
// ==============================================================================

import type { ProspectCandidate, RawPlaceResult } from './types';

export class GooglePlacesClient {
  private apiKey: string;
  private baseUrl = 'https://places.googleapis.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || '';
  }

  /**
   * Performs a cost-optimized Text Search (New) with minimal field masks.
   */
  async textSearch(
    query: string,
    city: string,
    state: string,
    country: string,
    pageSize = 20
  ): Promise<ProspectCandidate[]> {
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured.');
    }

    const endpoint = `${this.baseUrl}/places:searchText`;
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.types',
      'places.businessStatus',
      'places.nationalPhoneNumber',
      'places.websiteUri',
    ].join(',');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: Math.min(pageSize, 20),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Places Text Search error [HTTP ${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const rawPlaces: RawPlaceResult[] = data.places || [];

    return rawPlaces
      .filter((p) => p.businessStatus !== 'CLOSED_PERMANENTLY' && p.businessStatus !== 'CLOSED_TEMPORARILY')
      .map((p) => ({
        placeId: p.id,
        businessName: p.displayName?.text || 'Unknown Business',
        formattedAddress: p.formattedAddress || '',
        city,
        state,
        country,
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
        website: p.websiteUri || '',
        types: p.types || [],
        sourceQuery: query,
      }));
  }

  /**
   * Targeted Place Details (New) called ONLY for promising candidates missing contact info.
   */
  async getPlaceDetails(placeId: string): Promise<Partial<ProspectCandidate>> {
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured.');
    }

    const endpoint = `${this.baseUrl}/places/${placeId}`;
    const fieldMask = 'id,nationalPhoneNumber,websiteUri';

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    if (!response.ok) {
      return {};
    }

    const data: RawPlaceResult = await response.json();
    return {
      phone: data.nationalPhoneNumber || data.internationalPhoneNumber || '',
      website: data.websiteUri || '',
    };
  }
}
