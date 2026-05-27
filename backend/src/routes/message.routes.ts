import { Router } from 'express';
import { pushWeatherMessage, pushChatMessage} from '../controllers/message.controller';

const messageRouter = Router();

messageRouter.post('/push-weather', pushWeatherMessage);
messageRouter.post('/chat', pushChatMessage);

export default messageRouter;