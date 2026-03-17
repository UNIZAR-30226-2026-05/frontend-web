import { z } from 'zod';


export const RegisterFormSchema = z.object({

    username: z.string()
    .trim() // Elimina espacios en blanco al inicio y al final
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres') // minimo 3 caracteres
    .max(20, 'El nombre de usuario no puede tener más de 20 caracteres'), // maximo 20 caracteres

    password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres') // minimo 8 caracteres
    .max(72, 'La contraseña no puede tener más de 100 caracteres'), // maximo 100 caracteres

    confirmPassword: z.string()
    


}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],

});

export const LogInFormSchema = z.object({

    username: z.string()
    .trim() // Elimina espacios en blanco al inicio y al final
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres') // minimo 3 caracteres
    .max(20, 'El nombre de usuario no puede tener más de 20 caracteres'), // maximo 20 caracteres

    password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres') // minimo 8 caracteres
    .max(100, 'La contraseña no puede tener más de 100 caracteres'), // maximo 100 caracteres
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