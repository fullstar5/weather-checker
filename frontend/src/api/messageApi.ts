import { http } from "./http";


export const sendMessageApi = async(payload: {
    username: string,
    city: string,
    message: string,
}) => {

    const res = await http.post('/api/message/chat', payload);

    return res.data;
} 
    
