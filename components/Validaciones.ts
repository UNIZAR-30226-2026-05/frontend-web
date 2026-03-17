// En este fichero creamos las distintas validaciones para los formularios de registro y login utilizando la librería zod.
// Así mismo, exportamos los tipos RegisterFormData y LogInFormData para tipar los datos que recibimos en las acciones de registro y login.
// De esta forma, podemos manejar la validación de los datos de manera más eficiente y segura, 
// ya que no se expone la lógica de validación al cliente.
// Exportamos también el tipo FormState para tipar el estado del form en los componentes de registro y login, 
// y así poder manejar los errores de validación de manera más fácil.

import { z } from 'zod';

// creamos variables para los limites de los usuarios y contraseña
// para que sea menos monolítico y por si queremos cambiarlo en el futuro.
const minUsernameLength = 3;
const maxUsernameLength = 20;
const minPasswordLength = 8;
const maxPasswordLength = 72;

export const RegisterFormSchema = z.object({

    username: z.string()
    .trim() // Elimina espacios en blanco al inicio y al final
    .min(minUsernameLength, 'El nombre de usuario debe tener al menos 3 caracteres') // minimo 3 caracteres
    .max(maxUsernameLength, 'El nombre de usuario no puede tener más de 20 caracteres'), // maximo 20 caracteres

    password: z.string()
    .min(minPasswordLength, 'La contraseña debe tener al menos 8 caracteres') // minimo 8 caracteres
    .max(maxPasswordLength, 'La contraseña no puede tener más de 72 caracteres'), // maximo 72 caracteres

    confirmPassword: z.string()
    


}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],

});

export const LogInFormSchema = z.object({

    username: z.string()
    .trim() // Elimina espacios en blanco al inicio y al final
    .min(minUsernameLength, 'El nombre de usuario debe tener al menos 3 caracteres') // minimo 3 caracteres
    .max(maxUsernameLength, 'El nombre de usuario no puede tener más de 20 caracteres'), // maximo 20 caracteres

    password: z.string()
    .min(minPasswordLength, 'La contraseña debe tener al menos 8 caracteres') // minimo 8 caracteres
    .max(maxPasswordLength, 'La contraseña no puede tener más de 72 caracteres'), // maximo 72 caracteres
});

export type RegisterFormData = z.infer<typeof RegisterFormSchema>;
export type LogInFormData = z.infer<typeof LogInFormSchema>;

export type FormState = { // creamos tipos para que nos sea más facil manejar el estado del form 

    success?: boolean;
    message?: string;

    data?: {
        username: string;
        password: string;
        confirmPassword?: string;
    };

    backendErrors?: string[] | null;

    zodErrors?: {
        username?: string[];
        password?: string[];
        confirmPassword?: string[];
    } | null;
}