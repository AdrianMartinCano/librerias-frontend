import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedProducts } from './shared-products';

describe('SharedProducts', () => {
  let component: SharedProducts;
  let fixture: ComponentFixture<SharedProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
