describe('Task Management', () => {
  beforeEach(() => {
    // Mock student authentication
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
  });

  describe('Today Tasks Page', () => {
    beforeEach(() => {
      cy.visit('/today');
    });

    it('should display today tasks page', () => {
      cy.get('[data-cy=today-tasks-title]').should('contain', '今日任务');
      cy.get('[data-cy=task-list]').should('be.visible');
    });

    it('should show task cards', () => {
      cy.get('[data-cy=task-card]').should('have.length.greaterThan', 0);
    });

    it('should display task information correctly', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=task-title]').should('be.visible');
        cy.get('[data-cy=task-category-icon]').should('be.visible');
        cy.get('[data-cy=task-points]').should('be.visible');
        cy.get('[data-cy=task-status]').should('be.visible');
      });
    });

    it('should allow starting a task', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=start-task-button]').click();
        cy.get('[data-cy=task-status]').should('contain', '进行中');
      });
    });

    it('should open evidence modal when completing task', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=complete-task-button]').click();
      });
      cy.get('[data-cy=evidence-modal]').should('be.visible');
    });

    it('should submit task evidence', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=complete-task-button]').click();
      });
      
      cy.get('[data-cy=evidence-modal]').within(() => {
        cy.get('[data-cy=text-evidence-input]').type('我完成了这个任务，学到了很多东西！');
        cy.get('[data-cy=notes-input]').type('这是额外的备注');
        cy.get('[data-cy=submit-evidence-button]').click();
      });

      cy.get('[data-cy=evidence-modal]').should('not.exist');
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=task-status]').should('contain', '已完成');
      });
    });

    it('should allow skipping a task', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=skip-task-button]').click();
        cy.get('[data-cy=task-status]').should('contain', '已跳过');
      });
    });

    it('should show completion celebration', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=complete-task-button]').click();
      });
      
      cy.get('[data-cy=evidence-modal]').within(() => {
        cy.get('[data-cy=text-evidence-input]').type('任务完成！');
        cy.get('[data-cy=submit-evidence-button]').click();
      });

      cy.get('[data-cy=celebration-modal]').should('be.visible');
      cy.get('[data-cy=celebration-title]').should('contain', '任务完成');
    });
  });

  describe('Task Planning Page', () => {
    beforeEach(() => {
      cy.visit('/planning');
    });

    it('should display planning page', () => {
      cy.get('[data-cy=planning-title]').should('contain', '任务规划');
      cy.get('[data-cy=available-tasks]').should('be.visible');
    });

    it('should show available task categories', () => {
      cy.get('[data-cy=category-filter]').should('be.visible');
      cy.get('[data-cy=category-button]').should('have.length.greaterThan', 0);
    });

    it('should filter tasks by category', () => {
      cy.get('[data-cy=category-button]').contains('学习').click();
      cy.get('[data-cy=task-item]').each(($task) => {
        cy.wrap($task).should('contain', '学习');
      });
    });

    it('should add task to daily plan', () => {
      cy.get('[data-cy=task-item]').first().within(() => {
        cy.get('[data-cy=add-task-button]').click();
      });
      
      cy.get('[data-cy=success-message]').should('contain', '任务已添加到今日计划');
    });

    it('should show task details modal', () => {
      cy.get('[data-cy=task-item]').first().click();
      cy.get('[data-cy=task-details-modal]').should('be.visible');
      cy.get('[data-cy=task-description]').should('be.visible');
      cy.get('[data-cy=task-requirements]').should('be.visible');
    });

    it('should allow setting planned time', () => {
      cy.get('[data-cy=task-item]').first().within(() => {
        cy.get('[data-cy=add-task-button]').click();
      });
      
      cy.get('[data-cy=time-picker-modal]').should('be.visible');
      cy.get('[data-cy=time-input]').type('14:30');
      cy.get('[data-cy=confirm-time-button]').click();
      
      cy.get('[data-cy=success-message]').should('contain', '任务已添加');
    });
  });

  describe('File Upload in Evidence Modal', () => {
    beforeEach(() => {
      cy.visit('/today');
    });

    it('should upload image file', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=complete-task-button]').click();
      });
      
      cy.get('[data-cy=evidence-modal]').within(() => {
        // Create a mock file
        const fileName = 'test-image.jpg';
        cy.fixture('test-image.jpg', 'base64').then(fileContent => {
          cy.get('[data-cy=file-upload]').attachFile({
            fileContent,
            fileName,
            mimeType: 'image/jpeg'
          });
        });
        
        cy.get('[data-cy=file-preview]').should('be.visible');
        cy.get('[data-cy=submit-evidence-button]').click();
      });
    });

    it('should show file upload progress', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=complete-task-button]').click();
      });
      
      cy.get('[data-cy=evidence-modal]').within(() => {
        const fileName = 'large-video.mp4';
        cy.fixture('large-video.mp4', 'base64').then(fileContent => {
          cy.get('[data-cy=file-upload]').attachFile({
            fileContent,
            fileName,
            mimeType: 'video/mp4'
          });
        });
        
        cy.get('[data-cy=upload-progress]').should('be.visible');
      });
    });

    it('should validate file size', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=complete-task-button]').click();
      });
      
      cy.get('[data-cy=evidence-modal]').within(() => {
        // Mock a file that's too large
        const fileName = 'huge-file.jpg';
        const hugeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
        
        cy.get('[data-cy=file-upload]').attachFile({
          fileContent: btoa(hugeContent),
          fileName,
          mimeType: 'image/jpeg'
        });
        
        cy.get('[data-cy=file-error]').should('contain', '文件大小不能超过10MB');
      });
    });

    it('should validate file type', () => {
      cy.get('[data-cy=task-card]').first().within(() => {
        cy.get('[data-cy=complete-task-button]').click();
      });
      
      cy.get('[data-cy=evidence-modal]').within(() => {
        const fileName = 'document.pdf';
        cy.fixture('document.pdf', 'base64').then(fileContent => {
          cy.get('[data-cy=file-upload]').attachFile({
            fileContent,
            fileName,
            mimeType: 'application/pdf'
          });
        });
        
        cy.get('[data-cy=file-error]').should('contain', '不支持的文件类型');
      });
    });
  });
});