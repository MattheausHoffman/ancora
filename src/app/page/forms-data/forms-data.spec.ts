import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsData } from './forms-data';

describe('FormsData', () => {
  let component: FormsData;
  let fixture: ComponentFixture<FormsData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormsData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
