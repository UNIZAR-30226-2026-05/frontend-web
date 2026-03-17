export function FormError({ error }: { error: string[] }) {
    if (!error) return null; // si no hay error no renderizamos nada

    return error.map((err, indice) => (
        <div key={indice} className="text-red-500 text-sm mt-1">{err}</div>
    ));
}