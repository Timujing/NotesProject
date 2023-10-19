'use sctrict'

/* We get main "a" tag with id="note_create" and create one notes list item and one div with text of this note(i.e notes content)
    In mainNotesContainer we'll append note content div with theme/heading and note text; P.s. note content div means ".notes_content_wrapper" 
    In mainNotesColumn  we'll append note list item; P.s. note list item means ".notes_list_item"

*/

/* TODO:
    1) add functionality to svg buttons -> in proccess
    2) add indexedDb -> done
    3) add pinned functionality. How to realize it? 
        Maybe just take query note list item div and prepend it in to "mainNotesColumn"? And also append in h1.notes_list_item_heading some "pin" image.
        Also add some property to notes obj, like {pinned: true} . And then if obj.pinned == true, then use "prepend method"
    4) add on content note keydown functionality. If when we redaction note content div text and key down "enter", then we should add <p></p> tag and focus in it (.focus()).
    5) TODO: think how to optimize, if we clicked on the same note list item as we clicked earlier. Check "showEditableNote" func.
*/

let createNoteBtn = document.getElementById('note_create');
let mainNotesContainer = document.body.querySelector('.notes_scroll_container');
let mainNotesColumn = document.body.querySelector('.notes_column');
let notesToolbar = document.body.querySelector('.notes_toolbar'); /* let's think how we want to handle toolbar functions. In one function or in different functions on every button?*/
let deletePopupDiv = document.body.querySelector('.Modal');

// indexedDB initiate. Main variable to work with DB.
let db;
// initial display of db;
init();

// let initiate indexed DB and create object store to save notes; Also we'll display notes from DB
async function init() {
    db = await idb.openDb('notesDb', 1, db => {
        db.createObjectStore('notes', {keyPath: 'id'}); //when add id generator then should use Id keypath       
    });

    displayNotesFromDatabase();
}

// Let handle some residual errors that will be throw in try/catch in functions
window.addEventListener('unhandledrejection', event => {
    console.log(`Ошибка: ${event.reason.message}. Объект ошибки: ${console.dir(event)}`);
});

/* Add click functionality to createNoteBtn
    showFullNote is aggregation of 3 functions: 
        1) createNoteListItem. We create one list item and return it.
        2) createNoteContent. We create one content of note(theme and text) and return this div.
        3) Hide another content notes at mainNotesContainer
    And append it in DOM.
*/
createNoteBtn.addEventListener('click', showFullNote);

/* Add click functionality "showEditableNote" to mainNotesColumn.
    Let's hide all content notes and select content note which we've selected in notes list items.
*/
mainNotesColumn.addEventListener('click', showEditableNote);

/* Describe the function. Here we want to handle all buttons in div.notes_toolbar. Should make text italic/bold/underlined/crossed and etc.
    Also add handler functions to "pin" and "delete" buttons.
*/
notesToolbar.addEventListener('click', mainToolbarHandler);

