# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

`tree -I node_modules -L 2`

```
├── app
│   ├── adapters
│   ├── app.css
│   ├── components
│   ├── configuration
│   ├── context
│   ├── domain
│   ├── hooks
│   ├── lib
│   ├── root.tsx
│   ├── routes
│   ├── routes.ts
│   └── services
├── build
│   ├── client
│   └── server
├── components.json
├── Dockerfile
├── package-lock.json
├── package.json
├── public
│   ├── box.svg
│   ├── favicon.png
│   └── old-favicon.ico
├── react-router.config.ts
├── README.md
├── tsconfig.json
└── vite.config.ts
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

## reference
- [radix-ui](https://www.radix-ui.com)
- [remix js](https://remix.run/docs/en/main)
- [shadcn ui](https://ui.shadcn.com/docs)
- [tailwindcss](https://tailwindcss.com/docs/installation)
- [Remix Guide](https://remix.guide)


---

Built with ❤️ using React Router.

## run on docker
```shell
docker build -f Dockerfile -t nbox-ui:runner --target runner .
docker run --network host -e COOKIE_SECRET=1234567890plmnhytgvfredcxswqaz -e BASE_URL=http://127.0.0.1:7337 -p 3000:3000 -it nbox-ui:runner
```


## Development

```shell
export COOKIE_SECRET=1234567890plmnhytgvfredcxswqaz
export BASE_URL=http://127.0.0.1:7337

```


## UPDATE npm

```shell
npm install -g npm-check-updates
ncu -u
npm install
```

### add componets
```shell
npx shadcn@latest add [name]
```


## news

```shell
mise use -g bun@latest  # install latest bun

```