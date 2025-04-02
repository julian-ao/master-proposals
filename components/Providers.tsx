"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";
import { ThemeProvider } from "next-themes";
const queryClient = new QueryClient();

queryClientAtom.init = queryClient;

export default function Providers(props: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>
        <ReactQueryDevtools initialIsOpen={false} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {props.children}
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
}
