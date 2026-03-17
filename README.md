This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.



## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Dependencias instaladas para el proyecto:

### React
```
npm install react
```
Para utilizar React components debemos importar dicha librería, la versión con la que se va a trabajar es React 19

### jose
```
npm install jose
```
Esta librería nos proporciona soporte para realizar tareas relacionadas al JWT, en concreto, para decodificar, verificar y validar el token.  
Al instalarla npm nos dará un warning de que hay una vulneravilidad con un paquete, para solucionar dicho problema, ejecutaremos el siguiente comando:  
```
npm audit fix
```

### Zod
```
npm install zod
```
De cara a validar que los datos en los formularios de inicio de sesión y registro son correctos, utilizaremos la librería ``Zod`` para ello ya que nos proporciona multitud de herramientas para validar dichos campos.
