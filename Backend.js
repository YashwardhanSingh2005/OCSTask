import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'views'))); // Serve static files from public directory

app.set('view engine', 'ejs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
app.get('/', (req, res) => {
  res.render('Frontend');
});
// Backend.js
app.get('/results', (req, res) => {
  // Extract the data from the query parameters
  const data = JSON.parse(req.query.data);
  res.render('ResultsPage', { data: data });
});

app.post('/data', async (req, res) => {
    try {
       const { userId, password } = req.body;
       const hashedPassword = crypto.createHash('md5').update(password).digest("hex"); //Creates a md5 form of raw password entered from client side
   
       let { data: userData, error: userError } = await supabase
         .from('users')
         .select('role, password_hash')
         .eq('userid', userId);
   
       if (userError) throw userError;
   
       if (hashedPassword !== userData[0].password_hash) {
           return res.status(401).send('Invalid credentials');
       }
   
       let { data: allData, error: allError } = await supabase
         .from('users')
         .select('*');
   
       if (allError) throw allError;
   
       if (userData[0].role === 'admin') {
           res.status(200).json(allData);
       } else {
           let { data: userSpecificData, error: userSpecificError } = await supabase
             .from('users')
             .select('*')
             .eq('userid', userId);
   
           if (userSpecificError) throw userSpecificError;
   
           res.status(200).json(userSpecificData);
       }
    } catch (err) {
       console.error(err);
       res.status(500).send('Server error');
    }
   });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
