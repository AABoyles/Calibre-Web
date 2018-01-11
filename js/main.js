const apiKey = 'AIzaSyB_4ELGPiJhFBxOkYmHbErEDECt_bROEM8';
const clientId = '612657856529-84naj5l18uhqu93bdvlkp3psfnj7fqvh.apps.googleusercontent.com';
const scope = 'https://www.googleapis.com/auth/drive.readonly';
const appId = 'calibre-web-186715';

var pickerApiLoaded = false;
var oauthToken;
var DB;

// Use the Google API Loader script to load the google.picker script.
function loadPicker() {
  gapi.load('auth', {'callback': () => {
    window.gapi.auth.authorize({
      'client_id': clientId,
      'scope': scope,
      'immediate': false
    }, authResult => {
      if (authResult && !authResult.error) {
        oauthToken = authResult.access_token;
        createPicker();
      }
    });
  }});
  gapi.load('picker', {'callback': () => {
    pickerApiLoaded = true;
    createPicker();
  }});
}

// Create and render a Picker object for searching images.
function createPicker() {
  if (pickerApiLoaded && oauthToken) {
    let view = new google.picker.DocsView(google.picker.ViewId.DOCS);
      view.setIncludeFolders(true);
      view.setSelectFolderEnabled(true);
      view.setQuery('metadata.db');
    let picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(appId)
        .setOAuthToken(oauthToken)
        .addView(view)
        .addView(new google.picker.DocsUploadView())
        .setCallback(pickerCallback)
        .build();
     picker.setVisible(true);
  }
}

// A simple callback implementation.
function pickerCallback(data) {
  if (data.action == google.picker.Action.PICKED) {
    if (data.docs[0].id) {
      $('#loading-modal').modal('show');
      var accessToken = gapi.auth.getToken().access_token;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://www.googleapis.com/drive/v2/files/' + data.docs[0].id + '?alt=media');
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        DB = new SQL.Database(new Uint8Array(this.response));
        refreshViews('SELECT title as Title, author_sort as Author FROM books;');
        $('#loading-modal').modal('hide');
      };
      // xhr.onerror = function() { callback(null) };
      xhr.send();
    }
  }
}

function refreshViews(query){
  currentView = DB.exec(query)[0];
  $('#splash-banner').slideUp();
  $('#views').slideUp(e => {
    $("#jsGrid").jsGrid({
      width: "100%",
      filtering: true,
      editing: false,
      sorting: true,
      paging: true,
      autoload: true,
      pageSize: 10,
      pageButtonCount: 5,
      data: transform(currentView),
      fields: currentView.columns.map(c => ({name: c, type: "text"}))
    });
    $('#views').slideDown();
  });
}

function transform(input){
  return input.values.map(v => {
    let out = {};
    v.forEach((cell, i) => out[input.columns[i]] = cell);
    return out;
  });
}

$(function(){
  $('html').removeClass('no-js');
  $('#load-library-pseudo').click(e => $('#dropdown02').click());
  $('#google-drive-signin').click(loadPicker);
  $('#view-books').click(e => {
    refreshViews('SELECT title as Title, author_sort as Author FROM books;');
  });
  $('#view-series').click(e => {
    refreshViews('SELECT name AS Series FROM series order by Series;');
  });
  $('#view-authors').click(e => {
    refreshViews('SELECT name AS Author FROM authors order by Author;');
  });
  $('#view-publishers').click(e => {
    refreshViews('SELECT name AS Publisher FROM publishers order by Publisher;');
  });
  $('#view-tags').click(e => {
    refreshViews('SELECT name AS Tag FROM tags order by tag;');
  });
  $('#about-button').click(e => {
    $('#splash-banner').slideDown();
    $('#views').slideUp();
  });
});