// Show note content of the same note list item which we've clicked.
function showEditableNote(e) {
    // target note list item
    let targetNoteListItemDiv = e.target.closest('div.notes_list_item');
    
    // if we've clicked not on div list item, then "return"
    if (!targetNoteListItemDiv) return;

    // ======================REWORKED VARIANT WITH DATABASE

    /* reworked variant if we have database 
        Here is 2 scenarious:
        1) We have no notes in db yet and create a lot of notes. We should find all div's content notes and notes list items. 
            Then in cycle If we got item what we've clicked then with index find in all content notes exactly content note
        2) We have notes in db and want create new one. 
    */

   // Find all list notes items and notes content.
    let allContentNotes = mainNotesContainer.querySelectorAll('.notes_content_wrapper'),
        allNotesListItems = mainNotesColumn.querySelectorAll('.notes_list_item:not(#note_create)'), //except first "creation button".
        idOfTargetNoteListItem = targetNoteListItemDiv.dataset.idOfNote; // can be undefined if note list item div was created for the first time. In function "saveNoteToDb" he'll get it.

    /*  TODO: should think if we'll pin note list item. 
        If we pin item, then it'll be first, second etc on list, but content of this item not first, second and etc (we can pin any item on list).
        Maybe we should match note list item and content by Theme in input, when we'll add IndexedDB.
        Better way is to match note list item and note content via some ID.

        TODO: think how to optimize, if we clicked on the same note list item as we clicked earlier.
        Now if we clicked on the same note list as we clicked earlier, functions "showEditableNote" and "hideContentNotes" is invoked.
    */

    if (!idOfTargetNoteListItem) {        

        /* cycle all notes, hide it if we've created new one note. How it works:
        1) Cycle all note list items.
        2) If we got item what we've clicked then with index find in all content notes exactly content note, what we need.

            !But it works only if first list item matches with first content note.
        */

        for (let i = 0; i < allNotesListItems.length; i++) {

            // we should remove all "onEdit" class from note list items. If not, newest ones will have always "onEdit" class
            allNotesListItems[i].classList.remove('onEdit');
    
            if (targetNoteListItemDiv == allNotesListItems[i]) {
                hideContentNotes(allContentNotes, allNotesListItems);
    
                allNotesListItems[i].classList.add('onEdit');
                allContentNotes[i].classList.remove('hide');
                allContentNotes[i].classList.add('editable');
                
            }
        }

    } else {
        // find content note with the same as note list item 
        let noteContentDiv = mainNotesContainer.querySelector(`[data-id-of-note="${idOfTargetNoteListItem}"`);
        // remove previous class "onEdit" of note list item
        mainNotesColumn.querySelector('.onEdit').classList.remove('onEdit');
        
        // remove previous class "editable" of content note
        let lastNoteContentEditable = mainNotesContainer.querySelector('.editable');
        lastNoteContentEditable.classList.remove('editable');
        lastNoteContentEditable.classList.add('hide');
        
        // add "onEdit" to target last item and "editable" to content note with same id
        targetNoteListItemDiv.classList.add('onEdit');
        noteContentDiv.classList.remove('hide');
        noteContentDiv.classList.add('editable');

    }

}

// create one note list item
// should be reworked, want to pass here obj
function createNoteListItem(noteObj) {

    // create main note list item 
    let noteListDiv = document.createElement('div');
    noteListDiv.classList.add('notes_list_item', 'onEdit');

    // append in noteListDiv div with description(it includes h1 with theme and span with text of note)
    noteListDiv.insertAdjacentHTML('afterbegin', `
    <div class="notes_list_item_description">
        <h1 class="notes_list_item_heading">
            <span class="notes_list_item_heading_text">
             ${noteObj.heading || 'Title'}
            </span>
        </h1>
        <span class="notes_list_item_text">${noteObj.text || 'Text'}</span>
    </div>
    `);

    return noteListDiv;
}

// create div with note content (with theme and main text)
// should be reworked, want to pass here obj 
function createNoteContent(noteObj) {
    
    // create main note content with empty theme and empty text
    let noteContentDiv = document.createElement('div');
    noteContentDiv.classList.add("notes_content_wrapper", "editable");

    // lets add onfocusout event to save data of Note
    // noteContentDiv.addEventListener('focusin', onRedactingNote);
    noteContentDiv.addEventListener('focusout', saveNoteToDb);


    // append theme and note text
    noteContentDiv.insertAdjacentHTML('afterbegin', `
    <span class="notes_theme">
        <input id="note-theme-input" placeholder="Your theme" type="text" autocomplete="off" value="${noteObj.heading || 'Title'}" maxlength="200">
    </span> 
    <div class="notes_text" contenteditable="true" data-placeholder="Type your text">
        ${noteObj.text || 'Text'}    
    </div>`);

    return noteContentDiv;
}

