declare namespace JSX {
  interface DotLottieWcProps {
    src?: string;
    autoplay?: boolean | string;
    loop?: boolean | string;
    style?: Record<string, string | number>;
  }

  interface IntrinsicElements {
    'dotlottie-wc': DotLottieWcProps;
  }
}
