// Este componente se utiliza en los formularios de login y registro para mostrar 
// los errores de validación debajo de cada input. Recibe un array de strings con 
// los errores y los renderiza uno por uno. Si no hay errores, no renderiza nada.

export function FormError({ error }: { error: string[] }) {
    if (!error) return null; // si no hay error no renderizamos nada

    return error.map((err, indice) => (
        <div key={indice} className="text-red-500 text-sm mt-1">{err}</div>
    ));
}