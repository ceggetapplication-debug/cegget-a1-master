import { StyleSheet } from 'react-native';

export const PALETTE = {
  deepBlue: '#001524',
  teal: '#15616d',
  linen: '#ffecd1',
  orange: '#ff7d00',
  russet: '#78290f',
  grey: '#f5f5f5',
  white: '#ffffff',
  black: '#000000',
};

export const GLOBAL_STYLES = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.grey,
  },
  textBody: {
    color: PALETTE.black,
    fontSize: 14,
  },
  textLabel: {
    color: PALETTE.deepBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  textTitle: {
    color: PALETTE.russet,
    fontSize: 18,
    fontWeight: '900',
  },
  amount: {
    color: PALETTE.orange,
    fontWeight: '900',
  }
});
