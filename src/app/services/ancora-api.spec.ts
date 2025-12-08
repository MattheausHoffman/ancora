import { TestBed } from '@angular/core/testing';

import { AncoraApi } from './ancora-api';

describe('AncoraApi', () => {
  let service: AncoraApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AncoraApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
