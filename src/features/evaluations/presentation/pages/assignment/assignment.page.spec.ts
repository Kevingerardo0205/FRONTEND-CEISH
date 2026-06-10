import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentPage } from './assignment.page';
import { Router } from '@angular/router';

describe('AssignmentPage', () => {
  let component: AssignmentPage;
  let fixture: ComponentFixture<AssignmentPage>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AssignmentPage],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });
});
