import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        // you're already defining theme tokens using @theme inline in CSS,
        // so we don't need to re-extend colors/fonts here unless you want to.
        extend: {},
    },
    plugins: [typography],
} satisfies Config;
