// Workaround for react-native 0.85 + TypeScript: the new HostInstance-based
// class pattern breaks JSX type checking. Interface merging restores the
// React.Component members so TypeScript accepts these as valid JSX components.
import type React from 'react';
import type {
  ViewProps,
  TextProps,
  ImageProps,
  TextInputProps,
  ScrollViewProps,
  ActivityIndicatorProps,
  SwitchProps,
  RefreshControlProps,
  KeyboardAvoidingViewProps,
} from 'react-native';

declare module 'react-native' {
  interface View extends React.Component<ViewProps> {}
  interface Text extends React.Component<TextProps> {}
  interface Image extends React.Component<ImageProps> {}
  interface TextInput extends React.Component<TextInputProps> {}
  interface ScrollView extends React.Component<ScrollViewProps> {}
  interface ActivityIndicator extends React.Component<ActivityIndicatorProps> {}
  interface Switch extends React.Component<SwitchProps> {}
  interface RefreshControl extends React.Component<RefreshControlProps> {}
  interface SafeAreaView extends React.Component<ViewProps> {}
  interface KeyboardAvoidingView extends React.Component<KeyboardAvoidingViewProps> {}
}
