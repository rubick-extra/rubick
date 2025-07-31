declare module 'vue-i18n' {
  export const useI18n: () => {
    t: (key: string, params?: any) => string;
  };
}
