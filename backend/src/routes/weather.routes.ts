import { Router } from 'express';
import { geocodeCity, getWeather } from '../controllers/weather.controller';


const weatherRouter = Router();

weatherRouter.get('/', getWeather);
weatherRouter.get('/geocode', geocodeCity);

export default weatherRouter;