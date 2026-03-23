// Exportamos las funciones necesarias para que los componentes de forms puedan importar 
// las acciones de registro y login de manera centralizada sin tener que importar cada 
// acción por separado. Esto es especialmente útil cuando tenemos muchas acciones en la  
// aplicación, ya que nos permite mantener el código más organizado y fácil de mantener. 

"use server"    // IMPORTANTE: usamos use server ya que esta función se ejecutará 
                // en el servidor, no en el cliente. De esta forma se puede hacer 
                // la validación de los datos de manera más eficiente y segura, 
                // ya que no se expone la lógica de validación al cliente.
import { z } from 'zod';
import { redirect } from 'next/navigation';

import {RegisterFormSchema, type FormState } from '@/components/Validaciones'; // importamos el tipo FormState para tipar el estado del form
import { LogInFormSchema } from '@/components/Validaciones';    
import { registerUserService, loginUserService } from '@/lib/backend';

//IMPOERTANTE: desde el backend se nos pasa un apartado detail, si existe, ha ocurrido un 
// error de autenticación, en caso contrario todo ha ido bien.
export async function registerUserAction(prevState: FormState, formData: FormData): Promise<FormState> {
    // console.log('registerUserAction ejecutada en el servidor'); // Para verificar que se ejecuta en el servidor
    
    const fields = {
        username: formData.get('username') as string,
        password: formData.get('password') as string,
        confirmPassword: formData.get('confirmPassword') as string
    };

    //console.log('Datos recibidos en registerUserAction:', fields); // Para verificar que se reciben los datos correctamente

                                            // safeParse valida sin elevar un error, devuelve un objeto llamado success
    const validateFields = RegisterFormSchema.safeParse(fields);

    const fieldsParaRegistro = {
        nombre: fields.username,
        password: fields.password
    } 

    
    if (!validateFields.success) {
        const flattenedErrors = z.flattenError(validateFields.error);

        return {
            success: false,
            message: 'Error de validación',
            backendErrors: null,
            zodErrors: flattenedErrors.fieldErrors,
            data: fields
        };
    }
    // lo que devueve la acción se pasa al cliente, esto
    // mandará los errores en el form para que el usiario los 
    // arregle, o en caso de que no haya errores, se podrá redirigir 
    // al usuario a otra página o mostrar un mensaje de éxito.

    const response = await registerUserService(fieldsParaRegistro);

    if (response.detail) {
        return {
            success: false,
            message: 'Error en el registro',
            backendErrors: response?.detail || 'Error desconocido',
            zodErrors: null,
            data: fields
        };
    }

    console.log('Usuario registrado con éxito:', response); // Para verificar que el usuario se ha registrado correctamente

    redirect('/login');

    return {
        success: true,
        message: 'Usuario registrado correctamente',
        backendErrors: null,
        zodErrors: null,
        data: fields
    };

}


//IMPOERTANTE: desde el backend se nos pasa un apartado detail, si existe, ha ocurrido un 
// error de autenticación, en caso contrario todo ha ido bien.
export async function loginUserAction(prevState: FormState, formData: FormData): Promise<FormState> {
    // console.log('registerUserAction ejecutada en el servidor'); // Para verificar que se ejecuta en el servidor
    
    const fields = {
        username: formData.get('username') as string,
        password: formData.get('password') as string,
    };

    //console.log('Datos recibidos en registerUserAction:', fields); // Para verificar que se reciben los datos correctamente

                                            // safeParse valida sin elevar un error, devuelve un objeto llamado success
    const validateFields = LogInFormSchema.safeParse(fields);

     const fieldsParaLogin = {

        username: fields.username,
        password: fields.password
    }

    if (!validateFields.success) {
        const flattenedErrors = z.flattenError(validateFields.error);

        return {
            success: false,
            message: 'Error de validación',
            backendErrors: null,
            zodErrors: flattenedErrors.fieldErrors,
            data: fields
        };
    }
    // lo que devueve la acción se pasa al cliente, esto
    // mandará los errores en el form para que el usiario los 
    // arregle, o en caso de que no haya errores, se podrá redirigir 
    // al usuario a otra página o mostrar un mensaje de éxito.
    
    const response = await loginUserService(fieldsParaLogin); 

    if (response.detail) {
        return {
            success: false,
            message: 'Error en el inicio de sesión',
            backendErrors: response?.detail || 'Error desconocido',
            zodErrors: null,
            data: fields
        };
    }

    console.log('Usuario logeado con éxito:', response); // Para verificar que el usuario se ha registrado correctamente


    return {
        success: true,
        message: 'Usuario logeado correctamente',
        backendErrors: null,
        zodErrors: null,
        data: fields
    };

}