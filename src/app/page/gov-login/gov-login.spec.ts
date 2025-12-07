import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GovLogin } from './gov-login';

describe('GovLogin', () => {
  let component: GovLogin;
  let fixture: ComponentFixture<GovLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GovLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
