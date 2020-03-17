const express = require('express')
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('./db/dictionary.json');
const db = low(adapter);

// api test the connection between client and server
app.get('/', (req, res) => {
  const message = "Welcome to API Translate Fran to Eng :))";
  res.json({ message });
});

// api get all word in dictionary
app.get('/words', (req, res) => {
  const ret = db.get('words');
  res.json(ret);
});

//api translate from France to English (data from params of request). vd: localhost:4200/translate/bonjour
app.get('/translate/:franceWord', async (req, res) => {
  try {
    const franceWord = req.params.franceWord;
    //const wordInDictionary = db.get('words').value().find(word => word.fr === franceWord)
    const wordInDictionary = await db.get('words').find({ fr: `${franceWord}` }).value();
    if (!wordInDictionary) {
      return res.status(403).json({ message: "This word does not exist in Dictionary!!!" });
    };
    res.json({
      successf: true,
      ...wordInDictionary
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// api add new word into dictionary (data from body of request). vd {"fr": "bonjour", "en": "hello"}
app.post('/add-word', async (req, res) => {
  try {
    const newWord = req.body;
    const isExist = db.get('words').find({ fr: `${newWord.fr}` }).value();
    if (isExist) return res.status(409).json({ success: false, message: 'This word is already exist in DB!!!' });
    await db.get('words')
      .push(newWord)
      .write();
    res.json({
      success: true,
      ...newWord
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// api delete a word from dictionary (data from body of request). vd {"fr": "franceWord"}
app.delete('', async (req, res) => {
  try {
    let fr_word = req.body.fr;
    console.log('fr_word', fr_word);
    if (!fr_word || fr_word.length == 0) {
      return res.status(403).json({
        success: false,
        message: 'request body is empty !!!'
      });
    };
    const isExist = await db.get('words').find({ fr: `${fr_word}` }).value();
    if (!isExist) {
      return res.status(404).json({ success: false, message: `"${fr_word}" is already not exist in DB!!!` });
    } else {
      await db.get('words').remove({ fr: `${fr_word}` }).write();
      res.json({
        success: true,
        message: `*${fr_word}* is already deleted`
      });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

//api update từ vựng trong dictionary. Data lấy từ req body. 
//VD: {"fr": "Bonjours", "edit_into": "bonjour"} or {"en": "heloo", "edit_into": "hello" }
app.put('', async (req, res) => {
  try {
    let fr_word = req.body.fr;
    let en_word = req.body.en;
    let edit_into = req.body.edit_into;

    if (!edit_into || edit_into.length == 0 || (fr_word && en_word) ||
      ((!fr_word || fr_word.length == 0) && (!en_word || en_word.length == 0))) {
      return res.status(403).json({
        success: false,
        message: 'request body is invalid !!!'
      });
    };

    let isExist
    if (fr_word) {
      isExist = await db.get('words').find({ fr: `${fr_word}` }).value();
    } else {
      isExist = await db.get('words').find({ en: `${en_word}` }).value();
    }

    if (!isExist) {
      if (fr_word) {
        return res.status(404).json({ success: false, message: `*${fr_word}* is not exist in DB!!!` });

      } else {
        return res.status(404).json({ success: false, message: `"*${en_word}* is not exist in DB!!!` });

      }
    } else {
      if (fr_word) {
        await db.get('words').find({ fr: `${fr_word}` }).assign({ fr: `${edit_into}` }).write();
        return res.json({
          success: true,
          message: `*${fr_word}* is already edited into *${edit_into}* in DB`
        });
      } else {
        await db.get('words').find({ en: `${en_word}` }).assign({ en: `${edit_into}` }).write();
        return res.json({
          success: true,
          message: `*${en_word}* is already edited into *${edit_into}* in DB`
        });
      }

    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

const PORT = 4200;
app.listen(PORT, () => {
  console.log('App is running in port ', PORT);
})