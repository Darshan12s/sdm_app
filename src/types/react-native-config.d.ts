declare module 'react-native-config' {
  interface Config {
    [key: string]: string;
  }

  const config: Config;
  export default config;
}