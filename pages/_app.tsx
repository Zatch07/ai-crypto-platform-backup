import type { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/clerk-react";
import "@/index.css";

const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_placeholder_key";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

