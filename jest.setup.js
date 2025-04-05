// jest.setup.js
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'), // Сохраняем реальные части mongoose, если нужны
  isValidObjectId: jest.fn().mockReturnValue(true), // Мокаем isValidObjectId
  // Можно добавить моки для connect, connection и т.д., если они используются где-то еще
}));