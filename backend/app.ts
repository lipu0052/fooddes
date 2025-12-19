import express from 'express';
import cors from 'cors';
import recipeRoutes from './routes/recipeRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Recipe Recommendation API is running!' });
});

app.use('/api', recipeRoutes);

export default app;