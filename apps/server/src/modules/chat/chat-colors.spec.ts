import { nextAvailableColor } from './chat-colors';

describe('nextAvailableColor', () => {
  it('returns the first palette color when none are used', () => {
    expect(nextAvailableColor([])).toBe('purple');
  });

  it('returns the least-used color, keeping palette order on ties', () => {
    expect(nextAvailableColor(['purple', 'blue'])).toBe('cyan');
    expect(nextAvailableColor(['purple', 'purple', 'blue'])).toBe('cyan');
  });
});
