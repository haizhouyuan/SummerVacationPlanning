describe('Student Dashboard', () => {
  beforeEach(() => {
    // Mock authentication state
    cy.window().then((win) => {
      win.localStorage.setItem('auth', JSON.stringify({
        user: {
          id: 'student123',
          email: 'student@example.com',
          displayName: '小明',
          role: 'student',
          points: 150,
        }
      }));
    });
    cy.visit('/dashboard');
  });

  it('should display student dashboard correctly', () => {
    cy.get('[data-cy=welcome-message]').should('contain', '欢迎回来，小明！');
    cy.get('[data-cy=user-role]').should('contain', '学生');
    cy.get('[data-cy=user-points]').should('be.visible');
  });

  it('should show quick action buttons', () => {
    cy.get('[data-cy=today-tasks-button]').should('be.visible').and('contain', '今日任务');
    cy.get('[data-cy=planning-button]').should('be.visible').and('contain', '任务规划');
    cy.get('[data-cy=rewards-button]').should('be.visible').and('contain', '奖励中心');
  });

  it('should display progress bar', () => {
    cy.get('[data-cy=weekly-progress]').should('be.visible');
    cy.get('[data-cy=progress-bar]').should('be.visible');
  });

  it('should navigate to today tasks page', () => {
    cy.get('[data-cy=today-tasks-button]').click();
    cy.url().should('include', '/today');
  });

  it('should navigate to planning page', () => {
    cy.get('[data-cy=planning-button]').click();
    cy.url().should('include', '/planning');
  });

  it('should navigate to rewards page', () => {
    cy.get('[data-cy=rewards-button]').click();
    cy.url().should('include', '/rewards');
  });

  it('should display statistics correctly', () => {
    cy.get('[data-cy=stats-section]').should('be.visible');
    cy.get('[data-cy=weekly-completed]').should('be.visible');
    cy.get('[data-cy=total-points]').should('contain', '150');
    cy.get('[data-cy=streak-days]').should('be.visible');
  });

  it('should show recent activity section', () => {
    cy.get('[data-cy=recent-activity]').should('be.visible');
  });

  it('should handle logout', () => {
    cy.get('[data-cy=logout-button]').click();
    cy.url().should('include', '/login');
  });
});

describe('Parent Dashboard', () => {
  beforeEach(() => {
    // Mock parent authentication state
    cy.window().then((win) => {
      win.localStorage.setItem('auth', JSON.stringify({
        user: {
          id: 'parent123',
          email: 'parent@example.com',
          displayName: '妈妈',
          role: 'parent',
          points: 0,
        }
      }));
    });
    cy.visit('/dashboard');
  });

  it('should display parent dashboard correctly', () => {
    cy.get('[data-cy=welcome-message]').should('contain', '欢迎回来，妈妈！');
    cy.get('[data-cy=user-role]').should('contain', '家长');
    cy.get('[data-cy=dashboard-title]').should('contain', '家长控制台');
  });

  it('should show management action buttons', () => {
    cy.get('[data-cy=task-approval-button]').should('be.visible').and('contain', '任务审批');
    cy.get('[data-cy=family-management-button]').should('be.visible').and('contain', '家庭管理');
  });

  it('should display child selector', () => {
    cy.get('[data-cy=child-selector]').should('be.visible');
    cy.get('[data-cy=child-card]').should('have.length.greaterThan', 0);
  });

  it('should open task approval modal', () => {
    cy.get('[data-cy=task-approval-button]').click();
    cy.get('[data-cy=task-approval-modal]').should('be.visible');
  });

  it('should open family management modal', () => {
    cy.get('[data-cy=family-management-button]').click();
    cy.get('[data-cy=family-management-modal]').should('be.visible');
  });

  it('should select different children', () => {
    cy.get('[data-cy=child-card]').first().click();
    cy.get('[data-cy=child-card]').first().should('have.class', 'border-cartoon-green');
  });

  it('should display child overview cards', () => {
    cy.get('[data-cy=child-overview]').should('be.visible');
    cy.get('[data-cy=weekly-progress-card]').should('be.visible');
    cy.get('[data-cy=streak-card]').should('be.visible');
    cy.get('[data-cy=category-breakdown]').should('be.visible');
  });

  it('should show family leaderboard', () => {
    cy.get('[data-cy=family-leaderboard]').should('be.visible');
    cy.get('[data-cy=leaderboard-entry]').should('have.length.greaterThan', 0);
  });

  it('should filter tasks by time period', () => {
    cy.get('[data-cy=time-filter-today]').click();
    cy.get('[data-cy=time-filter-today]').should('have.class', 'bg-cartoon-green');
    
    cy.get('[data-cy=time-filter-week]').click();
    cy.get('[data-cy=time-filter-week]').should('have.class', 'bg-cartoon-green');
  });
});