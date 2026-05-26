import { Router } from 'express';
import { pushWeatherMessage } from '../controllers/message.controller';

const messageRouter = Router();

messageRouter.post('/push-weather', pushWeatherMessage);

export default messageRouter;