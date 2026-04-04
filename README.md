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


### Zod
```
npm install zod
```
De cara a validar que los datos en los formularios de inicio de sesión y registro son correctos, utilizaremos la librería ``Zod`` para ello ya que nos proporciona multitud de herramientas para validar dichos campos.


# Flujo para debug o jugar:  
---
**En la terminal:**
```
cd {directorio_front_web}  
npm run dev
```

**En el navegador, abrir "http://localhost:3000".**

Una vez tenemos esto podemos debugear con la consola viendo los logs que dejamos (quien es el encargado en cada momento de logear y el contenido propio del log).  
En el entorno de desarrollador podemos navegar al apartado `Aplication` y ver el JWT en el sub-apartado de `cookies` así como el id de la partida, el nombre de usuario y el array de jugadores en el lobby en el sub-apartado de `Session Storage`.

