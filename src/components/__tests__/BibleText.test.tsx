import React from 'react';
import { render } from '@testing-library/react-native';
import { BibleText } from '../BibleText';

describe('BibleText', () => {
  it('renders correctly with given children', () => {
    const { getByText } = render(<BibleText>Test Content</BibleText>);
    const textElement = getByText('Test Content');
    expect(textElement).toBeTruthy();
  });

  it('applies custom style alongside default styles', () => {
    const { getByText } = render(
      <BibleText style={{ color: 'red' }}>Styled Text</BibleText>
    );
    const textElement = getByText('Styled Text');
    // @ts-ignore
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: 'red' })])
    );
  });
});
