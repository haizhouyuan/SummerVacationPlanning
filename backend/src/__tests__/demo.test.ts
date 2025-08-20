// 演示测试文件 - 确保测试套件包含至少一个测试
describe('Demo Tests', () => {
  it('should pass basic demonstration test', () => {
    expect(true).toBe(true);
  });

  it('should validate environment setup', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  it('should test basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });
});