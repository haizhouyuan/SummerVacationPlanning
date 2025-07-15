describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('[data-cy=login-form]').should('be.visible');
    cy.get('[data-cy=email-input]').should('be.visible');
    cy.get('[data-cy=password-input]').should('be.visible');
    cy.get('[data-cy=login-button]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('[data-cy=login-button]').click();
    cy.get('[data-cy=email-error]').should('contain', '请输入邮箱');
    cy.get('[data-cy=password-error]').should('contain', '请输入密码');
  });

  it('should show error for invalid email format', () => {
    cy.get('[data-cy=email-input]').type('invalid-email');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=login-button]').click();
    cy.get('[data-cy=email-error]').should('contain', '请输入有效的邮箱地址');
  });

  it('should navigate to register page', () => {
    cy.get('[data-cy=register-link]').click();
    cy.url().should('include', '/register');
    cy.get('[data-cy=register-form]').should('be.visible');
  });

  it('should attempt login with valid credentials', () => {
    cy.get('[data-cy=email-input]').type('test@example.com');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=login-button]').click();
    
    // Mock successful login would redirect to dashboard
    // In a real test, you'd set up proper auth mocking
    cy.get('[data-cy=loading-spinner]').should('be.visible');
  });

  it('should toggle password visibility', () => {
    cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password');
    cy.get('[data-cy=password-toggle]').click();
    cy.get('[data-cy=password-input]').should('have.attr', 'type', 'text');
    cy.get('[data-cy=password-toggle]').click();
    cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password');
  });
});

describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('should display registration form', () => {
    cy.get('[data-cy=register-form]').should('be.visible');
    cy.get('[data-cy=name-input]').should('be.visible');
    cy.get('[data-cy=email-input]').should('be.visible');
    cy.get('[data-cy=password-input]').should('be.visible');
    cy.get('[data-cy=confirm-password-input]').should('be.visible');
    cy.get('[data-cy=role-select]').should('be.visible');
    cy.get('[data-cy=register-button]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('[data-cy=register-button]').click();
    cy.get('[data-cy=name-error]').should('contain', '请输入姓名');
    cy.get('[data-cy=email-error]').should('contain', '请输入邮箱');
    cy.get('[data-cy=password-error]').should('contain', '请输入密码');
  });

  it('should show error for password mismatch', () => {
    cy.get('[data-cy=name-input]').type('Test User');
    cy.get('[data-cy=email-input]').type('test@example.com');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=confirm-password-input]').type('password456');
    cy.get('[data-cy=register-button]').click();
    cy.get('[data-cy=confirm-password-error]').should('contain', '密码不匹配');
  });

  it('should allow role selection', () => {
    cy.get('[data-cy=role-select]').select('student');
    cy.get('[data-cy=role-select]').should('have.value', 'student');
    
    cy.get('[data-cy=role-select]').select('parent');
    cy.get('[data-cy=role-select]').should('have.value', 'parent');
  });

  it('should attempt registration with valid data', () => {
    cy.get('[data-cy=name-input]').type('Test User');
    cy.get('[data-cy=email-input]').type('test@example.com');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=confirm-password-input]').type('password123');
    cy.get('[data-cy=role-select]').select('student');
    cy.get('[data-cy=register-button]').click();
    
    cy.get('[data-cy=loading-spinner]').should('be.visible');
  });

  it('should navigate back to login page', () => {
    cy.get('[data-cy=login-link]').click();
    cy.url().should('include', '/login');
    cy.get('[data-cy=login-form]').should('be.visible');
  });
});