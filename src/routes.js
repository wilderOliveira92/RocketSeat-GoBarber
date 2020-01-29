import { Router } from 'express';

const routes = new Router();

routes.get('/user', (req, res) => {
    res.json({ message: "Hello World"});
})

export default routes;