// Hide all note divs content. First argument is list of divs content. Can be null if it's called without arguments.
function hideContentNotes(allContentNotes = null, allNotesListItems = null) {
    // should hidde all notes and remove all ".onEdit" from note list items.
    
    // let allContentNotes;
    
    /* List was added because I want to minimaze duplication of finding notes content. "else" block was comment, because there is 2 scenarious:  
        1) we put in arguments arrays with div's notes content and notes list item. If we put, then we just cycle it and hide all divs content and remove all ".onEdit" in note list items.
        2) we don't put it. If we don't we should search all div's notes content(.notes_content_wrapper) and all notes list item(.notes_list_item:not(#note_create))
    */
    if (!allContentNotes) {
        allContentNotes = mainNotesContainer.querySelectorAll('.notes_content_wrapper');
        allNotesListItems = mainNotesColumn.querySelectorAll('.notes_list_item:not(#note_create)');
    }

    // allContentNotes may be with 0 length if we don't have content notes yet
    if (allContentNotes.length == 0) return;

    // hide all content notes
    for (let i = 0; i < allNotesListItems.length; i++) {
        // hide all notes content div's.
        allContentNotes[i].classList.remove('editable');
        allContentNotes[i].classList.add('hide');

        // also should remove all "onEdit" note list items
        allNotesListItems[i].classList.remove('onEdit');
    }    

}

// Create one note list item and note content and then append it in html file. noteObj = {} because we want to minimize errors, want to get "undefined" to handle it. Same thing with event. 
function showFullNote(event = null, noteObj = {}) {
    // hide all notes content divs
    hideContentNotes();

    // create one note list item and note content
    let noteListDiv = createNoteListItem(noteObj),
        noteContentDiv = createNoteContent(noteObj);

    // if we have id of note in noteObj add it to our note list item and noteContentDiv
    if (noteObj.id) {   
        noteListDiv.dataset.idOfNote = noteObj.id;
        noteContentDiv.dataset.idOfNote = noteObj.id;
    }

    /* TODO: if we'll have PINNED functionality then we want to prepend, not append! Should add some conditions like: if noteObj.pinned == true, then prepend */
    // append one note in list and div content
    mainNotesColumn.append(noteListDiv);
    mainNotesContainer.append(noteContentDiv);
}


/* Want to save data from note to db. 
    We'll create object with data, which we want to update. "date" in this object will be update always when we'll redact our input of content div
*/

async function saveNoteToDb(event) {

    // if we not in target element - return
    let inContentWrapper = event.target.closest('.notes_content_wrapper');
    if (!inContentWrapper) return;

    // add transaction and get our "notes" store to put/delete some data of note
    let notesStore = db.transaction('notes', 'readwrite').objectStore('notes');

    let freshNoteContent = {
        heading: null,
        text: null,
        date: new Date(),
        id: `${inContentWrapper.dataset.idOfNote || generateId()}` /* want to generate id here and add it in "data-id-of-note" attribute. 
                Also should check, if "inContentWrapper" has "dataset.idOfNote" or not.
                If not it's new item in db and maybe use "add", exept "put". If it has, then we want to update this item */
    };

    // add ID to note content div and note list item
    if (!inContentWrapper.dataset.idOfNote) {
        // add id to content div note
        inContentWrapper.dataset.idOfNote = freshNoteContent.id;
        mainNotesColumn.querySelector('.onEdit').dataset.idOfNote = freshNoteContent.id;
    } 

    try {
        // condition if this is heading redacting and text redacting
        // redacting heading/theme of note condition
        if (event.target.tagName == 'INPUT') {

            /* give to "freshNoteContent" object input value(value of #note-theme-input) and text of div.notes_text  */
            freshNoteContent.heading = event.target.value || 'Empty header';
            freshNoteContent.text = event.currentTarget.querySelector('.notes_text').innerHTML || 'Empty text';
            // Update or create data of our note in DB. Using put, not add, because we want to update data in DB also.
            await notesStore.put(freshNoteContent);

            // text redacting condition
        } else if (event.target.tagName == 'DIV') {
            // let freshNoteContentInput = inContentWrapper.querySelector('#note-theme-input'); -> changed on "event.currentTarget.querySelector('#note-theme-input').value".
            
            /* Taking value from input(#note-theme-input), taking innerHTML of div.notes_text and put it in to "freshNoteContent" object to update it in DB*/
            freshNoteContent.heading = event.currentTarget.querySelector('#note-theme-input').value || 'Empty header';
            freshNoteContent.text = event.target.innerHTML || 'Empty text';
            // Update or create data of our note in DB.
            await notesStore.put(freshNoteContent);

        }

        // update currently editing note list item heading and text
        updateNoteListItem(freshNoteContent);

    
    } catch(err) {
    // TODO: Maybe add some more condition what error we can have and how handle it 
        if (err.name == 'ConstraintError') {
            alert("Напиши тему!");
          } else {
            throw err;
          }
    }
    
    console.log('saving successful!');
}

