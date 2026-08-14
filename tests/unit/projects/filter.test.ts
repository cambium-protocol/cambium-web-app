import { describe, it, expect } from 'vitest';
import {
  filterProjects,
  availableMethodologies,
  availableGeographies,
} from '@/lib/projects/filter';
import type { Project } from '@cambium-protocol/sdk';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

const projects: Project[] = [
  { id: ACCOUNT, methodology: 'ARR', geography: 'Kenya', verifyingKeyVersion: 1 },
  {
    id: 'GA4GASG6WYK6W3FQZPZ4V2EOSVYNCP2DWLDUHMS2B5MX6MYL7G4AFEOR',
    methodology: 'REDD+',
    geography: 'Brazil',
    externalRegistryRef: 'VCS-123',
    verifyingKeyVersion: 2,
  },
  { id: 'GBA4RFT2UCLMD7BQPYQQRLJ3RVS72G4P5CBEKPZOEMNROZCWWPDVHAVH', methodology: 'ARR', geography: 'Kenya', verifyingKeyVersion: 1 },
];

describe('filterProjects', () => {
  it('returns all projects for an empty query', () => {
    expect(filterProjects(projects, '')).toHaveLength(3);
    expect(filterProjects(projects, '   ')).toHaveLength(3);
  });

  it('matches methodology case-insensitively', () => {
    expect(filterProjects(projects, 'redd')).toHaveLength(1);
    expect(filterProjects(projects, 'arr')).toHaveLength(2);
  });

  it('matches geography', () => {
    expect(filterProjects(projects, 'brazil')).toHaveLength(1);
    expect(filterProjects(projects, 'kenya')).toHaveLength(2);
  });

  it('matches external registry refs and ids', () => {
    expect(filterProjects(projects, 'vcs-123')).toHaveLength(1);
    expect(filterProjects(projects, ACCOUNT.slice(0, 10))).toHaveLength(1);
  });

  it('returns no results for an unmatched query', () => {
    expect(filterProjects(projects, 'nope')).toHaveLength(0);
  });

  it('filters by methodology exactly', () => {
    expect(filterProjects(projects, '', { methodology: 'ARR' })).toHaveLength(
      2,
    );
    expect(filterProjects(projects, '', { methodology: 'REDD+' })).toHaveLength(
      1,
    );
    expect(filterProjects(projects, '', { methodology: 'None' })).toHaveLength(
      0,
    );
  });

  it('filters by geography exactly', () => {
    expect(filterProjects(projects, '', { geography: 'Kenya' })).toHaveLength(
      2,
    );
    expect(filterProjects(projects, '', { geography: 'Brazil' })).toHaveLength(
      1,
    );
  });

  it('combines methodology, geography, and search', () => {
    expect(
      filterProjects(projects, 'redd', { geography: 'Brazil' }),
    ).toHaveLength(1);
    expect(filterProjects(projects, 'arr', { geography: 'Brazil' })).toHaveLength(
      0,
    );
  });
});

describe('availableMethodologies', () => {
  it('returns unique sorted methodologies', () => {
    expect(availableMethodologies(projects)).toEqual(['ARR', 'REDD+']);
  });
});

describe('availableGeographies', () => {
  it('returns unique sorted geographies', () => {
    expect(availableGeographies(projects)).toEqual(['Brazil', 'Kenya']);
  });
});
