import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.post('/data', async (req, res) => {
    try {
       const { userId, password } = req.body;
       const hashedPassword = crypto.createHash('md5').update(password).digest("hex");
   
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