// When we have notes in DB we should display it from DB in first open html.
async function displayNotesFromDatabase() {
    // get store of notes
    let notesStore = db.transaction('notes', 'readonly').objectStore('notes');

    let notes = await notesStore.getAll();

    if (notes.length) {

        notes.forEach(note => {
            // crutch variant, should be reworked???
            
            // else show full note for each note from database
            // We're passing full obj note with all data
            showFullNote(null, note);
        });

    } else {
        console.log('empty db');
    }
}

// update header/text of currently editable note list item. Maybe add here "pin" functionality(just use prepend if "pinned" = true)
function updateNoteListItem(obj) {

    // will not find "currentlyRedactingNoteListItem" if we just create note, because it don't have id of note
    let currentlyRedactingNoteListItem = document.body.querySelector(`.notes_list_item.onEdit[data-id-of-note="${obj.id}"`);
    
    let noteListText = currentlyRedactingNoteListItem.querySelector('span.notes_list_item_text');    
    noteListText.innerHTML = obj.text;

    let noteListHeading = currentlyRedactingNoteListItem.querySelector('.notes_list_item_heading_text');
    noteListHeading.innerHTML = obj.heading;

    return currentlyRedactingNoteListItem;
}

// lets add ID generator for note list item and note content
// it would be 3x numbers and 2 
function generateId() {
    let generateFirstRandomNumbers = () => Math.round(Math.random() * 1000); 

    // should generate symbols from 65(myMin) - 122(myMax) inclusive
    let myMax = 122,
        myMin = 65;
    let generateRandomSymbol = () => String.fromCodePoint(Math.floor(Math.random() * (myMax - myMin + 1) + myMin));

    let randomId = `${generateFirstRandomNumbers()}${generateRandomSymbol()}${generateRandomSymbol()}`;
    return randomId;
}

/* TODO: should create description to this function. Should it be asynchronical, because "*/
function mainToolbarHandler(event) {
    // let start with "delete" button

    let button = event.target.closest('button.icons');

    // if we clicked not on button some way, then return
    if (!button) return;

    let buttonFunctionalityName = button.className.split(' ')[1];

    /* let call handle functions depends on what button functionality we clicked. 
        if "buttonFunctionalityName" == "delete", then first of all we should create and show confirmation popup, where user confirm deleting or not.
    */
    switch (buttonFunctionalityName) {
        case 'delete':
            // Should we reffer "event" to this function or not?
            /* Should confirm also, user want to delete or not. 
            Maybe we'll use asynchronical function? 
            Maybe just show popup. And delete in functions which will envoke on "delete", "cansel" button. */

            let confirmDelete = confirmDeleting(); // return true/false
            if (confirmDelete) {
                
                try {
                    
                    deleteNoteFromDb(event);
                    deleteNoteFromDOM(event);
                    hideDeletePopup(event);   
                    // Just want to show delete popup 26.07 
                
                } catch(err) {
                    // ADD WHAT ERRORS CAN BE WHEN WE TRY TO DELETE. Remember that there is can be just created empty note.
                    console.dir(err);
                    throw err
                }
                
            } else {
                hideDeletePopup(event);
            }

            break;
        
        default:
            console.log(buttonFunctionalityName);
    }
}

function deleteNoteFromDOM(event) {
    // here will delete note list item and content note from dom
}

function hideDeletePopup(event) {
    // 
}

// delete popup already created in html, but hided
function showDeletePopup(event) {
    // should show delete popup

    console.log('DELETE functionality!');
}

function confirmDeleting(event) {
    // should return true or false depends on was clicked "delete" or "cansel". Maybe do it asynchronius?
}

async function deleteNoteFromDb(e) {

}

