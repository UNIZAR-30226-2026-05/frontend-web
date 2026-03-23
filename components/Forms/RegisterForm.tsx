'use client';   // IMPORTANTE: usamos use client ya que queremos que se ejetute en el cliente.
                // si queremos que el usuario cambie el estado (modifique el campo de los inputs), 
                // es obligatorio que el componente se ejecute en el cliente.

import React, { useActionState } from 'react';
import Link from 'next/link';
import PixelInput from '../UI/PixelInput';
import PixelButton from '../UI/PixelButton';
import { type FormState } from '../Validaciones'; // importamos el tipo FormState para tipar el estado del form
import { FormError } from './FormError'; // importamos el componente FormError para mostrar los errores de validación debajo de cada input

import { actions } from '@/actions'; // importamos actions para poder validar datos de entrada




const INITIAL_STATE: FormState = {
    success: undefined,
    message: undefined,
    backendErrors: null,
    zodErrors: null,
    data: {
        username: '',
        password: '',
        confirmPassword: ''
    }
};

export default function RegisterForm() {

    const [formState, formAction] = useActionState(actions.auth.registerUserAction, INITIAL_STATE);

    //console.log('formState:', formState); // Para verificar el estado del form en cada renderizado

    const textShadow = "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000";

    return (
        <div className="flex flex-col items-center gap-6 font-pixel text-white">
            <form action={formAction}>  {/* en este form utilizamos el action para validar los datos del usuario  */}
                <h1 
                    className="text-4xl text-center leading-relaxed mb-4" 
                    style={{ textShadow }}
                >
                    Registrarse
                </h1>

                <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                    <div className="flex flex-col gap-2 w-full text-center">
                        <label htmlFor="username" style={{ textShadow }} className="text-lg">Nombre de usuario</label>
                        <PixelInput placeholder='Username'
                                    id='username'
                                    name='username'
                                    className="w-full text-center" 
                                    defaultValue={formState.data?.username ?? ''}/> {/* valores por defecto para que cuando el usuario envie el 
                                                                                    form y haya errores, no tenga que volver a escribir todo */}
                        <FormError error={formState.zodErrors?.username || []} /> {/* mostramos los errores de validación debajo del input */}
                    </div>

                    <div className="flex flex-col gap-2 w-full text-center">
                        <label htmlFor="password" style={{ textShadow }} className="text-lg">Contraseña</label>
                        <PixelInput type="password" 
                                    id='password'
                                    name='password'
                                    placeholder='Contraseña'
                                    className="w-full text-center" 
                                    defaultValue={formState.data?.password ?? ''}/>
                        <FormError error={formState.zodErrors?.password || []} /> {/* mostramos los errores de validación debajo del input */}
                    </div>

                    <div className="flex flex-col gap-2 w-full text-center">
                        <label htmlFor="confirmPassword" style={{ textShadow }} className="text-lg">Repite la contraseña</label>
                        <PixelInput type="password" 
                                    id='confirmPassword'
                                    name='confirmPassword'
                                    placeholder='Repite la contraseña'
                                    className="w-full text-center" 
                                    defaultValue={formState.data?.confirmPassword ?? ''}/>
                        <FormError error={formState.zodErrors?.confirmPassword || []} /> {/* mostramos los errores de validación debajo del input */}
                    </div>
                </div>

                <div className="mt-4 flex flex-col items-center gap-6">
                    <PixelButton variant="green">
                        Crear cuenta
                    </PixelButton>
                    {formState.backendErrors && ( // si hay errores del backend, los mostramos debajo del botón
                        <div className="text-red-500 text-sm text-center">
                            {formState.backendErrors}
                        </div>
                    )}

                    <Link 
                        href="/login" 
                        className="text-sm text-center transition-colors hover:text-gray-300 leading-loose" 
                        style={{ textShadow }}
                    >
                        Si ya tienes cuenta,<br />INICIA SESIÓN
                    </Link>
                </div>
            </form>
        </div>
    );
}
