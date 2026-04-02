import { registerUserAction, loginUserAction} from './auth';

// index.ts es un archivo que sirve para exportar todas las acciones de la 
// aplicación de manera centralizada. De esta forma, si queremos importar 
// una acción en un componente, solo tenemos que importar el archivo index.ts 
// y no cada acción por separado. Esto es especialmente útil cuando tenemos 
// muchas acciones en la aplicación, ya que nos permite mantener el código más 
// organizado y fácil de mantener.
export const actions = {
    auth: {
        registerUserAction,
        loginUserAction,
    },
    
};