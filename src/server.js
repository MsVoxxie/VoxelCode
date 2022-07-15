const Document = require('./storage/models/codeModel');
const mongoose = require('mongoose');
const express = require('express');
const https = require('https');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const app = express();

//Login to MongoDB
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Get CSS Dir
const cssDirectoryPath = path.join(__dirname, '../src/storage/css');
// const scriptDirectoryPath = path.join(__dirname, '../src/storage/scripts');
const cssDirectory = express.static(cssDirectoryPath);
// const scriptDirectory = express.static(scriptDirectoryPath);

// Use ejs for templating
app.set('view engine', 'ejs');

//Use Statics
app.use('/css/', cssDirectory);
// app.use('/scripts/', scriptDirectory);

//Use URL Encoding
app.use(express.urlencoded({ extended: true }));

// Get Views
const views = {
	code_display: path.join(`${__dirname}/storage/views/code-display.ejs`),
	new_file: path.join(`${__dirname}/storage/views/new-file.ejs`),
};

// Home Page
app.get('/', (req, res) => {
	const placeHolder = 'Hello World';
	res.render(views.code_display, { code: placeHolder, language: 'plaintext' });
});

app.get('/new', (req, res) => {
	res.render(views.new_file);
});

app.post('/save', async (req, res) => {
	const code = req.body.code;
	try {
		const newCode = await Document.create({ code });
		res.redirect(`/${newCode.id}`);
	} catch (error) {
		res.render(views.new_file, { code });
		console.log(error);
	}
});

app.get('/:id/duplicate', async (req, res) => {
	const id = req.params.id;
	try {
		const code = await Document.findById(id);
		res.render(views.new_file, { code: code.code });
	} catch (error) {
		res.redirect(`/${id}`);
	}
});

app.get('/:id', async (req, res) => {
	const id = req.params.id;
	try {
		const code = await Document.findById(id);
		res.render(views.code_display, { code: code.code, id });
	} catch (error) {
		res.redirect('/');
	}
});

const AUTH = {
	privateKey: fs.readFileSync('/etc/letsencrypt/live/code.voxxie.me/privkey.pem', 'utf8'),
	certificate: fs.readFileSync('/etc/letsencrypt/live/code.voxxie.me/fullchain.pem', 'utf8'),
	ca: fs.readFileSync('/etc/letsencrypt/live/code.voxxie.me/chain.pem', 'utf8'),
};

// app.listen(process.env.PORT, () => console.log('Server started'));

https.createServer({ key: AUTH.privateKey, cert: AUTH.certificate, ca: AUTH.ca }, app).listen(process.env.PORT, '0.0.0.0', () => console.log(`Server Started on port:  ${process.env.PORT}`));
