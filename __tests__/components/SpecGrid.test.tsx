import { render, screen } from '@testing-library/react-native';

import SpecGrid from '../../src/components/SpecGrid';

describe('SpecGrid', () => {
  it('reads each spec as one phrase', () => {
    render(
      <SpecGrid
        specs={[
          { label: 'Seats', value: '5' },
          { label: 'Fuel', value: 'Electric' },
        ]}
      />
    );

    expect(screen.getByLabelText('Seats: 5')).toBeTruthy();
    expect(screen.getByLabelText('Fuel: Electric')).toBeTruthy();
  });
});
