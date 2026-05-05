export const BASE_URL: string =
    typeof process !== "undefined" && process.env?.BASE_URL
        ? process.env.BASE_URL
        : 'http://localhost:7337'
