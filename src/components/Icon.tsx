import React from 'react';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type IconFamily = 'feather' | 'material';

type Props = {
  name: string;
  size?: number;
  color?: string;
  family?: IconFamily;
};

export default function Icon({name, size = 20, color = '#EAEBEB', family = 'feather'}: Props) {
  if (family === 'material') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Feather name={name} size={size} color={color} />;
}
