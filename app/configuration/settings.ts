export const BASE_URL: string = typeof process !== "undefined" && process.env?.BASE_URL ? process.env.BASE_URL : 'http://localhost:7337'

// export const JSON_DEFAULT_ENTRY = JSON.stringify([
//     {
//         "path": "global/example",
//         "key": "unique-key1",
//         "value": "bla bla",
//         "secure": false
//     }
// ], null, 2)