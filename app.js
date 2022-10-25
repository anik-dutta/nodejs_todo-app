/*              A to do list           */

// require and configure dotenv
require('dotenv').config();

// external imports
const express = require('express');
const mongoose = require('mongoose');
const { capitalize, map } = require('lodash');

// starting app
const app = express();

// serving static files
app.use(express.static('public'));

// view engine setup
app.set('view engine', 'ejs');

// parser
app.use(express.urlencoded({ extended: true }));

// function to capitalize the first letters of each word
const titleCase = (str) => map(str.split(' '), capitalize).join(' ');

// establish database connection
mongoose.connect(process.env.URI)
    .then(() => {
        console.log('Connected to the database successfully!')
    }).catch((error) => {
        console.log(error.message)
    });

// creating schema
const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Add the name of the task please']
    }
});

// creating model
const Item = mongoose.model('Item', itemSchema);

// default task
const item1 = new Item({
    name: ' Welcome to your To Do List • Start adding tasks to your schedule • To remove a task tick the respective checkbox'
});

// creating schema for custom list
const listSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Add the name of the list please']
    },
    items: [itemSchema]
});

// creating model for lists
const List = mongoose.model('List', listSchema);

let listTitle = '';

// routes
app.get('/', async function (req, res) {
    try {
        const data = await Item.find();
        if (data.length === 0) {
            try {
                await Item.create(item1);
                res.redirect('/');
            } catch (error) {
                res.render('error', { error: 'There was an error on the server side!' });
            }
        } else {
            res.render('list', { tasks: data, listTitle: 'Daily\xa0Tasks' });
        }
    } catch (error) {
        res.render('error', { error: 'There was an error on the server side!' });
    }
});

app.get('/:newListName', async function (req, res) {
    const customListName = titleCase(req.params.newListName);
    try {
        const foundList = await List.findOne({ name: customListName });
        if (foundList) {
            // show an existing list
            res.render('list', { tasks: foundList.items, listTitle: foundList.name });
        } else {
            // create a new list
            const list = new List({
                name: customListName,
                items: item1
            });
            list.save();
            res.redirect('/' + customListName);
        }
    } catch (error) {
        res.render('error', { error: 'There was an error on the server side!' });
    }
});

app.post('/', async function (req, res) {
    // add a task
    const task = req.body.new_task;
    const listName = req.body.listName;
    const item = new Item({
        name: task
    });
    if (listName === 'Daily\xa0Tasks') {
        item.save();
        res.redirect('/');
    } else {
        try {
            const foundList = await List.findOne({ name: listName });
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        } catch (error) {
            res.render('error', { error: 'There was an error on the server side!' });
        }
    }
});

app.post('/delete', async function (req, res) {
    const listName = req.body.listName;
    const checkedItem = req.body.checkedItem;
    if (listName === 'Daily\xa0Tasks') {
        try {
            await Item.findByIdAndDelete({ _id: checkedItem });
            res.redirect('/');
        } catch (error) {
            res.render('error', { error: 'There was an error on the server side!' });
        }
    } else {
        try {
            await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItem } } });
            res.redirect('/' + listName);
        } catch (error) {
            res.render('error', { error: 'There was an error on the server side!' });
        }
    }
});

// port setup
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
}); 