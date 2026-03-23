
type UserData = {
    username: string;
    password: string;
}


export async function registerUserService (userData: object) {
    const url = `${process.env.API_URL}/usuarios/registro/`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        console.log('Response from backend:', data); // Para verificar la respuesta del backend

        return data;

    }catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }

}


export async function loginUserService (userData: UserData) {
    const url = `${process.env.API_URL}/usuarios/login`;

    const params = new URLSearchParams();
    params.append('username', userData.username);
    params.append('password', userData.password);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' // en el login necesitamos este formato
            },
            body: params
        });

        const data = await response.json();
        console.log('Response from backend:', data); // Para verificar la respuesta del backend
        
        return data;

    }catch (error) {
        console.error('Error logging in user:', error);
        throw error;
    }

}